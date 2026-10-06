import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon';
import MapSettingDialog from './MapSettingDialog';
import { getMicrophoneGroups } from './workspaceGeometry';
import './MicrophoneSetup.css';

function MicrophoneIcon() {
  return <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="22" height="22" rx="2" fill="#7d919f" stroke="#cadce8" />
    <rect x="7" y="7" width="14" height="14" rx="1" fill="#b2c6d2" stroke="#d8e6ee" />
    <path d="M10 11h8M10 14h8M10 17h8" stroke="#728b9b" />
    <path d="M20 4h4" stroke="#6ce3ab" strokeWidth="1.5" />
  </svg>;
}

export default function MicrophoneSetup({
  microphones = [],
  groups = [],
  active = true,
  preferredGroupId,
  mapRequest,
  initialMaps,
  onToggleGroup,
  onMapOpenChange,
}) {
  const titleId = useId();
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(microphones[0]?.id || '');
  const [entryGroupId, setEntryGroupId] = useState('');
  const [entryPickupMode, setEntryPickupMode] = useState();
  const [open, setOpen] = useState(false);
  const [lastGroupByMicrophone, setLastGroupByMicrophone] = useState({});
  const processedRequestToken = useRef();
  const selectedMicrophone = microphones.find((microphone) => microphone.id === selectedMicrophoneId)
    || microphones[0];

  useEffect(() => {
    if (!active) setOpen(false);
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

  const openMicrophone = (microphone) => {
    const microphoneGroups = getMicrophoneGroups(groups, microphone.id);
    const preferredGroup = microphoneGroups.find((group) => group.id === lastGroupByMicrophone[microphone.id])
      || microphoneGroups.find((group) => group.id === preferredGroupId && group.enabled !== false
        && (!group.pickupMode || group.pickupMode === 'Talker Position'))
      || microphoneGroups.find((group) => group.enabled !== false
        && (!group.pickupMode || group.pickupMode === 'Talker Position'))
      || microphoneGroups[0];
    setSelectedMicrophoneId(microphone.id);
    setEntryGroupId(preferredGroup?.id || '');
    setEntryPickupMode(undefined);
    if (preferredGroup) {
      setLastGroupByMicrophone((previous) => ({ ...previous, [microphone.id]: preferredGroup.id }));
    }
    onMapOpenChange?.(true);
    setOpen(true);
  };

  const closeMap = useCallback(() => {
    onMapOpenChange?.(false);
    setOpen(false);
  }, [onMapOpenChange]);

  return <section
    className="microphone-setup"
    aria-label="Microphone zone settings"
    hidden={!active}
  >
    <header className="microphone-setup__header">
      <h2 id={titleId}>Microphones</h2>
      <span>Zone settings</span>
    </header>
    <div className="microphone-setup__cards" aria-labelledby={titleId}>
      {microphones.map((microphone) => <button
          key={microphone.id}
          className="microphone-setup__card"
          type="button"
          disabled={!active}
          aria-label={`Configure zones for ${microphone.id} ${microphone.model}`}
          onClick={() => openMicrophone(microphone)}
        >
          <span className="microphone-setup__icon"><MicrophoneIcon /></span>
          <span className="microphone-setup__name">
            <strong>{microphone.id}</strong>
            <span>{microphone.model}</span>
          </span>
          <Icon className="microphone-setup__chevron" name="chevron" size={16} />
        </button>)}
      {!microphones.length && <p className="microphone-setup__empty">No microphones connected.</p>}
    </div>
    {selectedMicrophone && <MapSettingDialog
      open={active && open}
      variant="previews"
      microphone={selectedMicrophone}
      initialGroupId={entryGroupId}
      entryPickupMode={entryPickupMode}
      initialMaps={initialMaps}
      groups={groups}
      onToggleGroup={onToggleGroup}
      onEditingGroupChange={rememberEditingGroup}
      onClose={closeMap}
    />}
  </section>;
}
