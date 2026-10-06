import { WORKSPACE_MICROPHONE, createWorkspaceMaps } from './workspaceGeometry';

// V5-only sample devices keep the earlier design comparisons unchanged.
export const SETUP_MICROPHONES = [
  WORKSPACE_MICROPHONE,
  { id: 'MIC-02', model: 'Shure MXA925-S' },
];

export const SETUP_GROUPS = [
  { id: 'G1', microphoneId: 'MIC-01', camera: 'TR535N', enabled: false, pickupMode: 'Talker Position' },
  { id: 'G2', microphoneId: 'MIC-01', camera: 'TR211', enabled: true, pickupMode: 'Talker Position' },
  { id: 'G3', microphoneId: 'MIC-01', camera: 'TR313', enabled: true, pickupMode: 'Talker Position' },
  { id: 'G4', microphoneId: 'MIC-02', camera: 'TR535N', enabled: true, pickupMode: 'Talker Position' },
  { id: 'G5', microphoneId: 'MIC-02', camera: 'TR313', enabled: true, pickupMode: 'Talker Position' },
];

export const SETUP_MAPS = {
  ...createWorkspaceMaps(SETUP_GROUPS),
  G4: [
    { id: 'zone-1', name: 'Zone 1', x: -2.75, y: 1.5, width: 3, height: 2.5 },
    { id: 'zone-2', name: 'Zone 2', x: 2.5, y: -1.25, width: 2.5, height: 2 },
  ],
  G5: [
    { id: 'zone-1', name: 'Zone 1', x: -3, y: -1.5, width: 2.5, height: 2 },
    { id: 'zone-2', name: 'Zone 2', x: 2.5, y: 1.75, width: 3, height: 2.5 },
  ],
};
