export const MANUAL_LAYOUTS = [
  { id: 'single', label: 'Single', inputs: 1 },
  { id: 'side-by-side', label: 'Side-by-side', inputs: 2 },
  { id: 'main-three', label: 'Main Speaker (3-inputs)', inputs: 3 },
  { id: 'main-four', label: 'Main Speaker (4-inputs)', inputs: 4 },
  { id: 'pip', label: 'PIP', inputs: 2 },
  { id: 'quad', label: 'Quad View', inputs: 4 },
]

export const MANUAL_CAMERAS = ['TR535_rtsp', 'TR211', 'TR313']
export const MANUAL_PRESET_NUMBERS = Array.from({ length: 255 }, (_, index) => index)
export const MANUAL_PRESETS = MANUAL_PRESET_NUMBERS.map((number) => `Preset ${number}`)
export const INITIAL_MANUAL_CAMERA_STATE = { pan: 0, tilt: 0, zoom: 1, autoFocus: true, focus: 50 }

export function createManualAssignments() {
  return Array.from({ length: 4 }, (_, index) => ({
    number: index + 1,
    camera: index === 0 ? MANUAL_CAMERAS[0] : '',
    preset: '',
    tracking: 'Off',
  }))
}
