import { useEffect, useState } from 'react'
import { fetchFlights, fetchSatellites } from '../utils/api-helpers'

export function DataStatus() {
  const [status, setStatus] = useState({
    flights: { count: 0, loading: false, error: null },
    satellites: { count: 0, loading: false, error: null }
  })

  useEffect(() => {
    const testAPIs = async () => {
      // Test flights
      setStatus(prev => ({ ...prev, flights: { ...prev.flights, loading: true } }))
      try {
        const flights = await fetchFlights()
        setStatus(prev => ({ 
          ...prev, 
          flights: { count: flights.length, loading: false, error: null }
        }))
      } catch (error) {
        setStatus(prev => ({ 
          ...prev, 
          flights: { count: 0, loading: false, error: error.message }
        }))
      }

      // Test satellites
      setStatus(prev => ({ ...prev, satellites: { ...prev.satellites, loading: true } }))
      try {
        const satellites = await fetchSatellites()
        setStatus(prev => ({ 
          ...prev, 
          satellites: { count: satellites.length, loading: false, error: null }
        }))
      } catch (error) {
        setStatus(prev => ({ 
          ...prev, 
          satellites: { count: 0, loading: false, error: error.message }
        }))
      }
    }

    testAPIs()
  }, [])

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <div>Flights: {status.flights.loading ? 'Loading...' : `${status.flights.count} found`}</div>
      {status.flights.error && <div style={{color: 'red'}}>Error: {status.flights.error}</div>}
      
      <div>Satellites: {status.satellites.loading ? 'Loading...' : `${status.satellites.count} found`}</div>
      {status.satellites.error && <div style={{color: 'red'}}>Error: {status.satellites.error}</div>}
    </div>
  )
}