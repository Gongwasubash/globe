import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import * as satellite from 'satellite.js'
import { Satellite } from '../types/dataLayers'
import { fetchSatellites } from '../utils/api-helpers'
import { getSatelliteColor, getLabelColor } from '../utils/entityColors'
import { DataLayerManager } from '../utils/dataLayerManager'

/**
 * Custom hook for satellite tracking
 * Fetches TLE data from CelesTrak and calculates orbits
 */
export function useSatellites(viewer: any | null, layerManager: DataLayerManager | null) {
  const [sats, setSats] = useState<Satellite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const satDataRef = useRef<Satellite[]>([])
  const satEntitiesRef = useRef<Map<string, any>>(new Map())
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const renderListenerRef = useRef<Function | null>(null)

  useEffect(() => {
    if (!viewer || !layerManager) return

    const fetchAndRender = async () => {
      try {
        setLoading(true)
        const newSats = await fetchSatellites()
        satDataRef.current = newSats
        setSats(newSats)
        setError(null)

        // Create initial entities
        createSatelliteEntities(viewer, newSats, satEntitiesRef.current, layerManager)
      } catch (err) {
        console.error('Satellite tracking error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchAndRender()

    // Set up interval for TLE updates (every 30 seconds)
    fetchIntervalRef.current = setInterval(fetchAndRender, 30000)

    // Set up per-frame position updates
    const updatePositions = () => {
      updateSatellitePositions(satDataRef.current, satEntitiesRef.current)
    }

    renderListenerRef.current = updatePositions
    viewer.scene.postRender.addEventListener(updatePositions)

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current)
      }
      if (renderListenerRef.current) {
        if (viewer && viewer.scene) {
          try {
            viewer.scene.postRender.removeEventListener(renderListenerRef.current)
          } catch (e) {
            // Viewer already destroyed
          }
        }
      }
      // Cleanup entities
      if (viewer && viewer.entities) {
        satEntitiesRef.current.forEach((entity) => {
          try {
            viewer.entities.removeById(entity.id)
          } catch (e) {
            // Viewer already destroyed
          }
        })
      }
      satEntitiesRef.current.clear()
    }
  }, [viewer, layerManager])

  return { satellites: sats, loading, error }
}

/**
 * Create satellite entities on the globe
 */
function createSatelliteEntities(
  viewer: any,
  satellites: Satellite[],
  entityMap: Map<string, any>,
  layerManager: DataLayerManager
): void {
  // Clear old entities
  if (viewer && viewer.entities) {
    entityMap.forEach((entity) => {
      try {
        viewer.entities.removeById(entity.id)
      } catch (e) {
        // Already removed
      }
    })
  }
  entityMap.clear()

  // Create new entities
  for (const sat of satellites) {
    const color = getSatelliteColor(sat.type)

    // Create orbital path
    const positions = calculateOrbitPath(sat)

    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.ZERO, // Will be updated by postRender
      point: {
        pixelSize: 6,
        color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
        heightReference: Cesium.HeightReference.NONE,
      },
      label: {
        text: sat.name.slice(0, 15),
        font: '9px monospace',
        fillColor: getLabelColor(),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1,
        pixelOffset: new Cesium.Cartesian2(0, -15),
        showBackground: true,
        backgroundColor: new Cesium.Color(0, 0, 0, 0.8),
        backgroundPadding: new Cesium.Cartesian2(4, 2),
        scale: 0.8,
      },
      // Add orbital trail
      polyline: positions.length > 1 ? {
        positions,
        width: 1,
        material: color.withAlpha(0.3),
        clampToGround: false,
      } : undefined,
      properties: {
        type: 'satellite',
        name: sat.name,
        satType: sat.type,
      },
    })

    entityMap.set(sat.id, entity)
    layerManager.addEntity('satellites', sat.id, entity)
  }

  console.log(`Created ${satellites.length} satellite entities with orbital paths`)
}

/**
 * Calculate orbital path for visualization
 */
function calculateOrbitPath(sat: Satellite): Cesium.Cartesian3[] {
  try {
    const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2)
    if (satrec.error) return []

    const positions: Cesium.Cartesian3[] = []
    const now = new Date()
    
    // Calculate positions for next 90 minutes (one orbit)
    for (let i = 0; i < 90; i += 2) {
      const time = new Date(now.getTime() + i * 60000)
      const posVel = satellite.propagate(satrec, time)
      
      if (posVel.position) {
        const gmst = satellite.gstime(time)
        const geo = satellite.eciToGeodetic(posVel.position as satellite.EciVec3<number>, gmst)
        
        const lat = (geo.latitude * 180) / Math.PI
        const lon = (geo.longitude * 180) / Math.PI
        const alt = geo.height * 1000
        
        positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, alt))
      }
    }
    
    return positions
  } catch (e) {
    return []
  }
}

/**
 * Update satellite positions every frame
 */
function updateSatellitePositions(satellites: Satellite[], entityMap: Map<string, any>): void {
  const now = new Date()

  for (const sat of satellites) {
    try {
      const entity = entityMap.get(sat.id)
      if (!entity) continue

      // Parse TLE
      const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2)
      if (satrec.error) continue

      // Propagate to current time
      const posVel = satellite.propagate(satrec, now)
      if (!posVel.position) continue

      // Get GMST for coordinate transformation
      const gmst = satellite.gstime(now)

      // Convert ECI to geodetic coordinates
      const geo = satellite.eciToGeodetic(posVel.position as satellite.EciVec3<number>, gmst)

      // Convert to degrees
      const lat = (geo.latitude * 180) / Math.PI
      const lon = (geo.longitude * 180) / Math.PI
      const alt = geo.height * 1000 // km to meters

      // Validate coordinates
      if (isNaN(lat) || isNaN(lon) || isNaN(alt)) continue

      // Update entity position with smooth interpolation
      const newPosition = Cesium.Cartesian3.fromDegrees(lon, lat, alt)
      
      // Use Cesium's SampledPositionProperty for smooth movement
      if (!entity.position || !entity.position.getValue) {
        entity.position = new Cesium.SampledPositionProperty()
      }
      
      const julianDate = Cesium.JulianDate.fromDate(now)
      entity.position.addSample(julianDate, newPosition)
      
      // Keep only recent samples (last 10 seconds)
      const tenSecondsAgo = Cesium.JulianDate.addSeconds(julianDate, -10, new Cesium.JulianDate())
      entity.position.removeSamplesAfter(tenSecondsAgo)
      
    } catch (e) {
      console.debug(`Failed to calculate position for ${sat.name}:`, e)
    }
  }
}
