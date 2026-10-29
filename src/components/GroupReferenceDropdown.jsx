import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { getGroupReferenceColor } from './groupReferenceColors'
import './GroupReferenceDropdown.css'

export default function GroupReferenceDropdown({ groups = [], checked = {}, onChange, disabled = false, disabledReason = '' }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const [reasonHovered, setReasonHovered] = useState(false)
  const [reasonFocused, setReasonFocused] = useState(false)
  const [reasonDismissed, setReasonDismissed] = useState(false)
  const [reasonPosition, setReasonPosition] = useState(null)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const reasonRef = useRef(null)
  const id = useId()
  const groupsKey = groups.map((group) => `${group.id}:${group.name || group.id}:${group.camera}:${group.zoneCount}`).join('|')
  const positioned = position !== null
  const expanded = open && !disabled
  const hasDisabledReason = disabled && Boolean(disabledReason)
  const showReason = hasDisabledReason && (reasonHovered || reasonFocused) && !reasonDismissed

  // The list identifies the current group's references. Close when it changes.
  useEffect(() => {
    setOpen(false)
  }, [groupsKey])

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  useLayoutEffect(() => {
    if (!showReason) return undefined
    const reposition = () => {
      const trigger = triggerRef.current
      if (!trigger?.isConnected) return
      const bounds = trigger.getBoundingClientRect()
      const viewportWidth = document.documentElement.clientWidth
      const viewportHeight = window.innerHeight
      const edge = 8
      const gap = 6
      const width = Math.min(280, viewportWidth - edge * 2)
      const height = reasonRef.current?.getBoundingClientRect().height || 42
      const roomBelow = viewportHeight - bounds.bottom - gap - edge
      const top = roomBelow >= height || bounds.top < height + gap + edge
        ? Math.min(bounds.bottom + gap, viewportHeight - height - edge)
        : bounds.top - height - gap
      setReasonPosition({
        top: Math.max(edge, top),
        left: Math.max(edge, Math.min(bounds.right - width, viewportWidth - width - edge)),
        width,
      })
    }
    reposition()
    const resizeObserver = new ResizeObserver(reposition)
    resizeObserver.observe(triggerRef.current)
    resizeObserver.observe(reasonRef.current)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [showReason, disabledReason])

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
      const expectedHeight = Math.min(280, (groups.length ? groups.reduce((height, group) => height + (group.zoneCount === 0 ? 54 : 36), 0) : 36) + 10)
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
    <span
      ref={rootRef}
      className={`group-reference-dropdown${hasDisabledReason ? ' has-disabled-reason' : ''}`}
      tabIndex={hasDisabledReason ? 0 : undefined}
      role={hasDisabledReason ? 'group' : undefined}
      aria-label={hasDisabledReason ? 'View Other Groups’ Zones' : undefined}
      aria-disabled={hasDisabledReason ? true : undefined}
      aria-describedby={hasDisabledReason ? `${id}-disabled-reason` : undefined}
      onPointerEnter={() => { setReasonHovered(true); setReasonDismissed(false) }}
      onPointerLeave={() => setReasonHovered(false)}
      onFocus={(event) => {
        if (event.target !== event.currentTarget) return
        setReasonFocused(true)
        setReasonDismissed(false)
      }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setReasonFocused(false) }}
      onKeyDown={(event) => {
        if (!showReason || event.key !== 'Escape') return
        event.preventDefault()
        event.stopPropagation()
        setReasonDismissed(true)
      }}
    >
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        className={`group-reference-trigger${expanded ? ' is-open' : ''}`}
        disabled={disabled}
        aria-describedby={hasDisabledReason ? `${id}-disabled-reason` : undefined}
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
            <label key={group.id} className={`group-reference-option${group.zoneCount === 0 ? ' is-disabled' : ''}`} style={{ '--group-reference-color': getGroupReferenceColor(group.id) }}>
              <input
                type="checkbox"
                disabled={disabled || group.zoneCount === 0}
                checked={group.zoneCount !== 0 && Boolean(checked[group.id])}
                aria-label={`Show ${group.name || group.id} reference zones`}
                aria-describedby={group.zoneCount === 0 ? `${id}-${group.id}-empty` : undefined}
                onChange={(event) => { if (!disabled && group.zoneCount !== 0) onChange(group.id, event.target.checked) }}
              />
              <span className="group-reference-option-dot" aria-hidden="true" />
              <span className="group-reference-option-copy">
                <span className="group-reference-option-summary">
                  <span className="group-reference-option-id" title={group.name || group.id}>{group.name || group.id}</span>
                  <span className="group-reference-option-camera">{group.camera}</span>
                </span>
                {group.zoneCount === 0 && <span id={`${id}-${group.id}-empty`} className="group-reference-option-note">No zones configured</span>}
              </span>
            </label>
          ))}
        </div>,
        document.body,
      )}
      {hasDisabledReason && createPortal(
        <span
          ref={reasonRef}
          id={`${id}-disabled-reason`}
          role="tooltip"
          className="group-reference-disabled-reason"
          style={showReason && reasonPosition ? reasonPosition : { visibility: 'hidden', top: 0, left: 0, width: 280 }}
        >
          {disabledReason}
        </span>,
        document.body,
      )}
    </span>
  )
}
