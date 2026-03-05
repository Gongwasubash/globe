import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface SidebarProps {
  flights: any[]
  satellites: any[]
  earthquakes: any[]
  isOpen: boolean
  onClose: () => void
}

export function DashboardSidebar({ flights, satellites, earthquakes, isOpen, onClose }: SidebarProps) {
  const [expanded, setExpanded] = useState<string | null>('flights')

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            top: 'clamp(50px, 10vh, 70px)'
          }}
        />
      )}
      <div style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: 'auto',
        maxHeight: '40vh',
        background: 'linear-gradient(180deg, #0f0f1e 0%, #1a1a2e 100%)',
        borderTop: '1px solid #00d4ff33',
        zIndex: 999,
        overflowY: 'auto',
        fontFamily: 'Inter, sans-serif',
        transition: 'transform 0.3s ease',
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        boxShadow: isOpen ? '0 -4px 20px rgba(0, 212, 255, 0.1)' : 'none'
      }}>
        {/* Sections Container */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '12px',
          overflowX: 'auto',
          scrollBehavior: 'smooth'
        }}>
          {/* Flights Section */}
          <Section
            title="Active Flights"
            icon="✈️"
            count={flights.length}
            color="#00d4ff"
            expanded={expanded === 'flights'}
            onToggle={() => setExpanded(expanded === 'flights' ? null : 'flights')}
          >
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {flights.slice(0, 3).map((f: any) => (
                <FlightItem key={f.id} flight={f} />
              ))}
            </div>
          </Section>

          {/* Satellites Section */}
          <Section
            title="Satellites"
            icon="🛰️"
            count={satellites.length}
            color="#00ff88"
            expanded={expanded === 'satellites'}
            onToggle={() => setExpanded(expanded === 'satellites' ? null : 'satellites')}
          >
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {satellites.slice(0, 3).map((s: any) => (
                <SatelliteItem key={s.id} satellite={s} />
              ))}
            </div>
          </Section>

          {/* Earthquakes Section */}
          <Section
            title="Recent Earthquakes"
            icon="📍"
            count={earthquakes.length}
            color="#ff6b6b"
            expanded={expanded === 'earthquakes'}
            onToggle={() => setExpanded(expanded === 'earthquakes' ? null : 'earthquakes')}
          >
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {earthquakes.slice(0, 3).map((e: any) => (
                <EarthquakeItem key={e.id} earthquake={e} />
              ))}
            </div>
          </Section>
        </div>
      </div>
    </>
  )
}

function Section({ title, icon, count, color, expanded, onToggle, children }: any) {
  return (
    <div style={{
      minWidth: '280px',
      background: expanded ? `${color}08` : 'transparent',
      border: `1px solid ${color}33`,
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'all 0.2s'
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'transparent',
          border: 'none',
          color: color,
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${color}15`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{icon}</span>
          <span>{title}</span>
          <span style={{
            background: color,
            color: '#000',
            padding: '2px 5px',
            borderRadius: '3px',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            {count}
          </span>
        </div>
        <ChevronDown
          size={14}
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        />
      </button>
      {expanded && (
        <div style={{ padding: '0 12px 12px 12px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function FlightItem({ flight }: any) {
  return (
    <div style={{
      padding: '6px',
      marginBottom: '4px',
      background: '#00d4ff08',
      borderRadius: '4px',
      border: '1px solid #00d4ff20',
      fontSize: '11px'
    }}>
      <div style={{ fontWeight: '600', color: '#00d4ff' }}>{flight.callsign}</div>
      <div style={{ color: '#888', fontSize: '10px', marginTop: '2px' }}>
        {Math.round(flight.alt / 1000)}k ft
      </div>
    </div>
  )
}

function SatelliteItem({ satellite }: any) {
  return (
    <div style={{
      padding: '6px',
      marginBottom: '4px',
      background: '#00ff8808',
      borderRadius: '4px',
      border: '1px solid #00ff8820',
      fontSize: '11px'
    }}>
      <div style={{ fontWeight: '600', color: '#00ff88' }}>{satellite.name.slice(0, 20)}</div>
      <div style={{ color: '#888', fontSize: '10px', marginTop: '2px' }}>
        {Math.round(satellite.alt / 1000)}km
      </div>
    </div>
  )
}

function EarthquakeItem({ earthquake }: any) {
  return (
    <div style={{
      padding: '6px',
      marginBottom: '4px',
      background: '#ff6b6b08',
      borderRadius: '4px',
      border: '1px solid #ff6b6b20',
      fontSize: '11px'
    }}>
      <div style={{ fontWeight: '600', color: '#ff6b6b' }}>
        M{earthquake.magnitude.toFixed(1)}
      </div>
      <div style={{ color: '#888', fontSize: '10px', marginTop: '2px' }}>
        {earthquake.place.slice(0, 25)}
      </div>
    </div>
  )
}
