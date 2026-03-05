import { useState, useEffect, useRef } from 'react'
import { Search, Maximize2, Minimize2 } from 'lucide-react'
import * as Cesium from 'cesium'

interface LocationSearchProps {
  viewer: any
}

export function LocationSearch({ viewer }: LocationSearchProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [is3D, setIs3D] = useState(true)
  const [loading, setLoading] = useState(false)
  const boundaryEntityRef = useRef<any>(null)
  const labelEntityRef = useRef<any>(null)

  useEffect(() => {
    if (search.length < 2) {
      setResults([])
      return
    }

    const searchLocations = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=15&addressdetails=1&countrycodes=np`,
          {
            signal: AbortSignal.timeout(8000),
            headers: { 
              'Accept-Language': 'en',
              'User-Agent': '3DMapDashboard/1.0'
            }
          }
        )
        const data = await response.json()
        if (data && data.length > 0) {
          setResults(data)
        } else {
          // Retry without country filter for broader search
          const retryResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=15&addressdetails=1`,
            {
              signal: AbortSignal.timeout(8000),
              headers: { 
                'Accept-Language': 'en',
                'User-Agent': '3DMapDashboard/1.0'
              }
            }
          )
          const retryData = await retryResponse.json()
          setResults(retryData || [])
        }
      } catch (e) {
        console.error('Search error:', e)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(searchLocations, 300)
    return () => clearTimeout(timer)
  }, [search])

  const flyToLocation = async (lat: string, lon: string, name: string, osm_id: string, osm_type: string) => {
    if (!viewer) return

    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)
    
    if (isNaN(latNum) || isNaN(lonNum)) return

    // Remove previous boundary and label
    if (boundaryEntityRef.current && viewer.entities.contains(boundaryEntityRef.current)) {
      viewer.entities.remove(boundaryEntityRef.current)
    }
    if (labelEntityRef.current && viewer.entities.contains(labelEntityRef.current)) {
      viewer.entities.remove(labelEntityRef.current)
    }

    // Add location name label
    labelEntityRef.current = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lonNum, latNum, 50000),
      label: {
        text: name,
        font: 'bold 16px sans-serif',
        fillColor: Cesium.Color.CYAN,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        showBackground: true,
        backgroundColor: new Cesium.Color(0, 0, 0, 0.8),
        backgroundPadding: new Cesium.Cartesian2(8, 4),
      },
    })

    // Fetch polygon data
    try {
      const polyResponse = await fetch(
        `https://nominatim.openstreetmap.org/details?osm_id=${osm_id}&osm_type=${osm_type}&format=json&polygon_geojson=1`,
        {
          headers: { 'User-Agent': '3DMapDashboard/1.0' }
        }
      )
      const polyData = await polyResponse.json()

      if (polyData.geometry && polyData.geometry.coordinates) {
        const positions = parseGeoJSON(polyData.geometry)
        if (positions.length > 0) {
          boundaryEntityRef.current = viewer.entities.add({
            polyline: {
              positions,
              width: 2,
              material: Cesium.Color.CYAN.withAlpha(0.8),
              clampToGround: true,
            },
          })
        }
      }
    } catch (e) {
      console.debug('Could not fetch boundary:', e)
    }

    const alt = 100000
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lonNum, latNum, alt),
      duration: 2,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      }
    })
    setSearch('')
    setResults([])
    setShowDropdown(false)
  }

  const parseGeoJSON = (geometry: any): Cesium.Cartesian3[] => {
    const positions: Cesium.Cartesian3[] = []
    
    const addCoords = (coords: any[]) => {
      if (typeof coords[0] === 'number') {
        positions.push(Cesium.Cartesian3.fromDegrees(coords[0], coords[1]))
      } else {
        coords.forEach(c => addCoords(c))
      }
    }

    if (geometry.type === 'Polygon') {
      addCoords(geometry.coordinates[0])
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((poly: any) => addCoords(poly[0]))
    }

    return positions
  }

  const toggle3D = () => {
    if (!viewer) return
    
    if (is3D) {
      viewer.scene.morphTo2D(1)
      setIs3D(false)
    } else {
      viewer.scene.morphTo3D(1)
      setIs3D(true)
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      marginLeft: '30px'
    }} onClick={(e) => e.stopPropagation()}>
      <div style={{ position: 'relative', width: '280px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0, 212, 255, 0.1)',
          border: '1px solid #00d4ff',
          borderRadius: '6px',
          padding: '8px 12px',
          gap: '8px'
        }}>
          <Search size={16} color="#00d4ff" />
          <input
            type="text"
            placeholder="Search location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              outline: 'none'
            }}
          />
          {loading && (
            <div style={{
              width: '14px',
              height: '14px',
              border: '2px solid #00d4ff33',
              borderTop: '2px solid #00d4ff',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite'
            }} />
          )}
        </div>

        {showDropdown && results.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#1a1a2e',
            border: '1px solid #00d4ff',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            marginTop: '-1px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1001
          }}>
            {results.map((result, idx) => {
              const displayName = result.name || `${result.lat}, ${result.lon}`
              const displayAddress = result.address?.city || result.address?.town || result.address?.county || `${result.lat}, ${result.lon}`
              return (
                <button
                  key={idx}
                  onClick={() => flyToLocation(result.lat, result.lon, displayName, result.osm_id, result.osm_type)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#00d4ff',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: '1px solid #333',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#00d4ff15'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ fontWeight: '600' }}>📍 {displayName}</div>
                  <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                    {displayAddress}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {showDropdown && search.length >= 2 && results.length === 0 && !loading && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#1a1a2e',
            border: '1px solid #00d4ff',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            marginTop: '-1px',
            padding: '12px',
            color: '#888',
            fontSize: '12px',
            textAlign: 'center',
            zIndex: 1001
          }}>
            No locations found
          </div>
        )}

        {showDropdown && loading && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#1a1a2e',
            border: '1px solid #00d4ff',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            marginTop: '-1px',
            padding: '12px',
            color: '#888',
            fontSize: '12px',
            textAlign: 'center',
            zIndex: 1001
          }}>
            Searching...
          </div>
        )}
      </div>

      <button
        onClick={toggle3D}
        style={{
          padding: '8px 12px',
          background: is3D ? '#00d4ff15' : '#00ff8815',
          border: `1px solid ${is3D ? '#00d4ff' : '#00ff88'}`,
          borderRadius: '6px',
          color: is3D ? '#00d4ff' : '#00ff88',
          fontSize: '11px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = is3D ? '#00d4ff30' : '#00ff8830'
          e.currentTarget.style.boxShadow = `0 0 10px ${is3D ? '#00d4ff40' : '#00ff8840'}`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = is3D ? '#00d4ff15' : '#00ff8815'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {is3D ? (
          <>
            <Maximize2 size={14} />
            3D
          </>
        ) : (
          <>
            <Minimize2 size={14} />
            2D
          </>
        )}
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        div:has(> input:focus) {
          box-shadow: 0 0 8px #00d4ff40;
        }
      `}</style>
    </div>
  )
}
