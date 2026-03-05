import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { Wildfire } from '../types/dataLayers'
import { fetchWildfires } from '../utils/api-helpers'
import { getWildfireColor, getWildfireSize } from '../utils/entityColors'
import { DataLayerManager } from '../utils/dataLayerManager'

/**
 * Custom hook for wildfire tracking
 * Fetches data from NASA FIRMS API
 */
export function useWildfires(viewer: any | null, layerManager: DataLayerManager | null) {
  const [wildfires, setWildfires] = useState<Wildfire[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false)

  const fireEntitiesRef = useRef<Map<string, any>>(new Map())
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!viewer || !layerManager) return

    const apiKey = (import.meta.env as any).VITE_NASA_FIRMS_KEY

    if (!apiKey) {
      console.warn('NASA FIRMS API key not configured. Set VITE_NASA_FIRMS_KEY in .env')
      setApiKeyConfigured(false)
      return
    }

    setApiKeyConfigured(true)

    const fetchAndRender = async () => {
      try {
        setLoading(true)
        // Fetch global wildfires (or use 'NPL' for Nepal only)
        const newWildfires = await fetchWildfires(apiKey, 'WORLD')
        setWildfires(newWildfires)
        setError(null)

        // Update entities
        updateWildfireEntities(viewer, newWildfires, fireEntitiesRef.current, layerManager)
      } catch (err) {
        console.error('Wildfire tracking error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchAndRender()

    // Set up interval for periodic updates (every 2 hours)
    // NASA FIRMS updates once daily, so more frequent isn't necessary
    fetchIntervalRef.current = setInterval(fetchAndRender, 2 * 60 * 60 * 1000)

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current)
      }
      // Cleanup entities
      fireEntitiesRef.current.forEach((entity) => {
        viewer.entities.removeById(entity.id)
      })
      fireEntitiesRef.current.clear()
    }
  }, [viewer, layerManager])

  return { wildfires, loading, error, apiKeyConfigured }
}

/**
 * Update wildfire entities on the globe
 */
function updateWildfireEntities(
  viewer: any,
  wildfires: Wildfire[],
  entityMap: Map<string, any>,
  layerManager: DataLayerManager
): void {
  const currentFireIds = new Set(wildfires.map((f) => f.id))

  // Remove fires that no longer exist
  for (const [id, entity] of entityMap.entries()) {
    if (!currentFireIds.has(id)) {
      viewer.entities.removeById(entity.id)
      layerManager.removeEntity('wildfires', id)
      entityMap.delete(id)
    }
  }

  // Add or update fires
  for (const fire of wildfires) {
    if (!fire.lat || !fire.lon) continue

    const fireKey = fire.id

    if (!entityMap.has(fireKey)) {
      // Create new entity
      const position = Cesium.Cartesian3.fromDegrees(fire.lon, fire.lat, 0)
      const color = getWildfireColor(fire.brightness)
      const radiusMeters = getWildfireSize(fire.brightness)

      const entity = viewer.entities.add({
        position,
        ellipsoid: {
          radii: new Cesium.Cartesian3(radiusMeters, radiusMeters, radiusMeters * 0.5),
          material: color.withAlpha(0.5),
          outline: true,
          outlineColor: color,
        },
        label: {
          text: `🔥`,
          font: 'bold 16px monospace',
          pixelOffset: new Cesium.Cartesian2(0, -20),
          showBackground: false,
        },
        properties: {
          type: 'wildfire',
          brightness: fire.brightness,
          confidence: fire.confidence,
          dayNight: fire.dayNight,
          satellite: fire.satellite,
          detectionDate: fire.acquisitionDate.toISOString(),
        },
      })

      entityMap.set(fireKey, entity)
      layerManager.addEntity('wildfires', fireKey, entity)
    }
  }

  console.log(`Rendered ${wildfires.length} wildfires`)
}
