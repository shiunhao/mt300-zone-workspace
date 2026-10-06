import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import MapViewControls from './MapViewControls';
import useMapZoom from './useMapZoom';
import GroupReferenceDropdown from './GroupReferenceDropdown';
import { getGroupReferenceColor } from './groupReferenceColors';
import { WORKSPACE_MICROPHONE } from './workspaceGeometry';
import './ZoneMapPanel.css';

// Prototype geometry: 51 square cells, each 0.5 m at the existing display scale.
const GRID_CELLS = 51;
const CELL_SIZE = 50;
const UNITS_PER_METER = 100;
const WORLD_SIZE = GRID_CELLS * CELL_SIZE;
const ORIGIN = WORLD_SIZE / 2;
const WORLD_METERS = WORLD_SIZE / UNITS_PER_METER;
const MAP_EXTENT = WORLD_METERS / 2;
const BASE_VIEW_WIDTH = 1200;
const BASE_VIEW_HEIGHT = 800;
const GRID_LINES = Array.from({ length: GRID_CELLS + 1 }, (_, index) => index * CELL_SIZE);
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
const round = (value) => Math.round(value * 100) / 100;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const constrainCenter = (value, size) => clamp(round(value),
  Math.ceil((-MAP_EXTENT + size / 2) * 100 - 0.000001) / 100,
  Math.floor((MAP_EXTENT - size / 2) * 100 + 0.000001) / 100);
function constrainZone(zone) {
  const width = round(clamp(zone.width, 0.3, WORLD_METERS));
  const height = round(clamp(zone.height, 0.3, WORLD_METERS));
  return {
    ...zone, width, height,
    x: constrainCenter(zone.x, width),
    y: constrainCenter(zone.y, height),
  };
}
const mapRect = (zone) => ({
  x: ORIGIN + (zone.x - zone.width / 2) * UNITS_PER_METER,
  y: ORIGIN - (zone.y + zone.height / 2) * UNITS_PER_METER,
  width: zone.width * UNITS_PER_METER,
  height: zone.height * UNITS_PER_METER,
});
// Geometry is stored to 0.01 m. Half-centimeter integer bounds keep touching
// edges exact instead of treating floating-point noise as an intersection.
const zoneBounds = (zone) => ({
  left: Math.round(zone.x * 200) - Math.round(zone.width * 100),
  right: Math.round(zone.x * 200) + Math.round(zone.width * 100),
  bottom: Math.round(zone.y * 200) - Math.round(zone.height * 100),
  top: Math.round(zone.y * 200) + Math.round(zone.height * 100),
});
function zonesOverlap(first, second) {
  const a = zoneBounds(first);
  const b = zoneBounds(second);
  return a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom;
}
const conflictsWithMap = (candidate, zones) => zones.some((zone) => zone.id !== candidate.id && zonesOverlap(candidate, zone));
function resizeZone(zone, corner, dx, dy) {
  const bounds = zoneBounds(zone);
  const limit = Math.round(MAP_EXTENT * 200);
  const minimumSize = 60; // 0.3 m in half-centimeter units.
  function movingEdge(start, requested, minimum, maximum) {
    // A 0.02 m edge step preserves both size and center at two decimals, so
    // storing the result cannot move the opposite corner through rounding.
    const step = 4;
    const low = start + Math.ceil((minimum - start) / step) * step;
    const high = start + Math.floor((maximum - start) / step) * step;
    return clamp(start + Math.round((requested - start) / step) * step, low, high);
  }
  if (corner.includes('w')) bounds.left = movingEdge(bounds.left, bounds.left + dx * 200, -limit, bounds.right - minimumSize);
  else bounds.right = movingEdge(bounds.right, bounds.right + dx * 200, bounds.left + minimumSize, limit);
  if (corner.includes('n')) bounds.top = movingEdge(bounds.top, bounds.top - dy * 200, bounds.bottom + minimumSize, limit);
  else bounds.bottom = movingEdge(bounds.bottom, bounds.bottom - dy * 200, -limit, bounds.top - minimumSize);
  return {
    ...zone,
    x: (bounds.left + bounds.right) / 400,
    y: (bounds.bottom + bounds.top) / 400,
    width: (bounds.right - bounds.left) / 200,
    height: (bounds.top - bounds.bottom) / 200,
  };
}

function NumericField({ label, value, disabled, onCommit }) {
  const [input, setInput] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setInput(String(value));
  }
  useEffect(() => {
    if (disabled) setInput(String(value));
  }, [disabled, value]);
  function commit() {
    if (disabled) {
      setInput(String(value));
      return;
    }
    const next = input.trim() === '' ? NaN : Number(input);
    if (!Number.isFinite(next)) {
      setInput(String(value));
      return;
    }
    onCommit(next);
    // Also reset a rejected or clamped value when the stored value did not change.
    setInput(String(value));
  }
  return (
    <label className="zone-map__number-field">
      <span>{label}</span>
      <div><input type="number" step="0.1" value={input} aria-label={`${label} in meters`} disabled={disabled}
        onChange={(event) => { if (!disabled) setInput(event.target.value); }} onBlur={commit}
        onKeyDown={(event) => { if (!disabled && event.key === 'Enter') event.currentTarget.blur(); }} /><span>m</span></div>
    </label>
  );
}

export default function ZoneMapPanel({
  variant = 'reference', groupId = 'G2', groups = [], enabled = true, active = true,
  maps, onMapsChange, visibleGroupIds, overview = false, onSelectGroup, toolbarSlot,
  selectedZoneId = null, onSelectedZoneChange, showReferences = true,
  microphone = WORKSPACE_MICROPHONE, showGroupContext = false,
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
  const { mapRef, zoom, reset, zoomIn, zoomOut } = useMapZoom({ enabled: isInteractive, maxZoom: 150 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setPanning] = useState(false);
  const [dragPreview, setDragPreview] = useState(null);
  const [viewport, setViewport] = useState({ width: BASE_VIEW_WIDTH, height: BASE_VIEW_HEIGHT });
  const [feedback, setFeedback] = useState('');
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const suppressCanvasClick = useRef(false);
  const nextId = useRef(3);
  const allGroups = groups.length ? groups : [{ id: 'G1', camera: 'TR535N' }, { id: 'G2', camera: 'TR211' }, { id: 'G3', camera: 'TR313' }];
  const otherGroups = allGroups.filter((group) => group.id !== groupId);
  const currentGroup = allGroups.find((group) => group.id === groupId) || { id: groupId, enabled, camera: '—' };
  const availableMaps = maps ?? (isWorkspace ? {} : groupMaps);
  const visibleIds = new Set(visibleGroupIds || allGroups.map((group) => group.id));
  const visibleGroups = allGroups.filter((group) => visibleIds.has(group.id));
  const referenceGroups = isWorkspace ? visibleGroups.filter((group) => group.id !== groupId) : showReferences ? otherGroups.filter((group) => references[group.id]) : [];
  const selectionKey = groupId;
  const mapContext = `${variant}/${groupId}/${isOverview ? 'overview' : 'edit'}`;
  const currentZones = availableMaps[groupId] || [];
  const canEdit = !isOverview && (!isWorkspace || currentGroup.enabled !== false);
  const editable = isInteractive && canEdit;
  const activePreview = dragPreview?.context === mapContext ? dragPreview : null;
  const displayZones = activePreview ? currentZones.map((zone) => zone.id === activePreview.zone.id ? activePreview.zone : zone) : currentZones;
  const currentSelectionId = Object.prototype.hasOwnProperty.call(selection, selectionKey)
    ? selection[selectionKey] : currentZones[0]?.id;
  const selectedZone = displayZones.find((zone) => zone.id === (isWorkspace ? selectedZoneId : currentSelectionId)) || null;
  const hasVisibleZones = isOverview ? visibleGroups.some((group) => availableMaps[group.id]?.length) : currentZones.length > 0;
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
  const viewBox = `${ORIGIN + panX - viewWidth / 2} ${ORIGIN + panY - viewHeight / 2} ${viewWidth} ${viewHeight}`;

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
      if (!isInteractive || !dragRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    canvas.addEventListener('wheel', blockWheelDuringDrag, { capture: true, passive: false });
    return () => {
      observer.disconnect();
      canvas.removeEventListener('wheel', blockWheelDuringDrag, { capture: true });
    };
  }, [mapRef, isInteractive]);

  useEffect(() => {
    if (!isInteractive) return;
    // Keep the next zoom centered on the view currently visible after clamping.
    setPan((previous) => {
      const x = clamp(previous.x, -panLimitX, panLimitX);
      const y = clamp(previous.y, -panLimitY, panLimitY);
      return x === previous.x && y === previous.y ? previous : { x, y };
    });
  }, [isInteractive, panLimitX, panLimitY]);

  useEffect(() => {
    if (!isInteractive || (dragRef.current && dragRef.current.context !== mapContext)) cancelGesture();
  }, [isInteractive, mapContext]);

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
    if (!isInteractive) return;
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
    if (!selectedZone || !editable) return;
    const requested = { ...selectedZone, [field]: value };
    const constrained = constrainZone(requested);
    setFeedback(Object.keys(constrained).some((key) => constrained[key] !== requested[key])
      ? 'Adjusted to keep the zone inside the map. Minimum size is 0.3 m.' : 'Zone updated.');
    updateZone(selectedZone.id, { [field]: value });
  }
  function addZone() {
    if (!editable) return;
    let number = nextId.current;
    while (currentZones.some((zone) => zone.id === `zone-${number}` || zone.name === `Zone ${number}`)) number += 1;
    let zone = null;
    // Start at the origin, then look outward for a free half-meter grid point.
    for (let radius = 0; radius <= Math.ceil(MAP_EXTENT * 2) && !zone; radius += 1) {
      for (let x = -radius; x <= radius && !zone; x += 1) {
        for (let y = -radius; y <= radius && !zone; y += 1) {
          if (Math.max(Math.abs(x), Math.abs(y)) !== radius) continue;
          const candidate = constrainZone({ id: `zone-${number}`, name: `Zone ${number}`, x: x / 2, y: y / 2, width: 2, height: 1.5 });
          if (!conflictsWithMap(candidate, currentZones)) zone = candidate;
        }
      }
    }
    if (!zone) {
      setFeedback('No space is available for a new zone.');
      return;
    }
    nextId.current = number + 1;
    updateZones((zones) => [...zones, zone]);
    selectZone(zone.id);
    setFeedback(`${zone.name} added.`);
  }
  function removeZone() {
    if (!selectedZone || !editable) return;
    updateZones((zones) => zones.filter((zone) => zone.id !== selectedZone.id));
    selectZone(null);
    setFeedback(`${selectedZone.name} removed.`);
  }
  function changeReference(id, isChecked) {
    if (!isInteractive) return;
    setReferences((previous) => ({ ...previous, [id]: isChecked }));
  }
  function svgPoint(event, inverseMatrix) {
    if (!isInteractive) return null;
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
    if (!isInteractive || event.button !== 0 || dragRef.current || event.target.closest?.('.zone-map__zone')) return;
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
    if (!isInteractive) return;
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
    if (drag.action === 'move') candidate = constrainZone({ ...drag.zone, x: drag.zone.x + dx, y: drag.zone.y - dy });
    else candidate = resizeZone(drag.zone, drag.corner, dx, dy);
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
    if (!isInteractive || drag.context !== mapContext || event.type === 'pointercancel') {
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
    if (!isInteractive) return;
    if (suppressCanvasClick.current) {
      suppressCanvasClick.current = false;
      return;
    }
    if (!event.target.closest?.('.zone-map__zone')) selectZone(null);
  }
  function zoneKeyDown(event, zone, ownerId = groupId) {
    if (!isInteractive) return;
    const shifts = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] };
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectZone(zone.id, ownerId); }
    else if (editable && ownerId === groupId && shifts[event.key]) {
      event.preventDefault(); selectZone(zone.id);
      const [dx, dy] = shifts[event.key];
      updateZone(zone.id, { x: zone.x + dx, y: zone.y + dy });
    }
  }
  function resizeKeyDown(event, zone, corner) {
    event.stopPropagation();
    if (!editable || dragRef.current) return;
    const shifts = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] };
    if (shifts[event.key]) {
      event.preventDefault();
      const [dx, dy] = shifts[event.key];
      updateZone(zone.id, resizeZone(zone, corner, dx, dy));
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
    const label = isWorkspace ? `${owner.id} · ${zone.name}` : zone.name;
    return <g key={`${owner.id}-${zone.id}`} className={`zone-map__zone ${selected ? 'is-selected' : ''} ${zoneEditable ? 'is-editable' : ''}${conflicting ? ' is-conflicting' : ''}${isOverview ? ' zone-map__overview-zone' : ''}${muted ? ' is-group-disabled' : ''}`} style={isOverview ? { '--group-zone-color': muted ? '#77828f' : getGroupReferenceColor(owner.id) } : undefined} data-zone-group={owner.id} data-zone-id={zone.id} role="button" tabIndex={enabled ? 0 : -1} aria-disabled={!enabled} aria-invalid={conflicting || undefined} aria-label={`${label}, X ${zone.x}, Y ${zone.y}, width ${zone.width}, height ${zone.height} meters`} aria-pressed={selected} onClick={() => selectZone(zone.id, owner.id)} onKeyDown={(event) => zoneKeyDown(event, zone, owner.id)} onPointerDown={(event) => { if (zoneEditable) beginDrag(event, zone); }}>
      <rect {...rect} rx="3" /><text x={rect.x + 12} y={rect.y + 25}>{label}</text>
      {selected && zoneEditable && RESIZE_CORNERS.map((corner) => <rect key={corner.id} className={`zone-map__resize-handle zone-map__resize-handle--${corner.id}`} data-resize-corner={corner.id} x={(corner.id.includes('w') ? rect.x : rect.x + rect.width) - 8} y={(corner.id.includes('n') ? rect.y : rect.y + rect.height) - 8} width="16" height="16" rx="2" role="button" tabIndex="0" aria-label={`Resize ${zone.name} from ${corner.label} corner`} onPointerDown={(event) => beginDrag(event, zone, 'resize', corner.id)} onKeyDown={(event) => resizeKeyDown(event, zone, corner.id)}><title>Resize {zone.name} from {corner.label} corner</title></rect>)}
    </g>;
  }

  return (
    <section className={`zone-map-panel${isWorkspace ? ' is-workspace' : ''}${isOverview ? ' is-overview' : ''}${enabled ? '' : ' is-disabled'}`} aria-label={isOverview ? 'Microphone group zone overview' : `${groupId} zone map`} aria-disabled={!enabled} inert={enabled ? undefined : ''}>
      <div className="zone-map__layout">
        <div className="zone-map__main">
          <div className="zone-map__toolbar">
            {showGroupContext ? <span className="zone-map__model zone-map__group-context"><strong>{groupId}</strong><Icon name="camera" size={16} /><span>{currentGroup.camera}</span></span>
              : <span className="zone-map__model">{microphone.model}</span>}
            <div><button type="button" className="zone-map__button" disabled={!editable} onClick={addZone}><Icon name="plus" size={15} />Add Zone</button><button type="button" className="zone-map__button" disabled={!editable || !selectedZone} onClick={removeZone}>Remove Zone</button></div>
            {isWorkspace ? <div className="zone-map__workspace-toolbar-slot">{toolbarSlot}</div> : showReferences && <GroupReferenceDropdown groups={otherGroups} checked={references} disabled={!isInteractive} onChange={changeReference} />}
          </div>
          <div className="zone-map__canvas-wrap" ref={mapRef}>
            <svg ref={svgRef} className={`zone-map__canvas${isPanning ? ' is-panning' : ''}`} viewBox={viewBox} data-grid-cells={GRID_CELLS} data-cell-size={CELL_SIZE} tabIndex={enabled ? undefined : -1} aria-disabled={!enabled} aria-label="Coverage zone map, 51 by 51 cells, microphone at origin" onClick={canvasClick} onPointerDown={beginPan} onPointerMove={movePointer} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={cancelGesture}>
              <rect x="0" y="0" width={WORLD_SIZE} height={WORLD_SIZE} fill="#252b32" />
              <g className="zone-map__grid" pointerEvents="none" aria-hidden="true">{GRID_LINES.map((position) => <path key={position} d={`M${position} 0V${WORLD_SIZE}M0 ${position}H${WORLD_SIZE}`} fill="none" stroke="#3a424c" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />)}</g>
              <rect x="0" y="0" width={WORLD_SIZE} height={WORLD_SIZE} fill="none" stroke="#626e7b" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <path d={`M${ORIGIN} 0V${WORLD_SIZE}M0 ${ORIGIN}H${WORLD_SIZE}`} stroke="#1e9bf0" strokeWidth="1.5" strokeDasharray="7 7" opacity=".65" vectorEffect="non-scaling-stroke" pointerEvents="none" />
              <text x={WORLD_SIZE - 35} y={ORIGIN - 10} className="zone-map__axis-label" pointerEvents="none">+X</text><text x={ORIGIN + 14} y="28" className="zone-map__axis-label" pointerEvents="none">+Y</text>
              {!isOverview && referenceGroups.map((group) => <g key={group.id} className={`zone-map__reference-geometry${isWorkspace && group.enabled === false ? ' is-group-disabled' : ''}`} style={{ '--group-reference-color': isWorkspace && group.enabled === false ? '#77828f' : getGroupReferenceColor(group.id) }} data-reference-group={group.id} aria-label={`${group.id} reference zones, read-only`}>
                {(availableMaps[group.id] || []).map((zone) => { const rect = mapRect(zone); return <g key={`${group.id}-${zone.id}`}><rect {...rect} rx="3" /><text x={rect.x + 10} y={rect.y + rect.height - 12}>{group.id} · {zone.name}</text></g>; })}
              </g>)}
              {isOverview ? visibleGroups.flatMap((group) => (availableMaps[group.id] || []).map((zone) => <line key={`connector-${group.id}-${zone.id}`} className={`zone-map__connector zone-map__overview-connector${group.id === groupId && selectedZone?.id === zone.id ? ' is-selected' : ''}`} style={{ '--group-zone-color': group.enabled === false ? '#77828f' : getGroupReferenceColor(group.id) }} x1={ORIGIN} y1={ORIGIN} x2={ORIGIN + zone.x * UNITS_PER_METER} y2={ORIGIN - zone.y * UNITS_PER_METER} pointerEvents="none" aria-hidden="true" />)) : displayZones.map((zone) => <line key={`connector-${zone.id}`} className={`zone-map__connector${selectedZone?.id === zone.id ? ' is-selected' : ''}`} x1={ORIGIN} y1={ORIGIN} x2={ORIGIN + zone.x * UNITS_PER_METER} y2={ORIGIN - zone.y * UNITS_PER_METER} pointerEvents="none" aria-hidden="true" />)}
              {isOverview ? visibleGroups.flatMap((group) => (availableMaps[group.id] || []).map((zone) => renderZone(zone, group))) : displayZones.map((zone) => renderZone(zone))}
              <g className="zone-map__mic" transform={`translate(${ORIGIN} ${ORIGIN})`} pointerEvents="none"><rect x="-18" y="-18" width="36" height="36" rx="5" /><rect x="-10" y="-10" width="20" height="20" rx="2" /><path d="M-5 -5h10M-5 0h10M-5 5h10" /><text x="26" y="24">{microphone.id} · (0, 0)</text></g>
            </svg>
            {!hasVisibleZones && <div className="zone-map__empty">No zones yet{canEdit && <span>Add a zone to define the coverage area.</span>}</div>}
            <MapViewControls zoom={zoom} onReset={resetView} onZoomIn={zoomIn} onZoomOut={zoomOut} disabled={!enabled} label="Zone map" maxZoom={150} />
          </div>
        </div>

        <aside className="zone-map__inspector" aria-label="Zone settings">
          <div className="zone-map__inspector-section">
            <h4>Zone settings{!canEdit && <span>Read-only</span>}</h4>
            {isWorkspace && <p className="zone-map__owner"><span className="zone-map__owner-color" style={{ backgroundColor: currentGroup.enabled === false ? '#77828f' : getGroupReferenceColor(groupId) }} /><strong>{groupId}</strong><span>{currentGroup.camera || '—'}</span></p>}
            <label className="zone-map__zone-select">Selected zone<select aria-label="Selected zone" value={selectedZone?.id || ''} disabled={!enabled} onChange={(event) => selectZone(event.target.value || null)}><option value="">Select a zone</option>{currentZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
            {selectedZone ? <>
              <p className="zone-map__field-caption">Position · Zone center</p>
              <div className="zone-map__field-grid"><NumericField key={`${selectionKey}-${selectedZone.id}-x`} label="X" value={selectedZone.x} disabled={!editable} onCommit={(value) => commitField('x', value)} /><NumericField key={`${selectionKey}-${selectedZone.id}-y`} label="Y" value={selectedZone.y} disabled={!editable} onCommit={(value) => commitField('y', value)} /></div>
              <p className="zone-map__field-caption">Size</p>
              <div className="zone-map__field-grid"><NumericField key={`${selectionKey}-${selectedZone.id}-width`} label="Width" value={selectedZone.width} disabled={!editable} onCommit={(value) => commitField('width', value)} /><NumericField key={`${selectionKey}-${selectedZone.id}-height`} label="Height" value={selectedZone.height} disabled={!editable} onCommit={(value) => commitField('height', value)} /></div>
            </> : <p className="zone-map__helper zone-map__no-selection">{currentZones.length ? `Select a zone on the map to ${canEdit ? 'edit' : 'view'} its position and size.` : canEdit ? 'Add a zone to edit its position and size.' : 'No zones in this map.'}</p>}
          </div>
        </aside>
      </div>
      <div className="zone-map__status zone-map__status--hidden" role="status" aria-live="polite">{feedback}</div>
    </section>
  );
}
