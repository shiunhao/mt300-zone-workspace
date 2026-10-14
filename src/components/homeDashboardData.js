export const HOME_PROFILES = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  label: `Profile ${index + 1} Auto Mode`,
}))

export const HOME_LAYOUTS = [
  { id: 'single', label: 'Single', inputs: 1 },
  { id: 'side-by-side', label: 'Side-by-side', inputs: 2 },
  { id: 'main-three', label: 'Main Speaker (3-inputs)', inputs: 3 },
  { id: 'main-four', label: 'Main Speaker (4-inputs)', inputs: 4 },
  { id: 'quad', label: 'Quad View', inputs: 4 },
  { id: 'pip', label: 'PIP', inputs: 2 },
]

export const HOME_DEVICES = ['TR322', 'U1', 'U2', 'TR211', 'TR535', 'TR311_rtsp', 'PTC310N_rtsp', 'TR535_rtsp']
export const HOME_PRESET_NUMBERS = Array.from({ length: 255 }, (_, index) => index)
export const INITIAL_HOME_CAMERA_STATE = { pan: 0, tilt: 0, zoom: 1, autoFocus: true, focus: 50 }
