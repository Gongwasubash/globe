import { useEffect, useRef, useState } from 'react'
import { CameraMode, SelectedEntity } from '../types/cameraMode'

interface CameraModeState {
  mode: CameraMode
  selectedEntity: SelectedEntity | null
  isPOVVisible: boolean
}

/**
 * Custom hook for managing camera modes
 * Handles global, follow, POV, and ISS modes with keyboard controls
 */
export function useCameraMode(
  viewer: any | null,
  selectedEntity: SelectedEntity | null,
  isFollowing: boolean,
) {
  const [mode, setMode] = useState<CameraMode>('global')
  const [isPOVVisible, setIsPOVVisible] = useState(false)
  const modeRef = useRef<CameraModeState>({
    mode: 'global',
    selectedEntity: selectedEntity,
    isPOVVisible: false,
  })

  // Update mode based on selection
  useEffect(() => {
    if (selectedEntity && isFollowing) {
      // Entered follow mode
      setMode('follow')
      modeRef.current.mode = 'follow'
      modeRef.current.selectedEntity = selectedEntity

      // Dispatch event
      window.dispatchEvent(
        new CustomEvent('cameraModeChanged', {
          detail: { mode: 'follow', selectedEntity },
        }),
      )
    }
  }, [selectedEntity, isFollowing])

  // Keyboard controls
  useEffect(() => {
    if (!viewer) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      // F1: Return to global view
      if (event.key === 'F1') {
        event.preventDefault()
        setMode('global')
        modeRef.current.mode = 'global'
        setIsPOVVisible(false)

        // Return to global view
        viewer.camera.flyHome(1.0)

        window.dispatchEvent(
          new CustomEvent('cameraModeChanged', {
            detail: { mode: 'global' },
          }),
        )
        console.log('Camera mode: Global')
      }

      // F2: Toggle follow mode
      if (event.key === 'F2') {
        event.preventDefault()
        if (modeRef.current.mode === 'follow') {
          setMode('global')
          modeRef.current.mode = 'global'
          viewer.camera.flyHome(1.0)
          window.dispatchEvent(
            new CustomEvent('cameraModeChanged', {
              detail: { mode: 'global' },
            }),
          )
          console.log('Camera mode: Global')
        } else if (selectedEntity) {
          setMode('follow')
          modeRef.current.mode = 'follow'
          window.dispatchEvent(
            new CustomEvent('cameraModeChanged', {
              detail: { mode: 'follow', selectedEntity },
            }),
          )
          console.log('Camera mode: Follow')
        }
      }

      // F3: Toggle POV map
      if (event.key === 'F3') {
        event.preventDefault()
        if (modeRef.current.mode === 'follow') {
          const newPOVState = !isPOVVisible
          setIsPOVVisible(newPOVState)
          modeRef.current.isPOVVisible = newPOVState

          const newMode: CameraMode = newPOVState ? 'pov' : 'follow'
          setMode(newMode)
          modeRef.current.mode = newMode

          window.dispatchEvent(
            new CustomEvent('cameraModeChanged', {
              detail: { mode: newMode, isPOVVisible: newPOVState },
            }),
          )
          console.log(`Camera mode: ${newMode}`)
        } else {
          console.log('Select an entity first (F2)')
        }
      }

      // I: Toggle ISS camera widget
      if (key === 'i') {
        event.preventDefault()
        window.dispatchEvent(new CustomEvent('toggleISSCamera'))
        console.log('ISS camera toggled')
      }

      // ESC: Exit follow mode
      if (event.key === 'Escape') {
        setMode('global')
        modeRef.current.mode = 'global'
        setIsPOVVisible(false)
        viewer.camera.flyHome(1.0)
        window.dispatchEvent(
          new CustomEvent('cameraModeChanged', {
            detail: { mode: 'global' },
          }),
        )
        console.log('Camera mode: Global (ESC pressed)')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [viewer, selectedEntity, isPOVVisible])

  return {
    mode,
    isPOVVisible,
    setMode,
    setIsPOVVisible,
  }
}
