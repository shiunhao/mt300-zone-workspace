import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { getGroupReferenceColor } from './groupReferenceColors'
import './GroupReferenceDropdown.css'

export default function GroupReferenceDropdown({ groups = [], checked = {}, onChange, disabled = false }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const id = useId()
  const groupsKey = groups.map((group) => `${group.id}:${group.camera}`).join('|')
  const positioned = position !== null
  const expanded = open && !disabled

  // The list identifies the current group's references. Close when it changes.
  useEffect(() => {
    setOpen(false)
  }, [groupsKey])

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  useLayoutEffect(() => {
    if (!expanded) return undefined
    const trigger = triggerRef.current
    const ancestors = []
    for (let element = rootRef.current; element; element = element.parentElement) ancestors.push(element)

    const reposition = () => {
      if (trigger.disabled || !trigger.isConnected || trigger.getClientRects().length === 0) {
        setOpen(false)
        return
      }
      const bounds = trigger.getBoundingClientRect()
      const viewportWidth = document.documentElement.clientWidth
      const viewportHeight = window.innerHeight
      const edge = 8
      const gap = 6
      const width = Math.min(220, viewportWidth - edge * 2)
      const roomBelow = Math.max(0, viewportHeight - bounds.bottom - gap - edge)
      const roomAbove = Math.max(0, bounds.top - gap - edge)
      const expectedHeight = Math.min(280, Math.max(1, groups.length) * 36 + 10)
      const above = roomBelow < expectedHeight && roomAbove > roomBelow
      const maxHeight = Math.min(280, above ? roomAbove : roomBelow)
      const top = above ? bounds.top - gap - Math.min(expectedHeight, maxHeight) : bounds.bottom + gap
      const left = Math.max(edge, Math.min(bounds.left, viewportWidth - width - edge))
      setPosition({ top, left, width, maxHeight })
    }

    reposition()

    const resizeObserver = new ResizeObserver(reposition)
    resizeObserver.observe(trigger)
    ancestors.forEach((element) => resizeObserver.observe(element))
    const visibilityObserver = new MutationObserver(reposition)
    ancestors.forEach((element) => visibilityObserver.observe(element, {
      attributes: true,
      attributeFilter: ['hidden', 'class', 'style'],
    }))
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [expanded, groupsKey])

  useEffect(() => {
    if (expanded && positioned) menuRef.current?.querySelector('input[type="checkbox"]:not(:disabled)')?.focus()
  }, [expanded, positioned])

  useEffect(() => {
    if (!expanded) return undefined
    const withinDropdown = (target) => rootRef.current?.contains(target) || menuRef.current?.contains(target)
    const handleOutside = (event) => {
      if (!withinDropdown(event.target)) setOpen(false)
    }
    const handleEscape = (event) => {
      if (triggerRef.current?.disabled || event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', handleOutside)
    document.addEventListener('focusin', handleOutside)
    document.addEventListener('keydown', handleEscape, true)
    return () => {
      document.removeEventListener('pointerdown', handleOutside)
      document.removeEventListener('focusin', handleOutside)
      document.removeEventListener('keydown', handleEscape, true)
    }
  }, [expanded])

  return (
    <span ref={rootRef} className="group-reference-dropdown">
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        className={`group-reference-trigger${expanded ? ' is-open' : ''}`}
        disabled={disabled}
        aria-expanded={expanded}
        aria-controls={expanded ? `${id}-options` : undefined}
        onClick={() => { if (!disabled) setOpen((current) => !current) }}
        onKeyDown={(event) => {
          if (disabled || event.key !== 'ArrowDown') return
          event.preventDefault()
          if (expanded) menuRef.current?.querySelector('input[type="checkbox"]:not(:disabled)')?.focus()
          else setOpen(true)
        }}
      >
        <span>View Other Groups’ Zones</span>
        <Icon name="chevron" size={14} />
      </button>
      {expanded && createPortal(
        <div
          ref={menuRef}
          id={`${id}-options`}
          className="group-reference-menu"
          role="group"
          aria-label="Other group reference zones"
          style={position ? { ...position, position: 'fixed' } : { visibility: 'hidden', position: 'fixed' }}
        >
          {groups.length === 0 ? <span className="group-reference-empty">No other groups</span> : groups.map((group) => (
            <label key={group.id} className="group-reference-option" style={{ '--group-reference-color': getGroupReferenceColor(group.id) }}>
              <input
                type="checkbox"
                disabled={disabled}
                checked={Boolean(checked[group.id])}
                aria-label={`Show ${group.id} reference zones`}
                onChange={(event) => { if (!disabled) onChange(group.id, event.target.checked) }}
              />
              <span className="group-reference-option-dot" aria-hidden="true" />
              <span className="group-reference-option-id">{group.id}</span>
              <span className="group-reference-option-camera">{group.camera}</span>
            </label>
          ))}
        </div>,
        document.body,
      )}
    </span>
  )
}
