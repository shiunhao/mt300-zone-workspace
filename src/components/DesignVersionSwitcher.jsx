import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './DesignVersionSwitcher.css'

const versions = [
  {
    value: 'reference',
    code: 'V1',
    label: 'Independent Group Maps',
  },
  {
    value: 'shared',
    code: 'V2',
    label: 'Zone Workspace',
  },
  {
    value: 'dialog',
    code: 'V3',
    label: 'Map Setting Dialog',
  },
  {
    value: 'previews',
    code: 'V4',
    label: 'Group Previews',
  },
]

export default function DesignVersionSwitcher({ value, onChange, hidden = false }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [top, setTop] = useState(null)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const optionRefs = useRef([])
  const id = useId()
  const selectedIndex = Math.max(0, versions.findIndex((version) => version.value === value))
  const selected = versions[selectedIndex]

  useLayoutEffect(() => {
    const toolbar = document.querySelector('.page-toolbar')
    if (!toolbar) return undefined

    // Keep the floating selector beneath the real Help / Close toolbar row.
    const positionBelowToolbar = () => {
      setTop(Math.round(toolbar.getBoundingClientRect().bottom + 4 + window.scrollY))
    }
    positionBelowToolbar()
    const observer = new ResizeObserver(positionBelowToolbar)
    observer.observe(toolbar)
    window.addEventListener('resize', positionBelowToolbar)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', positionBelowToolbar)
    }
  }, [])

  useEffect(() => {
    if (hidden) setOpen(false)
  }, [hidden])

  useEffect(() => {
    if (!open || hidden) return undefined

    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', handleOutside)
    // Capture Escape so an open version menu closes before a dialog behind it.
    document.addEventListener('keydown', handleEscape, true)
    return () => {
      document.removeEventListener('pointerdown', handleOutside)
      document.removeEventListener('keydown', handleEscape, true)
    }
  }, [open, hidden])

  useEffect(() => {
    if (open && !hidden) optionRefs.current[activeIndex]?.focus()
  }, [open, activeIndex, hidden])

  const openMenu = (index = selectedIndex) => {
    setActiveIndex(index)
    setOpen(true)
  }

  const selectVersion = (version) => {
    onChange(version.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleMenuKeyDown = (event) => {
    let nextIndex
    if (event.key === 'ArrowDown') nextIndex = (activeIndex + 1) % versions.length
    if (event.key === 'ArrowUp') nextIndex = (activeIndex - 1 + versions.length) % versions.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = versions.length - 1
    if (nextIndex !== undefined) {
      event.preventDefault()
      setActiveIndex(nextIndex)
    }
    if (event.key === 'Tab') setOpen(false)
  }

  return createPortal(
    <div
      ref={rootRef}
      className="design-version-switcher"
      hidden={hidden}
      style={top === null ? undefined : { '--design-switcher-top': `${top}px` }}
      title="Switch prototype version"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        className={`design-version-trigger${open ? ' is-open' : ''}`}
        aria-label={`Design version: ${selected.code} ${selected.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
          event.preventDefault()
          openMenu(event.key === 'ArrowUp' ? versions.length - 1 : selectedIndex)
        }}
      >
        <span className="design-version-dot" aria-hidden="true" />
        <span className="design-version-label">{selected.code} — {selected.label}</span>
        <span className="design-version-chevron" aria-hidden="true">▼</span>
      </button>

      {open && !hidden && (
        <div
          id={`${id}-menu`}
          className="design-version-menu"
          role="menu"
          aria-labelledby={`${id}-trigger`}
          onKeyDown={handleMenuKeyDown}
        >
          {versions.map((version, index) => (
            <button
              key={version.value}
              ref={(element) => { optionRefs.current[index] = element }}
              type="button"
              className={`design-version-option${selected.value === version.value ? ' is-selected' : ''}`}
              role="menuitemradio"
              aria-checked={selected.value === version.value}
              tabIndex={index === activeIndex ? 0 : -1}
              onFocus={() => setActiveIndex(index)}
              onClick={() => selectVersion(version)}
            >
              {version.code} — {version.label}
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
