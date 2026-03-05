import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import {
  createNOAAGOESProvider,
  createMODISProvider,
  addImageryLayer,
  removeImageryLayer,
  setImageryLayerOpacity,
} from '../utils/satImageryProvider'

/**
 * Custom hook for managing satellite imagery layer
 * Provides real-time satellite imagery overlay with toggle and opacity control
 */
export function useImageryLayer(viewer: any | null) {
  const [isVisible, setIsVisible] = useState(true)
  const [opacity, setOpacity] = useState(0.6)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imageryLayerRef = useRef<Cesium.ImageryLayer | null>(null)
  const providerRef = useRef<Cesium.ImageryProvider | null>(null)

  // Initialize imagery layer
  useEffect(() => {
    if (!viewer) return

    const initializeImagery = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try NOAA GOES first (best for real-time satellite imagery)
        let provider: Cesium.ImageryProvider | null = null

        try {
          provider = await createNOAAGOESProvider()
          console.log('Loaded NOAA GOES satellite imagery')
        } catch (err) {
          console.warn('NOAA GOES unavailable, trying MODIS:', err)
          try {
            provider = await createMODISProvider()
            console.log('Loaded MODIS satellite imagery')
          } catch (err2) {
            console.warn('MODIS unavailable, using fallback')
            // Could add fallback provider here if needed
          }
        }

        if (provider) {
          providerRef.current = provider
          const layer = addImageryLayer(viewer, provider, opacity)
          imageryLayerRef.current = layer
          console.log('Satellite imagery layer added')
        }
      } catch (err) {
        console.error('Failed to initialize satellite imagery:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    initializeImagery()

    return () => {
      if (imageryLayerRef.current && viewer) {
        removeImageryLayer(viewer, imageryLayerRef.current)
      }
    }
  }, [viewer])

  // Handle visibility toggle
  useEffect(() => {
    if (!imageryLayerRef.current) return

    imageryLayerRef.current.show = isVisible
    console.log(`Satellite imagery ${isVisible ? 'enabled' : 'disabled'}`)
  }, [isVisible])

  // Handle opacity changes
  useEffect(() => {
    if (!imageryLayerRef.current) return

    setImageryLayerOpacity(imageryLayerRef.current, opacity)
  }, [opacity])

  const toggleImagery = () => {
    setIsVisible(!isVisible)
  }

  const setImageryOpacity = (value: number) => {
    setOpacity(Math.max(0, Math.min(1, value)))
  }

  return {
    isVisible,
    toggleImagery,
    opacity,
    setImageryOpacity,
    loading,
    error,
  }
}
