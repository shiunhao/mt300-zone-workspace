import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import ZoneMapPanel from './ZoneMapPanel';
import GroupZonePreviews from './GroupZonePreviews';
import { createWorkspaceMaps } from './workspaceGeometry';
import { useDialogFocus } from './ChannelConfigureDialog';
import './MapSettingDialog.css';

export default function MapSettingDialog({
  open = false,
  variant = 'reference',
  groups = [],
  initialGroupId = 'G2',
  entryPickupMode,
  onToggleGroup,
  onClose,
}) {
  const titleId = useId();
  const groupSelectId = useId();
  const statusId = useId();
  const dialogRef = useRef(null);
  const groupSelectRef = useRef(null);
  const [editingGroupId, setEditingGroupId] = useState(initialGroupId);
  const [previewMaps, setPreviewMaps] = useState(() => createWorkspaceMaps(groups));
  const hasPreviews = variant === 'previews';

  useEffect(() => {
    if (open) setEditingGroupId(initialGroupId);
  }, [open, initialGroupId]);
  useDialogFocus(open, dialogRef, onClose);

  const selectedGroup = groups.find((group) => group.id === editingGroupId) || groups[0];
  const groupId = selectedGroup?.id || initialGroupId;
  // The entry group may be using the still-open Channel Configure draft.
  // Switching groups never changes that draft or another group's Pickup Mode.
  const pickupMode = groupId === initialGroupId && entryPickupMode
    ? entryPickupMode : selectedGroup?.pickupMode || 'Talker Position';
  const talkerPosition = pickupMode === 'Talker Position';
  const groupEnabled = selectedGroup?.enabled !== false;
  const previewGroups = groups.map((group) => group.id === initialGroupId && entryPickupMode
    ? { ...group, pickupMode: entryPickupMode } : group);
  const status = !talkerPosition
    ? `${groupId} uses ${pickupMode} mode. Zone settings are available in Talker Position mode.`
    : '';

  return createPortal(
    <div
      className="map-setting-overlay"
      hidden={!open}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !document.querySelector('.design-version-menu')) onClose();
      }}
    >
      <section
        className={`map-setting-dialog${hasPreviews ? ' map-setting-dialog--previews' : ''}`}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={status ? statusId : undefined}
        tabIndex={-1}
        data-mt-dialog
        data-modal-level="1200"
      >
        <header className="map-setting-dialog__header">
          <h2 id={titleId}>Zone Map</h2>
          <div className="map-setting-dialog__group-controls">
            <label htmlFor={groupSelectId}>Group</label>
            <div className="select-field map-setting-dialog__group-select">
              <select
                id={groupSelectId}
                ref={groupSelectRef}
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
          </div>
          <button
            className="icon-button map-setting-dialog__close"
            type="button"
            aria-label="Close map setting"
            disabled={!open}
            onClick={onClose}
          ><Icon name="close" size={22} /></button>
        </header>
        <div className="map-setting-dialog__body">
          {hasPreviews && <GroupZonePreviews
            groups={previewGroups}
            currentGroupId={groupId}
            maps={previewMaps}
            active={open}
            onSelectGroup={(id) => {
              setEditingGroupId(id);
              requestAnimationFrame(() => groupSelectRef.current?.focus());
            }}
          />}
          <div className="map-setting-dialog__editor">
            {status && <p className="map-setting-dialog__status" id={statusId} role="status">{status}</p>}
            <ZoneMapPanel
              variant="reference"
              groupId={groupId}
              groups={groups}
              enabled={groupEnabled && talkerPosition}
              active={open}
              maps={hasPreviews ? previewMaps : undefined}
              onMapsChange={hasPreviews ? setPreviewMaps : undefined}
              showReferences={!hasPreviews}
            />
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
