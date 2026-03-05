import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { SelectedEntity } from '../types/cameraMode'
import {
  calculateViewingRadius,
  generateViewingFootprint,
} from '../utils/povGenerator'
import './POVMap.css'

interface POVMapProps {
  viewer: any | null
  selectedEntity: SelectedEntity | null
  isVisible: boolean
}

/**
 * POV Map Component
 * Displays simulated camera view showing what's visible below the selected object
 */
export function POVMap({ viewer, selectedEntity, isVisible }: POVMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [viewingRadius, setViewingRadius] = useState(0)

  // Update POV visualization
  useEffect(() => {
    if (!isVisible || !selectedEntity || !viewer || !containerRef.current) return

    // Calculate viewing parameters
    const radius = calculateViewingRadius(selectedEntity.position.alt, selectedEntity.type)
    setViewingRadius(radius)

    const footprint = generateViewingFootprint(
      selectedEntity.position.lat,
      selectedEntity.position.lon,
      radius,
      selectedEntity.heading || 0,
    )

    // Draw footprint on globe
    if (!viewer.entities.getById('povFootprint')) {
      viewer.entities.add({
        id: 'povFootprint',
        polyline: {
          positions: footprint.polygon,
          width: 2,
          material: Cesium.Color.YELLOW.withAlpha(0.5),
          clampToGround: true,
        },
      })

      // Add center marker
      viewer.entities.add({
        id: 'povCenter',
        position: Cesium.Cartesian3.fromDegrees(
          selectedEntity.position.lon,
          selectedEntity.position.lat,
          0,
        ),
        point: {
          pixelSize: 8,
          color: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: 'POV Center',
          font: '12px monospace',
          fillColor: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          pixelOffset: new Cesium.Cartesian2(0, -15),
          showBackground: true,
          backgroundColor: new Cesium.Color(0, 0, 0, 0.7),
        },
      })
    }

    return () => {
      // Clean up on unmount or visibility change
      const footprintEntity = viewer.entities.getById('povFootprint')
      const centerEntity = viewer.entities.getById('povCenter')
      if (footprintEntity) viewer.entities.removeById('povFootprint')
      if (centerEntity) viewer.entities.removeById('povCenter')
    }
  }, [isVisible, selectedEntity, viewer])

  if (!isVisible || !selectedEntity) {
    return null
  }

  return (
    <div className="pov-map-container" ref={containerRef}>
      <div className="pov-map-header">
        <h3>Point of View Map</h3>
        <div className="pov-map-info">
          <span className="pov-entity-name">{selectedEntity.name}</span>
          <div className="pov-details">
            <span className="pov-detail-item">
              Alt: {selectedEntity.position.alt.toFixed(1)} km
            </span>
            <span className="pov-detail-item">
              Radius: {viewingRadius.toFixed(0)} km
            </span>
            {selectedEntity.heading !== undefined && (
              <span className="pov-detail-item">
                Heading: {selectedEntity.heading.toFixed(0)}°
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="pov-map-content">
        <div className="pov-map-canvas-wrapper">
          <canvas ref={canvasRef} className="pov-map-canvas" />
          <div className="pov-map-compass">
            <div className="pov-compass-dial">
              <div className="pov-compass-point-n">N</div>
              {selectedEntity.heading !== undefined && (
                <div
                  className="pov-compass-arrow"
                  style={{
                    transform: `rotate(${selectedEntity.heading}deg)`,
                  }}
                >
                  ↑
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pov-map-legend">
          <div className="pov-legend-item">
            <div className="pov-legend-color" style={{ backgroundColor: '#FFFF00' }} />
            <span>Viewing Area</span>
          </div>
          <div className="pov-legend-item">
            <div className="pov-legend-color" style={{ backgroundColor: '#00FF00' }} />
            <span>Visible Objects</span>
          </div>
          <div className="pov-legend-item">
            <div className="pov-legend-color" style={{ backgroundColor: '#FF0000' }} />
            <span>Out of View</span>
          </div>
        </div>
      </div>
    </div>
  )
}
