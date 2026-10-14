import { useId, useState } from 'react'
import Icon from './Icon.jsx'
import HomePtzPanel from './HomePtzPanel.jsx'
import AccountMenu from './AccountMenu.jsx'
import officeImage from '../assets/office-empty-desk.png'
import { HOME_DEVICES, HOME_LAYOUTS, HOME_PRESET_NUMBERS, HOME_PROFILES, INITIAL_HOME_CAMERA_STATE } from './homeDashboardData.js'
import './HomeDashboard.css'

function LayoutIcon({ layout }) {
  const rectangles = {
    single: [[3, 3, 32, 28]],
    'side-by-side': [[3, 11, 16, 12], [19, 11, 16, 12]],
    'main-three': [[3, 3, 32, 17], [3, 20, 16, 11], [19, 20, 16, 11]],
    'main-four': [[7, 3, 24, 17], [3, 20, 10.7, 11], [13.7, 20, 10.6, 11], [24.3, 20, 10.7, 11]],
    quad: [[3, 3, 16, 14], [19, 3, 16, 14], [3, 17, 16, 14], [19, 17, 16, 14]],
    pip: [[3, 3, 32, 28], [20, 19, 15, 12]],
  }
  return <svg width="38" height="34" viewBox="0 0 38 34" aria-hidden="true">{rectangles[layout].map((rect, index) => <rect key={index} x={rect[0]} y={rect[1]} width={rect[2]} height={rect[3]} />)}</svg>
}

function DropCameraIcon() {
  return <svg width="128" height="90" viewBox="0 0 128 90" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><rect x="3" y="3" width="69" height="49" strokeDasharray="5 5" /><rect x="48" y="32" width="77" height="55" /><rect x="76" y="43" width="23" height="23" rx="7" /><circle cx="87.5" cy="54.5" r="5" /><path d="M82 67v6m12-6v6M75 74h26M36 41l16 15 5-20z" /></svg>
}

export default function HomeDashboard({ visible = true, onOpenSettings, profileId = 1, onProfileChange, resetBehavior, accountRole = 'Admin', onSelectAccountRole }) {
  const profileSelectId = useId()
  const [liveMode, setLiveMode] = useState(false)
  const [layoutId, setLayoutId] = useState('single')
  const [assignments, setAssignments] = useState([null, null, null, null])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [armedDevice, setArmedDevice] = useState(null)
  const [dragTarget, setDragTarget] = useState(null)
  const [cameraStates, setCameraStates] = useState({})
  const [selectedPresets, setSelectedPresets] = useState({})
  const [announcement, setAnnouncement] = useState('')
  const layout = HOME_LAYOUTS.find((item) => item.id === layoutId)
  const cameraName = selectedSlot === null ? null : assignments[selectedSlot]
  const cameraState = cameraStates[cameraName] || INITIAL_HOME_CAMERA_STATE
  const displayedAssignments = assignments.slice(0, layout.inputs)

  function changeLayout(nextId) {
    const nextLayout = HOME_LAYOUTS.find((item) => item.id === nextId)
    setLayoutId(nextId)
    setSelectedSlot((current) => current !== null && current >= nextLayout.inputs ? null : current)
    setDragTarget(null)
  }

  function assignDevice(slot, device) {
    if (!HOME_DEVICES.includes(device)) return
    setAssignments((current) => current.map((value, index) => index === slot ? device : value))
    setSelectedSlot(slot)
    setArmedDevice(null)
    setDragTarget(null)
    setAnnouncement(`${device} assigned to output ${slot + 1}`)
  }

  function selectSlot(slot) {
    if (armedDevice) assignDevice(slot, armedDevice)
    else setSelectedSlot(slot)
  }

  function resetLiveView() {
    if (resetBehavior !== 'clear') return
    setLayoutId('single')
    setAssignments([null, null, null, null])
    setSelectedSlot(null)
    setArmedDevice(null)
    setDragTarget(null)
    setCameraStates({})
    setSelectedPresets({})
    setAnnouncement('Live View reset')
  }

  return (
    <section className={`home-dashboard${liveMode ? ' is-live-mode' : ''}`} hidden={!visible} aria-label="MT300 home">
      <header className="home-dashboard__header">
        <div className="home-dashboard__brand" aria-label="AVer">AVer</div>
        <div className="home-dashboard__mode">
          <label htmlFor="home-live-mode" className={liveMode ? 'is-active' : ''}>Live Mode</label>
          <button id="home-live-mode" type="button" className={`home-dashboard__switch${liveMode ? ' is-on' : ''}`} role="switch" aria-checked={liveMode} aria-label="Live Mode" onClick={() => { setLiveMode((current) => !current); setArmedDevice(null) }}><span /></button>
        </div>
        <div className="home-dashboard__profile-area">
          {liveMode ? <button type="button" className="button home-dashboard__reset" onClick={resetLiveView} disabled={resetBehavior !== 'clear'} title="Reset Live View">Reset</button> : <>
            <label className="home-dashboard__sr-only" htmlFor={profileSelectId}>Live profile</label>
            <div className="select-field home-dashboard__profile-select"><select id={profileSelectId} value={profileId} onChange={(event) => onProfileChange?.(Number(event.target.value))}>{HOME_PROFILES.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}</select><Icon name="chevron" size={17} /></div>
          </>}
        </div>
        {!liveMode && <div className="home-dashboard__audio" aria-label="Audio activity"><Icon name="ndi" size={34} /><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="7" fill="currentColor" /><path d="m5 3 5 4-5 4z" fill="var(--page)" /></svg></div>}
        <div className="home-dashboard__header-spacer" />
        <div className="home-dashboard__device-status" aria-label="Device Status"><strong>{liveMode ? '2/8' : '0'}</strong><span>Device Status</span></div>
        <AccountMenu role={accountRole} onSelectRole={onSelectAccountRole} active={visible} />
        <button type="button" className="icon-button home-dashboard__settings" aria-label="Open settings" onClick={onOpenSettings} data-open-settings><Icon name="system" size={31} /></button>
      </header>

      {liveMode ? <div className="home-dashboard__live-workspace">
        <div className="home-dashboard__main">
          <div className="home-dashboard__layout-toolbar" role="group" aria-label="Live output layout">
            {HOME_LAYOUTS.map((item) => <button key={item.id} type="button" className={`home-dashboard__layout-button${layoutId === item.id ? ' is-active' : ''}`} aria-label={`Live layout ${item.label}`} aria-pressed={layoutId === item.id} title={item.label} onClick={() => changeLayout(item.id)}><LayoutIcon layout={item.id} /></button>)}
          </div>
          <div className="home-dashboard__stage">
            <div className={`home-dashboard__composition is-${layout.id}`} aria-label={`${layout.label} Live View`}>
              {displayedAssignments.map((device, index) => {
                const state = cameraStates[device] || INITIAL_HOME_CAMERA_STATE
                return <button key={index} type="button" className={`home-dashboard__output${device ? ' is-assigned' : ''}${selectedSlot === index ? ' is-selected' : ''}${dragTarget === index ? ' is-drop-target' : ''}`} data-output={index + 1} aria-label={`Live output ${index + 1}${device ? `, ${device}` : ', empty'}${armedDevice ? `; assign ${armedDevice}` : ''}`} aria-pressed={selectedSlot === index} onClick={() => selectSlot(index)} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setDragTarget(index) }} onDragLeave={() => setDragTarget((current) => current === index ? null : current)} onDrop={(event) => { event.preventDefault(); assignDevice(index, event.dataTransfer.getData('text/plain')) }}>
                  {device ? <><img src={officeImage} alt="Office desks and chairs" draggable="false" style={{ transform: `scale(${state.zoom})`, objectPosition: `${50 + state.pan * .12}% ${50 - state.tilt * .2}%` }} /><span className="home-dashboard__output-caption"><span>{index + 1}</span>{device}</span></> : <span className="home-dashboard__empty-output"><DropCameraIcon /><span>{armedDevice ? `Click to place ${armedDevice}` : 'Drag a device here'}</span>{layout.inputs > 1 && <b>{index + 1}</b>}</span>}
                </button>
              })}
            </div>
          </div>
        </div>
        <aside className="home-dashboard__sidebar" aria-label="Live controls">
          <HomePtzPanel disabled={!cameraName} cameraName={cameraName || ''} cameraState={cameraState} onCameraStateChange={(nextState) => { if (cameraName) setCameraStates((current) => ({ ...current, [cameraName]: nextState })) }} presetNumbers={HOME_PRESET_NUMBERS} selectedPreset={selectedPresets[cameraName] ?? null} onRecallPreset={(number) => { if (cameraName) { setSelectedPresets((current) => ({ ...current, [cameraName]: number })); setAnnouncement(`${cameraName}, Preset ${number} selected`) } }} />
          <section className="home-dashboard__devices" aria-label="Select Device">
            <h2>Select Device</h2>
            <div className="home-dashboard__device-grid">
              {HOME_DEVICES.map((device, index) => <button key={device} type="button" className={`home-dashboard__device-card${(armedDevice || cameraName) === device ? ' is-selected' : ''}`} draggable="true" aria-label={`Select device ${device}`} aria-pressed={(armedDevice || cameraName) === device} title="Drag to an output, or select this device and then an output" onClick={() => { setArmedDevice((current) => current === device ? null : device); setAnnouncement(`Select an output for ${device}`) }} onDragStart={(event) => { event.dataTransfer.setData('text/plain', device); event.dataTransfer.effectAllowed = 'copy'; setArmedDevice(device) }} onDragEnd={() => setDragTarget(null)}><span className="home-dashboard__device-name"><span aria-hidden="true">⋮</span>{device}</span><img src={officeImage} alt="" draggable="false" style={{ objectPosition: `${35 + index * 7}% 50%` }} /></button>)}
            </div>
          </section>
        </aside>
      </div> : <div className="home-dashboard__automatic-stage" aria-label="Live View"><img src={officeImage} alt="Office desks and chairs" draggable="false" /></div>}
      <p className="home-dashboard__sr-only" role="status" aria-live="polite">{announcement}</p>
    </section>
  )
}
