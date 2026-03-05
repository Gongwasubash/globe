import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { Aircraft } from '../types/dataLayers'

interface FlightIconLayerProps {
  viewer: any
  flights: Aircraft[]
  enabled: boolean
}

export function FlightIconLayer({ viewer, flights, enabled }: FlightIconLayerProps) {
  const entitiesRef = useRef<Map<string, any>>(new Map())

  useEffect(() => {
    if (!viewer || !enabled) return

    const updateFlights = () => {
      const currentIds = new Set(flights.map(f => f.id))

      // Remove old flights
      for (const [id, entity] of entitiesRef.current.entries()) {
        if (!currentIds.has(id)) {
          viewer.entities.removeById(entity.id)
          entitiesRef.current.delete(id)
        }
      }

      // Add/update flights
      for (const flight of flights) {
        if (!flight.lat || !flight.lon) continue

        const position = Cesium.Cartesian3.fromDegrees(
          flight.lon,
          flight.lat,
          flight.alt || 0
        )

        if (entitiesRef.current.has(flight.id)) {
          // Update existing
          const entity = entitiesRef.current.get(flight.id)
          entity.position = position
          
          // Rotate based on heading
          if (flight.heading !== null && flight.heading !== undefined) {
            const heading = Cesium.Math.toRadians(flight.heading)
            entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
              position,
              new Cesium.HeadingPitchRoll(heading, 0, 0)
            )
          }
        } else {
          // Create new
          const heading = flight.heading || 0
          const headingRad = Cesium.Math.toRadians(heading)

          const entity = viewer.entities.add({
            position,
            model: {
              uri: Cesium.BoxGraphics.ConstructorOptions,
              minimumPixelSize: 20,
              maximumScale: 100
            },
            // Fallback to icon if model fails
            billboard: {
              image: createAirplaneIcon(flight.speed || 0),
              scale: 1.5,
              rotation: headingRad,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER
            },
            label: {
              text: `${flight.callsign}\n${flight.alt}m`,
              font: '10px monospace',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
              pixelOffset: new Cesium.Cartesian2(0, -30),
              showBackground: true,
              backgroundColor: new Cesium.Color(0, 0, 0, 0.7),
              backgroundPadding: new Cesium.Cartesian2(6, 3)
            },
            properties: {
              type: 'flight',
              callsign: flight.callsign,
              speed: flight.speed,
              heading: flight.heading,
              altitude: flight.alt
            }
          })

          entitiesRef.current.set(flight.id, entity)
        }
      }
    }

    updateFlights()
    const interval = setInterval(updateFlights, 1000)

    return () => {
      clearInterval(interval)
      if (viewer && viewer.entities) {
        entitiesRef.current.forEach(entity => {
          try {
            viewer.entities.removeById(entity.id)
          } catch (e) {
            // Viewer already destroyed
          }
        })
      }
      entitiesRef.current.clear()
    }
  }, [viewer, flights, enabled])

  return null
}

// Create airplane icon as canvas
function createAirplaneIcon(speed: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64

  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#FF6B6B'
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2

  // Draw airplane shape
  ctx.beginPath()
  ctx.moveTo(32, 8) // Nose
  ctx.lineTo(24, 32) // Left wing
  ctx.lineTo(32, 28) // Center
  ctx.lineTo(40, 32) // Right wing
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Draw tail
  ctx.beginPath()
  ctx.moveTo(32, 28)
  ctx.lineTo(30, 56)
  ctx.lineTo(32, 52)
  ctx.lineTo(34, 56)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Add speed indicator
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(Math.round(speed).toString(), 32, 62)

  return canvas.toDataURL()
}
