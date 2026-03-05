import { useState, useEffect } from 'react'
import { Ruler, X } from 'lucide-react'
import * as Cesium from 'cesium'

interface DistanceMeasurerProps {
  viewer: any
}

export function DistanceMeasurer({ viewer }: DistanceMeasurerProps) {
  const [isActive, setIsActive] = useState(false)
  const [points, setPoints] = useState<Cesium.Cartesian3[]>([])
  const [distance, setDistance] = useState(0)
  const [polylineEntity, setPolylineEntity] = useState<any>(null)

  useEffect(() => {
    if (!viewer) return

    if (!isActive) {
      // Cleanup
      if (polylineEntity) {
        viewer.entities.remove(polylineEntity)
        setPolylineEntity(null)
      }
      viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
      viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
      viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)
      return
    }

    const handler = viewer.screenSpaceEventHandler

    // Left click to add point
    handler.setInputAction((click: any) => {
      const pickedObject = viewer.scene.pick(click.position)
      if (Cesium.defined(pickedObject)) return

      const cartesian = viewer.scene.pickPosition(click.position)
      if (!Cesium.defined(cartesian)) return

      const newPoints = [...points, cartesian]
      setPoints(newPoints)

      // Add point marker
      viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: 8,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
      })

      // Update polyline
      if (newPoints.length > 1) {
        const totalDist = calculateTotalDistance(newPoints)
        setDistance(totalDist)

        if (polylineEntity) {
          viewer.entities.remove(polylineEntity)
        }

        const newPolyline = viewer.entities.add({
          polyline: {
            positions: newPoints,
            width: 3,
            material: Cesium.Color.RED.withAlpha(0.7),
            clampToGround: true,
          },
        })
        setPolylineEntity(newPolyline)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // Right click to finish
    handler.setInputAction(() => {
      setIsActive(false)
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    return () => {
      handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
      handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }
  }, [viewer, isActive, points, polylineEntity])

  const calculateTotalDistance = (pts: Cesium.Cartesian3[]): number => {
    let total = 0
    for (let i = 1; i < pts.length; i++) {
      const p1 = Cesium.Cartographic.fromCartesian(pts[i - 1])
      const p2 = Cesium.Cartographic.fromCartesian(pts[i])
      const distance = Cesium.Cartesian3.distance(pts[i - 1], pts[i])
      total += distance
    }
    return total
  }

  const reset = () => {
    if (viewer && polylineEntity) {
      viewer.entities.remove(polylineEntity)
      setPolylineEntity(null)
    }
    setPoints([])
    setDistance(0)
  }

  const formatDistance = (meters: number): string => {
    if (meters > 1000) {
      return `${(meters / 1000).toFixed(2)} km`
    }
    return `${meters.toFixed(2)} m`
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button
        onClick={() => {
          setIsActive(!isActive)
          if (!isActive) {
            reset()
          }
        }}
        style={{
          padding: '8px 12px',
          background: isActive ? '#ff6b6b15' : '#00ff8815',
          border: `1px solid ${isActive ? '#ff6b6b' : '#00ff88'}`,
          borderRadius: '6px',
          color: isActive ? '#ff6b6b' : '#00ff88',
          fontSize: '11px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isActive ? '#ff6b6b30' : '#00ff8830'
          e.currentTarget.style.boxShadow = `0 0 10px ${isActive ? '#ff6b6b40' : '#00ff8840'}`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isActive ? '#ff6b6b15' : '#00ff8815'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <Ruler size={14} />
        {isActive ? 'MEASURING' : 'MEASURE'}
      </button>

      {isActive && distance > 0 && (
        <div style={{
          padding: '6px 12px',
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid #ff6b6b',
          borderRadius: '4px',
          color: '#ff6b6b',
          fontSize: '11px',
          fontWeight: '600',
        }}>
          {formatDistance(distance)}
        </div>
      )}

      {isActive && points.length > 0 && (
        <button
          onClick={reset}
          style={{
            padding: '6px 10px',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid #ff6b6b',
            borderRadius: '4px',
            color: '#ff6b6b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
