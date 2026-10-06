export const WORKSPACE_MICROPHONE = { id: 'MIC-01', model: 'Shure MXA925-S' };

export function getMicrophoneGroups(groups, microphoneId) {
  return microphoneId ? groups.filter((group) => group.microphoneId === microphoneId) : [];
}

const INITIAL_MAPS = {
  G1: [
    { id: 'zone-1', name: 'Zone 1', x: -2.5, y: 1.25, width: 3, height: 2 },
    { id: 'zone-2', name: 'Zone 2', x: 2.25, y: -1.25, width: 3.5, height: 2 },
  ],
  G2: [
    { id: 'zone-1', name: 'Zone 1', x: -2.25, y: 1, width: 3.5, height: 2.5 },
    { id: 'zone-2', name: 'Zone 2', x: 2.5, y: -1.5, width: 3, height: 2 },
  ],
  G3: [
    { id: 'zone-1', name: 'Zone 1', x: -3.25, y: -1.5, width: 2.5, height: 2 },
    { id: 'zone-2', name: 'Zone 2', x: 2.75, y: 1.75, width: 2, height: 2.5 },
  ],
};

export const cloneZones = (zones = []) => zones.map((zone) => ({ ...zone }));

export function createWorkspaceMaps(groups = []) {
  return Object.fromEntries((groups.length ? groups : Object.keys(INITIAL_MAPS).map((id) => ({ id })))
    .map((group) => [group.id, cloneZones(INITIAL_MAPS[group.id] || [])]));
}

const bounds = (zone) => ({
  left: Math.round(zone.x * 200) - Math.round(zone.width * 100),
  right: Math.round(zone.x * 200) + Math.round(zone.width * 100),
  bottom: Math.round(zone.y * 200) - Math.round(zone.height * 100),
  top: Math.round(zone.y * 200) + Math.round(zone.height * 100),
});

export function validateWorkspaceZones(zones) {
  for (const zone of zones) {
    if (![zone.x, zone.y, zone.width, zone.height].every(Number.isFinite)
      || zone.width < 0.3 || zone.height < 0.3) return 'A zone has an invalid size or position.';
    const box = bounds(zone);
    if (box.left < -2550 || box.right > 2550 || box.bottom < -2550 || box.top > 2550)
      return 'A zone extends beyond the map.';
  }
  for (let first = 0; first < zones.length; first += 1) {
    for (let second = first + 1; second < zones.length; second += 1) {
      const a = bounds(zones[first]);
      const b = bounds(zones[second]);
      if (a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom)
        return 'Source zones overlap. Adjust them before copying.';
    }
  }
  return '';
}

export function copyWorkspaceZones(zones, targetId, copyId) {
  return zones.map((zone, index) => ({
    ...zone,
    id: `${targetId.toLowerCase()}-copy-${copyId}-${index + 1}`,
  }));
}
