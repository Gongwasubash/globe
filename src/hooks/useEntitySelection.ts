import { useEffect, useState } from 'react'
import * as Cesium from 'cesium'
import { SelectedEntity } from '../types/cameraMode'

/**
 * Custom hook for entity click detection
 * Allows users to click on planes, satellites, and other entities to select them for following
 */
export function useEntitySelection(viewer: any | null) {
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)

  useEffect(() => {
    if (!viewer) return

    // Enable picking on entities
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    const handleLeftClick = (click: any) => {
      // Try to pick an entity
      const pickedEntity = viewer.scene.pick(click.position)

      if (!Cesium.defined(pickedEntity) || !pickedEntity.id) {
        setSelectedEntity(null)
        return
      }

      const entity = pickedEntity.id

      // Extract entity information
      try {
        const position = entity.position.getValue ? entity.position.getValue(Cesium.JulianDate.now()) : entity.position
        const cartographic = Cesium.Cartographic.fromCartesian(position)

        let entityType: SelectedEntity['type'] = 'aircraft'
        let name = 'Unknown'

        // Determine entity type based on properties
        if (entity.properties) {
          const type = entity.properties.type?.getValue?.() || entity.properties.type
          const entityName =
            entity.properties.name?.getValue?.() ||
            entity.properties.callsign?.getValue?.() ||
            entity.label?.text?.getValue?.() ||
            entity.label?.text ||
            'Unknown'

          if (type === 'aircraft' || type === 'flight') {
            entityType = 'aircraft'
            name =
              entity.properties.callsign?.getValue?.() ||
              entity.properties.callsign ||
              entityName
          } else if (type === 'satellite') {
            entityType = 'satellite'
            name = entity.properties.name?.getValue?.() || entity.properties.name || entityName
          } else if (type === 'earthquake') {
            entityType = 'earthquake'
            name =
              entity.properties.place?.getValue?.() || entity.properties.place || 'Earthquake'
          } else if (type === 'wildfire') {
            entityType = 'wildfire'
            name = `Fire ${entity.properties.brightness?.getValue?.() || ''}`
          } else if (type === 'iss') {
            entityType = 'iss'
            name = 'ISS'
          }
        }

        const newSelection: SelectedEntity = {
          type: entityType,
          id: entity.id?.toString?.() || Date.now().toString(),
          name: name.toString(),
          position: {
            lat: Cesium.Math.toDegrees(cartographic.latitude),
            lon: Cesium.Math.toDegrees(cartographic.longitude),
            alt: cartographic.height / 1000, // Convert to km
          },
          heading: entity.properties?.heading?.getValue?.() || entity.properties?.heading,
        }

        setSelectedEntity(newSelection)

        // Dispatch custom event for camera system to listen
        window.dispatchEvent(
          new CustomEvent('entitySelected', {
            detail: newSelection,
          }),
        )

        console.log('Selected entity:', newSelection)
      } catch (error) {
        console.debug('Error processing selected entity:', error)
        setSelectedEntity(null)
      }
    }

    const handleRightClick = () => {
      // Clear selection on right-click
      setSelectedEntity(null)
    }

    // Register event handlers
    handler.setInputAction(handleLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    handler.setInputAction(handleRightClick, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    // Update cursor to show entities are clickable
    const handleMouseMove = (move: any) => {
      const pickedObject = viewer.scene.pick(move.endPosition)
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        viewer.scene.canvas.style.cursor = 'pointer'
      } else {
        viewer.scene.canvas.style.cursor = 'default'
      }
    }

    handler.setInputAction(handleMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    return () => {
      handler.destroy()
    }
  }, [viewer])

  const clearSelection = () => {
    setSelectedEntity(null)
  }

  return {
    selectedEntity,
    setSelectedEntity,
    clearSelection,
  }
}
