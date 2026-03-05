import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { Satellite } from '../types/dataLayers'
import { fetchSatellites } from '../utils/api-helpers'
import { getSatelliteColor, getLabelColor } from '../utils/entityColors'
import { DataLayerManager } from '../utils/dataLayerManager'

export function useSatellites(viewer: any | null, layerManager: DataLayerManager | null) {
  const [sats, setSats] = useState<Satellite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const satDataRef = useRef<Satellite[]>([])
  const satEntitiesRef = useRef<Map<string, any>>(new Map())
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!viewer || !layerManager) return

    const fetchAndRender = async () => {
      try {
        setLoading(true)
        const newSats = await fetchSatellites()
        satDataRef.current = newSats
        setSats(newSats)
        setError(null)

        createSatelliteEntities(viewer, newSats, satEntitiesRef.current, layerManager)
      } catch (err) {
        console.error('Satellite tracking error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchAndRender()
    fetchIntervalRef.current = setInterval(fetchAndRender, 30000)

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current)
      }
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

function createSatelliteEntities(
  viewer: any,
  satellites: Satellite[],
  entityMap: Map<string, any>,
  layerManager: DataLayerManager
): void {
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

  for (const sat of satellites) {
    const color = getSatelliteColor(sat.type)

    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(0, 0, 400000),
      point: {
        pixelSize: 6,
        color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
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
      properties: {
        type: 'satellite',
        name: sat.name,
        satType: sat.type,
      },
    })

    entityMap.set(sat.id, entity)
    layerManager.addEntity('satellites', sat.id, entity)
  }

  console.log(`Created ${satellites.length} satellite entities`)
}
