import React from 'react'
import { Entity, PointGraphics, LabelGraphics, PolylineGraphics } from 'resium'
import * as Cesium from 'cesium'
import { useVessels } from '../../hooks/useVessels'

interface VesselLayerProps {
  enabled: boolean
  bounds?: [number, number, number, number]
  showLabels?: boolean
  showTrails?: boolean
}

export default function VesselLayer({ 
  enabled, 
  bounds, 
  showLabels = true,
  showTrails = false 
}: VesselLayerProps) {
  const { vessels, loading } = useVessels({ 
    bounds, 
    enabled,
    refreshInterval: 30000 
  })

  if (!enabled || loading) return null

  const getVesselColor = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('military')) return Cesium.Color.RED
    if (lowerType.includes('cargo')) return Cesium.Color.BLUE
    if (lowerType.includes('tanker')) return Cesium.Color.ORANGE
    if (lowerType.includes('passenger')) return Cesium.Color.GREEN
    if (lowerType.includes('fishing')) return Cesium.Color.CYAN
    return Cesium.Color.WHITE
  }

  const getVesselIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('military')) return '🚢'
    if (lowerType.includes('cargo')) return '📦'
    if (lowerType.includes('tanker')) return '🛢️'
    if (lowerType.includes('passenger')) return '🚢'
    if (lowerType.includes('fishing')) return '🎣'
    return '⛵'
  }

  return (
    <>
      {vessels.map((vessel) => (
        <Entity
          key={vessel.mmsi}
          position={Cesium.Cartesian3.fromDegrees(vessel.lon, vessel.lat)}
          description={`
            <div style="font-family: monospace;">
              <h3>${vessel.name}</h3>
              <p><strong>MMSI:</strong> ${vessel.mmsi}</p>
              <p><strong>Type:</strong> ${vessel.type}</p>
              <p><strong>Flag:</strong> ${vessel.flag}</p>
              <p><strong>Speed:</strong> ${vessel.speed} knots</p>
              <p><strong>Course:</strong> ${vessel.course}°</p>
              <p><strong>Position:</strong> ${vessel.lat.toFixed(4)}, ${vessel.lon.toFixed(4)}</p>
            </div>
          `}
        >
          <PointGraphics
            pixelSize={8}
            color={getVesselColor(vessel.type)}
            outlineColor={Cesium.Color.WHITE}
            outlineWidth={1}
            heightReference={Cesium.HeightReference.CLAMP_TO_GROUND}
          />
          
          {showLabels && (
            <LabelGraphics
              text={`${getVesselIcon(vessel.type)} ${vessel.name}`}
              font="12pt monospace"
              fillColor={Cesium.Color.WHITE}
              outlineColor={Cesium.Color.BLACK}
              outlineWidth={2}
              style={Cesium.LabelStyle.FILL_AND_OUTLINE}
              pixelOffset={new Cesium.Cartesian2(0, -40)}
              showBackground={true}
              backgroundColor={Cesium.Color.BLACK.withAlpha(0.7)}
              backgroundPadding={new Cesium.Cartesian2(8, 4)}
            />
          )}

          {showTrails && vessel.course > 0 && (
            <PolylineGraphics
              positions={[
                Cesium.Cartesian3.fromDegrees(vessel.lon, vessel.lat),
                Cesium.Cartesian3.fromDegrees(
                  vessel.lon + Math.sin(Cesium.Math.toRadians(vessel.course)) * 0.1,
                  vessel.lat + Math.cos(Cesium.Math.toRadians(vessel.course)) * 0.1
                )
              ]}
              width={2}
              material={getVesselColor(vessel.type)}
              clampToGround={true}
            />
          )}
        </Entity>
      ))}
    </>
  )
}