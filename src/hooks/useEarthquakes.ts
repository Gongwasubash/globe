import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { Earthquake } from '../types/dataLayers'
import { fetchEarthquakes } from '../utils/api-helpers'
import { getEarthquakeColor, getEarthquakeSize, getLabelColor } from '../utils/entityColors'
import { DataLayerManager } from '../utils/dataLayerManager'

/**
 * Custom hook for earthquake monitoring
 * Fetches data from USGS API
 */
export function useEarthquakes(viewer: any | null, layerManager: DataLayerManager | null) {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eqEntitiesRef = useRef<Map<string, any>>(new Map())
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!viewer || !layerManager) return

    const fetchAndRender = async () => {
      try {
        setLoading(true)
        const newEarthquakes = await fetchEarthquakes()
        setEarthquakes(newEarthquakes)
        setError(null)

        // Update entities
        updateEarthquakeEntities(viewer, newEarthquakes, eqEntitiesRef.current, layerManager)
      } catch (err) {
        console.error('Earthquake tracking error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchAndRender()

    // Set up interval for periodic updates (every 30 seconds)
    fetchIntervalRef.current = setInterval(fetchAndRender, 30000)

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current)
      }
      if (viewer && viewer.entities) {
        eqEntitiesRef.current.forEach((entity) => {
          try {
            viewer.entities.removeById(entity.id)
          } catch (e) {
            // Viewer already destroyed
          }
        })
      }
      eqEntitiesRef.current.clear()
    }
  }, [viewer, layerManager])

  return { earthquakes, loading, error }
}

/**
 * Update earthquake entities on the globe
 */
function updateEarthquakeEntities(
  viewer: any,
  earthquakes: Earthquake[],
  entityMap: Map<string, any>,
  layerManager: DataLayerManager
): void {
  const currentEqIds = new Set(earthquakes.map((eq) => eq.id))

  // Remove earthquakes that no longer exist (older than 24h)
  for (const [id, entity] of entityMap.entries()) {
    if (!currentEqIds.has(id)) {
      if (viewer && viewer.entities) {
        try {
          viewer.entities.removeById(entity.id)
        } catch (e) {
          // Already removed
        }
      }
      layerManager.removeEntity('earthquakes', id)
      entityMap.delete(id)
    }
  }

  // Add or update earthquakes
  for (const eq of earthquakes) {
    if (!eq.lat || !eq.lon) continue

    const eqKey = eq.id

    if (!entityMap.has(eqKey)) {
      // Create new entity
      const position = Cesium.Cartesian3.fromDegrees(eq.lon, eq.lat, 0)
      const color = getEarthquakeColor(eq.magnitude)
      const radiusMeters = getEarthquakeSize(eq.magnitude)

      const entity = viewer.entities.add({
        position,
        ellipsoid: {
          radii: new Cesium.Cartesian3(radiusMeters, radiusMeters, radiusMeters),
          material: color.withAlpha(0.4),
          outline: true,
          outlineColor: color.withAlpha(0.8),
        },
        label: {
          text: `M${eq.magnitude.toFixed(1)}`,
          font: 'bold 9px monospace',
          fillColor: getLabelColor(),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          pixelOffset: new Cesium.Cartesian2(0, -15),
          showBackground: true,
          backgroundColor: new Cesium.Color(0, 0, 0, 0.8),
          backgroundPadding: new Cesium.Cartesian2(4, 2),
        },
        properties: {
          type: 'earthquake',
          magnitude: eq.magnitude,
          depth: eq.depth,
          place: eq.place,
          time: eq.time.toISOString(),
        },
      })

      entityMap.set(eqKey, entity)
      layerManager.addEntity('earthquakes', eqKey, entity)
    }
  }

  console.log(`Rendered ${earthquakes.length} earthquakes`)
}
