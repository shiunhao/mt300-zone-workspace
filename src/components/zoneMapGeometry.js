// One ceiling grid cell measures 60 × 60 cm. Coordinates remain in meters.
export const GRID_CELLS = 51;
export const CELL_SIZE = 60;
export const UNITS_PER_METER = 100;
export const MIN_ZONE_SIZE = CELL_SIZE / UNITS_PER_METER;
export const WORLD_SIZE = GRID_CELLS * CELL_SIZE;
export const ORIGIN = WORLD_SIZE / 2;
export const WORLD_METERS = WORLD_SIZE / UNITS_PER_METER;
export const MAP_EXTENT = WORLD_METERS / 2;
export const MAP_BOUNDS = { left: -MAP_EXTENT, right: MAP_EXTENT, bottom: -MAP_EXTENT, top: MAP_EXTENT };

const round = (value) => Math.round(value * 100) / 100;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const constrainCenter = (value, size) => clamp(round(value),
  Math.ceil((-MAP_EXTENT + size / 2) * 100 - 0.000001) / 100,
  Math.floor((MAP_EXTENT - size / 2) * 100 + 0.000001) / 100);

export function constrainZone(zone) {
  const width = round(clamp(zone.width, MIN_ZONE_SIZE, WORLD_METERS));
  const height = round(clamp(zone.height, MIN_ZONE_SIZE, WORLD_METERS));
  return {
    ...zone, width, height,
    x: constrainCenter(zone.x, width),
    y: constrainCenter(zone.y, height),
  };
}

export const mapRect = (zone) => ({
  x: ORIGIN + (zone.x - zone.width / 2) * UNITS_PER_METER,
  y: ORIGIN - (zone.y + zone.height / 2) * UNITS_PER_METER,
  width: zone.width * UNITS_PER_METER,
  height: zone.height * UNITS_PER_METER,
});

// Half-centimeter integer bounds keep touching edges exact.
const zoneBounds = (zone) => ({
  left: Math.round(zone.x * 200) - Math.round(zone.width * 100),
  right: Math.round(zone.x * 200) + Math.round(zone.width * 100),
  bottom: Math.round(zone.y * 200) - Math.round(zone.height * 100),
  top: Math.round(zone.y * 200) + Math.round(zone.height * 100),
});
export function zonesOverlap(first, second) {
  const a = zoneBounds(first);
  const b = zoneBounds(second);
  return a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom;
}
export const conflictsWithMap = (candidate, zones) => zones.some((zone) => zone.id !== candidate.id && zonesOverlap(candidate, zone));

export function visibleMapBounds({ panX, panY, visibleWidth, visibleHeight, inset = 8 }) {
  return {
    left: Math.max(-MAP_EXTENT, (panX - visibleWidth / 2 + inset) / UNITS_PER_METER),
    right: Math.min(MAP_EXTENT, (panX + visibleWidth / 2 - inset) / UNITS_PER_METER),
    bottom: Math.max(-MAP_EXTENT, -(panY + visibleHeight / 2 - inset) / UNITS_PER_METER),
    top: Math.min(MAP_EXTENT, -(panY - visibleHeight / 2 + inset) / UNITS_PER_METER),
  };
}

export function zoneFieldLimits(zone, bounds = MAP_BOUNDS) {
  const ceilTenth = (value) => Math.ceil(value * 10 - 0.000001) / 10;
  const floorTenth = (value) => Math.floor(value * 10 + 0.000001) / 10;
  return {
    x: { min: ceilTenth(bounds.left + zone.width / 2), max: floorTenth(bounds.right - zone.width / 2) },
    y: { min: ceilTenth(bounds.bottom + zone.height / 2), max: floorTenth(bounds.top - zone.height / 2) },
    width: { min: MIN_ZONE_SIZE, max: floorTenth(2 * Math.min(zone.x - bounds.left, bounds.right - zone.x)) },
    height: { min: MIN_ZONE_SIZE, max: floorTenth(2 * Math.min(zone.y - bounds.bottom, bounds.top - zone.y)) },
  };
}

export function moveZone(zone, dx, dy, visible = MAP_BOUNDS) {
  if (dx === 0 && dy === 0) return zone;
  const minX = Math.ceil((visible.left + zone.width / 2) * 100 - 0.000001) / 100;
  const maxX = Math.floor((visible.right - zone.width / 2) * 100 + 0.000001) / 100;
  const minY = Math.ceil((visible.bottom + zone.height / 2) * 100 - 0.000001) / 100;
  const maxY = Math.floor((visible.top - zone.height / 2) * 100 + 0.000001) / 100;
  // Numeric input can create a zone larger than the viewport. Preserve that
  // geometry until zooming out makes it possible to drag the whole zone inside.
  if (minX > maxX || minY > maxY) return zone;
  return {
    ...zone,
    x: clamp(round(zone.x + dx), minX, maxX),
    y: clamp(round(zone.y + dy), minY, maxY),
  };
}

export function resizeZone(zone, corner, dx, dy, visible = MAP_BOUNDS) {
  const bounds = zoneBounds(zone);
  const minimumSize = Math.round(MIN_ZONE_SIZE * 200);
  const limits = {
    left: Math.ceil(visible.left * 200 - 0.000001),
    right: Math.floor(visible.right * 200 + 0.000001),
    bottom: Math.ceil(visible.bottom * 200 - 0.000001),
    top: Math.floor(visible.top * 200 + 0.000001),
  };
  function movingEdge(start, requested, minimum, maximum) {
    // A 0.02 m edge step keeps the opposite corner fixed after rounding.
    const step = 4;
    const low = start + Math.ceil((minimum - start) / step) * step;
    const high = start + Math.floor((maximum - start) / step) * step;
    return low > high ? start : clamp(start + Math.round((requested - start) / step) * step, low, high);
  }
  if (corner.includes('w')) bounds.left = movingEdge(bounds.left, bounds.left + dx * 200, limits.left, Math.min(limits.right, bounds.right - minimumSize));
  else bounds.right = movingEdge(bounds.right, bounds.right + dx * 200, Math.max(limits.left, bounds.left + minimumSize), limits.right);
  if (corner.includes('n')) bounds.top = movingEdge(bounds.top, bounds.top - dy * 200, Math.max(limits.bottom, bounds.bottom + minimumSize), limits.top);
  else bounds.bottom = movingEdge(bounds.bottom, bounds.bottom - dy * 200, limits.bottom, Math.min(limits.top, bounds.top - minimumSize));
  return {
    ...zone,
    x: (bounds.left + bounds.right) / 400,
    y: (bounds.bottom + bounds.top) / 400,
    width: (bounds.right - bounds.left) / 200,
    height: (bounds.top - bounds.bottom) / 200,
  };
}
