import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon';
import MapSettingDialog from './MapSettingDialog';
import { getMicrophoneGroups } from './workspaceGeometry';
import './MicrophoneSetup.css';

function chooseGroup(groups, microphoneId, preferredGroupId, rememberedGroupId) {
  const microphoneGroups = getMicrophoneGroups(groups, microphoneId);
  const editable = (group) => group.enabled !== false
    && (!group.pickupMode || group.pickupMode === 'Talker Position');
  return microphoneGroups.find((group) => group.id === rememberedGroupId)
    || microphoneGroups.find((group) => group.id === preferredGroupId && editable(group))
    || microphoneGroups.find(editable) || microphoneGroups[0];
}

export default function MicrophoneSetup({
  microphones = [],
  groups = [],
  active = true,
  visible = true,
  preferredGroupId,
  mapRequest,
  initialMaps,
  onToggleGroup,
  onMapOpenChange,
}) {
  const selectId = useId();
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(microphones[0]?.id || '');
  const [entryGroupId, setEntryGroupId] = useState(() =>
    chooseGroup(groups, microphones[0]?.id, preferredGroupId)?.id || '');
  const [entryPickupMode, setEntryPickupMode] = useState();
  const [open, setOpen] = useState(false);
  const [lastGroupByMicrophone, setLastGroupByMicrophone] = useState({});
  const processedRequestToken = useRef();
  const selectedMicrophone = microphones.find((microphone) => microphone.id === selectedMicrophoneId)
    || microphones[0];

  useEffect(() => {
    if (!active) {
      setOpen(false);
      setEntryPickupMode(undefined);
    }
  }, [active]);

  useEffect(() => {
    onMapOpenChange?.(active && open);
  }, [active, open, onMapOpenChange]);

  useEffect(() => {
    if (!active || !mapRequest || mapRequest.token === processedRequestToken.current) return;
    const microphone = microphones.find((item) => item.id === mapRequest.microphoneId);
    if (!microphone) return;
    const microphoneGroups = getMicrophoneGroups(groups, microphone.id);
    const requestedGroup = microphoneGroups.find((group) => group.id === mapRequest.groupId)
      || microphoneGroups[0];
    processedRequestToken.current = mapRequest.token;
    setSelectedMicrophoneId(microphone.id);
    setEntryGroupId(requestedGroup?.id || '');
    setEntryPickupMode(mapRequest.pickupMode);
    if (requestedGroup) {
      setLastGroupByMicrophone((previous) => ({ ...previous, [microphone.id]: requestedGroup.id }));
    }
    onMapOpenChange?.(true);
    setOpen(true);
  }, [active, mapRequest, microphones, groups, onMapOpenChange]);

  const rememberEditingGroup = useCallback((groupId) => {
    if (!selectedMicrophone || !getMicrophoneGroups(groups, selectedMicrophone.id)
      .some((group) => group.id === groupId)) return;
    setLastGroupByMicrophone((previous) => previous[selectedMicrophone.id] === groupId
      ? previous : { ...previous, [selectedMicrophone.id]: groupId });
  }, [selectedMicrophone, groups]);

  const selectMicrophone = (microphoneId) => {
    const preferredGroup = chooseGroup(groups, microphoneId, preferredGroupId, lastGroupByMicrophone[microphoneId]);
    setSelectedMicrophoneId(microphoneId);
    setEntryGroupId(preferredGroup?.id || '');
    setEntryPickupMode(undefined);
    if (preferredGroup) {
      setLastGroupByMicrophone((previous) => ({ ...previous, [microphoneId]: preferredGroup.id }));
    }
  };

  const closeMap = useCallback(() => {
    onMapOpenChange?.(false);
    setOpen(false);
    setEntryPickupMode(undefined);
  }, [onMapOpenChange]);

  return <section
    className="microphone-setup"
    aria-label="Microphone zone settings"
    hidden={!active || !visible}
  >
    <header className="microphone-setup__header">
      <label htmlFor={selectId}>Select microphone</label>
      <div className="select-field microphone-setup__select">
        <select id={selectId} value={selectedMicrophone?.id || ''} disabled={!active || !microphones.length}
          onChange={(event) => selectMicrophone(event.target.value)}>
          {microphones.map((microphone) => <option key={microphone.id} value={microphone.id}>
            {microphone.id} · {microphone.model}
          </option>)}
        </select>
        <Icon name="chevron" size={16} />
      </div>
    </header>
    {!microphones.length && <p className="microphone-setup__empty">No microphones connected.</p>}
    {selectedMicrophone && <MapSettingDialog
      open={active && (visible || open)}
      embedded={!open}
      variant="previews"
      microphone={selectedMicrophone}
      initialGroupId={entryGroupId}
      entryPickupMode={open ? entryPickupMode : undefined}
      initialMaps={initialMaps}
      groups={groups}
      onToggleGroup={onToggleGroup}
      onEditingGroupChange={rememberEditingGroup}
      onClose={closeMap}
    />}
  </section>;
}
