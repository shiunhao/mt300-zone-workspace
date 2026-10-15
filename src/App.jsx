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
import ZoneSettingsWorkspace from './components/ZoneSettingsWorkspace.jsx'
import ManualModeSettings from './components/ManualModeSettings.jsx'
import AddGroupDialog from './components/AddGroupDialog.jsx'
import HomeDashboard from './components/HomeDashboard.jsx'
import DeviceSettings from './components/DeviceSettings.jsx'
import HelpSettings from './components/HelpSettings.jsx'
import UpgradePermissionDialog from './components/UpgradePermissionDialog.jsx'
import { getMicrophoneGroups, WORKSPACE_MICROPHONE } from './components/workspaceGeometry.js'
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

const microphones = SETUP_MICROPHONES
const groupCameras = ['TR535N', 'TR211', 'TR313']
const microphoneChannelCounts = [...Array.from({ length: 31 }, (_, index) => (index + 1) * 8), 255]

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
const designVersions = ['reference', 'dialog', 'microphones', 'settings']
const initialConfigurations = Object.fromEntries(designVersions.map((version) => [version,
  Object.fromEntries((['microphones', 'settings'].includes(version) ? SETUP_GROUPS : initialGroups).map((group) => [group.id, {
    pickupMode: 'Talker Position',
    channelInformation: 'Talker Position',
  }])),
]))

function GroupItem({ group, selected, onSelect, onToggle, viewOnly = false }) {
  const name = group.name || group.id
  return (
    <div className={`group-item ${selected ? 'is-selected' : ''}`}>
      <button className="group-select" type="button" onClick={onSelect} aria-label={`Select ${name} ${group.camera}`} aria-pressed={selected}>
        <span className="group-name" title={name}>{name}</span>
        <span className="group-camera"><Icon name="camera" size={23} /><span>{group.camera}</span></span>
      </button>
      <div className="group-state">
        <button
          className={`switch ${group.enabled ? 'is-on' : ''}`}
          type="button"
          role="switch"
          aria-checked={group.enabled}
          aria-label={`Enable ${name}`}
          disabled={viewOnly}
          onClick={onToggle}
        ><span /></button>
        <span className="mic-state"><span className={`status-dot ${group.micIndicator}`} aria-label={`MIC indicator: ${group.micIndicator}`} />MIC</span>
      </div>
    </div>
  )
}

export default function App() {
  const [settingsVisible, setSettingsVisible] = useState(true)
  const [settingsSection, setSettingsSection] = useState('Profile')
  const [accountRole, setAccountRole] = useState('Admin')
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')
  const [profileId, setProfileId] = useState(1)
  const [liveProfileId, setLiveProfileId] = useState(1)
  const [groups, setGroups] = useState(initialGroups)
  const [setupGroups, setSetupGroups] = useState(SETUP_GROUPS)
  const [settingsGroups, setSettingsGroups] = useState(SETUP_GROUPS)
  const [selectedGroupId, setSelectedGroupId] = useState('G2')
  const [selectedSetupGroupId, setSelectedSetupGroupId] = useState('G2')
  const [selectedSettingsGroupId, setSelectedSettingsGroupId] = useState('G2')
  const [designVersion, setDesignVersion] = useState('settings')
  const [settingsPagesByVersion, setSettingsPagesByVersion] = useState({ microphones: 'auto', settings: 'microphones' })
  const [showFeedback, setShowFeedback] = useState(false)
  const [detailTabsByVersion, setDetailTabsByVersion] = useState({ reference: 'zone', dialog: 'channel', microphones: 'channel', settings: 'channel' })
  const [configurations, setConfigurations] = useState(initialConfigurations)
  const [configureOpen, setConfigureOpen] = useState(false)
  const [addGroupOpen, setAddGroupOpen] = useState(false)
  const [mapSettingOpen, setMapSettingOpen] = useState(false)
  const [setupMapOpen, setSetupMapOpen] = useState(false)
  const [setupMapRequest, setSetupMapRequest] = useState(null)
  const [microphoneSidebar, setMicrophoneSidebar] = useState(null)
  const [settingsMapOpen, setSettingsMapOpen] = useState(false)
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [settingsMapRequest, setSettingsMapRequest] = useState(null)
  const [settingsSidebar, setSettingsSidebar] = useState(null)
  const [mapEntryMode, setMapEntryMode] = useState('Talker Position')
  const [mapEntryMicrophone, setMapEntryMicrophone] = useState(WORKSPACE_MICROPHONE)
  const [channelSearch, setChannelSearch] = useState('')
  const showMicrophoneSetup = designVersion === 'microphones'
  const showZoneSettings = designVersion === 'settings'
  const isMicrophoneVersion = showMicrophoneSetup || showZoneSettings
  const settingsPage = settingsPagesByVersion[designVersion] || 'auto'
  const setSettingsPage = (page) => setSettingsPagesByVersion((current) => ({ ...current, [designVersion]: page }))
  const viewGroups = showZoneSettings ? settingsGroups : showMicrophoneSetup ? setupGroups : groups
  const currentGroupId = showZoneSettings ? selectedSettingsGroupId : showMicrophoneSetup ? selectedSetupGroupId : selectedGroupId
  const selectedGroup = viewGroups.find((group) => group.id === currentGroupId)
  const selectedGroupName = selectedGroup.name || selectedGroup.id
  const selectedMicrophone = microphones.find((microphone) => microphone.id === selectedGroup.microphoneId) || WORKSPACE_MICROPHONE
  const selectedDetailTab = detailTabsByVersion[designVersion]
  const showMicrophoneZones = isMicrophoneVersion && settingsPage === 'microphones'
  const showManualSettings = settingsPage === 'manual'
  const showAutoSettings = !showMicrophoneZones && !showManualSettings
  const profileVisible = settingsVisible && settingsSection === 'Profile'
  const feedbackVisible = settingsSection === 'Profile' && showFeedback
  const viewOnly = accountRole === 'User'
  const settingsTabs = isMicrophoneVersion ? ['auto', 'manual', 'microphones'] : ['auto', 'manual']
  const detailTabs = designVersion === 'reference' ? ['channel', 'position', 'zone'] : ['channel', 'position']
  const tabTrack = designVersion === 'reference' ? detailTabTracks[selectedDetailTab] : { start: selectedDetailTab === 'position' ? '50%' : '0%', width: '50%' }
  const configuration = configurations[designVersion][currentGroupId]
  const usesMapDialog = designVersion === 'dialog' || isMicrophoneVersion
  const setSelectedDetailTab = (tab) => setDetailTabsByVersion((current) => ({ ...current, [designVersion]: tab }))

  const closeSettings = () => {
    setAddGroupOpen(false)
    setConfigureOpen(false)
    setMapSettingOpen(false)
    setSetupMapOpen(false)
    setSettingsMapOpen(false)
    setManualDialogOpen(false)
    setSettingsVisible(false)
    requestAnimationFrame(() => document.querySelector('[data-open-settings]')?.focus())
  }

  const openSettings = () => {
    const nextSection = viewOnly && !['Profile', 'Help'].includes(settingsSection) ? 'Profile' : settingsSection
    setSettingsSection(nextSection)
    setProfileId(liveProfileId)
    setSettingsVisible(true)
    requestAnimationFrame(() => {
      const target = nextSection === 'Profile' ? document.getElementById(`${settingsPage}-tab`)
        : nextSection === 'Help' ? document.querySelector('.help-settings [aria-selected="true"]')
          : document.querySelector('.sidebar .nav-item[aria-current="page"]')
      target?.focus()
    })
  }

  const navigateSettings = (section) => {
    if (!['Device', 'Profile', 'Help'].includes(section) || (viewOnly && !['Profile', 'Help'].includes(section))) return
    setSettingsSection(section)
  }

  const selectAccountRole = (role) => {
    if (role === accountRole) return
    if (role === 'User') setAccountRole('User')
    else if (role === 'Admin') {
      setUpgradeError('')
      setUpgradeOpen(true)
    }
  }

  const closeUpgrade = () => {
    setUpgradeOpen(false)
    setUpgradeError('')
    requestAnimationFrame(() => document.querySelector('[data-account-trigger]')?.focus())
  }

  const verifyUpgrade = ({ username, password }) => {
    if (username !== 'demo' || password !== 'demo') {
      setUpgradeError('Incorrect username or password.')
      return
    }
    setAccountRole('Admin')
    closeUpgrade()
  }

  const switchDesignVersion = (version) => {
    setMapSettingOpen(false)
    setConfigureOpen(false)
    setAddGroupOpen(false)
    if (version === 'feedback') {
      setShowFeedback(true)
      return
    }
    setShowFeedback(false)
    setDesignVersion(version)
    if (version !== designVersion) {
      if (showManualSettings) {
        setSettingsPagesByVersion((current) => ({ ...current, [version]: 'manual' }))
      } else if (version === 'settings') {
        setSettingsPagesByVersion((current) => ({ ...current, settings: 'microphones' }))
      }
    }
    if (version !== designVersion) setChannelSearch('')
  }

  const openConfigure = () => {
    setConfigureOpen(true)
  }

  const saveConfiguration = (nextConfiguration) => {
    if (viewOnly) return
    setConfigurations((current) => ({
      ...current,
      [designVersion]: { ...current[designVersion], [currentGroupId]: nextConfiguration },
    }))
    setConfigureOpen(false)
  }

  const openMapSetting = (draft) => {
    if (showZoneSettings) {
      setSettingsMapRequest((current) => ({
        token: (current?.token || 0) + 1,
        microphoneId: selectedGroup.microphoneId,
        groupId: currentGroupId,
        pickupMode: draft?.pickupMode ?? configuration.pickupMode,
      }))
      return
    }
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

  const toggleGroup = (id) => { if (!viewOnly) setGroups((current) => current.map((group) => group.id === id ? { ...group, enabled: !group.enabled } : group)) }
  const toggleSetupGroup = (id) => { if (!viewOnly) setSetupGroups((current) => current.map((group) => group.id === id ? { ...group, enabled: !group.enabled } : group)) }
  const toggleSettingsGroup = (id) => { if (!viewOnly) setSettingsGroups((current) => current.map((group) => group.id === id ? { ...group, enabled: !group.enabled } : group)) }

  const selectGroup = (id) => {
    if (showZoneSettings) setSelectedSettingsGroupId(id)
    else if (showMicrophoneSetup) setSelectedSetupGroupId(id)
    else setSelectedGroupId(id)
    setChannelSearch('')
  }

  const addGroup = ({ name, camera, microphoneId, channelCount }) => {
    if (viewOnly) return
    if (!groupCameras.includes(camera) || !microphones.some((microphone) => microphone.id === microphoneId)
      || !microphoneChannelCounts.includes(channelCount)) return
    const existingNames = new Set(viewGroups.map((group) => (group.name || group.id).toLocaleLowerCase()))
    const trimmedName = name.trim()
    if (trimmedName && existingNames.has(trimmedName.toLocaleLowerCase())) return
    let number = Math.max(0, ...viewGroups.map((group) => Number(/^G(\d+)$/.exec(group.id)?.[1]) || 0)) + 1
    while (viewGroups.some((group) => group.id === `G${number}`)
      || (!trimmedName && existingNames.has(`g${number}`))) number += 1
    const id = `G${number}`
    const group = { id, name: trimmedName || id, camera, microphoneId, channelCount,
      enabled: true, micIndicator: 'gray', pickupMode: 'Talker Position', newlyCreated: true }
    const affectedVersions = showZoneSettings ? ['settings'] : showMicrophoneSetup ? ['microphones'] : ['reference', 'dialog']
    if (showZoneSettings) setSettingsGroups((current) => [...current, group])
    else if (showMicrophoneSetup) setSetupGroups((current) => [...current, group])
    else setGroups((current) => [...current, group])
    setConfigurations((current) => ({ ...current, ...Object.fromEntries(affectedVersions.map((version) => [version, {
      ...current[version], [id]: { pickupMode: 'Talker Position', channelInformation: 'Talker Position' },
    }])) }))
    selectGroup(id)
    setSelectedDetailTab('channel')
    setAddGroupOpen(false)
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
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const currentIndex = settingsTabs.indexOf(settingsPage)
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? settingsTabs.length - 1
      : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + settingsTabs.length) % settingsTabs.length
    const nextPage = settingsTabs[nextIndex]
    setSettingsPage(nextPage)
    document.getElementById(`${nextPage}-tab`)?.focus()
  }

  return (
    <>
    <HomeDashboard visible={!settingsVisible} onOpenSettings={openSettings} profileId={liveProfileId} onProfileChange={setLiveProfileId}
      accountRole={accountRole} onSelectAccountRole={selectAccountRole} />
    <div className={`settings-shell design-${designVersion}${feedbackVisible ? ' is-feedback-page' : ''}${viewOnly ? ' is-view-only' : ''}`} hidden={!settingsVisible} inert={settingsVisible ? undefined : ''}>
      <DesignVersionSwitcher value={showFeedback ? 'feedback' : designVersion} onChange={switchDesignVersion} hidden={!profileVisible || addGroupOpen || manualDialogOpen || (usesMapDialog && mapSettingOpen) || (!showFeedback && ((showMicrophoneSetup && setupMapOpen) || (showZoneSettings && settingsMapOpen)))} />
      <aside className="sidebar" aria-label="Main navigation" hidden={feedbackVisible}>
        <div className="product-name"><Icon name="device" size={26} /><span>MT300</span></div>
        <nav>
          {sections.map((section) => (
            <button key={section.label} type="button" className={`nav-item ${section.label === settingsSection ? 'is-active' : ''}`}
              aria-current={section.label === settingsSection ? 'page' : undefined}
              disabled={viewOnly && !['Profile', 'Help'].includes(section.label)} onClick={() => navigateSettings(section.label)}>
              <Icon name={section.icon} size={19} /><span>{section.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="settings-main">
        <header className="page-toolbar" hidden={feedbackVisible || settingsSection === 'Help'}>
          {settingsSection === 'Profile' ? <div className="select-field profile-select">
            <select aria-label="Profile" value={profileId} onChange={(event) => setProfileId(Number(event.target.value))}>
              {Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>Profile {index + 1}</option>)}
            </select>
            <Icon name="chevron" size={18} />
          </div> : <span />}
          <div className="page-actions">
            <button className="icon-button" type="button" aria-label="Help" title="Help" onClick={() => navigateSettings('Help')}><Icon name="help" size={24} /></button>
            <button className="icon-button" type="button" aria-label="Close settings" title="Close settings" onClick={closeSettings}><Icon name="close" size={24} /></button>
          </div>
        </header>

        <DeviceSettings visible={settingsVisible && settingsSection === 'Device'} />
        <HelpSettings visible={settingsVisible && settingsSection === 'Help'} onClose={closeSettings} />
        <div className="mode-tabs" role="tablist" aria-label="Mode settings" hidden={!profileVisible || showFeedback}>
          <button className={`mode-tab${showAutoSettings ? ' is-active' : ''}`} id="auto-tab" type="button" role="tab"
            aria-selected={showAutoSettings} aria-controls="auto-settings" tabIndex={showAutoSettings ? 0 : -1}
            onClick={() => setSettingsPage('auto')} onKeyDown={handleSettingsTabKeyDown}>Auto Mode Settings</button>
          <button className={`mode-tab${showManualSettings ? ' is-active' : ''}`} id="manual-tab" type="button" role="tab"
            aria-selected={showManualSettings} aria-controls="manual-settings" tabIndex={showManualSettings ? 0 : -1}
            onClick={() => setSettingsPage('manual')} onKeyDown={handleSettingsTabKeyDown}>Manual Mode Settings</button>
          {isMicrophoneVersion && <button className={`mode-tab${showMicrophoneZones ? ' is-active' : ''}`} id="microphones-tab" type="button" role="tab"
            aria-selected={showMicrophoneZones} aria-controls={showZoneSettings ? 'zone-settings-library' : 'microphones-settings'} tabIndex={showMicrophoneZones ? 0 : -1}
            onClick={() => setSettingsPage('microphones')} onKeyDown={handleSettingsTabKeyDown}>Microphone Zones</button>}
        </div>

        <UserFeedbackPage active={profileVisible && showFeedback} />
        <ManualModeSettings visible={profileVisible && !showFeedback && showManualSettings} viewOnly={viewOnly} onDialogOpenChange={setManualDialogOpen} />

        <section className="workspace auto-settings-workspace" id="auto-settings" role="tabpanel" aria-labelledby="auto-tab" hidden={!profileVisible || showFeedback || !showAutoSettings}>
          <aside className="group-panel" aria-label="Group settings">
            <div className="output-layout">
              <label htmlFor="output-layout">Select Output Layout</label>
              <div className="select-field">
                <select id="output-layout" defaultValue="Single" disabled={viewOnly}>
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
                  <button className="button add-group" type="button" aria-label="Add group" disabled={viewOnly} onClick={() => setAddGroupOpen(true)}><span>Group</span><Icon name="plus" size={16} /></button>
                </div>
              </div>
              <div className="group-list">
                {viewGroups.map((group) => <GroupItem key={group.id} group={group} viewOnly={viewOnly} selected={group.id === currentGroupId} onSelect={() => selectGroup(group.id)} onToggle={() => showZoneSettings ? toggleSettingsGroup(group.id) : showMicrophoneSetup ? toggleSetupGroup(group.id) : toggleGroup(group.id)} />)}
              </div>
            </div>
          </aside>

          <section className="group-detail" aria-label={`${selectedGroupName} settings`}>
            <div className="detail-header">
              <h1 className="detail-heading" title={`${selectedGroupName} - ${selectedGroup.camera}`}>{selectedGroupName} - {selectedGroup.camera}</h1>
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
                <button className="button time-button" type="button" disabled={viewOnly}><Icon name="clock" size={17} /><span>Time</span></button>
              </div>}
            </div>
            <div className="channel-content" id="channel-view" role="tabpanel" aria-labelledby="channel-tab" hidden={selectedDetailTab !== 'channel'}>
              <ChannelPanel groupId={selectedGroup.id} groupName={selectedGroupName}
                stateKey={`${showZoneSettings ? 'settings' : showMicrophoneSetup ? 'microphones' : 'shared'}/${selectedGroup.id}`}
                channelCount={selectedGroup.channelCount || 8} emptyInitial={Boolean(selectedGroup.newlyCreated)} searchQuery={channelSearch} viewOnly={viewOnly} />
            </div>
            <div className="position-content" id="position-view" role="tabpanel" aria-labelledby="position-tab" hidden={selectedDetailTab !== 'position'}>
              <div className="position-toolbar">
                <label htmlFor="position-coverage">Position view</label>
                <div className="select-field coverage-select">
                  <select id="position-coverage" defaultValue="Coverage not assigned" disabled={viewOnly}><option>Coverage not assigned</option></select>
                  <Icon name="chevron" size={18} />
                </div>
                <button className="button reconfigure-button" type="button" disabled={viewOnly}>Re-configure</button>
              </div>
              <div className="map-container"><PositionMap groupName={selectedGroupName} /></div>
            </div>
            <div className="zone-content" id="zone-view" role={designVersion === 'reference' ? 'tabpanel' : undefined} aria-labelledby={designVersion === 'reference' ? 'zone-tab' : undefined} hidden={designVersion !== 'reference' || selectedDetailTab !== 'zone'}>
              {configuration.pickupMode !== 'Talker Position' && <div className="map-mode-message">
                <div><strong>Zone Map uses Talker Position</strong><p>Current pickup mode: {configuration.pickupMode}. Save Talker Position in Channel Configure to edit this map.</p></div>
                <button className="button" type="button" onClick={openConfigure}>Channel Configure</button>
              </div>}
              <div key="reference" hidden={designVersion !== 'reference' || configuration.pickupMode !== 'Talker Position'}>
                <ZoneMapPanel variant="reference" groupId={selectedGroup.id}
                  groups={getMicrophoneGroups(groups, selectedGroup.microphoneId)} microphone={selectedMicrophone}
                  enabled={selectedGroup.enabled} viewOnly={viewOnly} active={profileVisible && !showFeedback && showAutoSettings && selectedDetailTab === 'zone' && designVersion === 'reference' && configuration.pickupMode === 'Talker Position'} />
              </div>
            </div>
          </section>
        </section>
        <section className="workspace microphone-settings-workspace" id="microphones-settings" role="tabpanel" aria-labelledby="microphones-tab" hidden={!profileVisible || showFeedback || !showMicrophoneSetup || !showMicrophoneZones}>
          <aside className="group-panel" aria-label="Microphone zone navigation">
            <div className="microphone-zones-navigation" ref={setMicrophoneSidebar} />
          </aside>
          <section className="group-detail" aria-label="Microphone zones settings">
            <header className="detail-header"><h1 className="detail-heading">Microphone Zones</h1></header>
            <MicrophoneSetup microphones={SETUP_MICROPHONES}
              groups={setupGroups.map((group) => ({ ...group, pickupMode: configurations.microphones[group.id].pickupMode }))}
              initialMaps={SETUP_MAPS} preferredGroupId={selectedSetupGroupId} mapRequest={setupMapRequest}
              sidebarTarget={microphoneSidebar} viewOnly={viewOnly} visible={profileVisible && showMicrophoneSetup && showMicrophoneZones} active={profileVisible && showMicrophoneSetup && !showFeedback && !showManualSettings}
              onToggleGroup={toggleSetupGroup} onMapOpenChange={setSetupMapOpen} />
          </section>
        </section>
        <section className="workspace microphone-settings-workspace zone-settings-library-workspace" id="zone-settings-library" role="tabpanel" aria-labelledby="microphones-tab" hidden={!profileVisible || showFeedback || !showZoneSettings || !showMicrophoneZones}>
          <aside className="group-panel" aria-label="Microphone zone navigation">
            <div className="microphone-zones-navigation" ref={setSettingsSidebar} />
          </aside>
          <section className="group-detail" aria-label="Zone settings library">
            <ZoneSettingsWorkspace microphones={SETUP_MICROPHONES}
              groups={settingsGroups.map((group) => ({ ...group, pickupMode: configurations.settings[group.id].pickupMode }))}
              initialMaps={SETUP_MAPS} mapRequest={settingsMapRequest}
              sidebarTarget={settingsSidebar} viewOnly={viewOnly} visible={profileVisible && showZoneSettings && showMicrophoneZones} active={profileVisible && showZoneSettings && !showFeedback && !showManualSettings}
              onToggleGroup={toggleSettingsGroup} onMapOpenChange={setSettingsMapOpen} />
          </section>
        </section>
      </main>
      <AddGroupDialog open={profileVisible && !viewOnly && addGroupOpen} cameras={groupCameras} microphones={microphones}
        channelCounts={microphoneChannelCounts} existingNames={viewGroups.map((group) => group.name || group.id)}
        onClose={() => setAddGroupOpen(false)} onSave={addGroup} />
      <ChannelConfigureDialog viewOnly={viewOnly} open={profileVisible && configureOpen} suspended={mapSettingOpen || setupMapOpen || settingsMapOpen} groupId={selectedGroupName} initialMode={configuration.pickupMode} initialChannelInformation={configuration.channelInformation} mapIsTab={!usesMapDialog} onClose={() => setConfigureOpen(false)} onSave={saveConfiguration} onMapSetting={openMapSetting} />
      <MapSettingDialog microphone={mapEntryMicrophone} viewOnly={viewOnly} open={profileVisible && designVersion === 'dialog' && mapSettingOpen} groups={getMicrophoneGroups(groups, mapEntryMicrophone.id).map((group) => ({ ...group, pickupMode: configurations.dialog[group.id].pickupMode }))} initialGroupId={selectedGroupId} entryPickupMode={mapEntryMode} onToggleGroup={toggleGroup} onClose={() => setMapSettingOpen(false)} />
    </div>
    <UpgradePermissionDialog open={!settingsVisible && upgradeOpen} onClose={closeUpgrade} onVerify={verifyUpgrade} error={upgradeError} />
    </>
  )
}
