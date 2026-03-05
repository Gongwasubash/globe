import { useEffect, useState } from 'react'
import { SelectedEntity } from '../types/cameraMode'
import './FollowModeUI.css'

interface FollowModeUIProps {
  selectedEntity: SelectedEntity | null
  isFollowing: boolean
  onExit: () => void
}

/**
 * Follow Mode UI Component
 * Displays information about the currently followed object
 */
export function FollowModeUI({ selectedEntity, isFollowing, onExit }: FollowModeUIProps) {
  const [updateTime, setUpdateTime] = useState<Date>(new Date())

  // Update timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!isFollowing || !selectedEntity) {
    return null
  }

  const getEntityIcon = () => {
    switch (selectedEntity.type) {
      case 'aircraft':
        return '✈️'
      case 'satellite':
        return '🛰️'
      case 'iss':
        return '🚀'
      case 'earthquake':
        return '🌍'
      case 'wildfire':
        return '🔥'
      default:
        return '📍'
    }
  }

  const getEntityColor = () => {
    switch (selectedEntity.type) {
      case 'aircraft':
        return '#00ff00'
      case 'satellite':
        return '#00ffff'
      case 'iss':
        return '#ffff00'
      case 'earthquake':
        return '#ff6600'
      case 'wildfire':
        return '#ff3333'
      default:
        return '#ffffff'
    }
  }

  const formatCoordinate = (value: number): string => {
    return value.toFixed(4)
  }

  const formatAltitude = (altKm: number): string => {
    if (altKm > 1) {
      return `${altKm.toFixed(1)} km`
    }
    return `${(altKm * 1000).toFixed(0)} m`
  }

  return (
    <div className="follow-mode-ui" style={{ '--entity-color': getEntityColor() } as any}>
      <div className="follow-header">
        <div className="follow-title">
          <span className="follow-icon">{getEntityIcon()}</span>
          <span className="follow-name">{selectedEntity.name}</span>
          <span className="follow-type">({selectedEntity.type})</span>
        </div>
        <button className="follow-exit-btn" onClick={onExit} title="Exit follow mode (ESC)">
          ✕
        </button>
      </div>

      <div className="follow-content">
        {/* Position section */}
        <div className="follow-section">
          <h4 className="follow-section-title">Position</h4>
          <div className="follow-info-grid">
            <div className="follow-info-item">
              <label>Latitude</label>
              <div className="follow-value">{formatCoordinate(selectedEntity.position.lat)}°</div>
            </div>
            <div className="follow-info-item">
              <label>Longitude</label>
              <div className="follow-value">{formatCoordinate(selectedEntity.position.lon)}°</div>
            </div>
          </div>
        </div>

        {/* Altitude section */}
        <div className="follow-section">
          <h4 className="follow-section-title">Altitude</h4>
          <div className="follow-altitude-display">
            {formatAltitude(selectedEntity.position.alt)}
          </div>
        </div>

        {/* Heading section (if available) */}
        {selectedEntity.heading !== undefined && (
          <div className="follow-section">
            <h4 className="follow-section-title">Heading</h4>
            <div className="follow-heading-display">
              <div className="follow-heading-value">
                {selectedEntity.heading.toFixed(0)}°
              </div>
              <div className="follow-heading-compass">
                <div className="follow-compass-rose">
                  <div
                    className="follow-compass-arrow"
                    style={{
                      transform: `rotate(${selectedEntity.heading}deg)`,
                    }}
                  >
                    ▲
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="follow-timestamp">
          Updated: {updateTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Controls hint */}
      <div className="follow-controls-hint">
        <span>F1: Global</span>
        <span>F2: Toggle</span>
        <span>F3: POV</span>
        <span>ESC: Exit</span>
      </div>
    </div>
  )
}
