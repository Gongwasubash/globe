import { EffectMode } from '../utils/effectsManager'
import { CameraMode, SelectedEntity } from '../types/cameraMode'

interface StatusBarProps {
  effectMode: EffectMode
  cameraMode?: CameraMode
  followEntity?: SelectedEntity | null
}

/**
 * Status bar showing current effect mode, camera mode, and keyboard shortcuts
 */
export function StatusBar({ effectMode, cameraMode = 'global', followEntity }: StatusBarProps) {
  const effectLabels: Record<EffectMode, string> = {
    normal: 'Normal Mode',
    nvg: 'Night Vision',
    thermal: 'Thermal',
    crt: 'CRT Mode',
  }

  const cameraModeLabels: Record<CameraMode, string> = {
    global: 'Global View',
    follow: 'Follow Mode',
    pov: 'POV Map',
    iss: 'ISS View',
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#00ff00',
        padding: '12px 16px',
        borderRadius: 4,
        fontFamily: 'monospace',
        fontSize: 12,
        userSelect: 'none',
        pointerEvents: 'none',
        border: '1px solid rgba(0, 255, 0, 0.3)',
        fontWeight: 'bold',
        maxWidth: 320,
      }}
    >
      {/* Effect Mode */}
      <div style={{ marginBottom: 8 }}>
        Vision: <span style={{ color: '#00ff99' }}>{effectLabels[effectMode]}</span>
      </div>

      {/* Camera Mode */}
      <div style={{ marginBottom: 8 }}>
        Camera: <span style={{ color: '#ffff00' }}>{cameraModeLabels[cameraMode]}</span>
      </div>

      {/* Follow Status */}
      {followEntity && (
        <div style={{ marginBottom: 8, fontSize: 11, color: '#00ffff' }}>
          Following: {followEntity.name}
        </div>
      )}

      {/* Keyboard Shortcuts */}
      <div style={{ fontSize: 10, opacity: 0.8, borderTop: '1px solid rgba(0, 255, 0, 0.2)', paddingTop: 8 }}>
        <div style={{ marginBottom: 4 }}>Vision: F1-F4</div>
        <div style={{ marginBottom: 4 }}>Camera: F1 Global | F2 Follow | F3 POV</div>
        <div>Locations: 1-6</div>
      </div>
    </div>
  )
}
