import { useEffect, useRef, useState } from 'react'
import { Ion, Viewer, Terrain, buildModuleUrl } from 'cesium'
import { useEffects } from './hooks/useEffects'
import { useKeyboardEvents } from './hooks/useKeyboardEvents'
import { useFlightTracking } from './hooks/useFlightTracking'
import { useSatellites } from './hooks/useSatellites'
import { useEarthquakes } from './hooks/useEarthquakes'
import { useWildfires } from './hooks/useWildfires'
import { useEntitySelection } from './hooks/useEntitySelection'
import { useCameraFollow } from './hooks/useCameraFollow'
import { useCameraMode } from './hooks/useCameraMode'
import { useImageryLayer } from './hooks/useImageryLayer'
import { useAIIntelligence } from './hooks/useAIIntelligence'
import { StatusBar } from './components/StatusBar'
import { LayerControls } from './components/LayerControls'
import { ISSCamera } from './components/ISSCamera'
import { FollowModeUI } from './components/FollowModeUI'
import { POVMap } from './components/POVMap'
import { DataStatus } from './components/DataStatus'
import { IntelligencePanel } from './components/IntelligencePanel'
import { DataLayerManager } from './utils/dataLayerManager'
import { DebugPanel } from './components/DebugPanel'
import { testAPIs } from './utils/testAPIs'
import { FlightIconLayer } from './components/Globe/FlightIconLayer'
import { DashboardHeader } from './components/DashboardHeader'
import { DashboardSidebar } from './components/DashboardSidebar'

// Set Cesium base URL
;(buildModuleUrl as any).setBaseUrl('/cesium/')

// Set Ion token
Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || ''

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const [viewer, setViewer] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Data layer management
  const layerManagerRef = useRef<DataLayerManager | null>(null)
  const [layerManager, setLayerManager] = useState<DataLayerManager | null>(null)
  const [layerCounts, setLayerCounts] = useState({
    flights: 0,
    satellites: 0,
    earthquakes: 0,
    wildfires: 0,
    vessels: 0,
  })
  const [updateCount, setUpdateCount] = useState(0) // Trigger re-render on layer changes

  // Phase 4: Camera and follow mode
  const { selectedEntity, clearSelection } = useEntitySelection(viewer)
  const { isFollowing, followEntity } = useCameraFollow(viewer, selectedEntity)
  const { mode: cameraMode } = useCameraMode(viewer, selectedEntity, isFollowing)

  // Phase 4: Satellite imagery
  const { isVisible: imageryVisible, toggleImagery } = useImageryLayer(viewer)

  // Initialize Cesium Viewer
  useEffect(() => {
    // Test APIs on startup
    testAPIs()
    if (!containerRef.current) return

    // Create Cesium Viewer
    const newViewer = new Viewer(containerRef.current, {
      terrain: Terrain.fromWorldTerrain(),
    })

    viewerRef.current = newViewer
    setViewer(newViewer)

    // Initialize data layer manager
    const manager = new DataLayerManager(newViewer)
    layerManagerRef.current = manager
    setLayerManager(manager)

    // Listen for layer toggle events
    const handleLayerToggle = () => {
      if (layerManagerRef.current) {
        setLayerCounts(layerManagerRef.current.getAllEntityCounts())
      }
    }

    window.addEventListener('layerToggled', handleLayerToggle)

    return () => {
      window.removeEventListener('layerToggled', handleLayerToggle)
      newViewer.destroy()
      viewerRef.current = null
      setViewer(null)
      if (layerManagerRef.current) {
        layerManagerRef.current.destroy()
        layerManagerRef.current = null
        setLayerManager(null)
      }
    }
  }, [])

  // Initialize visual effects system
  const { effectMode, changeEffect } = useEffects(viewer)

  // Initialize keyboard event handlers
  useKeyboardEvents({
    viewer,
    changeEffect,
  })

  // Initialize data layers
  const flightTracking = useFlightTracking(viewer, layerManager)
  const satellites = useSatellites(viewer, layerManager)
  const earthquakes = useEarthquakes(viewer, layerManager)
  const wildfires = useWildfires(viewer, layerManager)

  // Phase 4: AI Intelligence Layer (must come after data layers)
  const { 
    intelligence, 
    isAnalyzing, 
    analyzeRegion, 
    getEntityIntelligence 
  } = useAIIntelligence(viewer, {
    flights: flightTracking.flights,
    satellites: satellites.satellites,
    earthquakes: earthquakes.earthquakes,
    wildfires: wildfires.wildfires
  })

  // Update layer counts when data changes
  useEffect(() => {
    if (layerManager) {
      setLayerCounts(layerManager.getAllEntityCounts())
    }
  }, [flightTracking.flights.length, satellites.satellites.length, earthquakes.earthquakes.length, wildfires.wildfires.length, layerManager])

  // Handle keyboard shortcuts for layer toggling
  useEffect(() => {
    if (!layerManager) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // T: Toggle flights
      if (event.key.toLowerCase() === 't' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        layerManager.toggleLayer('flights')
        setUpdateCount((c) => c + 1)
        console.log('Flights toggled')
      }

      // S: Toggle satellites
      if (event.key.toLowerCase() === 's' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        layerManager.toggleLayer('satellites')
        setUpdateCount((c) => c + 1)
        console.log('Satellites toggled')
      }

      // E: Toggle earthquakes
      if (event.key.toLowerCase() === 'e' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        layerManager.toggleLayer('earthquakes')
        setUpdateCount((c) => c + 1)
        console.log('Earthquakes toggled')
      }

      // W: Toggle wildfires
      if (event.key.toLowerCase() === 'w' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        layerManager.toggleLayer('wildfires')
        setUpdateCount((c) => c + 1)
        console.log('Wildfires toggled')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [layerManager, updateCount])

  return (
    <>
      <div ref={containerRef} style={{ width: '100vw', height: 'calc(100vh - 70px)', marginTop: '70px' }} />

      <DashboardHeader
        flightCount={flightTracking.flights.length}
        satelliteCount={satellites.satellites.length}
        earthquakeCount={earthquakes.earthquakes.length}
        wildfireCount={wildfires.wildfires.length}
        layerManager={layerManager}
        viewer={viewer}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <DashboardSidebar
        flights={flightTracking.flights}
        satellites={satellites.satellites}
        earthquakes={earthquakes.earthquakes}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {viewer && (
        <FlightIconLayer
          viewer={viewer}
          flights={flightTracking.flights}
          enabled={layerManager?.isLayerVisible('flights') ?? true}
        />
      )}
    </>
  )
}