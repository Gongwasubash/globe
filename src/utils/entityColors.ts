import * as Cesium from 'cesium'

/**
 * Color utility functions for data layer visualization
 */

/**
 * Get color for flight based on altitude
 * Blue (low) → Green (medium) → Red (high)
 */
export function getFlightColor(altitudeMeters: number | null): Cesium.Color {
  if (!altitudeMeters) return Cesium.Color.YELLOW // Ground level

  // Clamp altitude: 0-12000m (0-40k ft)
  const normalized = Math.min(1, altitudeMeters / 12000)

  if (normalized < 0.5) {
    // Blue to Green
    const t = normalized * 2
    return new Cesium.Color(0, 0.5 + t * 0.5, 1 - t * 0.5, 0.8)
  } else {
    // Green to Red
    const t = (normalized - 0.5) * 2
    return new Cesium.Color(t, 1 - t * 0.5, 0, 0.8)
  }
}

/**
 * Get color for satellite based on type
 */
export function getSatelliteColor(type: string): Cesium.Color {
  switch (type.toLowerCase()) {
    case 'gps':
      return Cesium.Color.WHITE // White for positioning
    case 'weather':
      return Cesium.Color.BLUE // Blue for weather
    case 'communications':
      return new Cesium.Color(1, 0.5, 0, 0.9) // Orange
    case 'earth-observation':
      return Cesium.Color.GREEN // Green for earth obs
    case 'space-station':
      return Cesium.Color.CYAN // Cyan for ISS
    default:
      return Cesium.Color.GRAY
  }
}

/**
 * Get color for earthquake based on magnitude
 * Green (<4) → Yellow (4-5) → Orange (5-6) → Red (6+)
 */
export function getEarthquakeColor(magnitude: number): Cesium.Color {
  if (magnitude < 4) {
    // Green
    return Cesium.Color.LIME
  } else if (magnitude < 5) {
    // Yellow (green + red)
    const t = (magnitude - 4) // 0-1
    return new Cesium.Color(t, 1, 0, 0.9)
  } else if (magnitude < 6) {
    // Orange (red + green)
    const t = (magnitude - 5) // 0-1
    return new Cesium.Color(1, 1 - t * 0.5, 0, 0.9)
  } else {
    // Red for 6+
    return Cesium.Color.RED
  }
}

/**
 * Get size multiplier for earthquake based on magnitude
 */
export function getEarthquakeSize(magnitude: number): number {
  // Base: m3 = 5000m radius, M6 = 50000m radius
  // Logarithmic scale
  return Math.pow(10, magnitude - 2.5) * 1000
}

/**
 * Get color for wildfire based on brightness/intensity
 * Yellow (low) → Orange (medium) → Red (high)
 */
export function getWildfireColor(brightness: number): Cesium.Color {
  // Normalize brightness 0-100
  const normalized = Math.min(1, brightness / 100)

  if (normalized < 0.5) {
    // Yellow to Orange
    const t = normalized * 2
    return new Cesium.Color(1, 1 - t * 0.5, 0, 0.85)
  } else {
    // Orange to Red
    const t = (normalized - 0.5) * 2
    return new Cesium.Color(1, 0.5 - t * 0.5, 0, 0.85)
  }
}

/**
 * Get size for wildfire point based on brightness
 */
export function getWildfireSize(brightness: number): number {
  // 0-100 brightness → 500-5000m radius
  return 500 + (brightness / 100) * 4500
}

/**
 * Get earthquake depth color tint
 * Deep earthquakes are darker, shallow are lighter
 */
export function getEarthquakeDepthTint(depthKm: number, magnitude: number): Cesium.Color {
  const base = getEarthquakeColor(magnitude)

  // Depth: 0-700km
  const depthFactor = Math.min(1, depthKm / 700)

  // Darken for deep earthquakes
  return new Cesium.Color(
    base.red * (1 - depthFactor * 0.3),
    base.green * (1 - depthFactor * 0.3),
    base.blue * (1 - depthFactor * 0.3),
    base.alpha
  )
}

/**
 * Get label color for good contrast on both light and dark backgrounds
 */
export function getLabelColor(): Cesium.Color {
  return Cesium.Color.WHITE
}

/**
 * Get outline color for good visibility
 */
export function getOutlineColor(): Cesium.Color {
  return Cesium.Color.BLACK
}
