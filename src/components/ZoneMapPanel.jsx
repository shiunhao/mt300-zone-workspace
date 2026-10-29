import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import MapViewControls from './MapViewControls';
import useMapZoom from './useMapZoom';
import GroupReferenceDropdown from './GroupReferenceDropdown';
import WarningDialog from './WarningDialog';
import { getGroupReferenceColor } from './groupReferenceColors';
import { WORKSPACE_MICROPHONE } from './workspaceGeometry';
import { getOffscreenMicrophone } from './offscreenMicrophone';
import { GRID_CELLS, CELL_SIZE, UNITS_PER_METER, MIN_ZONE_SIZE, WORLD_SIZE, ORIGIN, MAP_EXTENT,
  clamp, constrainZone, mapRect, conflictsWithMap, moveZone, resizeZone, visibleMapBounds, zoneFieldLimits } from './zoneMapGeometry';
import './ZoneMapPanel.css';

const BASE_VIEW_WIDTH = 1200;
const BASE_VIEW_HEIGHT = 800;
// Anchor intersections to (0, 0); the outer map boundary can clip half cells.
const GRID_LINES = Array.from({ length: GRID_CELLS }, (_, index) => ORIGIN + (index - Math.floor(GRID_CELLS / 2)) * CELL_SIZE);
const RESIZE_CORNERS = [
  { id: 'nw', label: 'top-left' }, { id: 'ne', label: 'top-right' },
  { id: 'sw', label: 'bottom-left' }, { id: 'se', label: 'bottom-right' },
];

const INITIAL_G1 = [
  { id: 'zone-1', name: 'Zone 1', x: -2.5, y: 1.25, width: 3, height: 2 },
  { id: 'zone-2', name: 'Zone 2', x: 2.25, y: -1.25, width: 3.5, height: 2 },
];
const INITIAL_GROUPS = {
  G1: INITIAL_G1.map((zone) => ({ ...zone })),
  G2: [
    { id: 'zone-1', name: 'Zone 1', x: -2.25, y: 1, width: 3.5, height: 2.5 },
    { id: 'zone-2', name: 'Zone 2', x: 2.5, y: -1.5, width: 3, height: 2 },
  ],
  G3: [
    { id: 'zone-1', name: 'Zone 1', x: -3.25, y: -1.5, width: 2.5, height: 2 },
    { id: 'zone-2', name: 'Zone 2', x: 2.75, y: 1.75, width: 2, height: 2.5 },
  ],
};
const copyZones = (zones) => zones.map((zone) => ({ ...zone }));

function rangeWarning(value, { min, max }) {
  const reason = value > max ? 'too large' : value < min ? 'too small' : '';
  return reason ? `Value is ${reason}.\nMinimum: ${min} m · Maximum: ${max} m.` : '';
}

function NumericField({ label, value, min, max, disabled, onCommit }) {
  const inputRef = useRef(null);
  const dirty = useRef(false);
  const formattedValue = String(Math.round(value * 10) / 10);
  const [input, setInput] = useState(formattedValue);
  const [warning, setWarning] = useState('');
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setInput(formattedValue);
    dirty.current = false;
  }
  useEffect(() => {
    if (disabled) { setInput(formattedValue); dirty.current = false; }
  }, [disabled, formattedValue]);
  function commit() {
    if (disabled || !dirty.current) {
      if (warning) return;
      setInput(formattedValue);
      return;
    }
    dirty.current = false;
    const next = input.trim() === '' ? NaN : Number(input);
    if (!Number.isFinite(next)) {
      setWarning('Enter a valid number.');
      return;
    }
    const requested = Math.round(next * 10) / 10;
    const rangeError = rangeWarning(requested, { min, max });
    if (rangeError) { setWarning(rangeError); return; }
    const rejected = onCommit(requested);
    setWarning(rejected || '');
    if (!rejected) setInput(String(requested));
  }
  function changeInput(event) {
    if (disabled) return;
    const next = event.target.value;
    if (!/^-?\d*(?:\.\d*)?$/.test(next)) return;
    const decimal = next.indexOf('.');
    setInput(decimal === -1 ? next : next.slice(0, decimal + 2));
    dirty.current = true;
  }
  function dismissWarning() {
    setInput(formattedValue);
    dirty.current = false;
    setWarning('');
  }
  return (
    <><label className="zone-map__number-field">
      <span>{label}</span>
      <div><input ref={inputRef} type="number" step="0.1" min={min} max={max} inputMode="decimal" value={input} aria-label={`${label} in meters`} disabled={disabled}
        onChange={changeInput} onBlur={commit}
        onKeyDown={(event) => {
          if (!disabled && event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.blur();
          }
        }} /><span className="zone-map__unit" aria-hidden="true">m</span></div>
    </label><WarningDialog open={Boolean(warning)} message={warning} onClose={dismissWarning} returnFocusRef={inputRef} /></>
  );
}

export default function ZoneMapPanel({
  variant = 'reference', groupId = 'G2', groups = [], enabled = true, active = true,
  maps, onMapsChange, visibleGroupIds, overview = false, onSelectGroup, toolbarSlot,
  selectedZoneId = null, onSelectedZoneChange, showReferences = true,
  microphone = WORKSPACE_MICROPHONE, showGroupContext = false,
  compactSettings = false, toolbarStart, toolbarEnd, mapIdentity, readOnly = false, emptyMessage, disabledMessage,
  onAddZoneWithoutSettings, groupSelected = true,
  viewOnly = false,
}) {
  const isWorkspace = variant === 'workspace';
  const isOverview = isWorkspace && overview;
  const isInteractive = enabled && active;
  const [groupMaps, setGroupMaps] = useState(() => Object.fromEntries(Object.entries(INITIAL_GROUPS).map(([id, zones]) => [id, copyZones(zones)])));
  const [selection, setSelection] = useState(() => Object.fromEntries(
    (groups.length ? groups.map((group) => group.id) : Object.keys(INITIAL_GROUPS))
      .map((id) => [id, 'zone-1']),
  ));
  const [references, setReferences] = useState({ G1: false, G2: false, G3: false });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setPanning] = useState(false);
  const [dragPreview, setDragPreview] = useState(null);
  const [viewport, setViewport] = useState({ width: BASE_VIEW_WIDTH, height: BASE_VIEW_HEIGHT });
  const [feedback, setFeedback] = useState('');
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const suppressCanvasClick = useRef(false);
  const allGroups = groups.length ? groups : [{ id: 'G1', camera: 'TR535N' }, { id: 'G2', camera: 'TR211' }, { id: 'G3', camera: 'TR313' }];
  const otherGroups = allGroups.filter((group) => group.id !== groupId
    && (!group.microphoneId || group.microphoneId === microphone.id));
  const currentGroup = allGroups.find((group) => group.id === groupId) || { id: groupId, enabled, camera: '—' };
  const currentGroupName = currentGroup.name || currentGroup.id;
  const availableMaps = maps ?? (isWorkspace ? {} : groupMaps);
  const visibleIds = new Set(visibleGroupIds || allGroups.map((group) => group.id));
  const visibleGroups = allGroups.filter((group) => visibleIds.has(group.id));
  const referenceOptions = otherGroups.map((group) => ({ ...group, zoneCount: availableMaps[group.id]?.length || 0 }));
  const hasReferenceZones = referenceOptions.some((group) => group.zoneCount > 0);
  const referenceDisabledReason = !enabled ? '請先啟用目前群組以查看參照區域。'
    : !referenceOptions.length ? '目前沒有其他群組可供參照。'
      : !hasReferenceZones ? '其他群組尚未設定區域。' : '';
  const referenceGroups = isWorkspace ? visibleGroups.filter((group) => group.id !== groupId)
    : showReferences ? referenceOptions.filter((group) => references[group.id] && group.zoneCount > 0) : [];
  const selectionKey = mapIdentity || groupId;
  const mapContext = `${variant}/${groupId}/${mapIdentity || ''}/${isOverview ? 'overview' : 'edit'}`;
  const currentZones = availableMaps[groupId] || [];
  const canEdit = !viewOnly && groupSelected && !readOnly && !isOverview && (!isWorkspace || currentGroup.enabled !== false);
  const editable = isInteractive && canEdit;
  const activePreview = !viewOnly && dragPreview?.context === mapContext ? dragPreview : null;
  const displayZones = activePreview ? currentZones.map((zone) => zone.id === activePreview.zone.id ? activePreview.zone : zone) : currentZones;
  const currentSelectionId = Object.prototype.hasOwnProperty.call(selection, selectionKey)
    ? selection[selectionKey] : currentZones[0]?.id;
  const selectedZone = displayZones.find((zone) => zone.id === (isWorkspace ? selectedZoneId : currentSelectionId)) || null;
  const hasOwnZones = currentZones.length > 0;
  const hasVisibleZones = isOverview ? visibleGroups.some((group) => availableMaps[group.id]?.length)
    : hasOwnZones || referenceGroups.some((group) => availableMaps[group.id]?.length);
  const mapInteractive = isInteractive;
  const inspectorDisabled = !isInteractive || !groupSelected || !hasOwnZones;
  const { mapRef, zoom, reset, zoomIn, zoomOut } = useMapZoom({ enabled: mapInteractive, maxZoom: 150 });
  const viewWidth = BASE_VIEW_WIDTH * 100 / zoom;
  const viewHeight = BASE_VIEW_HEIGHT * 100 / zoom;
  const viewScale = Math.min(viewport.width / viewWidth, viewport.height / viewHeight);
  // SVG's default meet scaling can expose extra world area beside the nominal
  // viewBox. Include that area in the clamp so letterboxed sides stay bounded.
  const visibleWidth = viewport.width / viewScale;
  const visibleHeight = viewport.height / viewScale;
  const panLimitX = Math.max(0, (WORLD_SIZE - visibleWidth) / 2);
  const panLimitY = Math.max(0, (WORLD_SIZE - visibleHeight) / 2);
  const panX = clamp(pan.x, -panLimitX, panLimitX);
  const panY = clamp(pan.y, -panLimitY, panLimitY);
  const visibleBounds = visibleMapBounds({ panX, panY, visibleWidth, visibleHeight });
  const fieldLimits = selectedZone && zoneFieldLimits(selectedZone);
  const viewBox = `${ORIGIN + panX - viewWidth / 2} ${ORIGIN + panY - viewHeight / 2} ${viewWidth} ${viewHeight}`;
  const microphoneIndicator = getOffscreenMicrophone({
    ...viewport,
    x: viewport.width / 2 - panX * viewScale,
    y: viewport.height / 2 - panY * viewScale,
  });
  const indicatorWorldX = microphoneIndicator && ORIGIN + panX + (microphoneIndicator.x - viewport.width / 2) / viewScale;
  const indicatorWorldY = microphoneIndicator && ORIGIN + panY + (microphoneIndicator.y - viewport.height / 2) / viewScale;

  useEffect(() => {
    const svg = svgRef.current;
    const canvas = mapRef.current;
    if (!svg || !canvas) return undefined;
    function measure() {
      const { width, height } = svg.getBoundingClientRect();
      if (!width || !height) return;
      setViewport((previous) => previous.width === width && previous.height === height ? previous : { width, height });
    }
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    measure();
    function blockWheelDuringDrag(event) {
      if (!mapInteractive || !dragRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    canvas.addEventListener('wheel', blockWheelDuringDrag, { capture: true, passive: false });
    return () => {
      observer.disconnect();
      canvas.removeEventListener('wheel', blockWheelDuringDrag, { capture: true });
    };
  }, [mapRef, mapInteractive]);

  useEffect(() => {
    if (!mapInteractive) return;
    // Keep the next zoom centered on the view currently visible after clamping.
    setPan((previous) => {
      const x = clamp(previous.x, -panLimitX, panLimitX);
      const y = clamp(previous.y, -panLimitY, panLimitY);
      return x === previous.x && y === previous.y ? previous : { x, y };
    });
  }, [mapInteractive, panLimitX, panLimitY]);

  useEffect(() => {
    if (!mapInteractive || (dragRef.current && dragRef.current.context !== mapContext)) cancelGesture();
  }, [mapInteractive, mapContext]);

  useEffect(() => {
    if (viewOnly && dragRef.current?.action !== 'pan') cancelGesture();
  }, [viewOnly]);

  useEffect(() => {
    const onVisibilityChange = () => { if (document.hidden) cancelGesture(); };
    const onWindowBlur = () => cancelGesture();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      cancelGesture();
    };
  }, []);

  function resetView() {
    if (!mapInteractive) return;
    setPan({ x: 0, y: 0 });
    reset();
  }

  function selectZone(id, ownerId = groupId) {
    if (!isInteractive) return;
    if (isWorkspace) {
      onSelectGroup?.(ownerId);
      onSelectedZoneChange?.(ownerId, id);
    } else setSelection((previous) => ({ ...previous, [selectionKey]: id }));
  }
  function updateZones(updater) {
    if (!editable) return;
    const apply = (previous) => typeof updater === 'function' ? updater(previous) : updater;
    const updateMap = (previous) => ({ ...previous, [groupId]: apply(previous[groupId] || []) });
    if (isWorkspace || maps !== undefined) onMapsChange?.(updateMap);
    else setGroupMaps(updateMap);
  }
  function updateZone(id, change) {
    if (!editable) return false;
    const storedZone = currentZones.find((zone) => zone.id === id);
    if (!storedZone) return false;
    const candidate = constrainZone({ ...storedZone, ...change });
    if (conflictsWithMap(candidate, currentZones)) {
      setFeedback('The zone overlaps another zone. Its previous position and size were retained.');
      return false;
    }
    updateZones((zones) => zones.map((zone) => zone.id === id ? candidate : zone));
    return true;
  }
  function commitField(field, value) {
    if (!selectedZone || !editable) return 'This zone is read-only.';
    const rangeError = rangeWarning(value, fieldLimits[field]);
    if (rangeError) return rangeError;
    if (!updateZone(selectedZone.id, { [field]: value })) return 'Zone overlaps another zone.';
    setFeedback('Zone updated.');
    return '';
  }
  function addZone() {
    if (!editable) return;
    let number = 1;
    while (currentZones.some((zone) => zone.id === `zone-${number}` || zone.name === `Zone ${number}`)) number += 1;
    let zone = null;
    // Start at the origin, then look outward along the 0.6 m grid.
    for (let radius = 0; radius <= Math.ceil(MAP_EXTENT / MIN_ZONE_SIZE) && !zone; radius += 1) {
      for (let x = -radius; x <= radius && !zone; x += 1) {
        for (let y = -radius; y <= radius && !zone; y += 1) {
          if (Math.max(Math.abs(x), Math.abs(y)) !== radius) continue;
          const candidate = constrainZone({ id: `zone-${number}`, name: `Zone ${number}`, x: x * MIN_ZONE_SIZE, y: y * MIN_ZONE_SIZE, width: 2, height: 1.5 });
          if (!conflictsWithMap(candidate, currentZones)) zone = candidate;
        }
      }
    }
    if (!zone) {
      setFeedback('No space is available for a new zone.');
      return;
    }
    updateZones((zones) => [...zones, zone]);
    selectZone(zone.id);
    setFeedback(`${zone.name} added.`);
  }
  function requestAddZone() {
    if (viewOnly) return;
    if (editable) addZone();
    else if (isInteractive && readOnly) onAddZoneWithoutSettings?.();
  }
  function removeZone() {
    if (!selectedZone || !editable) return;
    updateZones((zones) => zones.filter((zone) => zone.id !== selectedZone.id));
    selectZone(null);
    setFeedback(`${selectedZone.name} removed.`);
  }
  function changeReference(id, isChecked) {
    if (!isInteractive || !referenceOptions.some((group) => group.id === id && group.zoneCount > 0)) return;
    setReferences((previous) => ({ ...previous, [id]: isChecked }));
  }
  function svgPoint(event, inverseMatrix) {
    if (!mapInteractive) return null;
    const svg = svgRef.current;
    const matrix = inverseMatrix || svg?.getScreenCTM()?.inverse();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(matrix);
  }
  function beginDrag(event, zone, action = 'move', corner = 'se') {
    if (!editable || event.button !== 0 || dragRef.current) return;
    const point = svgPoint(event);
    if (!point) return;
    event.preventDefault(); event.stopPropagation();
    suppressCanvasClick.current = false;
    selectZone(zone.id);
    const candidate = { ...zone };
    dragRef.current = { pointerId: event.pointerId, action, corner, point, zone: candidate, candidate, conflicting: false, context: mapContext };
    setDragPreview({ zone: candidate, conflicting: false, context: mapContext });
    svgRef.current.setPointerCapture(event.pointerId);
  }
  function beginPan(event) {
    if (!mapInteractive || event.button !== 0 || dragRef.current || event.target.closest?.('.zone-map__zone')) return;
    const inverseMatrix = svgRef.current?.getScreenCTM()?.inverse();
    const point = svgPoint(event, inverseMatrix);
    if (!point || !inverseMatrix) return;
    event.preventDefault();
    suppressCanvasClick.current = false;
    dragRef.current = {
      pointerId: event.pointerId, action: 'pan', inverseMatrix, point,
      clientX: event.clientX, clientY: event.clientY,
      pan: { x: panX, y: panY }, moved: false, context: mapContext,
    };
    svgRef.current.setPointerCapture(event.pointerId);
  }
  function movePointer(event) {
    if (!mapInteractive) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || drag.context !== mapContext) return;
    if (drag.action === 'pan') {
      if (!drag.moved && Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) < 3) return;
      drag.moved = true;
      setPanning(true);
      // Use the drag's initial transform. Reading the updated viewBox's CTM
      // here would feed the pan back into its own movement delta.
      const point = svgPoint(event, drag.inverseMatrix);
      if (!point) return;
      setPan({
        x: clamp(drag.pan.x - (point.x - drag.point.x), -panLimitX, panLimitX),
        y: clamp(drag.pan.y - (point.y - drag.point.y), -panLimitY, panLimitY),
      });
      return;
    }
    if (!editable) return;
    const point = svgPoint(event);
    if (!point) return;
    const dx = (point.x - drag.point.x) / UNITS_PER_METER;
    const dy = (point.y - drag.point.y) / UNITS_PER_METER;
    let candidate;
    if (drag.action === 'move') candidate = moveZone(drag.zone, dx, -dy, visibleBounds);
    else candidate = resizeZone(drag.zone, drag.corner, dx, dy, visibleBounds);
    drag.candidate = candidate;
    drag.conflicting = conflictsWithMap(candidate, currentZones);
    setDragPreview({ zone: candidate, conflicting: drag.conflicting, context: mapContext });
  }
  function cancelGesture() {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    suppressCanvasClick.current = false;
    if (drag.action === 'pan') setPan(drag.pan);
    setDragPreview(null);
    setPanning(false);
    if (svgRef.current?.hasPointerCapture(drag.pointerId)) svgRef.current.releasePointerCapture(drag.pointerId);
  }
  function endDrag(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!mapInteractive || drag.context !== mapContext || event.type === 'pointercancel') {
      cancelGesture();
      return;
    }
    if (drag.action !== 'pan') {
      if (editable && !drag.conflicting) updateZone(drag.zone.id, drag.candidate);
      else if (editable) setFeedback('The zone overlaps another zone. Its previous position and size were retained.');
    }
    // A new pointerdown clears this flag, so a drag that emits no click cannot
    // suppress a user's later deliberate blank-map click.
    suppressCanvasClick.current = drag.action !== 'pan' || drag.moved;
    dragRef.current = null;
    setDragPreview(null);
    setPanning(false);
    if (svgRef.current?.hasPointerCapture(event.pointerId)) svgRef.current.releasePointerCapture(event.pointerId);
  }
  function canvasClick(event) {
    if (!mapInteractive) return;
    if (suppressCanvasClick.current) {
      suppressCanvasClick.current = false;
      return;
    }
    if (!event.target.closest?.('.zone-map__zone')) selectZone(null);
  }
  function zoneKeyDown(event, zone, ownerId = groupId) {
    if (!mapInteractive) return;
    const shifts = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] };
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectZone(zone.id, ownerId); }
    else if (editable && ownerId === groupId && shifts[event.key]) {
      event.preventDefault(); selectZone(zone.id);
      const [dx, dy] = shifts[event.key];
      updateZone(zone.id, moveZone(zone, dx, dy, visibleBounds));
    }
  }
  function resizeKeyDown(event, zone, corner) {
    event.stopPropagation();
    if (!editable || dragRef.current) return;
    const shifts = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] };
    if (shifts[event.key]) {
      event.preventDefault();
      const [dx, dy] = shifts[event.key];
      updateZone(zone.id, resizeZone(zone, corner, dx, dy, visibleBounds));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectZone(zone.id);
    }
  }
  function renderZone(zone, owner = currentGroup) {
    const rect = mapRect(zone);
    const isOwn = owner.id === groupId;
    const selected = isOwn && selectedZone?.id === zone.id;
    const zoneEditable = isOwn && editable;
    const conflicting = isOwn && activePreview?.zone.id === zone.id && activePreview.conflicting;
    const muted = isOverview && owner.enabled === false;
    const label = isWorkspace ? `${owner.name || owner.id} · ${zone.name}` : zone.name;
    return <g key={`${owner.id}-${zone.id}`} className={`zone-map__zone ${selected ? 'is-selected' : ''} ${zoneEditable ? 'is-editable' : ''}${conflicting ? ' is-conflicting' : ''}${isOverview ? ' zone-map__overview-zone' : ''}${muted ? ' is-group-disabled' : ''}`} style={isOverview ? { '--group-zone-color': muted ? '#77828f' : getGroupReferenceColor(owner.id) } : undefined} data-zone-group={owner.id} data-zone-id={zone.id} role="button" tabIndex={enabled ? 0 : -1} aria-disabled={!enabled} aria-invalid={conflicting || undefined} aria-label={`${label}, X ${zone.x}, Y ${zone.y}, width ${zone.width}, height ${zone.height} meters`} aria-pressed={selected} onClick={() => selectZone(zone.id, owner.id)} onKeyDown={(event) => zoneKeyDown(event, zone, owner.id)} onPointerDown={(event) => { if (zoneEditable) beginDrag(event, zone); }}>
      <rect {...rect} rx="3" /><text x={rect.x + rect.width / 2} y={rect.y + rect.height / 2} textAnchor="middle" dominantBaseline="central">{zone.name.replace(/^Zone\s+/, '')}</text>
      {selected && zoneEditable && RESIZE_CORNERS.map((corner) => <rect key={corner.id} className={`zone-map__resize-handle zone-map__resize-handle--${corner.id}`} data-resize-corner={corner.id} x={(corner.id.includes('w') ? rect.x : rect.x + rect.width) - 8} y={(corner.id.includes('n') ? rect.y : rect.y + rect.height) - 8} width="16" height="16" rx="2" role="button" tabIndex="0" aria-label={`Resize ${zone.name} from ${corner.label} corner`} onPointerDown={(event) => beginDrag(event, zone, 'resize', corner.id)} onKeyDown={(event) => resizeKeyDown(event, zone, corner.id)}><title>Resize {zone.name} from {corner.label} corner</title></rect>)}
    </g>;
  }

  const canAddZone = !viewOnly && (editable || (isInteractive && groupSelected && readOnly && Boolean(onAddZoneWithoutSettings)));
  const zoneActions = <div className="zone-map__zone-actions"><button type="button" className="zone-map__button" disabled={!canAddZone} onClick={requestAddZone}><Icon name="plus" size={15} />Add Zone</button><button type="button" className="zone-map__button" disabled={!editable || !selectedZone} onClick={removeZone}>Remove Zone</button></div>;
  const zoneSelector = <select aria-label="Selected zone" value={selectedZone?.id || ''} disabled={inspectorDisabled} onChange={(event) => selectZone(event.target.value || null)}><option value="">{compactSettings ? '請選擇區域' : 'Select a zone'}</option>{currentZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select>;
  const positionFields = selectedZone && <div className="zone-map__field-grid"><NumericField key={`${selectionKey}-${selectedZone.id}-x`} label="X" value={selectedZone.x} {...fieldLimits.x} disabled={!editable} onCommit={(value) => commitField('x', value)} /><NumericField key={`${selectionKey}-${selectedZone.id}-y`} label="Y" value={selectedZone.y} {...fieldLimits.y} disabled={!editable} onCommit={(value) => commitField('y', value)} /></div>;
  const sizeFields = selectedZone && <div className="zone-map__field-grid"><NumericField key={`${selectionKey}-${selectedZone.id}-width`} label="Width" value={selectedZone.width} {...fieldLimits.width} disabled={!editable} onCommit={(value) => commitField('width', value)} /><NumericField key={`${selectionKey}-${selectedZone.id}-height`} label="Height" value={selectedZone.height} {...fieldLimits.height} disabled={!editable} onCommit={(value) => commitField('height', value)} /></div>;
  const selectionHintText = compactSettings
    ? !groupSelected ? '請先選擇群組以查看區域。' : currentZones.length ? `請在地圖上選擇區域，以${canEdit ? '編輯' : '查看'}位置與尺寸。` : canEdit ? '請新增區域以編輯位置與尺寸。' : '目前尚未設定區域。'
    : !groupSelected ? 'Select a group to view its zones.' : currentZones.length ? `Select a zone on the map to ${canEdit ? 'edit' : 'view'} its position and size.` : canEdit ? 'Add a zone to edit its position and size.' : 'No zones in this map.';
  const selectionHint = <p className="zone-map__helper zone-map__no-selection">{selectionHintText}</p>;
  const notice = !enabled && disabledMessage ? disabledMessage : !hasVisibleZones ? emptyMessage || (compactSettings ? '尚未新增區域' : 'No zones yet') : null;

  return (
    <section className={`zone-map-panel${isWorkspace ? ' is-workspace' : ''}${isOverview ? ' is-overview' : ''}${compactSettings ? ' is-compact-settings' : ''}${enabled ? '' : ' is-disabled'}`} aria-label={isOverview ? 'Microphone group zone overview' : groupSelected ? `${currentGroupName} zone map` : 'Microphone zone map'} aria-disabled={!enabled} inert={enabled || compactSettings ? undefined : ''}>
      <div className="zone-map__layout">
        <div className="zone-map__main">
          <div className="zone-map__toolbar" inert={compactSettings && !enabled ? '' : undefined}>
            {toolbarStart || (showGroupContext ? <span className="zone-map__model zone-map__group-context"><strong title={currentGroupName}>{currentGroupName}</strong><Icon name="camera" size={16} /><span>{currentGroup.camera}</span></span>
              : <span className="zone-map__model">{microphone.model}</span>)}
            {zoneActions}
            {toolbarEnd}
            {isWorkspace ? <div className="zone-map__workspace-toolbar-slot">{toolbarSlot}</div> : showReferences && <GroupReferenceDropdown groups={referenceOptions} checked={references} disabled={!isInteractive || !hasReferenceZones} disabledReason={referenceDisabledReason} onChange={changeReference} />}
          </div>
          <div className={`zone-map__canvas-wrap${hasVisibleZones ? '' : ' is-empty'}`} ref={mapRef}>
            <svg ref={svgRef} className={`zone-map__canvas${isPanning ? ' is-panning' : ''}`} viewBox={viewBox} data-grid-cells={GRID_CELLS} data-cell-size={CELL_SIZE} data-cell-meters={MIN_ZONE_SIZE} tabIndex={mapInteractive ? undefined : -1} aria-disabled={!mapInteractive} aria-label="Coverage zone map, 51 by 51 cells, each cell 0.6 meters, microphone at origin" onClick={canvasClick} onPointerDown={beginPan} onPointerMove={movePointer} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={cancelGesture}>
              <rect x="0" y="0" width={WORLD_SIZE} height={WORLD_SIZE} fill="#252b32" />
              <g className="zone-map__grid" pointerEvents="none" aria-hidden="true">{GRID_LINES.map((position) => <path key={position} d={`M${position} 0V${WORLD_SIZE}M0 ${position}H${WORLD_SIZE}`} fill="none" stroke="#3a424c" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />)}</g>
              <rect x="0" y="0" width={WORLD_SIZE} height={WORLD_SIZE} fill="none" stroke="#626e7b" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <path d={`M${ORIGIN} 0V${WORLD_SIZE}M0 ${ORIGIN}H${WORLD_SIZE}`} stroke="#1e9bf0" strokeWidth="1.5" strokeDasharray="7 7" opacity=".65" vectorEffect="non-scaling-stroke" pointerEvents="none" />
              {!isOverview && referenceGroups.map((group) => <g key={group.id} className={`zone-map__reference-geometry${isWorkspace && group.enabled === false ? ' is-group-disabled' : ''}`} style={{ '--group-reference-color': isWorkspace && group.enabled === false ? '#77828f' : getGroupReferenceColor(group.id) }} data-reference-group={group.id} aria-label={`${group.name || group.id} reference zones, read-only`}>
                {(availableMaps[group.id] || []).map((zone) => { const rect = mapRect(zone); return <g key={`${group.id}-${zone.id}`}><rect {...rect} rx="3" /><text x={rect.x + rect.width / 2} y={rect.y + rect.height / 2} textAnchor="middle" dominantBaseline="central">{group.name || group.id} · {zone.name}</text></g>; })}
              </g>)}
              {isOverview ? visibleGroups.flatMap((group) => (availableMaps[group.id] || []).map((zone) => <line key={`connector-${group.id}-${zone.id}`} className={`zone-map__connector zone-map__overview-connector${group.id === groupId && selectedZone?.id === zone.id ? ' is-selected' : ''}`} style={{ '--group-zone-color': group.enabled === false ? '#77828f' : getGroupReferenceColor(group.id) }} x1={ORIGIN} y1={ORIGIN} x2={ORIGIN + zone.x * UNITS_PER_METER} y2={ORIGIN - zone.y * UNITS_PER_METER} pointerEvents="none" aria-hidden="true" />)) : displayZones.map((zone) => <line key={`connector-${zone.id}`} className={`zone-map__connector${selectedZone?.id === zone.id ? ' is-selected' : ''}`} x1={ORIGIN} y1={ORIGIN} x2={ORIGIN + zone.x * UNITS_PER_METER} y2={ORIGIN - zone.y * UNITS_PER_METER} pointerEvents="none" aria-hidden="true" />)}
              {isOverview ? visibleGroups.flatMap((group) => (availableMaps[group.id] || []).map((zone) => renderZone(zone, group))) : displayZones.map((zone) => renderZone(zone))}
              {!microphoneIndicator && <g className="zone-map__mic" transform={`translate(${ORIGIN} ${ORIGIN})`} pointerEvents="none"><rect x="-18" y="-18" width="36" height="36" rx="5" /><rect x="-10" y="-10" width="20" height="20" rx="2" /><path d="M-5 -5h10M-5 0h10M-5 5h10" /><text x="26" y="24">{compactSettings ? '(0, 0)' : `${microphone.id} · (0, 0)`}</text></g>}
              {microphoneIndicator && <g className="zone-map__mic-indicator"
                transform={`translate(${indicatorWorldX} ${indicatorWorldY}) scale(${1 / viewScale})`}
                data-edge={microphoneIndicator.edge} role="img" aria-label={`Microphone ${microphone.id} is outside the visible map`} pointerEvents="none">
                <path d="M9 0L-8 -6L-5 0L-8 6Z" transform={`rotate(${microphoneIndicator.angle})`} />
                <text x={microphoneIndicator.label.x} y={microphoneIndicator.label.y} textAnchor={microphoneIndicator.label.anchor} dominantBaseline="central">MIC</text>
              </g>}
            </svg>
            {notice && <div className={`zone-map__empty${!enabled && disabledMessage ? ' is-warning' : ''}`} role={compactSettings ? 'status' : undefined}>{notice}{canEdit && (enabled || !compactSettings) && <span>{compactSettings ? '按 Add Zone 新增區域，設定收音範圍。' : 'Add a zone to define the coverage area.'}</span>}</div>}
            <MapViewControls zoom={zoom} onReset={resetView} onZoomIn={zoomIn} onZoomOut={zoomOut} disabled={!mapInteractive} label="Zone map" maxZoom={150} />
          </div>
        </div>

        <aside className={`zone-map__inspector${compactSettings ? ' zone-map__zone-card' : ''}${hasOwnZones ? '' : ' is-empty'}`} aria-label="Zone settings" aria-disabled={inspectorDisabled} inert={compactSettings && !enabled ? '' : undefined}>
          {compactSettings ? <>
            <header className="zone-map__zone-card-header">{zoneSelector}</header>
            <div className="zone-map__zone-card-body">
              {selectedZone ? <div className="zone-map__zone-card-columns">
                <section aria-label="Position of zone center"><h4>Position</h4>{positionFields}</section>
                <section aria-label="Zone size"><h4>Size</h4>{sizeFields}</section>
              </div> : selectionHint}
            </div>
          </> : <div className="zone-map__inspector-section">
            <h4>Zone settings{!canEdit && <span>Read-only</span>}</h4>
            {isWorkspace && <p className="zone-map__owner"><span className="zone-map__owner-color" style={{ backgroundColor: currentGroup.enabled === false ? '#77828f' : getGroupReferenceColor(groupId) }} /><strong title={currentGroupName}>{currentGroupName}</strong><span>{currentGroup.camera || '—'}</span></p>}
            <label className="zone-map__zone-select">Selected zone{zoneSelector}</label>
            {selectedZone ? <>
              <p className="zone-map__field-caption">Position</p>
              {positionFields}
              <p className="zone-map__field-caption">Size</p>
              {sizeFields}
            </> : selectionHint}
          </div>}
        </aside>
      </div>
      <div className="zone-map__status zone-map__status--hidden" role="status" aria-live="polite">{feedback}</div>
    </section>
  );
}
