import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { ManualCameraControlDialog } from './ManualCameraDialogs.jsx'
import ManualPresetEditor from './ManualPresetEditor.jsx'
import { createManualAssignments, INITIAL_MANUAL_CAMERA_STATE, MANUAL_CAMERAS, MANUAL_LAYOUTS, MANUAL_PRESET_NUMBERS, MANUAL_PRESETS } from './manualModeData.js'
import officeImage from '../assets/office-empty-desk.png'
import './ManualModeSettings.css'

function CameraIpIcon() {
  return (
    <span className="manual-mode__camera-icon" aria-hidden="true">
      <Icon name="camera" size={23} />
      <span>IP</span>
    </span>
  )
}

export default function ManualModeSettings({ visible = true, onDialogOpenChange, viewOnly = false }) {
  const outputLayoutId = useId()
  const helpId = useId()
  const [layoutId, setLayoutId] = useState('single')
  const [assignments, setAssignments] = useState(createManualAssignments)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [presetEditorOutput, setPresetEditorOutput] = useState(null)
  const [cameraStates, setCameraStates] = useState({})
  const [savedPresets, setSavedPresets] = useState({})
  const sectionRef = useRef(null)
  const presetButtonRefs = useRef({})
  const previousEditorOutput = useRef(null)
  const layout = MANUAL_LAYOUTS.find((item) => item.id === layoutId)
  const rows = assignments.slice(0, layout.inputs)
  const dialogAssignment = dialog ? assignments.find((row) => row.number === dialog.number) : null
  const dialogOpen = visible && !viewOnly && !!dialogAssignment
  const editorAssignment = !viewOnly && assignments.find((row) => row.number === presetEditorOutput)

  useEffect(() => {
    if (!visible || viewOnly) {
      setDialog(null)
      setPresetEditorOutput(null)
      setShowHelp(false)
    }
  }, [visible, viewOnly])

  useEffect(() => {
    onDialogOpenChange?.(dialogOpen)
  }, [dialogOpen, onDialogOpenChange])

  useEffect(() => {
    const previousOutput = previousEditorOutput.current
    previousEditorOutput.current = presetEditorOutput
    if (!visible) return undefined
    const target = presetEditorOutput
      ? sectionRef.current?.querySelector('[data-manual-preset-back]')
      : previousOutput ? presetButtonRefs.current[previousOutput] : null
    if (!target) return undefined
    const frame = requestAnimationFrame(() => target.focus())
    return () => cancelAnimationFrame(frame)
  }, [presetEditorOutput, visible])

  function changeLayout(value) {
    if (viewOnly) return
    const nextLayout = MANUAL_LAYOUTS.find((item) => item.id === value)
    setLayoutId(value)
    setSelectedSlot((current) => current > nextLayout.inputs ? null : current)
  }

  function updateAssignment(number, changes) {
    if (viewOnly) return
    setAssignments((current) => current.map((row) => row.number === number ? { ...row, ...changes } : row))
  }

  function openDialog(kind, number) {
    if (viewOnly) return
    setSelectedSlot(number)
    setDialog({ kind, number })
    setShowHelp(false)
  }

  function updateCameraState(camera, nextState) {
    if (viewOnly) return
    setCameraStates((current) => {
      const previous = current[camera] || INITIAL_MANUAL_CAMERA_STATE
      const next = typeof nextState === 'function' ? nextState(previous) : nextState
      return { ...current, [camera]: { ...previous, ...next } }
    })
  }

  function selectPreset(row, preset) {
    if (viewOnly) return
    updateAssignment(row.number, { preset })
    const number = Number(preset.replace('Preset ', ''))
    const savedState = preset ? savedPresets[row.camera]?.[number] : null
    if (savedState) updateCameraState(row.camera, { ...savedState })
  }

  function openPresetEditor(number) {
    if (viewOnly) return
    setSelectedSlot(number)
    setPresetEditorOutput(number)
    setShowHelp(false)
    setDialog(null)
  }

  function savePreset(number, cameraState) {
    if (viewOnly || !editorAssignment) return
    const camera = editorAssignment.camera
    const snapshot = cameraState || cameraStates[camera] || INITIAL_MANUAL_CAMERA_STATE
    setSavedPresets((current) => ({
      ...current,
      [camera]: { ...current[camera], [number]: { ...snapshot } },
    }))
  }

  return (
    <section
      id="manual-settings"
      className={`manual-mode-settings${editorAssignment ? ' is-preset-editor' : ''}`}
      ref={sectionRef}
      role="tabpanel"
      aria-labelledby="manual-tab"
      hidden={!visible}
    >
      {editorAssignment ? <ManualPresetEditor
        cameraName={editorAssignment.camera}
        presetNumbers={MANUAL_PRESET_NUMBERS}
        initialPresetNumber={editorAssignment.preset ? Number(editorAssignment.preset.replace('Preset ', '')) : 0}
        cameraState={cameraStates[editorAssignment.camera] || INITIAL_MANUAL_CAMERA_STATE}
        onCameraStateChange={(nextState) => updateCameraState(editorAssignment.camera, nextState)}
        onBack={() => setPresetEditorOutput(null)}
        onSave={savePreset}
        previewImageUrl={officeImage}
      /> : <>
      <aside className="manual-mode__layout-panel" aria-label="Manual output layout">
        <label className="manual-mode__layout-label" htmlFor={outputLayoutId}>Select Output Layout</label>
        <div className="manual-mode__select manual-mode__output-select">
          <select id={outputLayoutId} value={layoutId} disabled={viewOnly} onChange={(event) => changeLayout(event.target.value)}>
            {MANUAL_LAYOUTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <Icon name="chevron" size={18} />
        </div>
        <div className={`manual-mode__preview is-${layout.id}`} data-layout={layout.id} role="group" aria-label={`${layout.label} output preview`}>
          {rows.map((row) => (
            <button
              key={row.number}
              type="button"
              className={`manual-mode__cell${selectedSlot === row.number ? ' is-selected' : ''}`}
              data-slot={row.number}
              aria-label={`Select output ${row.number}`}
              aria-pressed={selectedSlot === row.number}
              onClick={() => setSelectedSlot(row.number)}
            >{row.number}</button>
          ))}
        </div>
      </aside>

      <div className="manual-mode__camera-panel">
        <div className="manual-mode__help-wrap">
          <button
            type="button"
            className="manual-mode__help"
            aria-label="Manual camera assignment help"
            aria-expanded={showHelp}
            aria-controls={helpId}
            onClick={() => setShowHelp((current) => !current)}
          ><Icon name="help" size={19} /></button>
          {showHelp && <p id={helpId} className="manual-mode__help-text" role="status">Choose a camera and preset for each numbered output. Select a preview area to locate its camera row.</p>}
        </div>
        <div className="manual-mode__table-scroll" role="region" aria-label="Manual camera assignments" tabIndex={0}>
          <table className="manual-mode__table" aria-label="Manual output camera assignments">
            <colgroup>
              <col className="manual-mode__camera-col" />
              <col className="manual-mode__preset-col" />
              <col className="manual-mode__tracking-col" />
              <col className="manual-mode__set-preset-col" />
              <col className="manual-mode__control-col" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Camera</th>
                <th scope="col">Preset</th>
                <th scope="col">Human tracking</th>
                <th scope="col"><span className="manual-mode__sr-only">Set preset</span></th>
                <th scope="col"><span className="manual-mode__sr-only">Camera controls</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.number}
                  className={`manual-mode__row${selectedSlot === row.number ? ' is-selected' : ''}`}
                  data-output={row.number}
                  onFocusCapture={() => setSelectedSlot(row.number)}
                  onClick={() => setSelectedSlot(row.number)}
                >
                  <td>
                    <div className="manual-mode__camera-assignment">
                      <span className="manual-mode__row-number" aria-label={`Output ${row.number}`}>{row.number}</span>
                      <CameraIpIcon />
                      <div className="manual-mode__select">
                        <select
                          aria-label={`Output ${row.number} camera`}
                          value={row.camera}
                          disabled={viewOnly}
                          onChange={(event) => updateAssignment(row.number, { camera: event.target.value, preset: '' })}
                        >
                          <option value="">Select camera</option>
                          {MANUAL_CAMERAS.map((camera) => <option key={camera} value={camera}>{camera}</option>)}
                        </select>
                        <Icon name="chevron" size={17} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="manual-mode__select">
                      <select
                        aria-label={`Output ${row.number} preset`}
                        value={row.preset}
                        disabled={viewOnly || !row.camera}
                        onChange={(event) => selectPreset(row, event.target.value)}
                      >
                        <option value="">Select preset</option>
                        {MANUAL_PRESETS.map((preset) => <option key={preset} value={preset}>{preset}</option>)}
                      </select>
                      <Icon name="chevron" size={17} />
                    </div>
                  </td>
                  <td>
                    <div className="manual-mode__select">
                      <select aria-label={`Output ${row.number} human tracking`} value={row.tracking} disabled>
                        <option value="Off">Off</option>
                      </select>
                      <Icon name="chevron" size={17} />
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="manual-mode__set-preset"
                      ref={(button) => { presetButtonRefs.current[row.number] = button }}
                      aria-label={`Set preset for output ${row.number}`}
                      disabled={viewOnly || !row.camera}
                      onClick={() => openPresetEditor(row.number)}
                    >Set preset</button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="manual-mode__camera-control"
                      aria-label={`Camera controls for output ${row.number}`}
                      title="Camera controls"
                      disabled={viewOnly || !row.camera}
                      onClick={() => openDialog('camera', row.number)}
                    ><Icon name="camera" size={23} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>}
      <ManualCameraControlDialog
        open={dialogOpen && dialog.kind === 'camera'}
        cameraName={dialogAssignment?.camera || ''}
        cameraState={cameraStates[dialogAssignment?.camera] || INITIAL_MANUAL_CAMERA_STATE}
        onCameraStateChange={(nextState) => updateCameraState(dialogAssignment.camera, nextState)}
        onClose={() => setDialog(null)}
      />
    </section>
  )
}
