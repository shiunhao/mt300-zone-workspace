import { useState } from 'react'
import Icon from './Icon.jsx'
import './HelpSettings.css'

const tabs = ['Manual', 'About', 'Privacy Policy', 'Console']

export default function HelpSettings({ visible = true, onClose, manualUrl }) {
  const [selectedTab, setSelectedTab] = useState('Manual')
  function changeTab(event, tab) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const index = tabs.indexOf(tab)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    setSelectedTab(tabs[next])
    document.getElementById(`help-tab-${next}`)?.focus()
  }
  return <section className="help-settings" hidden={!visible} aria-label="Help settings">
    <header className="help-settings__header">
      <div className="help-settings__tabs" role="tablist" aria-label="Help topics">
        {tabs.map((tab, index) => <button key={tab} id={`help-tab-${index}`} type="button" role="tab"
          className={selectedTab === tab ? 'is-active' : ''} aria-selected={selectedTab === tab}
          aria-controls={`help-panel-${index}`} tabIndex={selectedTab === tab ? 0 : -1}
          onClick={() => setSelectedTab(tab)} onKeyDown={(event) => changeTab(event, tab)}>{tab}</button>)}
      </div>
      <button type="button" className="icon-button" aria-label="Close settings" onClick={onClose}><Icon name="close" size={24} /></button>
    </header>
    {tabs.map((tab, index) => <div key={tab} id={`help-panel-${index}`} className="help-settings__panel"
      role="tabpanel" aria-labelledby={`help-tab-${index}`} hidden={selectedTab !== tab}>
      {tab === 'Manual' && <>
        <h1>User Manual</h1>
        <div className="help-settings__manual"><span>Online Software User Manual</span>
          {manualUrl ? <a className="button" href={manualUrl} target="_blank" rel="noreferrer">Read</a>
            : <button type="button" className="button" disabled>Read</button>}
        </div>
      </>}
    </div>)}
  </section>
}
