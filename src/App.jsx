import { useState } from 'react'
import Icon from './components/Icon.jsx'
import PositionMap from './components/PositionMap.jsx'
import ChannelPanel from './components/ChannelPanel.jsx'
import ZoneMapPanel from './components/ZoneMapPanel.jsx'
import DesignVersionSwitcher from './components/DesignVersionSwitcher.jsx'
import ChannelConfigureDialog from './components/ChannelConfigureDialog.jsx'
import MapSettingDialog from './components/MapSettingDialog.jsx'
import UserFeedbackPage from './components/UserFeedbackPage.jsx'
import MicrophoneSetup from './components/MicrophoneSetup.jsx'
import { WORKSPACE_MICROPHONE } from './components/workspaceGeometry.js'
import { SETUP_MICROPHONES, SETUP_GROUPS, SETUP_MAPS } from './components/microphoneSetupData.js'

const sections = [
  { label: 'Device', icon: 'device' },
  { label: 'Profile', icon: 'profile' },
  { label: 'Video & Audio', icon: 'video' },
  { label: 'Network', icon: 'network' },
  { label: 'NDI', icon: 'ndi' },
  { label: 'System', icon: 'system' },
  { label: 'Help', icon: 'help' },
]

const microphones = [WORKSPACE_MICROPHONE]

const initialGroups = [
  { id: 'G1', microphoneId: WORKSPACE_MICROPHONE.id, camera: 'TR535N', enabled: false, micIndicator: 'gray' },
  { id: 'G2', microphoneId: WORKSPACE_MICROPHONE.id, camera: 'TR211', enabled: true, micIndicator: 'green' },
  { id: 'G3', microphoneId: WORKSPACE_MICROPHONE.id, camera: 'TR313', enabled: true, micIndicator: 'green' },
]

const detailTabLabels = { channel: 'Channel', position: 'Active Position', zone: 'Zone Map (Talker Position)' }
const detailTabTracks = {
  channel: { start: '0%', width: '28%' },
  position: { start: '28%', width: '28%' },
  zone: { start: '56%', width: '44%' },
}
const designVersions = ['reference', 'dialog', 'previews', 'microphones']
const initialConfigurations = Object.fromEntries(designVersions.map((version) => [version,
  Object.fromEntries((version === 'microphones' ? SETUP_GROUPS : initialGroups).map((group) => [group.id, {
    pickupMode: 'Talker Position',
    channelInformation: 'Talker Position',
  }])),
]))

function SelectField({ label, value, className = '' }) {
  return (
    <div className={`select-field ${className}`}>
      <select aria-label={label} defaultValue={value}>
        <option value={value}>{value}</option>
      </select>
      <Icon name="chevron" size={18} />
    </div>
  )
}

function GroupItem({ group, selected, onSelect, onToggle }) {
  return (
    <div className={`group-item ${selected ? 'is-selected' : ''}`}>
      <button className="group-select" type="button" onClick={onSelect} aria-label={`Select ${group.id} ${group.camera}`} aria-pressed={selected}>
        <span className="group-name">{group.id}</span>
        <span className="group-camera"><Icon name="camera" size={23} /><span>{group.camera}</span></span>
      </button>
      <div className="group-state">
        <button
          className={`switch ${group.enabled ? 'is-on' : ''}`}
          type="button"
          role="switch"
          aria-checked={group.enabled}
          aria-label={`Enable ${group.id}`}
          onClick={onToggle}
        ><span /></button>
        <span className="mic-state"><span className={`status-dot ${group.micIndicator}`} aria-label={`MIC indicator: ${group.micIndicator}`} />MIC</span>
      </div>
    </div>
  )
}

export default function App() {
  const [groups, setGroups] = useState(initialGroups)
  const [setupGroups, setSetupGroups] = useState(SETUP_GROUPS)
  const [selectedGroupId, setSelectedGroupId] = useState('G2')
  const [selectedSetupGroupId, setSelectedSetupGroupId] = useState('G2')
  const [designVersion, setDesignVersion] = useState('microphones')
  const [settingsPage, setSettingsPage] = useState('auto')
  const [showFeedback, setShowFeedback] = useState(false)
  const [detailTabsByVersion, setDetailTabsByVersion] = useState({ reference: 'zone', dialog: 'channel', previews: 'channel', microphones: 'channel' })
  const [configurations, setConfigurations] = useState(initialConfigurations)
  const [configureOpen, setConfigureOpen] = useState(false)
  const [mapSettingOpen, setMapSettingOpen] = useState(false)
  const [setupMapOpen, setSetupMapOpen] = useState(false)
  const [setupMapRequest, setSetupMapRequest] = useState(null)
  const [microphoneSidebar, setMicrophoneSidebar] = useState(null)
  const [mapEntryMode, setMapEntryMode] = useState('Talker Position')
  const [mapEntryMicrophone, setMapEntryMicrophone] = useState(WORKSPACE_MICROPHONE)
  const [channelSearch, setChannelSearch] = useState('')
  const showMicrophoneSetup = designVersion === 'microphones'
  const viewGroups = showMicrophoneSetup ? setupGroups : groups
  const currentGroupId = showMicrophoneSetup ? selectedSetupGroupId : selectedGroupId
  const selectedGroup = viewGroups.find((group) => group.id === currentGroupId)
  const selectedDetailTab = detailTabsByVersion[designVersion]
  const showMicrophoneZones = showMicrophoneSetup && settingsPage === 'microphones'
  const detailTabs = designVersion === 'reference' ? ['channel', 'position', 'zone'] : ['channel', 'position']
  const tabTrack = designVersion === 'reference' ? detailTabTracks[selectedDetailTab] : { start: selectedDetailTab === 'position' ? '50%' : '0%', width: '50%' }
  const configuration = configurations[designVersion][currentGroupId]
  const usesMapDialog = designVersion === 'dialog' || designVersion === 'previews' || showMicrophoneSetup
  const setSelectedDetailTab = (tab) => setDetailTabsByVersion((current) => ({ ...current, [designVersion]: tab }))

  const switchDesignVersion = (version) => {
    setMapSettingOpen(false)
    setConfigureOpen(false)
    if (version === 'feedback') {
      setShowFeedback(true)
      return
    }
    setShowFeedback(false)
    setDesignVersion(version)
    if (version !== designVersion) setChannelSearch('')
  }

  const openConfigure = () => {
    setConfigureOpen(true)
  }

  const saveConfiguration = (nextConfiguration) => {
    setConfigurations((current) => ({
      ...current,
      [designVersion]: { ...current[designVersion], [currentGroupId]: nextConfiguration },
    }))
    setConfigureOpen(false)
  }

  const openMapSetting = (draft) => {
    if (showMicrophoneSetup) {
      setSetupMapRequest((current) => ({
        token: (current?.token || 0) + 1,
        microphoneId: selectedGroup.microphoneId,
        groupId: currentGroupId,
        pickupMode: draft?.pickupMode ?? configuration.pickupMode,
      }))
      return
    }
    if (usesMapDialog) {
      setMapEntryMode(draft?.pickupMode ?? configuration.pickupMode)
      setMapEntryMicrophone(microphones.find((microphone) => microphone.id === selectedGroup.microphoneId)
        || { id: selectedGroup.microphoneId, model: 'Microphone' })
      setMapSettingOpen(true)
      return
    }
    setConfigureOpen(false)
    setSelectedDetailTab('zone')
  }

  const toggleGroup = (id) => setGroups((current) => current.map((group) => group.id === id ? { ...group, enabled: !group.enabled } : group))
  const toggleSetupGroup = (id) => setSetupGroups((current) => current.map((group) => group.id === id ? { ...group, enabled: !group.enabled } : group))

  const selectGroup = (id) => {
    if (showMicrophoneSetup) setSelectedSetupGroupId(id)
    else setSelectedGroupId(id)
    setChannelSearch('')
  }

  const handleDetailTabKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const currentIndex = detailTabs.indexOf(selectedDetailTab)
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? detailTabs.length - 1 : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + detailTabs.length) % detailTabs.length
    const nextTab = detailTabs[nextIndex]
    setSelectedDetailTab(nextTab)
    document.getElementById(`${nextTab}-tab`)?.focus()
  }

  const handleSettingsTabKeyDown = (event) => {
    if (!showMicrophoneSetup || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextPage = event.key === 'Home' ? 'auto' : event.key === 'End' ? 'microphones'
      : showMicrophoneZones ? 'auto' : 'microphones'
    setSettingsPage(nextPage)
    document.getElementById(nextPage === 'auto' ? 'auto-tab' : 'microphones-tab')?.focus()
  }

  return (
    <div className={`settings-shell design-${designVersion}${showFeedback ? ' is-feedback-page' : ''}`}>
      <DesignVersionSwitcher value={showFeedback ? 'feedback' : designVersion} onChange={switchDesignVersion} hidden={(usesMapDialog && mapSettingOpen) || (showMicrophoneSetup && !showFeedback && setupMapOpen)} />
      <aside className="sidebar" aria-label="Main navigation" hidden={showFeedback}>
        <div className="product-name"><Icon name="device" size={26} /><span>MT300</span></div>
        <nav>
          {sections.map((section) => (
            <button key={section.label} type="button" className={`nav-item ${section.label === 'Profile' ? 'is-active' : ''}`} aria-current={section.label === 'Profile' ? 'page' : undefined}>
              <Icon name={section.icon} size={19} /><span>{section.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="settings-main">
        <header className="page-toolbar" hidden={showFeedback}>
          <SelectField label="Profile" value="Profile 1" className="profile-select" />
          <div className="page-actions">
            <button className="icon-button" type="button" aria-label="Help" title="Help"><Icon name="help" size={24} /></button>
            <button className="icon-button" type="button" aria-label="Close settings" title="Close settings"><Icon name="close" size={24} /></button>
          </div>
        </header>

        <div className="mode-tabs" role="tablist" aria-label="Mode settings" hidden={showFeedback}>
          <button className={`mode-tab${!showMicrophoneZones ? ' is-active' : ''}`} id="auto-tab" type="button" role="tab"
            aria-selected={!showMicrophoneZones} aria-controls="auto-settings" tabIndex={showMicrophoneZones ? -1 : 0}
            onClick={() => setSettingsPage('auto')} onKeyDown={handleSettingsTabKeyDown}>Auto Mode Settings</button>
          <button className="mode-tab" type="button" role="tab" aria-selected="false" tabIndex={-1}>Manual Mode Settings</button>
          {showMicrophoneSetup && <button className={`mode-tab${showMicrophoneZones ? ' is-active' : ''}`} id="microphones-tab" type="button" role="tab"
            aria-selected={showMicrophoneZones} aria-controls="microphones-settings" tabIndex={showMicrophoneZones ? 0 : -1}
            onClick={() => setSettingsPage('microphones')} onKeyDown={handleSettingsTabKeyDown}>Microphone Zones</button>}
        </div>

        <UserFeedbackPage active={showFeedback} />

        <section className="workspace" id="auto-settings" role="tabpanel" aria-labelledby="auto-tab" hidden={showFeedback || showMicrophoneZones}>
          <aside className="group-panel" aria-label="Group settings">
            <div className="output-layout">
              <label htmlFor="output-layout">Select Output Layout</label>
              <div className="select-field">
                <select id="output-layout" defaultValue="Single">
                  <option>Single</option>
                  <option>Side-by-side</option>
                  <option>Active Speaker</option>
                  <option>PIP</option>
                  <option>Customize</option>
                </select>
                <Icon name="chevron" size={18} />
              </div>
            </div>
            <div className="group-list-section">
              <div className="group-list-heading">
                <h2>Select group</h2>
                <div className="group-heading-actions">
                  <button className="icon-button small" type="button" aria-label="Group help" title="Group help"><Icon name="help" size={18} /></button>
                  <button className="button add-group" type="button"><span>Group</span><Icon name="plus" size={16} /></button>
                </div>
              </div>
              <div className="group-list">
                {viewGroups.map((group) => <GroupItem key={group.id} group={group} selected={group.id === currentGroupId} onSelect={() => selectGroup(group.id)} onToggle={() => showMicrophoneSetup ? toggleSetupGroup(group.id) : toggleGroup(group.id)} />)}
              </div>
            </div>
          </aside>

          <section className="group-detail" aria-label={`${selectedGroup.id} settings`}>
            <div className="detail-header">
              <h1 className="detail-heading">{selectedGroup.id} - {selectedGroup.camera}</h1>
              {selectedDetailTab === 'channel' && (
                <div className="channel-search">
                  <Icon name="search" size={16} />
                  <input type="search" aria-label="Search channels" placeholder="E.g., Preset 1, Channel 2 or Zone" value={channelSearch} onChange={(event) => setChannelSearch(event.target.value)} />
                </div>
              )}
            </div>
            <div className="detail-tabbar">
              <div className={`detail-tabs${designVersion === 'reference' ? ' has-zone' : ''}`} style={{ '--tab-start': tabTrack.start, '--tab-width': tabTrack.width }} role="tablist" aria-label="Group view">
                {detailTabs.map((tab) => <button key={tab} className={`detail-tab ${selectedDetailTab === tab ? 'is-active' : ''}`} id={`${tab}-tab`} type="button" role="tab" aria-selected={selectedDetailTab === tab} aria-controls={`${tab}-view`} tabIndex={selectedDetailTab === tab ? 0 : -1} onClick={() => setSelectedDetailTab(tab)} onKeyDown={handleDetailTabKeyDown}>{detailTabLabels[tab]}</button>)}
              </div>
              {selectedDetailTab !== 'zone' && <div className="detail-tab-actions">
                {selectedDetailTab === 'channel' && <button className="button channel-configure-button" type="button" onClick={openConfigure}>Channel Configure</button>}
                {designVersion === 'previews' && selectedDetailTab === 'channel' && <button className="button zone-map-entry-button" id="zone-map-button" type="button" onClick={() => openMapSetting()}>Zone Map</button>}
                <button className="button time-button" type="button"><Icon name="clock" size={17} /><span>Time</span></button>
              </div>}
            </div>
            <div className="channel-content" id="channel-view" role="tabpanel" aria-labelledby="channel-tab" hidden={selectedDetailTab !== 'channel'}>
              <ChannelPanel groupId={selectedGroup.id} searchQuery={channelSearch} />
            </div>
            <div className="position-content" id="position-view" role="tabpanel" aria-labelledby="position-tab" hidden={selectedDetailTab !== 'position'}>
              <div className="position-toolbar">
                <label htmlFor="position-coverage">Position view</label>
                <div className="select-field coverage-select">
                  <select id="position-coverage" defaultValue="Coverage not assigned"><option>Coverage not assigned</option></select>
                  <Icon name="chevron" size={18} />
                </div>
                <button className="button reconfigure-button" type="button">Re-configure</button>
              </div>
              <div className="map-container"><PositionMap groupName={selectedGroup.id} /></div>
            </div>
            <div className="zone-content" id="zone-view" role={designVersion === 'reference' ? 'tabpanel' : undefined} aria-labelledby={designVersion === 'reference' ? 'zone-tab' : undefined} hidden={designVersion !== 'reference' || selectedDetailTab !== 'zone'}>
              {configuration.pickupMode !== 'Talker Position' && <div className="map-mode-message">
                <div><strong>Zone Map uses Talker Position</strong><p>Current pickup mode: {configuration.pickupMode}. Save Talker Position in Channel Configure to edit this map.</p></div>
                <button className="button" type="button" onClick={openConfigure}>Channel Configure</button>
              </div>}
              <div key="reference" hidden={designVersion !== 'reference' || configuration.pickupMode !== 'Talker Position'}>
                <ZoneMapPanel variant="reference" groupId={selectedGroup.id} groups={groups} enabled={selectedGroup.enabled} active={!showFeedback && selectedDetailTab === 'zone' && designVersion === 'reference' && configuration.pickupMode === 'Talker Position'} />
              </div>
            </div>
          </section>
        </section>
        <section className="workspace microphone-settings-workspace" id="microphones-settings" role="tabpanel" aria-labelledby="microphones-tab" hidden={showFeedback || !showMicrophoneZones}>
          <aside className="group-panel" aria-label="Microphone zone navigation">
            <div className="microphone-zones-navigation" ref={setMicrophoneSidebar} />
          </aside>
          <section className="group-detail" aria-label="Microphone zones settings">
            <header className="detail-header"><h1 className="detail-heading">Microphone Zones</h1></header>
            <MicrophoneSetup microphones={SETUP_MICROPHONES}
              groups={setupGroups.map((group) => ({ ...group, pickupMode: configurations.microphones[group.id].pickupMode }))}
              initialMaps={SETUP_MAPS} preferredGroupId={selectedSetupGroupId} mapRequest={setupMapRequest}
              sidebarTarget={microphoneSidebar} visible={showMicrophoneZones} active={showMicrophoneSetup && !showFeedback}
              onToggleGroup={toggleSetupGroup} onMapOpenChange={setSetupMapOpen} />
          </section>
        </section>
      </main>
      <ChannelConfigureDialog open={configureOpen} suspended={mapSettingOpen || setupMapOpen} groupId={selectedGroup.id} initialMode={configuration.pickupMode} initialChannelInformation={configuration.channelInformation} mapIsTab={!usesMapDialog} onClose={() => setConfigureOpen(false)} onSave={saveConfiguration} onMapSetting={openMapSetting} />
      <MapSettingDialog open={designVersion === 'dialog' && mapSettingOpen} groups={groups.map((group) => ({ ...group, pickupMode: configurations.dialog[group.id].pickupMode }))} initialGroupId={selectedGroupId} entryPickupMode={mapEntryMode} onToggleGroup={toggleGroup} onClose={() => setMapSettingOpen(false)} />
      <MapSettingDialog variant="previews" microphone={mapEntryMicrophone} open={designVersion === 'previews' && mapSettingOpen} groups={groups.map((group) => ({ ...group, pickupMode: configurations.previews[group.id].pickupMode }))} initialGroupId={selectedGroupId} entryPickupMode={mapEntryMode} onToggleGroup={toggleGroup} onClose={() => setMapSettingOpen(false)} />
    </div>
  )
}
