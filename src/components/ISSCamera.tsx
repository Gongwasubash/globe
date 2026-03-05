import { useEffect, useState } from 'react'
import './ISSCamera.css'

interface ISSData {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  footprint: number
  timestamp: string
}

/**
 * ISS Live Camera Widget
 * Displays NASA's live ISS feed and current orbital parameters
 */
export function ISSCamera() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [issData, setIssData] = useState<ISSData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch ISS position data
  useEffect(() => {
    const fetchISSData = async () => {
      try {
        setLoading(true)
        const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544', {
          signal: AbortSignal.timeout(5000),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = await response.json()
        setIssData({
          latitude: data.latitude,
          longitude: data.longitude,
          altitude: data.altitude,
          velocity: data.velocity,
          footprint: data.footprint,
          timestamp: new Date().toISOString(),
        })
        setLastUpdate(new Date())
        setError(null)
      } catch (err) {
        console.error('Failed to fetch ISS data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchISSData()

    // Set up interval for updates (every 5 seconds)
    const intervalId = setInterval(fetchISSData, 5000)

    return () => clearInterval(intervalId)
  }, [])

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString()
  }

  return (
    <div className="iss-camera-widget">
      <div className="iss-camera-header">
        <button className="iss-toggle-btn" onClick={() => setIsExpanded(!isExpanded)}>
          <span className="iss-icon">🛰️</span>
          <span className="iss-title">ISS Live Camera</span>
          <span className={`iss-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </button>
      </div>

      {isExpanded && (
        <div className="iss-camera-content">
          {/* Live video embed */}
          <div className="iss-video-container">
            <div className="iss-video-placeholder">
              <p>NASA ISS Live Feed</p>
              <iframe
                width="100%"
                height="300"
                src="https://www.youtube.com/embed/P9C25Un7dGQ?autoplay=1"
                title="NASA ISS Live Feed"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Orbital data */}
          <div className="iss-data-panel">
            <h3>Orbital Parameters</h3>

            {loading && <div className="iss-loading">Updating...</div>}

            {error && <div className="iss-error">Error: {error}</div>}

            {issData && (
              <div className="iss-data-grid">
                <div className="iss-data-item">
                  <label>Latitude</label>
                  <div className="iss-value">{formatNumber(issData.latitude, 4)}°</div>
                </div>

                <div className="iss-data-item">
                  <label>Longitude</label>
                  <div className="iss-value">{formatNumber(issData.longitude, 4)}°</div>
                </div>

                <div className="iss-data-item">
                  <label>Altitude</label>
                  <div className="iss-value">{formatNumber(issData.altitude, 0)} km</div>
                </div>

                <div className="iss-data-item">
                  <label>Velocity</label>
                  <div className="iss-value">{formatNumber(issData.velocity, 2)} km/s</div>
                </div>

                <div className="iss-data-item">
                  <label>Coverage Radius</label>
                  <div className="iss-value">{formatNumber(issData.footprint, 0)} km</div>
                </div>

                <div className="iss-data-item">
                  <label>Last Update</label>
                  <div className="iss-value">{lastUpdate ? formatTime(lastUpdate) : 'N/A'}</div>
                </div>
              </div>
            )}

            {!issData && !loading && !error && (
              <div className="iss-no-data">Fetching ISS data...</div>
            )}
          </div>

          {/* Quick info */}
          <div className="iss-info">
            <p>
              <strong>ISS (International Space Station)</strong> orbits Earth every 90 minutes at approximately 28,000 km/h.
              NASA provides this live camera feed 24/7, showing Earth from 400+ km altitude.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
