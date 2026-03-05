/**
 * TypeScript interfaces for all data layers
 */

export type DataLayerType = 'flights' | 'satellites' | 'earthquakes' | 'wildfires' | 'vessels'

export interface Aircraft {
  id: string
  callsign: string
  lat: number
  lon: number
  alt: number | null
  heading: number | null
  speed: number | null
  country: string
  onGround: boolean
  lastUpdated: Date
}

export interface Satellite {
  id: string
  name: string
  lat: number
  lon: number
  alt: number
  tle1: string
  tle2: string
  type: SatelliteType
  lastUpdated: Date
}

export type SatelliteType = 'gps' | 'weather' | 'communications' | 'earth-observation' | 'space-station' | 'other'

export interface Earthquake {
  id: string
  magnitude: number
  lat: number
  lon: number
  depth: number // km
  place: string
  time: Date
  url: string
  felt?: number
  tsunami?: boolean
}

export interface Wildfire {
  id: string
  lat: number
  lon: number
  brightness: number // 0-100
  confidence: number // 0-100
  dayNight: 'D' | 'N'
  acquisitionDate: Date
  acquisitionTime: string
  satellite: 'VIIRS' | 'MODIS'
}

export interface Vessel {
  mmsi: number
  name: string
  lat: number
  lon: number
  course: number
  speed: number
  heading: number
  type: string
  flag: string
  timestamp: number
}

export interface DataLayerState {
  flights: {
    visible: boolean
    count: number
    lastUpdate: Date | null
    error: string | null
  }
  satellites: {
    visible: boolean
    count: number
    lastUpdate: Date | null
    error: string | null
  }
  earthquakes: {
    visible: boolean
    count: number
    lastUpdate: Date | null
    error: string | null
  }
  wildfires: {
    visible: boolean
    count: number
    lastUpdate: Date | null
    error: string | null
  }
  vessels: {
    visible: boolean
    count: number
    lastUpdate: Date | null
    error: string | null
  }
}

export interface DataLayerHooks {
  flights: {
    data: Aircraft[]
    loading: boolean
    error: string | null
  }
  satellites: {
    data: Satellite[]
    loading: boolean
    error: string | null
  }
  earthquakes: {
    data: Earthquake[]
    loading: boolean
    error: string | null
  }
  wildfires: {
    data: Wildfire[]
    loading: boolean
    error: string | null
  }
  vessels: {
    data: Vessel[]
    loading: boolean
    error: string | null
  }
}
