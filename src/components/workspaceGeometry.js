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
