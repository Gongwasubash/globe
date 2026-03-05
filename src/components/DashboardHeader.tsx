import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { LocationSearch } from './LocationSearch'
import { DistanceMeasurer } from './DistanceMeasurer'

interface DashboardHeaderProps {
  flightCount: number
  satelliteCount: number
  earthquakeCount: number
  wildfireCount: number
  layerManager: any
  viewer: any
  onMenuClick: () => void
}

export function DashboardHeader({
  flightCount,
  satelliteCount,
  earthquakeCount,
  wildfireCount,
  layerManager,
  viewer,
  onMenuClick
}: DashboardHeaderProps) {
  const [time, setTime] = useState(new Date())
  const [layerStates, setLayerStates] = useState({
    flights: false,
    satellites: false,
    earthquakes: false,
    wildfires: false
  })

  useEffect(() => {
    const handleLayerToggle = (e: any) => {
      const layer = e.detail.layer
      setLayerStates(prev => ({
        ...prev,
        [layer]: !prev[layer]
      }))
    }
    window.addEventListener('layerToggled', handleLayerToggle)
    return () => window.removeEventListener('layerToggled', handleLayerToggle)
  }, [])

  const toggleLayer = (layer: string) => {
    if (layerManager) {
      layerManager.toggleLayer(layer as any)
      window.dispatchEvent(new CustomEvent('layerToggled', { detail: { layer } }))
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '70px',
      background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
      borderBottom: '2px solid #00d4ff',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      boxShadow: '0 4px 20px rgba(0, 212, 255, 0.1)',
      fontFamily: 'Inter, sans-serif',
      gap: '20px'
    }}>
      {/* Hamburger Menu - Mobile Only */}
      <button
        onClick={onMenuClick}
        style={{
          display: 'none',
          '@media (max-width: 768px)': { display: 'flex' },
          width: '32px',
          height: '32px',
          padding: 0,
          background: '#00d4ff15',
          border: '1px solid #00d4ff',
          borderRadius: '4px',
          color: '#00d4ff',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#00d4ff30'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#00d4ff15'
        }}
      >
        <Menu size={18} />
      </button>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '280px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          🌍
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00d4ff', lineHeight: '1' }}>
            GEOSPATIAL
          </div>
          <div style={{ fontSize: '10px', color: '#888', lineHeight: '1' }}>
            Intelligence
          </div>
        </div>
      </div>

      {/* Stats - Compact */}
      <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
        <StatCard icon="✈️" label="Flights" value={flightCount} color="#00d4ff" />
        <StatCard icon="🛰️" label="Satellites" value={satelliteCount} color="#00ff88" />
        <StatCard icon="📍" label="Earthquakes" value={earthquakeCount} color="#ff6b6b" />
        <StatCard icon="🔥" label="Fires" value={wildfireCount} color="#ffa500" />
      </div>

      {/* Location Search */}
      <LocationSearch viewer={viewer} />

      {/* Distance Measurer */}
      <DistanceMeasurer viewer={viewer} />

      {/* Time */}
      <div style={{
        textAlign: 'right',
        fontSize: '12px',
        color: '#00d4ff',
        fontWeight: '600',
        minWidth: '100px'
      }}>
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Layer Controls */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <LayerButton label="T" onClick={() => toggleLayer('flights')} color="#00d4ff" isActive={layerStates.flights} />
        <LayerButton label="S" onClick={() => toggleLayer('satellites')} color="#00ff88" isActive={layerStates.satellites} />
        <LayerButton label="E" onClick={() => toggleLayer('earthquakes')} color="#ff6b6b" isActive={layerStates.earthquakes} />
        <LayerButton label="W" onClick={() => toggleLayer('wildfires')} color="#ffa500" isActive={layerStates.wildfires} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 10px',
      background: `${color}08`,
      borderRadius: '4px',
      border: `1px solid ${color}30`,
      fontSize: '11px',
      whiteSpace: 'nowrap'
    }}>
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <div>
        <div style={{ color: '#888', fontSize: '9px' }}>{label}</div>
        <div style={{ fontWeight: 'bold', color, fontSize: '12px' }}>{value}</div>
      </div>
    </div>
  )
}

function LayerButton({ label, onClick, color, isActive }: any) {
  return (
    <button
      onClick={onClick}
      title={`Toggle ${label}`}
      style={{
        width: '32px',
        height: '32px',
        padding: 0,
        background: isActive ? `${color}30` : `${color}08`,
        border: `2px solid ${isActive ? color : `${color}50`}`,
        borderRadius: '4px',
        color: color,
        fontSize: '11px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isActive ? `0 0 12px ${color}60` : 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${color}40`
        e.currentTarget.style.boxShadow = `0 0 12px ${color}60`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isActive ? `${color}30` : `${color}08`
        e.currentTarget.style.boxShadow = isActive ? `0 0 12px ${color}60` : 'none'
      }}
    >
      {label}
    </button>
  )
}
