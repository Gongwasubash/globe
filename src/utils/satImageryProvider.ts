import * as Cesium from 'cesium'

/**
 * Satellite imagery provider setup
 * Uses NOAA GOES real-time satellite imagery
 */

export interface ImageryLayerConfig {
  provider: Cesium.ImageryProvider
  layer: Cesium.ImageryLayer
  opacity: number
  visible: boolean
}

/**
 * Create NOAA GOES satellite imagery provider
 * Real-time satellite imagery updated every 15 minutes
 */
export async function createNOAAGOESProvider(): Promise<Cesium.ImageryProvider> {
  try {
    const provider = new Cesium.WebMapServiceImageryProvider({
      url: 'https://geoserver.wms.noaa.gov/geoserver/GOES-East/wms',
      layers: 'GOES-East_FullDisk_TrueColor',
      parameters: {
        transparent: true,
        format: 'image/png',
      },
    })

    return provider
  } catch (error) {
    console.error('Failed to create NOAA GOES provider:', error)
    throw error
  }
}

/**
 * Create alternative MODIS satellite imagery provider
 * Daily global coverage with moderate resolution
 */
export async function createMODISProvider(): Promise<Cesium.ImageryProvider> {
  try {
    // Using USGS MODIS imagery from NASA's WMS service
    const provider = new Cesium.WebMapServiceImageryProvider({
      url: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc',
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      style: '',
      format: 'image/jpeg',
      tileMatrixSetID: 'GoogleMapsCompatible_Level',
    })

    return provider
  } catch (error) {
    console.error('Failed to create MODIS provider:', error)
    throw error
  }
}

/**
 * Create fallback Bing Maps imagery provider
 * Always available, good coverage
 */
export function createBingMapsProvider(): Cesium.BingMapsImageryProvider {
  return new Cesium.BingMapsImageryProvider({
    url: 'https://dev.virtualearth.net',
    key: 'key', // Uses Cesium's default key
    mapStyle: Cesium.BingMapsStyle.AERIAL_WITH_LABELS,
  })
}

/**
 * Add imagery layer to Cesium viewer
 */
export function addImageryLayer(
  viewer: any,
  provider: Cesium.ImageryProvider,
  opacity: number = 0.6,
): Cesium.ImageryLayer {
  const layer = viewer.imageryLayers.addImageryProvider(provider)
  layer.alpha = opacity
  return layer
}

/**
 * Remove imagery layer from viewer
 */
export function removeImageryLayer(viewer: any, layer: Cesium.ImageryLayer): void {
  viewer.imageryLayers.remove(layer)
}

/**
 * Set imagery layer opacity
 */
export function setImageryLayerOpacity(layer: Cesium.ImageryLayer, opacity: number): void {
  layer.alpha = Math.max(0, Math.min(1, opacity))
}

/**
 * Get imagery layer opacity
 */
export function getImageryLayerOpacity(layer: Cesium.ImageryLayer): number {
  return layer.alpha
}
