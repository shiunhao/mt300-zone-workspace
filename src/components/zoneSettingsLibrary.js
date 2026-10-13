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

export function initializeZoneSettings(microphones = [], groups = [], _initialMaps = {}) {
  const assignments = {};
  const microphoneIds = new Set(microphones.map((microphone) => microphone.id));
  for (const group of groups) {
    if (!microphoneIds.has(group.microphoneId)) throw new Error('Group 所屬的麥克風不存在。');
    assignments[group.id] = null;
  }
  return { settings: [], assignments };
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

export function removeSettingsBatch(state, groups, microphoneId, settingsIds) {
  if (!Array.isArray(settingsIds) || !settingsIds.length) {
    throw new Error('請選擇要刪除的設定檔。');
  }
  const removedIds = new Set(settingsIds);
  for (const id of removedIds) {
    requireSameMicrophone({ microphoneId }, requireSettings(state, id));
  }
  // Validate every selection and affected Group before producing the next state.
  const assignments = { ...state.assignments };
  for (const [groupId, settingsId] of Object.entries(assignments)) {
    if (!removedIds.has(settingsId)) continue;
    requireSameMicrophone(requireGroup(groups, groupId), requireSettings(state, settingsId));
    assignments[groupId] = null;
  }
  return {
    ...state,
    settings: state.settings.filter((settings) => !removedIds.has(settings.id)),
    assignments,
  };
}

export function updateSettingsZones(state, id, zones) {
  requireSettings(state, id);
  if (!Array.isArray(zones)) throw new Error('區域內容格式不正確。');
  return { ...state, settings: state.settings.map((item) => item.id === id
    ? { ...item, zones: cloneGeometry(zones) } : item) };
}
