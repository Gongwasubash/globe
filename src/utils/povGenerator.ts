import * as Cesium from 'cesium'

/**
 * POV (Point of View) Map Generator Utilities
 * Generates simulated camera views showing what's visible from object's perspective
 */

export interface ViewingFootprint {
  center: { lat: number; lon: number }
  radius: number // in km
  polygon: Cesium.Cartesian3[]
  heading: number
}

export interface POVMapData {
  position: { lat: number; lon: number; alt: number }
  footprint: ViewingFootprint
  imageUrl?: string
}

/**
 * Calculate viewing radius based on object altitude
 * Uses Earth curvature calculations
 */
export function calculateViewingRadius(altitudeKm: number, objectType: string): number {
  // Earth radius in km
  const EARTH_RADIUS = 6371

  let horizonMultiplier = 1
  if (objectType === 'aircraft') {
    horizonMultiplier = 1.2 // Aircraft: slightly closer horizon
  } else if (objectType === 'satellite') {
    horizonMultiplier = 1.5 // Satellite: can see much farther
  } else if (objectType === 'iss') {
    horizonMultiplier = 1.5 // ISS: similar to other spacecraft
  }

  // Formula: radius = sqrt(2 * R * h) where R = Earth radius, h = altitude
  // This accounts for Earth curvature and gives approximate viewing distance along surface
  const radius = Math.sqrt(2 * EARTH_RADIUS * altitudeKm) * horizonMultiplier

  return Math.min(radius, 5000) // Cap at 5000km
}

/**
 * Generate viewing footprint polygon
 * Returns a circle of points representing what's visible from object
 */
export function generateViewingFootprint(
  lat: number,
  lon: number,
  radiusKm: number,
  bearing: number = 0,
): ViewingFootprint {
  const EARTH_RADIUS = 6371 // km

  // Convert to radians
  const latRad = Cesium.Math.toRadians(lat)
  const lonRad = Cesium.Math.toRadians(lon)
  const radiusRad = radiusKm / EARTH_RADIUS

  // Generate polygon points (circle around position)
  const points: Cesium.Cartesian3[] = []
  const segments = 32 // Number of points in circle

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const b = Cesium.Math.toRadians(bearing + angle)

    // Calculate new latitude/longitude
    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(radiusRad) +
        Math.cos(latRad) * Math.sin(radiusRad) * Math.cos(b),
    )
    const lon2 =
      lonRad +
      Math.atan2(
        Math.sin(b) * Math.sin(radiusRad) * Math.cos(latRad),
        Math.cos(radiusRad) - Math.sin(latRad) * Math.sin(lat2),
      )

    const point = Cesium.Cartesian3.fromDegrees(
      Cesium.Math.toDegrees(lon2),
      Cesium.Math.toDegrees(lat2),
      0,
    )
    points.push(point)
  }

  return {
    center: { lat, lon },
    radius: radiusKm,
    polygon: points,
    heading: bearing,
  }
}

/**
 * Calculate what's visible from a position
 * Determines if other objects are within viewing range
 */
export function isPositionVisible(
  observerLat: number,
  observerLon: number,
  observerAlt: number,
  targetLat: number,
  targetLon: number,
  targetAlt: number,
  objectType: string,
): boolean {
  // Calculate distance using Haversine formula
  const distance = calculateGreatCircleDistance(observerLat, observerLon, targetLat, targetLon)

  // Check if within viewing radius
  const radius = calculateViewingRadius(observerAlt, objectType)

  return distance <= radius
}

/**
 * Great circle distance between two geographic points
 * Returns distance in km
 */
export function calculateGreatCircleDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const EARTH_RADIUS = 6371 // km

  const lat1Rad = Cesium.Math.toRadians(lat1)
  const lat2Rad = Cesium.Math.toRadians(lat2)
  const deltaLat = lat2Rad - lat1Rad
  const deltaLon = Cesium.Math.toRadians(lon2 - lon1)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = EARTH_RADIUS * c

  return distance
}

/**
 * Generate map tile URL for POV region
 * Creates a StaticMapProvider-like image URL centered at position
 */
export function generatePOVMapUrl(
  lat: number,
  lon: number,
  radiusKm: number,
  width: number = 400,
  height: number = 400,
): string {
  // Using OpenStreetMap tile services
  const zoom = calculateOptimalZoom(radiusKm)

  // Create a URL for map tiles (could use various tile providers)
  // This is a placeholder - in production would use TileCoordinates or similar
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&maptype=satellite&key=YOUR_API_KEY`
}

/**
 * Calculate optimal zoom level based on viewing radius
 */
function calculateOptimalZoom(radiusKm: number): number {
  // Simple zoom calculation based on radius
  if (radiusKm > 2000) return 4
  if (radiusKm > 1000) return 5
  if (radiusKm > 500) return 6
  if (radiusKm > 200) return 7
  if (radiusKm > 100) return 8
  if (radiusKm > 50) return 9
  if (radiusKm > 25) return 10
  return 11
}

/**
 * Calculate bearing (heading) from one point to another
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const lat1Rad = Cesium.Math.toRadians(lat1)
  const lat2Rad = Cesium.Math.toRadians(lat2)
  const deltaLon = Cesium.Math.toRadians(lon2 - lon1)

  const y = Math.sin(deltaLon) * Math.cos(lat2Rad)
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLon)

  const bearing = Math.atan2(y, x)
  return (Cesium.Math.toDegrees(bearing) + 360) % 360
}
