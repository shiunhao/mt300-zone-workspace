import { useEffect, useId, useState } from 'react'
import Icon from './Icon.jsx'
import './ChannelPanel.css'

const CHANNELS_PER_PAGE = 8
const presets = Array.from({ length: 255 }, (_, index) => `Preset ${index}`)

function createChannels(count, emptyInitial) {
  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    preset: !emptyInitial && index < 8 ? `Preset ${index + 1}` : '',
    tracking: 'Off',
    remarks: '',
  }))
}

export default function ChannelPanel({ groupId = 'G2', searchQuery = '', stateKey = groupId, channelCount = 8, emptyInitial = false, groupName = groupId }) {
  const pageSelectId = useId()
  const [channelsByGroup, setChannelsByGroup] = useState({})
  const [pagesByGroup, setPagesByGroup] = useState({})
  const count = Math.min(255, Math.max(1, Math.floor(Number(channelCount) || 8)))
  const initialChannels = createChannels(count, emptyInitial)
  const channels = initialChannels.map((channel, index) => channelsByGroup[stateKey]?.[index] ?? channel)
  const query = searchQuery.trim().toLocaleLowerCase()
  const matchingChannels = channels.filter((channel) => (
    [`Channel ${channel.number}`, channel.preset, channel.remarks]
      .some((value) => value.toLocaleLowerCase().includes(query))
  ))
  const totalPages = Math.max(1, Math.ceil(matchingChannels.length / CHANNELS_PER_PAGE))
  const savedPage = pagesByGroup[stateKey]
  const page = Math.min(totalPages, savedPage?.query === query ? savedPage.number : 1)
  const visibleChannels = matchingChannels.slice((page - 1) * CHANNELS_PER_PAGE, page * CHANNELS_PER_PAGE)
  const fillerCount = CHANNELS_PER_PAGE - Math.max(1, visibleChannels.length)

  useEffect(() => {
    setPagesByGroup((current) => current[stateKey]?.query === query ? current : {
      ...current,
      [stateKey]: { number: 1, query },
    })
  }, [stateKey, query])

  function updateChannel(number, field, value) {
    setChannelsByGroup((current) => {
      const storedChannels = current[stateKey] ?? []
      const nextChannels = createChannels(Math.max(count, storedChannels.length), emptyInitial)
        .map((channel, index) => storedChannels[index] ?? channel)
      return {
        ...current,
        [stateKey]: nextChannels.map((channel) => (
          channel.number === number ? { ...channel, [field]: value } : channel
        )),
      }
    })
  }

  return (
    <div className="channel-panel">
      <div className="channel-panel__table-scroll" role="region" aria-label={`${groupName} channel assignments`} tabIndex={0}>
        <table className="channel-panel__table" aria-label={`${groupName} microphone and camera channels`}>
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
                      aria-label={`${groupName} Channel ${channel.number} camera preset`}
                      value={channel.preset}
                      onChange={(event) => updateChannel(channel.number, 'preset', event.target.value)}
                    >
                      <option value="">Select preset</option>
                      {presets.map((preset) => <option key={preset} value={preset}>{preset}</option>)}
                    </select>
                    <Icon name="chevron" size={17} />
                  </div>
                </td>
                <td>
                  <div className="channel-panel__select">
                    <select aria-label={`${groupName} Channel ${channel.number} human tracking`} value={channel.tracking} onChange={(event) => updateChannel(channel.number, 'tracking', event.target.value)}>
                      <option value="Off">Off</option>
                    </select>
                    <Icon name="chevron" size={17} />
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    aria-label={`${groupName} Channel ${channel.number} remarks`}
                    value={channel.remarks}
                    onChange={(event) => updateChannel(channel.number, 'remarks', event.target.value)}
                  />
                </td>
              </tr>
            ))}
            {visibleChannels.length === 0 && <tr><td className="channel-panel__empty" colSpan={4}>No matching channels</td></tr>}
            {Array.from({ length: fillerCount }, (_, index) => (
              <tr className="channel-panel__filler" aria-hidden="true" key={`filler-${index}`}><td colSpan={4} /></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="channel-panel__pagination">
        <label htmlFor={pageSelectId}>Go to</label>
        <div className="channel-panel__select channel-panel__page-select">
          <select
            id={pageSelectId}
            value={page}
            aria-label={`${groupName} channel page`}
            onChange={(event) => setPagesByGroup((current) => ({
              ...current,
              [stateKey]: { number: Number(event.target.value), query },
            }))}
          >
            {Array.from({ length: totalPages }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
          </select>
          <Icon name="chevron" size={16} />
        </div>
        <span>/{totalPages}</span>
      </div>
    </div>
  )
}
