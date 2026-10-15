import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { HOME_PROFILES } from './homeDashboardData.js'
import './HomeProfileSelect.css'

function ProfileLabel({ id }) {
  return <span className="home-profile-select__label"><span className="home-profile-select__name">Profile {id}</span>{' '}<span className="home-profile-select__mode">Auto Mode</span></span>
}

export default function HomeProfileSelect({ value = 1, onChange, active = true }) {
  const id = useId()
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const optionRefs = useRef([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const selectedIndex = Math.max(0, HOME_PROFILES.findIndex((profile) => profile.id === value))
  const selected = HOME_PROFILES[selectedIndex]
  const expanded = open && active
  const listId = `${id}-profiles`
  const optionId = (index) => `${id}-profile-${index}`

  useEffect(() => {
    if (!active) setOpen(false)
  }, [active])

  useEffect(() => {
    if (!expanded) return undefined
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('focusin', closeOutside)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('focusin', closeOutside)
    }
  }, [expanded])

  useLayoutEffect(() => {
    if (expanded) optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [expanded, activeIndex])

  const openAt = (index = selectedIndex) => {
    setActiveIndex(index)
    setOpen(true)
  }

  const selectProfile = (index) => {
    setOpen(false)
    onChange?.(HOME_PROFILES[index].id)
    triggerRef.current?.focus()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Tab') {
      setOpen(false)
      return
    }
    if (event.key === 'Escape') {
      if (expanded) {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
      }
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (expanded) selectProfile(activeIndex)
      else openAt()
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!expanded) openAt()
      else setActiveIndex((index) => Math.max(0, Math.min(HOME_PROFILES.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))))
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      openAt(event.key === 'Home' ? 0 : HOME_PROFILES.length - 1)
      return
    }
    if (/^[1-8]$/.test(event.key)) {
      event.preventDefault()
      openAt(Number(event.key) - 1)
    }
  }

  return (
    <div className="home-profile-select home-dashboard__profile-select" ref={rootRef}>
      <button
        id={`${id}-trigger`}
        ref={triggerRef}
        type="button"
        role="combobox"
        className={`home-profile-select__trigger${expanded ? ' is-open' : ''}`}
        aria-label={`Live profile: Profile ${selected.id} Auto Mode`}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        aria-activedescendant={expanded ? optionId(activeIndex) : undefined}
        onClick={() => expanded ? setOpen(false) : openAt()}
        onKeyDown={handleKeyDown}
      >
        <ProfileLabel id={selected.id} />
        <Icon name="chevron" size={17} />
      </button>
      {expanded && (
        <div id={listId} className="home-profile-select__options" role="listbox" aria-label="Live profile">
          {HOME_PROFILES.map((profile, index) => (
            <div
              id={optionId(index)}
              key={profile.id}
              ref={(element) => { optionRefs.current[index] = element }}
              role="option"
              aria-selected={profile.id === selected.id}
              className={`home-profile-select__option${profile.id === selected.id ? ' is-selected' : ''}${activeIndex === index ? ' is-active' : ''}`}
              onPointerMove={() => setActiveIndex(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => selectProfile(index)}
            >
              <ProfileLabel id={profile.id} />
              {profile.id === selected.id && <svg className="home-profile-select__check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
