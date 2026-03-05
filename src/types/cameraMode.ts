export type CameraMode = 'global' | 'follow' | 'pov' | 'iss'

export interface SelectedEntity {
  type: 'aircraft' | 'satellite' | 'earthquake' | 'wildfire' | 'iss'
  id: string
  name: string
  position: { lat: number; lon: number; alt: number }
  heading?: number
}

export interface CameraModeState {
  mode: CameraMode
  selectedEntity: SelectedEntity | null
  isPOVVisible: boolean
  issImageryVisible: boolean
}
