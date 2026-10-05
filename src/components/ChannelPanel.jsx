import { useState } from 'react'
import Icon from './Icon.jsx'
import './ChannelPanel.css'

const presets = Array.from({ length: 8 }, (_, index) => `Preset ${index + 1}`)

function createChannels() {
  return presets.map((preset, index) => ({
    number: index + 1,
    preset,
    tracking: 'Off',
    remarks: '',
  }))
}

export default function ChannelPanel({ groupId = 'G2', searchQuery = '' }) {
  const [channelsByGroup, setChannelsByGroup] = useState({})
  const channels = channelsByGroup[groupId] ?? createChannels()
  const query = searchQuery.trim().toLocaleLowerCase()
  const visibleChannels = channels.filter((channel) => (
    [`Channel ${channel.number}`, channel.preset, channel.remarks]
      .some((value) => value.toLocaleLowerCase().includes(query))
  ))

  function updateChannel(number, field, value) {
    setChannelsByGroup((current) => ({
      ...current,
      [groupId]: (current[groupId] ?? createChannels()).map((channel) => (
        channel.number === number ? { ...channel, [field]: value } : channel
      )),
    }))
  }

  return (
    <div className="channel-panel">
      <div className="channel-panel__table-scroll" role="region" aria-label={`${groupId} channel assignments`} tabIndex={0}>
        <table className="channel-panel__table" aria-label={`${groupId} microphone and camera channels`}>
          <colgroup>
            <col className="channel-panel__microphone-col" />
            <col className="channel-panel__camera-col" />
            <col className="channel-panel__tracking-col" />
            <col className="channel-panel__remarks-col" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Microphone</th>
              <th scope="col">Camera</th>
              <th scope="col">
                <span className="channel-panel__tracking-heading">
                  Human tracking
                  <button type="button" className="channel-panel__info" aria-label="Human tracking information" title="Human tracking">
                    <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                      <circle cx="10" cy="10" r="8" fill="currentColor" />
                      <circle cx="10" cy="6" r="1" fill="var(--panel)" />
                      <path d="M10 9v5" stroke="var(--panel)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              </th>
              <th scope="col">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {visibleChannels.map((channel) => (
              <tr key={channel.number}>
                <th scope="row">Channel {channel.number}</th>
                <td>
                  <div className="channel-panel__select">
                    <select
                      aria-label={`${groupId} Channel ${channel.number} camera preset`}
                      value={channel.preset}
                      onChange={(event) => updateChannel(channel.number, 'preset', event.target.value)}
                    >
                      {presets.map((preset) => <option key={preset} value={preset}>{preset}</option>)}
                    </select>
                    <Icon name="chevron" size={17} />
                  </div>
                </td>
                <td>
                  <div className="channel-panel__select">
                    <select aria-label={`${groupId} Channel ${channel.number} human tracking`} value={channel.tracking} onChange={(event) => updateChannel(channel.number, 'tracking', event.target.value)}>
                      <option value="Off">Off</option>
                    </select>
                    <Icon name="chevron" size={17} />
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    aria-label={`${groupId} Channel ${channel.number} remarks`}
                    value={channel.remarks}
                    onChange={(event) => updateChannel(channel.number, 'remarks', event.target.value)}
                  />
                </td>
              </tr>
            ))}
            {visibleChannels.length === 0 && <tr><td className="channel-panel__empty" colSpan={4}>No matching channels</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="channel-panel__pagination">
        <label htmlFor={`channel-page-${groupId}`}>Go to</label>
        <div className="channel-panel__select channel-panel__page-select">
          <select id={`channel-page-${groupId}`} defaultValue="1" aria-label={`${groupId} channel page`}><option value="1">1</option></select>
          <Icon name="chevron" size={16} />
        </div>
        <span>/1</span>
      </div>
    </div>
  )
}
