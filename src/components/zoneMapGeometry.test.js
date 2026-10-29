import test from 'node:test';
import assert from 'node:assert/strict';
import { GRID_CELLS, CELL_SIZE, UNITS_PER_METER, MIN_ZONE_SIZE, WORLD_METERS, MAP_EXTENT,
  constrainZone, mapRect, resizeZone, visibleMapBounds, zoneFieldLimits } from './zoneMapGeometry.js';

const zone = { id: 'zone-1', name: 'Zone 1', x: 0, y: 0, width: 2, height: 1.6 };
const view = { left: -6, right: 6, bottom: -4, top: 4 };
const edges = (value) => ({ left: value.x - value.width / 2, right: value.x + value.width / 2,
  bottom: value.y - value.height / 2, top: value.y + value.height / 2 });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.000001, `${actual} != ${expected}`);

test('one 60 cm cell is the minimum zone size, with coordinates still in meters', () => {
  assert.equal(MIN_ZONE_SIZE, 0.6);
  near(WORLD_METERS, GRID_CELLS * 0.6);
  const minimum = constrainZone({ ...zone, width: 0.5, height: 0.1 });
  assert.equal(mapRect(minimum).width, CELL_SIZE);
  assert.equal(mapRect(minimum).height, CELL_SIZE);
  near(mapRect({ ...zone, x: 1 }).x - mapRect(zone).x, UNITS_PER_METER);
});

for (const corner of ['nw', 'ne', 'sw', 'se']) {
  test(`${corner} resize stops at one cell and keeps its opposite corner fixed`, () => {
    const result = resizeZone(zone, corner, corner.includes('w') ? 100 : -100, corner.includes('n') ? 100 : -100, view);
    near(result.width, 0.6);
    near(result.height, 0.6);
    const before = edges(zone);
    const after = edges(result);
    near(after[corner.includes('w') ? 'right' : 'left'], before[corner.includes('w') ? 'right' : 'left']);
    near(after[corner.includes('n') ? 'bottom' : 'top'], before[corner.includes('n') ? 'bottom' : 'top']);
  });
  test(`${corner} resize cannot extend outside the visible canvas`, () => {
    const result = resizeZone(zone, corner, corner.includes('w') ? -100 : 100, corner.includes('n') ? -100 : 100, view);
    const after = edges(result);
    assert.ok(after.left >= view.left && after.right <= view.right);
    assert.ok(after.bottom >= view.bottom && after.top <= view.top);
    near(after[corner.includes('w') ? 'right' : 'left'], edges(zone)[corner.includes('w') ? 'right' : 'left']);
    near(after[corner.includes('n') ? 'bottom' : 'top'], edges(zone)[corner.includes('n') ? 'bottom' : 'top']);
  });
}

test('zooming out permits further growth without changing existing geometry', () => {
  const normal = visibleMapBounds({ panX: 0, panY: 0, visibleWidth: 1200, visibleHeight: 800 });
  const wider = visibleMapBounds({ panX: 0, panY: 0, visibleWidth: 2400, visibleHeight: 1600 });
  const limited = resizeZone(zone, 'se', 9999, 9999, normal);
  const enlarged = resizeZone(limited, 'se', 9999, 9999, wider);
  assert.ok(enlarged.width > limited.width && enlarged.height > limited.height);
  near(edges(enlarged).left, edges(limited).left);
  near(edges(enlarged).top, edges(limited).top);
});

test('visible bounds follow pan, include the SVG viewport, and stop at the world boundary', () => {
  const moved = visibleMapBounds({ panX: 200, panY: -100, visibleWidth: 1200, visibleHeight: 800 });
  assert.deepEqual(moved, { left: -3.92, right: 7.92, bottom: -2.92, top: 4.92 });
  const all = visibleMapBounds({ panX: 0, panY: 0, visibleWidth: 100000, visibleHeight: 100000 });
  assert.deepEqual(all, { left: -MAP_EXTENT, right: MAP_EXTENT, bottom: -MAP_EXTENT, top: MAP_EXTENT });
});

test('field maxima keep the center fixed and round inward to one decimal', () => {
  const limits = zoneFieldLimits({ ...zone, x: 2, y: 1, height: 1.5 }, view);
  assert.deepEqual(limits, {
    x: { min: -5, max: 5 }, y: { min: -3.2, max: 3.2 },
    width: { min: 0.6, max: 8 }, height: { min: 0.6, max: 6 },
  });
  assert.ok(9999 > limits.width.max && 9999 > limits.x.max);
  const narrow = zoneFieldLimits(zone, { ...view, right: 1.234 });
  assert.equal(narrow.width.max, 2.4);
});

test('numeric entries may leave the viewport but must keep the zone inside the full map', () => {
  const limits = zoneFieldLimits(zone);
  assert.ok(10 <= limits.x.max);
  assert.ok(10 > zoneFieldLimits(zone, view).x.max);
  assert.equal(limits.x.max, 14.3);
  assert.equal(limits.x.min, -14.3);
  assert.equal(limits.width.max, 30.6);
  assert.ok(9999 > limits.width.max);
  assert.ok(15 > limits.x.max);
});
