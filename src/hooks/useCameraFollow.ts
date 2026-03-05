import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { SelectedEntity } from '../types/cameraMode'

interface CameraFollowState {
  isFollowing: boolean
  followEntity: SelectedEntity | null
  offset: Cesium.Cartesian3 | null
  heading: number
  pitch: number
}

/**
 * Custom hook for following entities with the camera
 * Positions camera relative to selected object and updates each frame
 */
export function useCameraFollow(viewer: any | null, selectedEntity: SelectedEntity | null) {
  const stateRef = useRef<CameraFollowState>({
    isFollowing: false,
    followEntity: selectedEntity,
    offset: null,
    heading: 0,
    pitch: -45, // Looking down 45 degrees
  })

  const renderListenerRef = useRef<Function | null>(null)

  // Calculate camera offset based on entity type
  const calculateCameraOffset = (entity: SelectedEntity) => {
    const position = Cesium.Cartesian3.fromDegrees(
      entity.position.lon,
      entity.position.lat,
      entity.position.alt * 1000, // Convert km to meters
    )

    let offset: Cesium.Cartesian3
    let pitch = -45

    if (entity.type === 'aircraft') {
      // For aircraft: position camera 1000m behind and 500m above, aligned with heading
      const heading = entity.heading || 0
      const distance = 1000 // meters

      // Calculate offset in local frame
      const heading_rad = Cesium.Math.toRadians(heading)
      const pitch_rad = Cesium.Math.toRadians(30) // 30 degrees up

      // Create offset vector
      const frame = Cesium.Transforms.eastNorthUpToFixedFrame(position)
      const offset_local = new Cesium.Matrix3()
      Cesium.Matrix3.setColumn(
        offset_local,
        0,
        new Cesium.Cartesian3(Math.cos(heading_rad) * distance, 0, 0),
        offset_local,
      )

      offset = new Cesium.Cartesian3(
        -Math.sin(heading_rad) * distance,
        -Math.cos(heading_rad) * distance,
        500,
      )
      pitch = -30
    } else if (entity.type === 'satellite') {
      // For satellites: position camera 50km away with 45-degree pitch
      offset = new Cesium.Cartesian3(50000, 30000, 40000)
      pitch = -45
    } else if (entity.type === 'iss') {
      // For ISS: position camera 100km away
      offset = new Cesium.Cartesian3(100000, 50000, 80000)
      pitch = -45
    } else {
      // Default: 20km away
      offset = new Cesium.Cartesian3(20000, 10000, 15000)
      pitch = -45
    }

    return { offset, position, pitch }
  }

  // Update camera position
  const updateCameraPosition = () => {
    if (!viewer || !stateRef.current.followEntity) return

    const entity = stateRef.current.followEntity
    const { offset, position, pitch } = calculateCameraOffset(entity)

    try {
      // Get camera direction (heading)
      const heading = Cesium.Math.toRadians(entity.heading || 0)

      // Create matrix to rotate offset based on entity heading
      const headingMatrix = Cesium.Matrix3.fromHeadingPitchRoll(
        new Cesium.HeadingPitchRoll(heading, 0, 0),
      )

      // Rotate offset
      const rotatedOffset = new Cesium.Cartesian3()
      Cesium.Matrix3.multiplyByVector(headingMatrix, offset, rotatedOffset)

      // Calculate camera position
      const cameraPosition = Cesium.Cartesian3.add(position, rotatedOffset, new Cesium.Cartesian3())

      // Smooth camera transition
      viewer.camera.flyTo({
        destination: cameraPosition,
        orientation: {
          heading: heading,
          pitch: Cesium.Math.toRadians(pitch),
          roll: 0,
        },
        duration: 0.1, // Smooth but responsive
        easingFunction: Cesium.EasingFunction.LINEAR_NONE,
      })

      stateRef.current.heading = heading
      stateRef.current.pitch = pitch
    } catch (error) {
      console.debug('Error updating camera position:', error)
    }
  }

  // Listen for entity selection
  useEffect(() => {
    const handleEntitySelected = (event: CustomEvent) => {
      const entity = event.detail as SelectedEntity
      stateRef.current.followEntity = entity
      stateRef.current.isFollowing = true
    }

    window.addEventListener('entitySelected', handleEntitySelected as EventListener)

    return () => {
      window.removeEventListener('entitySelected', handleEntitySelected as EventListener)
    }
  }, [])

  // Start/stop following
  useEffect(() => {
    if (!viewer) return

    if (selectedEntity) {
      stateRef.current.followEntity = selectedEntity
      stateRef.current.isFollowing = true

      // Update camera immediately
      updateCameraPosition()

      // Set up per-frame updates
      const update = () => {
        updateCameraPosition()
      }

      renderListenerRef.current = update
      viewer.scene.postRender.addEventListener(update)
    } else {
      stateRef.current.isFollowing = false
      if (renderListenerRef.current) {
        viewer.scene.postRender.removeEventListener(renderListenerRef.current as any)
        renderListenerRef.current = null
      }
    }

    return () => {
      if (renderListenerRef.current && viewer) {
        viewer.scene.postRender.removeEventListener(renderListenerRef.current as any)
      }
    }
  }, [viewer, selectedEntity])

  return {
    isFollowing: stateRef.current.isFollowing,
    followEntity: stateRef.current.followEntity,
    heading: stateRef.current.heading,
    pitch: stateRef.current.pitch,
  }
}
