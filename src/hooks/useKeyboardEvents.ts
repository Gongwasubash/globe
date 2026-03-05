import { useEffect } from 'react'
import * as Cesium from 'cesium'
import { EffectMode } from '../utils/effectsManager'
import { LOCATIONS, SHORTCUTS } from '../locations'

interface KeyboardEventHandlerProps {
  viewer: any | null
  changeEffect: (mode: EffectMode) => void
}

/**
 * Custom hook to handle global keyboard input for effects and location shortcuts
 * F1-F4: Switch between visual effects
 * 1-6: Jump to pre-defined locations
 */
export function useKeyboardEvents({ viewer, changeEffect }: KeyboardEventHandlerProps) {
  useEffect(() => {
    if (!viewer) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // F1: Normal mode
      if (event.key === 'F1') {
        event.preventDefault()
        changeEffect('normal')
        console.log('Effect: Normal')
        return
      }

      // F2: Night Vision mode
      if (event.key === 'F2') {
        event.preventDefault()
        changeEffect('nvg')
        console.log('Effect: Night Vision')
        return
      }

      // F3: Thermal mode
      if (event.key === 'F3') {
        event.preventDefault()
        changeEffect('thermal')
        console.log('Effect: Thermal')
        return
      }

      // F4: CRT mode
      if (event.key === 'F4') {
        event.preventDefault()
        changeEffect('crt')
        console.log('Effect: CRT')
        return
      }

      // Number keys: Location shortcuts
      const locationKey = SHORTCUTS[event.key]
      if (locationKey) {
        event.preventDefault()
        const location = LOCATIONS[locationKey]

        // Use Cesium camera to fly to the location
        const camera = viewer.camera
        const destination = Cesium.Cartesian3.fromDegrees(
          location.lon,
          location.lat,
          location.alt
        )

        camera.flyTo({
          destination,
          duration: 2,
        })

        console.log(`Jumped to ${location.label}`)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [viewer, changeEffect])
}
