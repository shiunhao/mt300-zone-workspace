import { useCallback, useEffect, useId, useState } from 'react';
import Icon from './Icon';
import MapSettingDialog from './MapSettingDialog';
import { getMicrophoneGroups } from './workspaceGeometry';
import './MicrophoneSetup.css';

function MicrophoneIllustration() {
  return <svg width="78" height="78" viewBox="0 0 78 78" fill="none" aria-hidden="true">
    <rect x="8" y="10" width="62" height="62" rx="7" fill="#101b23" />
    <rect x="9" y="6" width="60" height="60" rx="5" fill="#8298a6" stroke="#bdced8" strokeWidth="1.4" />
    <rect x="15" y="12" width="48" height="48" rx="3" fill="#b5c7d2" stroke="#dce7ed" />
    <rect x="21" y="18" width="36" height="36" rx="2" fill="#a0b5c2" />
    {[23, 28, 33, 38, 43, 48].map((y) => <path key={y} d={`M25 ${y}h28`} stroke="#7a96a7" strokeWidth="1.3" />)}
    <path d="M55 8h9" stroke="#66e6b1" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 10h4M12 62h4M62 62h4" stroke="#5e7e90" strokeLinecap="round" />
  </svg>;
}

export default function MicrophoneSetup({
  microphones = [],
  groups = [],
  active = true,
  initialMaps,
  onToggleGroup,
  onMapOpenChange,
}) {
  const titleId = useId();
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(microphones[0]?.id || '');
  const [entryGroupId, setEntryGroupId] = useState('');
  const [open, setOpen] = useState(false);
  const [lastGroupByMicrophone, setLastGroupByMicrophone] = useState({});
  const selectedMicrophone = microphones.find((microphone) => microphone.id === selectedMicrophoneId)
    || microphones[0];

  useEffect(() => {
    if (!active) setOpen(false);
  }, [active]);

  useEffect(() => {
    onMapOpenChange?.(active && open);
  }, [active, open, onMapOpenChange]);

  const rememberEditingGroup = useCallback((groupId) => {
    if (!selectedMicrophone || !getMicrophoneGroups(groups, selectedMicrophone.id)
      .some((group) => group.id === groupId)) return;
    setLastGroupByMicrophone((previous) => previous[selectedMicrophone.id] === groupId
      ? previous : { ...previous, [selectedMicrophone.id]: groupId });
  }, [selectedMicrophone, groups]);

  const openMicrophone = (microphone) => {
    const microphoneGroups = getMicrophoneGroups(groups, microphone.id);
    const preferredGroup = microphoneGroups.find((group) => group.id === lastGroupByMicrophone[microphone.id])
      || microphoneGroups.find((group) => group.enabled !== false
        && (!group.pickupMode || group.pickupMode === 'Talker Position'))
      || microphoneGroups[0];
    setSelectedMicrophoneId(microphone.id);
    setEntryGroupId(preferredGroup?.id || '');
    if (preferredGroup) {
      setLastGroupByMicrophone((previous) => ({ ...previous, [microphone.id]: preferredGroup.id }));
    }
    setOpen(true);
  };

  const closeMap = useCallback(() => setOpen(false), []);

  return <section
    className="microphone-setup"
    role="tabpanel"
    aria-labelledby="auto-tab"
    id={active ? 'auto-settings' : undefined}
    hidden={!active}
  >
    <header className="microphone-setup__header">
      <div>
        <h1 id={titleId}>Microphones</h1>
        <p>Choose a microphone to configure its zones.</p>
      </div>
    </header>
    <div className="microphone-setup__cards" aria-labelledby={titleId}>
      {microphones.map((microphone) => {
        const microphoneGroups = getMicrophoneGroups(groups, microphone.id);
        return <button
          key={microphone.id}
          className="microphone-setup__card"
          type="button"
          aria-label={`Configure zones for ${microphone.id} ${microphone.model}`}
          onClick={() => openMicrophone(microphone)}
        >
          <span className="microphone-setup__identity">
            <span className="microphone-setup__illustration"><MicrophoneIllustration /></span>
            <span className="microphone-setup__name">
              <strong>{microphone.id}</strong>
              <span>{microphone.model}</span>
            </span>
          </span>
          <span className="microphone-setup__connections">
            <span className="microphone-setup__label">Connected camera groups</span>
            <span className="microphone-setup__groups">
              {microphoneGroups.map((group) => <span
                key={group.id}
                className={`microphone-setup__group${group.enabled === false ? ' is-disabled' : ''}`}
                title={group.enabled === false ? `${group.id} is disabled` : `${group.id} is enabled`}
              >
                <Icon name="camera" size={15} />
                <strong>{group.id}</strong>
                <span>{group.camera}</span>
              </span>)}
              {!microphoneGroups.length && <span className="microphone-setup__empty-groups">No connected camera groups</span>}
            </span>
          </span>
          <span className="microphone-setup__card-footer">
            <span>Set up zones</span>
            <Icon name="chevron" size={18} />
          </span>
        </button>;
      })}
      {!microphones.length && <p className="microphone-setup__empty">No microphones connected.</p>}
    </div>
    {selectedMicrophone && <MapSettingDialog
      open={active && open}
      variant="previews"
      microphone={selectedMicrophone}
      initialGroupId={entryGroupId}
      initialMaps={initialMaps}
      groups={groups}
      onToggleGroup={onToggleGroup}
      onEditingGroupChange={rememberEditingGroup}
      onClose={closeMap}
    />}
  </section>;
}
