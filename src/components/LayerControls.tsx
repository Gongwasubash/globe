import { DataLayerManager } from '../utils/dataLayerManager'

interface LayerControlsProps {
  layerManager: DataLayerManager | null
  counts: {
    flights: number
    satellites: number
    earthquakes: number
    wildfires: number
    vessels: number
  }
  imageryVisible?: boolean
  onToggleImagery?: () => void
}

/**
 * Control panel for toggling data layer visibility
 */
export function LayerControls({ layerManager, counts, imageryVisible = true, onToggleImagery }: LayerControlsProps) {
  if (!layerManager) return null

  const handleToggle = (layer: 'flights' | 'satellites' | 'earthquakes' | 'wildfires' | 'vessels') => {
    layerManager.toggleLayer(layer)
    // Force re-render by updating visibility state
    window.dispatchEvent(new CustomEvent('layerToggled', { detail: { layer } }))
  }

  const isActive = (layer: 'flights' | 'satellites' | 'earthquakes' | 'wildfires' | 'vessels') => {
    return layerManager.isLayerVisible(layer)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        zIndex: 1000,
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        maxWidth: '600px',
      }}
    >
      <LayerButton
        label="Flights"
        count={counts.flights}
        shortcut="T"
        active={isActive('flights')}
        onClick={() => handleToggle('flights')}
        color="#FF6B6B"
      />
      <LayerButton
        label="Satellites"
        count={counts.satellites}
        shortcut="S"
        active={isActive('satellites')}
        onClick={() => handleToggle('satellites')}
        color="#4ECDC4"
      />
      <LayerButton
        label="Earthquakes"
        count={counts.earthquakes}
        shortcut="E"
        active={isActive('earthquakes')}
        onClick={() => handleToggle('earthquakes')}
        color="#FFD93D"
      />
      <LayerButton
        label="Wildfires"
        count={counts.wildfires}
        shortcut="W"
        active={isActive('wildfires')}
        onClick={() => handleToggle('wildfires')}
        color="#FF9D3D"
      />
      <LayerButton
        label="Vessels"
        count={counts.vessels}
        shortcut="V"
        active={isActive('vessels')}
        onClick={() => handleToggle('vessels')}
        color="#00BFFF"
      />

      {/* Satellite Imagery Toggle */}
      {onToggleImagery && (
        <LayerButton
          label="Satellite Imagery"
          count={0}
          shortcut="I"
          active={imageryVisible}
          onClick={onToggleImagery}
          color="#00FFFF"
        />
      )}
    </div>
  )
}

interface LayerButtonProps {
  label: string
  count: number
  shortcut: string
  active: boolean
  onClick: () => void
  color: string
}

/**
 * Individual layer toggle button
 */
function LayerButton({ label, count, shortcut, active, onClick, color }: LayerButtonProps) {
  return (
    <button
      onClick={onClick}
      title={`Toggle ${label} layer (${shortcut})`}
      style={{
        backgroundColor: active ? color : '#222222',
        color: active ? '#000000' : '#AAAAAA',
        border: `2px solid ${color}`,
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: '11px',
        fontWeight: 'bold',
        transition: 'all 0.2s ease',
        opacity: active ? 1 : 0.6,
        boxShadow: active ? `0 0 10px ${color}80` : 'none',
      }}
      onMouseEnter={(e) => {
        const btn = e.currentTarget
        btn.style.opacity = '1'
        btn.style.boxShadow = `0 0 15px ${color}cc`
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget
        btn.style.opacity = active ? '1' : '0.6'
        btn.style.boxShadow = active ? `0 0 10px ${color}80` : 'none'
      }}
    >
      {label}
      <span style={{ fontSize: '9px', marginLeft: '4px', opacity: 0.8 }}>
        [{count}]
      </span>
      <span style={{ fontSize: '8px', marginLeft: '4px', opacity: 0.6 }}>
        ({shortcut})
      </span>
    </button>
  )
}
