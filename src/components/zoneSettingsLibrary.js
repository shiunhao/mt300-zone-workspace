const cloneGeometry = (zones = []) => zones.map((zone) => ({ ...zone }));

function requireGroup(groups, groupId) {
  const group = groups.find((item) => item.id === groupId);
  if (!group) throw new Error('找不到這個 Group。');
  return group;
}

function requireSettings(state, settingsId) {
  const settings = state.settings.find((item) => item.id === settingsId);
  if (!settings) throw new Error('找不到這份區域設定檔。');
  return settings;
}

function requireSameMicrophone(group, settings) {
  if (group.microphoneId !== settings.microphoneId) {
    throw new Error('只能使用同一台麥克風的區域設定檔。');
  }
}

function validateName(state, microphoneId, name, exceptId = null) {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) throw new Error('請輸入設定檔名稱。');
  if (Array.from(trimmedName).length > 60) throw new Error('設定檔名稱最多 60 個字。');
  const duplicate = state.settings.some((item) => item.microphoneId === microphoneId
    && item.id !== exceptId && item.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase());
  if (duplicate) throw new Error('這台麥克風已有同名設定檔，請使用其他名稱。');
  return trimmedName;
}

function initialName(microphoneId, groupId, index) {
  if (microphoneId === 'MIC-01' || microphoneId === 'MIC01') {
    const names = { G1: '全會議室', G2: '訪客座位區', G3: '講台區' };
    if (names[groupId]) return names[groupId];
  }
  if (microphoneId === 'MIC-02' || microphoneId === 'MIC02') {
    const names = { G4: '討論區', G5: '簡報區' };
    if (names[groupId]) return names[groupId];
  }
  return `區域設定檔 ${index + 1}`;
}

export function initializeZoneSettings(microphones = [], groups = [], initialMaps = {}) {
  const settings = [];
  const assignments = {};
  const microphoneIds = new Set(microphones.map((microphone) => microphone.id));
  for (const group of groups) {
    if (!microphoneIds.has(group.microphoneId)) throw new Error('Group 所屬的麥克風不存在。');
  }

  for (const microphone of microphones) {
    const microphoneGroups = groups.filter((group) => group.microphoneId === microphone.id);
    const sampleOrder = ['G1', 'G3', 'G2'];
    const orderedGroups = microphone.id === 'MIC-01' || microphone.id === 'MIC01'
      ? [...microphoneGroups.filter((group) => sampleOrder.includes(group.id))
        .sort((a, b) => sampleOrder.indexOf(a.id) - sampleOrder.indexOf(b.id)),
      ...microphoneGroups.filter((group) => !sampleOrder.includes(group.id))]
      : microphoneGroups;
    for (const [index, group] of orderedGroups.entries()) {
      const id = `settings:${encodeURIComponent(microphone.id)}:${encodeURIComponent(group.id)}`;
      settings.push({
        id,
        microphoneId: microphone.id,
        name: initialName(microphone.id, group.id, index),
        zones: cloneGeometry(initialMaps[group.id]),
      });
      assignments[group.id] = id;
    }
    const firstGroup = microphoneGroups.find((group) => group.id === 'G1');
    const secondGroup = microphoneGroups.find((group) => group.id === 'G2');
    if ((microphone.id === 'MIC-01' || microphone.id === 'MIC01') && firstGroup && secondGroup) {
      assignments[secondGroup.id] = assignments[firstGroup.id];
    }
  }
  return { settings, assignments };
}

// Resolve assignments on every render so shared edits reach every connected Group.
// Each result is cloned to keep map consumers from mutating the stored geometry.
export function getSettingsMaps(state, groups = []) {
  return Object.fromEntries(groups.map((group) => {
    const settings = state.settings.find((item) => item.id === state.assignments[group.id]
      && item.microphoneId === group.microphoneId);
    return [group.id, cloneGeometry(settings?.zones)];
  }));
}

export function assignSettings(state, groups, groupId, settingsId) {
  const group = requireGroup(groups, groupId);
  if (settingsId !== null) requireSameMicrophone(group, requireSettings(state, settingsId));
  return { ...state, assignments: { ...state.assignments, [groupId]: settingsId } };
}

export function createSettings(state, groups, groupId, name, id, sourceId = null) {
  const group = requireGroup(groups, groupId);
  if (typeof id !== 'string' || !id.trim()) throw new Error('設定檔 ID 不可空白。');
  if (state.settings.some((item) => item.id === id)) throw new Error('這份設定檔已存在。');
  const trimmedName = validateName(state, group.microphoneId, name);
  const source = sourceId === null ? null : requireSettings(state, sourceId);
  if (source) requireSameMicrophone(group, source);
  return {
    ...state,
    settings: [...state.settings, {
      id,
      microphoneId: group.microphoneId,
      name: trimmedName,
      zones: cloneGeometry(source?.zones),
    }],
    assignments: { ...state.assignments, [groupId]: id },
  };
}

export function renameSettings(state, id, name) {
  const settings = requireSettings(state, id);
  const trimmedName = validateName(state, settings.microphoneId, name, id);
  return { ...state, settings: state.settings.map((item) => item.id === id
    ? { ...item, name: trimmedName } : item) };
}

export function removeSettings(state, groups, id, replacementId = null) {
  const settings = requireSettings(state, id);
  const replacement = replacementId === null ? null : requireSettings(state, replacementId);
  if (replacement?.id === id) throw new Error('請選擇其他設定檔作為替代。');
  if (replacement && replacement.microphoneId !== settings.microphoneId) {
    throw new Error('替代設定檔必須屬於同一台麥克風。');
  }
  const assignments = { ...state.assignments };
  for (const [groupId, assignedId] of Object.entries(assignments)) {
    if (assignedId !== id) continue;
    const group = requireGroup(groups, groupId);
    requireSameMicrophone(group, settings);
    assignments[groupId] = replacementId;
  }
  return {
    ...state,
    settings: state.settings.filter((item) => item.id !== id),
    assignments,
  };
}

export function updateSettingsZones(state, id, zones) {
  requireSettings(state, id);
  if (!Array.isArray(zones)) throw new Error('區域內容格式不正確。');
  return { ...state, settings: state.settings.map((item) => item.id === id
    ? { ...item, zones: cloneGeometry(zones) } : item) };
}
