import { useEffect, useRef, useState } from 'react'
import { EffectManager, EffectMode } from '../utils/effectsManager'

/**
 * Custom hook to manage visual effects on the Cesium viewer
 * Handles initialization and cleanup of the effect system
 */
export function useEffects(viewer: any | null) {
  const effectManagerRef = useRef<EffectManager | null>(null)
  const [effectMode, setEffectMode] = useState<EffectMode>('normal')

  useEffect(() => {
    // Only initialize if viewer is available
    if (!viewer) return

    try {
      // Create effect manager
      const manager = new EffectManager(viewer)
      effectManagerRef.current = manager

      console.log('Effects system initialized')
    } catch (error) {
      console.error('Failed to initialize effects:', error)
    }

    // Cleanup
    return () => {
      if (effectManagerRef.current && viewer) {
        effectManagerRef.current.destroy(viewer)
        effectManagerRef.current = null
      }
    }
  }, [viewer])

  /**
   * Change the current effect mode
   */
  const changeEffect = (mode: EffectMode) => {
    if (effectManagerRef.current) {
      effectManagerRef.current.setEffect(mode)
      setEffectMode(mode)
    }
  }

  return {
    effectMode,
    changeEffect,
    effectManager: effectManagerRef.current,
  }
}
