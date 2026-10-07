import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import ZoneMapPanel from './ZoneMapPanel';
import GroupZonePreviews from './GroupZonePreviews';
import { createWorkspaceMaps, getMicrophoneGroups, WORKSPACE_MICROPHONE } from './workspaceGeometry';
import { useDialogFocus } from './ChannelConfigureDialog';
import './MapSettingDialog.css';

export default function MapSettingDialog({
  open = false,
  embedded = false,
  variant = 'reference',
  microphone = WORKSPACE_MICROPHONE,
  groups = [],
  initialGroupId = 'G2',
  entryPickupMode,
  initialMaps,
  onEditingGroupChange,
  onToggleGroup,
  onClose,
}) {
  const titleId = useId();
  const groupSelectId = useId();
  const statusId = useId();
  const dialogRef = useRef(null);
  const [editingGroupId, setEditingGroupId] = useState(initialGroupId);
  const [previewMaps, setPreviewMaps] = useState(() => initialMaps
    ? Object.fromEntries(Object.entries(initialMaps).map(([id, zones]) => [id, zones.map((zone) => ({ ...zone }))]))
    : createWorkspaceMaps(groups));
  const hasPreviews = variant === 'previews';

  useEffect(() => {
    setEditingGroupId(initialGroupId);
  }, [initialGroupId, microphone.id]);
  useEffect(() => {
    if (open && !embedded) setEditingGroupId(initialGroupId);
  }, [open, embedded, initialGroupId]);
  useDialogFocus(open && !embedded, dialogRef, onClose);

  const scopedGroups = hasPreviews ? getMicrophoneGroups(groups, microphone.id) : groups;
  const selectedGroup = scopedGroups.find((group) => group.id === editingGroupId)
    || scopedGroups.find((group) => group.id === initialGroupId) || scopedGroups[0];
  const groupId = selectedGroup?.id || '';
  // The entry group may be using the still-open Channel Configure draft.
  // Switching groups never changes that draft or another group's Pickup Mode.
  const pickupMode = groupId === initialGroupId && entryPickupMode
    ? entryPickupMode : selectedGroup?.pickupMode || 'Talker Position';
  const talkerPosition = pickupMode === 'Talker Position';
  const groupEnabled = Boolean(selectedGroup) && selectedGroup.enabled !== false;
  const previewGroups = scopedGroups.map((group) => group.id === initialGroupId && entryPickupMode
    ? { ...group, pickupMode: entryPickupMode } : group);
  const status = selectedGroup && !talkerPosition
    ? `${groupId} uses ${pickupMode} mode. Zone settings are available in Talker Position mode.`
    : '';

  const content = <section
        className={`map-setting-dialog${hasPreviews ? ' map-setting-dialog--previews' : ''}${embedded ? ' map-setting-dialog--embedded' : ''}`}
        ref={dialogRef}
        hidden={embedded && !open}
        role={embedded ? 'region' : 'dialog'}
        aria-modal={embedded ? undefined : 'true'}
        aria-label={embedded ? `${microphone.id} microphone zones` : undefined}
        aria-labelledby={embedded ? undefined : titleId}
        aria-describedby={status ? statusId : undefined}
        tabIndex={embedded ? undefined : -1}
        data-mt-dialog={embedded ? undefined : true}
        data-modal-level={embedded ? undefined : '1200'}
      >
        {!embedded && <header className="map-setting-dialog__header">
          {hasPreviews ? <div className="map-setting-dialog__microphone" aria-label={`Microphone ${microphone.id} ${microphone.model}`}>
            <svg className="map-setting-dialog__microphone-icon" width="32" height="32" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="22" height="22" rx="2" fill="#7d919f" stroke="#cadce8" />
              <rect x="7" y="7" width="14" height="14" rx="1" fill="#b2c6d2" stroke="#d8e6ee" />
              <path d="M10 11h8M10 14h8M10 17h8" stroke="#728b9b" />
              <path d="M20 4h4" stroke="#6ce3ab" strokeWidth="1.5" />
            </svg>
            <div><h2 id={titleId}>Zone Map · {microphone.id}</h2><p>{microphone.model}</p></div>
          </div> : <h2 id={titleId}>Zone Map</h2>}
          {!hasPreviews && <div className="map-setting-dialog__group-controls">
            <label htmlFor={groupSelectId}>Group</label>
            <div className="select-field map-setting-dialog__group-select">
              <select
                id={groupSelectId}
                value={groupId}
                disabled={!open || !groups.length}
                data-initial-focus
                onChange={(event) => setEditingGroupId(event.target.value)}
              >
                {groups.map((group) => <option key={group.id} value={group.id}>{group.id} · {group.camera}</option>)}
              </select>
              <Icon name="chevron" size={16} />
            </div>
            <span className="map-setting-dialog__enable-label">Enabled</span>
            <button
              className={`switch${groupEnabled ? ' is-on' : ''}`}
              type="button"
              role="switch"
              aria-checked={groupEnabled}
              aria-label={`Enable ${groupId} in map setting`}
              disabled={!open || !selectedGroup || !onToggleGroup}
              onClick={() => onToggleGroup?.(groupId)}
            ><span /></button>
          </div>}
          <button
            className="icon-button map-setting-dialog__close"
            type="button"
            aria-label="Close map setting"
            disabled={!open}
            onClick={onClose}
          ><Icon name="close" size={22} /></button>
        </header>}
        <div className="map-setting-dialog__body">
          {hasPreviews && <GroupZonePreviews
            groups={previewGroups}
            currentGroupId={groupId}
            initialGroupId={initialGroupId}
            maps={previewMaps}
            active={open}
            onSelectGroup={(id) => {
              setEditingGroupId(id);
              onEditingGroupChange?.(id);
            }}
            onToggleGroup={onToggleGroup}
          />}
          <div className="map-setting-dialog__editor">
            {status && <p className="map-setting-dialog__status" id={statusId} role="status">{status}</p>}
            {selectedGroup ? <ZoneMapPanel
              variant="reference"
              groupId={groupId}
              groups={scopedGroups}
              microphone={microphone}
              showGroupContext={hasPreviews}
              enabled={groupEnabled && talkerPosition}
              active={open}
              maps={hasPreviews ? previewMaps : undefined}
              onMapsChange={hasPreviews ? setPreviewMaps : undefined}
              showReferences={!hasPreviews}
            /> : <p className="map-setting-dialog__empty">No camera groups connected to {microphone.id}.</p>}
          </div>
        </div>
      </section>;

  if (embedded) return content;
  return createPortal(
    <div
      className="map-setting-overlay"
      hidden={!open}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !document.querySelector('.design-version-menu')) onClose();
      }}
    >
      {content}
    </div>,
    document.body,
  );
}
