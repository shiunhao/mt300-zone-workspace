import Icon from './Icon'
import { CAMERA_DEVICES, MICROPHONE_DEVICES } from './deviceSettingsData'
import './DeviceSettings.css'

function MicrophoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3M9 21h6" />
    </svg>
  )
}

function DeviceCard({ device, microphone = false }) {
  return (
    <li className="device-settings__card">
      <span className="device-settings__name">{device.name}</span>
      <span className="device-settings__connection">
        {microphone ? <MicrophoneIcon /> : (
          <span className="device-settings__camera-icon">
            <Icon name="camera" size={24} />
            <span className="device-settings__connection-type">{device.type}</span>
          </span>
        )}
        <span>{device.connection}</span>
      </span>
    </li>
  )
}

export default function DeviceSettings({ visible = true, onAddDevice }) {
  return (
    <section className="device-settings" aria-label="Device settings" hidden={!visible}>
      <header className="device-settings__header">
        <h1>Device list</h1>
        <button className="device-settings__add" type="button" onClick={onAddDevice} disabled={!onAddDevice}>
          Add device
        </button>
      </header>
      <div className="device-settings__columns">
        <section className="device-settings__list-column" aria-labelledby="camera-list-heading">
          <h2 id="camera-list-heading">Camera List</h2>
          <ul className="device-settings__list" aria-label="Camera devices" tabIndex={0}>
            {CAMERA_DEVICES.map((device) => <DeviceCard key={device.id} device={device} />)}
          </ul>
        </section>
        <section className="device-settings__list-column" aria-labelledby="microphone-list-heading">
          <h2 id="microphone-list-heading">Microphone List</h2>
          <ul className="device-settings__list" aria-label="Microphone devices" tabIndex={0}>
            {MICROPHONE_DEVICES.map((device) => <DeviceCard key={device.id} device={device} microphone />)}
          </ul>
        </section>
      </div>
    </section>
  )
}
