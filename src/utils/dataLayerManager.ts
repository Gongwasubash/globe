/**
 * Manages visibility and lifecycle of all data layers
 */
export class DataLayerManager {
  private viewer: any
  private layerVisibility: {
    flights: boolean
    satellites: boolean
    earthquakes: boolean
    wildfires: boolean
    vessels: boolean
  } = {
    flights: false,
    satellites: false,
    earthquakes: false,
    wildfires: false,
    vessels: false,
  }

  private entityCollections: {
    flights: Map<string, any>
    satellites: Map<string, any>
    earthquakes: Map<string, any>
    wildfires: Map<string, any>
    vessels: Map<string, any>
  } = {
    flights: new Map(),
    satellites: new Map(),
    earthquakes: new Map(),
    wildfires: new Map(),
    vessels: new Map(),
  }

  constructor(viewer: any) {
    this.viewer = viewer
  }

  /**
   * Toggle visibility of a layer
   */
  toggleLayer(layerType: 'flights' | 'satellites' | 'earthquakes' | 'wildfires' | 'vessels'): boolean {
    this.layerVisibility[layerType] = !this.layerVisibility[layerType]
    this.updateLayerVisibility(layerType)
    return this.layerVisibility[layerType]
  }

  /**
   * Set layer visibility explicitly
   */
  setLayerVisible(layerType: 'flights' | 'satellites' | 'earthquakes' | 'wildfires' | 'vessels', visible: boolean): void {
    if (this.layerVisibility[layerType] !== visible) {
      this.layerVisibility[layerType] = visible
      this.updateLayerVisibility(layerType)
    }
  }

  /**
   * Check if layer is visible
   */
  isLayerVisible(layerType: 'flights' | 'satellites' | 'earthquakes' | 'wildfires' | 'vessels'): boolean {
    return this.layerVisibility[layerType]
  }

  /**
   * Get all visibility states
   */
  getVisibilityStates() {
    return { ...this.layerVisibility }
  }

  /**
   * Update visibility of all entities in a layer
   */
  private updateLayerVisibility(
    layerType: 'flights' | 'satellites' | 'earthquakes' | 'wildfires' | 'vessels'
  ): void {
    const visible = this.layerVisibility[layerType]
    const entities = this.entityCollections[layerType]

    entities.forEach((entity) => {
      entity.show = visible
    })

    console.log(`Layer ${layerType} ${visible ? 'enabled' : 'disabled'}`)
  }

  /**
   * Add entity to a layer
   */
  addEntity(
    layerType: 'flights' | 'satellites' | 'earthquakes' | 'wildfires' | 'vessels',
    id: string,
    entity: any
  ): void {
    this.entityCollections[layerType].set(id, entity)
    entity.show = this.layerVisibility[layerType]
  }

  /**
   * Remove entity from a layer
   */
  removeEntity(layerType: 'flights' | 'satellites' | 'earthquakes' | 'wildfires' | 'vessels', id: string): void {
    const entity = this.entityCollections[layerType].get(id)
    if (entity && this.viewer && this.viewer.entities) {
      try {
        this.viewer.entities.removeById(entity.id)
      } catch (e) {
        // Viewer already destroyed
      }
      this.entityCollections[layerType].delete(id)
    }
  }

  /**
   * Clear all entities from a layer
   */
  clearLayer(layerType: 'flights' | 'satellites' | 'earthquakes' | 'wildfires' | 'vessels'): void {
    const entities = this.entityCollections[layerType]
    if (this.viewer && this.viewer.entities) {
      entities.forEach((entity) => {
        try {
          this.viewer.entities.removeById(entity.id)
        } catch (e) {
          // Viewer already destroyed
        }
      })
    }
    entities.clear()
  }

  /**
   * Get entity count for a layer
   */
  getEntityCount(layerType: 'flights' | 'satellites' | 'earthquakes' | 'wildfires' | 'vessels'): number {
    return this.entityCollections[layerType].size
  }

  /**
   * Get all entity counts
   */
  getAllEntityCounts() {
    return {
      flights: this.entityCollections.flights.size,
      satellites: this.entityCollections.satellites.size,
      earthquakes: this.entityCollections.earthquakes.size,
      wildfires: this.entityCollections.wildfires.size,
      vessels: this.entityCollections.vessels.size,
    }
  }

  /**
   * Clean up the manager
   */
  destroy(): void {
    this.clearLayer('flights')
    this.clearLayer('satellites')
    this.clearLayer('earthquakes')
    this.clearLayer('wildfires')
    this.clearLayer('vessels')
  }
}
