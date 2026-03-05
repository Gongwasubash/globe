import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { Aircraft } from '../types/dataLayers'
import { fetchFlights } from '../utils/api-helpers'
import { getFlightColor, getLabelColor } from '../utils/entityColors'
import { DataLayerManager } from '../utils/dataLayerManager'

/**
 * Custom hook for real-time flight tracking
 * Fetches data from OpenSky Network API
 */
export function useFlightTracking(viewer: any | null, layerManager: DataLayerManager | null) {
  const [flights, setFlights] = useState<Aircraft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const flightEntitiesRef = useRef<Map<string, any>>(new Map())
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!viewer || !layerManager) return

    const fetchAndRender = async () => {
      try {
        setLoading(true)
        const newFlights = await fetchFlights()
        setFlights(newFlights)
        setError(null)

        // Update entities
        updateFlightEntities(viewer, newFlights, flightEntitiesRef.current, layerManager)
      } catch (err) {
        console.error('Flight tracking error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchAndRender()

    // Set up interval for periodic updates (every 10 seconds)
    fetchIntervalRef.current = setInterval(fetchAndRender, 10000)

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current)
      }
      // Cleanup entities
      if (viewer && viewer.entities) {
        flightEntitiesRef.current.forEach((entity) => {
          try {
            viewer.entities.removeById(entity.id)
          } catch (e) {
            // Viewer already destroyed
          }
        })
      }
      flightEntitiesRef.current.clear()
    }
  }, [viewer, layerManager])

  return { flights, loading, error }
}

/**
 * Update flight entities on the globe
 */
function updateFlightEntities(
  viewer: any,
  flights: Aircraft[],
  entityMap: Map<string, any>,
  layerManager: DataLayerManager
): void {
  const currentFlightIds = new Set(flights.map((f) => f.id))

  // Remove flights that no longer exist
  for (const [id, entity] of entityMap.entries()) {
    if (!currentFlightIds.has(id)) {
      if (viewer && viewer.entities) {
        try {
          viewer.entities.removeById(entity.id)
        } catch (e) {
          // Already removed
        }
      }
      layerManager.removeEntity('flights', id)
      entityMap.delete(id)
    }
  }

  // Add or update flights
  for (const flight of flights) {
    if (!flight.lat || !flight.lon) continue

    const flightKey = flight.id

    if (entityMap.has(flightKey)) {
      // Update existing entity position
      const entity = entityMap.get(flightKey)!
      entity.position = Cesium.Cartesian3.fromDegrees(flight.lon, flight.lat, flight.alt || 0)
    } else {
      // Create new entity
      const position = Cesium.Cartesian3.fromDegrees(flight.lon, flight.lat, flight.alt || 0)
      const color = getFlightColor(flight.alt)

      const entity = viewer.entities.add({
        position,
        point: {
          pixelSize: 6,
          color,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
        },
        label: {
          text: flight.callsign,
          font: '10px monospace',
          fillColor: getLabelColor(),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          showBackground: true,
          backgroundColor: new Cesium.Color(0, 0, 0, 0.7),
          backgroundPadding: new Cesium.Cartesian2(4, 2),
        },
        properties: {
          type: 'aircraft',
          callsign: flight.callsign,
          altitude: flight.alt,
          speed: flight.speed,
          heading: flight.heading,
        },
      })

      entityMap.set(flightKey, entity)
      layerManager.addEntity('flights', flightKey, entity)
    }
  }

  console.log(`Rendered ${flights.length} flights`)
}
