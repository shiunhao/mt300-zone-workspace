import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import ZoneMapPanel from './ZoneMapPanel';
import { getGroupReferenceColor } from './groupReferenceColors';
import {
  WORKSPACE_MICROPHONE, cloneZones, createWorkspaceMaps,
  copyWorkspaceZones, validateWorkspaceZones,
} from './workspaceGeometry';
import './MicrophoneWorkspace.css';

const isTalkerGroup = (group) => !group?.pickupMode || group.pickupMode === 'Talker Position';
const canUseZones = (group) => Boolean(group?.enabled) && isTalkerGroup(group);

function LayerIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
  </svg>;
}

function VisibilityIcon({ visible }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="2.8" />
    {!visible && <path d="m3 3 18 18" strokeWidth="2" />}
  </svg>;
}

function CeilingMicrophoneIcon() {
  return <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="22" height="22" rx="2" fill="#7d919f" stroke="#cadce8" strokeWidth="1.3" />
    <rect x="7" y="7" width="14" height="14" rx="1" fill="#b2c6d2" stroke="#d8e6ee" />
    <path d="M10 11h8M10 14h8M10 17h8M4 5h3M21 23h3" stroke="#728b9b" strokeWidth="1" />
    <path d="M20 4h4" stroke="#6ce3ab" strokeWidth="1.5" />
  </svg>;
}

function ZoneThumbnail({ zones, comparisonZones = zones, groupId, label }) {
  const color = getGroupReferenceColor(groupId);
  const halfWidth = Math.max(400, ...comparisonZones.map((zone) => (Math.abs(zone.x) + zone.width / 2) * 40 + 32));
  const halfHeight = Math.max(260, ...comparisonZones.map((zone) => (Math.abs(zone.y) + zone.height / 2) * 40 + 32));
  const left = 400 - halfWidth;
  const top = 260 - halfHeight;
  return <svg className="workspace-copy__thumbnail" viewBox={`${left} ${top} ${halfWidth * 2} ${halfHeight * 2}`} role="img" aria-label={label}>
    <defs><pattern id={`copy-grid-${groupId}-${label.startsWith('Before') ? 'before' : 'after'}`} width="25" height="25" patternUnits="userSpaceOnUse">
      <path d="M25 0H0V25" fill="none" stroke="#404750" strokeWidth="1" strokeDasharray="2 3" />
    </pattern></defs>
    <rect x={left} y={top} width={halfWidth * 2} height={halfHeight * 2} fill="#242a31" />
    <rect x={left} y={top} width={halfWidth * 2} height={halfHeight * 2} fill={`url(#copy-grid-${groupId}-${label.startsWith('Before') ? 'before' : 'after'})`} />
    <path d={`M400 ${top}v${halfHeight * 2}M${left} 260h${halfWidth * 2}`} stroke="#4884ab" strokeDasharray="6 5" />
    {zones.map((zone) => <g key={zone.id}>
      <rect x={400 + (zone.x - zone.width / 2) * 40} y={260 - (zone.y + zone.height / 2) * 40}
        width={zone.width * 40} height={zone.height * 40} rx="2" fill={color} fillOpacity=".17" stroke={color} strokeWidth="2" />
      <text x={405 + (zone.x - zone.width / 2) * 40} y={277 - (zone.y + zone.height / 2) * 40}
        fill="#e8edf2" fontSize="16">{zone.name}</text>
    </g>)}
    <rect x="389" y="249" width="22" height="22" rx="2" fill="#9aabb8" stroke="#d2dde6" />
    <rect x="393" y="253" width="14" height="14" fill="#c0ccd5" />
    {!zones.length && <text x="400" y="315" textAnchor="middle" fill="#9ca6af" fontSize="22">No zones</text>}
  </svg>;
}

function CopyZonesDialog({ draft, groups, maps, active, onChangeTargets, onPreview, onBack, onApply, onClose }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const source = groups.find((group) => group.id === draft.sourceId);
  const targetGroups = groups.filter((group) => group.id !== draft.sourceId);
  const selectedTargets = targetGroups.filter((group) => draft.targetIds.includes(group.id));
  const invalidTarget = selectedTargets.some((group) => !canUseZones(group));
  const invalidSource = !canUseZones(source) || !draft.zones.length;
  const validationMessage = validateWorkspaceZones(draft.zones);
  const canProceed = active && selectedTargets.length > 0 && !invalidTarget && !invalidSource && !validationMessage;

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    function onKey(event) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex="0"]') || [])
        .filter((element) => element.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus();
    };
  }, [onClose]);

  return createPortal(<div className="workspace-copy__backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="workspace-copy" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <header className="workspace-copy__header">
        <div><span className="workspace-copy__eyebrow">{draft.step === 'preview' ? '2 / 2 · Preview' : '1 / 2 · Choose groups'}</span>
          <h2 id={titleId}>Copy Zones to Groups</h2></div>
        <button ref={closeRef} type="button" className="icon-button" aria-label="Close copy zones dialog" onClick={onClose}><Icon name="close" /></button>
      </header>
      <div className="workspace-copy__body">
        <div className="workspace-copy__source">
          <span className="workspace-layer-color" style={{ background: getGroupReferenceColor(draft.sourceId) }} />
          <strong>{draft.sourceId}</strong><span>{source?.camera}</span><span className="workspace-copy__zone-count">{draft.zones.length} zones</span>
        </div>
        <p id={descriptionId} className="workspace-copy__description">Replace the selected groups’ zones with independent copies from {draft.sourceId}.</p>
        <div className="workspace-copy__replacement"><strong>Replace existing zones</strong><span>Each group can be edited separately after copying.</span></div>
        {draft.step === 'targets' ? <fieldset className="workspace-copy__targets">
          <legend>Copy to</legend>
          {targetGroups.map((group) => <label key={group.id} className={`workspace-copy__target${canUseZones(group) ? '' : ' is-disabled'}`}>
            <input type="checkbox" checked={draft.targetIds.includes(group.id)} disabled={!canUseZones(group) || !active}
              aria-label={`Copy zones to ${group.id}`} onChange={() => onChangeTargets(group.id)} />
            <span className="workspace-layer-color" style={{ background: getGroupReferenceColor(group.id) }} />
            <strong>{group.id}</strong><span>{group.camera}</span>
            <span className="workspace-copy__target-meta">{!group.enabled ? 'Disabled' : !isTalkerGroup(group) ? `${group.pickupMode} mode` : `${(maps[group.id] || []).length} existing zones`}</span>
          </label>)}
        </fieldset> : <div className="workspace-copy__previews">
          {selectedTargets.map((group) => <section key={group.id} className="workspace-copy__preview">
            <header><span className="workspace-layer-color" style={{ background: getGroupReferenceColor(group.id) }} /><strong>{group.id}</strong><span>{group.camera}</span></header>
            <div className="workspace-copy__preview-maps">
              <div><span>Before · {(maps[group.id] || []).length} zones</span><ZoneThumbnail zones={maps[group.id] || []} comparisonZones={[...(maps[group.id] || []), ...draft.zones]} groupId={group.id} label={`Before copying to ${group.id}`} /></div>
              <span className="workspace-copy__arrow" aria-hidden="true">→</span>
              <div><span>After · {draft.zones.length} zones</span><ZoneThumbnail zones={draft.zones} comparisonZones={[...(maps[group.id] || []), ...draft.zones]} groupId={group.id} label={`After copying to ${group.id}`} /></div>
            </div>
          </section>)}
        </div>}
        {(validationMessage || invalidTarget || invalidSource) && <p className="workspace-copy__error" role="alert">
          {validationMessage || (invalidSource ? 'Enable a source group in Talker Position mode with zones.' : 'Target groups must be enabled and in Talker Position mode.')}
        </p>}
      </div>
      <footer className="workspace-copy__footer">
        <span>{selectedTargets.length ? `${selectedTargets.length} ${selectedTargets.length === 1 ? 'group' : 'groups'} selected` : 'Select at least one enabled group'}</span>
        <div><button type="button" className="zone-map__button" onClick={onClose}>Cancel</button>
          {draft.step === 'preview' && <button type="button" className="zone-map__button" onClick={onBack}>Back</button>}
          <button type="button" className="zone-map__button is-primary" disabled={!canProceed}
            onClick={draft.step === 'preview' ? onApply : onPreview}>{draft.step === 'preview' ? 'Apply copies' : 'Preview'}</button>
        </div>
      </footer>
    </section>
  </div>, document.body);
}

export default function MicrophoneWorkspace({ groups = [], selectedGroupId = 'G2', onSelectGroup, onToggleGroup, onOpenGroupSettings, active = true }) {
  const [maps, setMaps] = useState(() => createWorkspaceMaps(groups));
  const [visibleGroupIds, setVisibleGroupIds] = useState(() => groups.map((group) => group.id));
  const [selections, setSelections] = useState({});
  const [editing, setEditing] = useState(false);
  const [copyDraft, setCopyDraft] = useState(null);
  const [notice, setNotice] = useState('');
  const copyId = useRef(1);
  const knownGroups = useRef(new Set(groups.map((group) => group.id)));
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || groups[0];
  const groupId = selectedGroup?.id || selectedGroupId;
  const overview = !editing;
  const sourceZones = maps[groupId] || [];
  const sourceEnabled = canUseZones(selectedGroup);
  const canCopy = active && sourceEnabled && sourceZones.length > 0 && groups.some((group) => group.id !== groupId && canUseZones(group));

  useEffect(() => {
    const added = groups.filter((group) => !knownGroups.current.has(group.id));
    if (added.length) {
      setMaps((current) => ({ ...current, ...createWorkspaceMaps(added) }));
      setVisibleGroupIds((current) => [...current, ...added.map((group) => group.id)]);
      added.forEach((group) => knownGroups.current.add(group.id));
    }
  }, [groups]);
  useEffect(() => {
    if (!active) { setCopyDraft(null); return; }
    setEditing(false);
    setVisibleGroupIds((current) => current.includes(groupId) ? current : [...current, groupId]);
  }, [active]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function selectGroup(nextGroupId) {
    if (!active) return;
    if (editing) setVisibleGroupIds((current) => current.includes(nextGroupId) ? current : [...current, nextGroupId]);
    onSelectGroup?.(nextGroupId);
  }
  function toggleVisibility(id) {
    if (!active) return;
    if (visibleGroupIds.includes(id)) {
      setSelections((current) => ({ ...current, [id]: null }));
      if (editing && id === groupId) setEditing(false);
    }
    setVisibleGroupIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function beginEditing() {
    if (!active || !sourceEnabled) return;
    setVisibleGroupIds((current) => current.includes(groupId) ? current : [...current, groupId]);
    setEditing(true);
  }
  function openCopy() {
    if (!canCopy) return;
    setCopyDraft({ sourceId: groupId, zones: cloneZones(sourceZones), targetIds: [], step: 'targets' });
  }
  const closeCopy = useCallback(() => setCopyDraft(null), []);
  function applyCopies() {
    if (!active || !copyDraft || copyDraft.step !== 'preview' || !copyDraft.targetIds.length) return;
    const source = groups.find((group) => group.id === copyDraft.sourceId);
    const targets = groups.filter((group) => copyDraft.targetIds.includes(group.id));
    if (!canUseZones(source) || targets.length !== copyDraft.targetIds.length || targets.some((group) => !canUseZones(group))
      || !copyDraft.zones.length || validateWorkspaceZones(copyDraft.zones)) return;
    const nextCopyId = copyId.current++;
    const nextZones = Object.fromEntries(targets.map((group) => [group.id, copyWorkspaceZones(copyDraft.zones, group.id, nextCopyId)]));
    setMaps((current) => ({ ...current, ...nextZones }));
    setSelections((current) => ({ ...current, ...Object.fromEntries(targets.map((group) => [group.id, nextZones[group.id][0]?.id || null])) }));
    setVisibleGroupIds((current) => [...new Set([...current, ...targets.map((group) => group.id)])]);
    setNotice(`Copied ${copyDraft.zones.length} zones from ${copyDraft.sourceId} to ${targets.map((group) => group.id).join(', ')}.`);
    setCopyDraft(null);
  }

  const toolbar = <div className="microphone-workspace__map-actions">
    {overview ? <button type="button" className="zone-map__button is-primary" disabled={!active || !sourceEnabled} onClick={beginEditing}>Edit {groupId}</button>
      : <button type="button" className="zone-map__button" disabled={!active} onClick={() => setEditing(false)}>Back to Overview</button>}
    <button type="button" className="zone-map__button" disabled={!canCopy} onClick={openCopy}>Copy Zones to Groups</button>
  </div>;

  return <div className="microphone-workspace" hidden={!active}>
    <aside className="microphone-workspace__layers" aria-label="Microphone group layers">
      <div className="microphone-workspace__mic"><div className="microphone-workspace__mic-icon"><CeilingMicrophoneIcon /></div>
        <div><strong>{WORKSPACE_MICROPHONE.id}</strong><span>{WORKSPACE_MICROPHONE.model}</span></div></div>
      <button type="button" className={`microphone-workspace__overview${overview ? ' is-active' : ''}`} disabled={!active}
        onClick={() => setEditing(false)}><LayerIcon /><span>Overview</span><span>{groups.length}</span></button>
      <div className="microphone-workspace__layer-heading"><h2>Group layers</h2><span>Visibility</span></div>
      <div className="microphone-workspace__layer-list">
        {groups.map((group) => <div key={group.id} className={`microphone-workspace__layer${group.id === groupId ? ' is-selected' : ''}${group.enabled ? '' : ' is-off'}`}
          style={{ '--layer-color': getGroupReferenceColor(group.id) }}>
          <button type="button" className={`microphone-workspace__visibility${visibleGroupIds.includes(group.id) ? ' is-visible' : ''}`}
            aria-label={`Show ${group.id} zones`} aria-pressed={visibleGroupIds.includes(group.id)} disabled={!active}
            title={`${visibleGroupIds.includes(group.id) ? 'Hide' : 'Show'} ${group.id} zones`} onClick={() => toggleVisibility(group.id)}>
            <VisibilityIcon visible={visibleGroupIds.includes(group.id)} />
          </button>
          <button type="button" className="microphone-workspace__layer-select" disabled={!active} aria-pressed={group.id === groupId}
            aria-label={`Inspect ${group.id} ${group.camera}`} onClick={() => selectGroup(group.id)}>
            <span><span className="workspace-layer-color" /><strong>{group.id}</strong>{editing && group.id === groupId && group.enabled && <span className="microphone-workspace__editing-dot" title="Editing" />}</span>
            <span className="microphone-workspace__camera"><Icon name="camera" size={16} />{group.camera}</span>
            <span className="microphone-workspace__layer-caption">{!isTalkerGroup(group) ? `${group.pickupMode} mode` : `${(maps[group.id] || []).length} zones`}{group.enabled ? '' : ' · Disabled'}</span>
          </button>
          <button type="button" className={`switch${group.enabled ? ' is-on' : ''}`} role="switch" aria-checked={group.enabled}
            aria-label={`Enable ${group.id}`} disabled={!active} onClick={() => { if (active) onToggleGroup?.(group.id); }}><span /></button>
        </div>)}
      </div>
      <div className="microphone-workspace__layer-foot"><span className="microphone-workspace__independent-icon" aria-hidden="true">↗</span><span>Each group has its own zones</span></div>
    </aside>
    <section className="microphone-workspace__main" aria-label="Zone Workspace">
      <header className="microphone-workspace__header">
        <div><h1>Zone Workspace</h1><p>{WORKSPACE_MICROPHONE.id}<span>·</span>{WORKSPACE_MICROPHONE.model}</p></div>
        <button type="button" className="zone-map__button" disabled={!active} onClick={() => { if (active) onOpenGroupSettings?.(); }}>
          <span aria-hidden="true">←</span>Back to Channel</button>
      </header>
      <div className={`microphone-workspace__mode${editing ? ' is-editing' : ''}`}>
        <span className="microphone-workspace__mode-label">{overview ? 'Overview' : `Editing ${groupId}`}</span>
        <span>{overview ? 'Select a zone to inspect its group' : sourceEnabled ? 'Changes apply to this group only' : !selectedGroup?.enabled ? `${groupId} is disabled` : `${selectedGroup.pickupMode} mode · Zones are read-only`}</span>
        {notice && <span className="microphone-workspace__notice" role="status">{notice}</span>}
      </div>
      <ZoneMapPanel variant="workspace" groupId={groupId} groups={groups} enabled={overview || sourceEnabled} active={active}
        maps={maps} onMapsChange={setMaps} visibleGroupIds={visibleGroupIds} overview={overview}
        onSelectGroup={selectGroup} toolbarSlot={toolbar} selectedZoneId={selections[groupId] || null}
        onSelectedZoneChange={(ownerId, zoneId) => { if (active) setSelections((current) => ({ ...current, [ownerId]: zoneId })); }} />
    </section>
    {copyDraft && active && <CopyZonesDialog draft={copyDraft} groups={groups} maps={maps} active={active}
      onChangeTargets={(targetId) => setCopyDraft((current) => current && ({ ...current, targetIds: current.targetIds.includes(targetId)
        ? current.targetIds.filter((id) => id !== targetId) : [...current.targetIds, targetId] }))}
      onPreview={() => setCopyDraft((current) => current && ({ ...current, step: 'preview' }))}
      onBack={() => setCopyDraft((current) => current && ({ ...current, step: 'targets' }))} onApply={applyCopies} onClose={closeCopy} />}
  </div>;
}
