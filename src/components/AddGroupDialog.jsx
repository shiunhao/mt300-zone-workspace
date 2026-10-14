import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import { useDialogFocus } from './ChannelConfigureDialog';
import './AddGroupDialog.css';

const emptyDraft = () => ({ name: '', camera: '', microphoneId: '', channelCount: '' });

export default function AddGroupDialog({
  open,
  cameras = [],
  microphones = [],
  channelCounts = [],
  existingNames = [],
  onClose,
  onSave,
  nameRequired = false,
}) {
  const titleId = useId();
  const nameId = useId();
  const errorId = useId();
  const cameraId = useId();
  const microphoneId = useId();
  const channelsId = useId();
  const dialogRef = useRef(null);
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    if (open) setDraft(emptyDraft());
  }, [open]);
  useDialogFocus(open, dialogRef, onClose);

  if (!open) return null;

  const name = draft.name.trim();
  const duplicateName = name !== '' && existingNames.some((existing) => (
    String(existing).trim().toLocaleLowerCase() === name.toLocaleLowerCase()
  ));
  const channelCount = Number(draft.channelCount);
  const valid = (!nameRequired || name !== '')
    && !duplicateName
    && cameras.includes(draft.camera)
    && microphones.some((microphone) => microphone.id === draft.microphoneId)
    && channelCounts.includes(channelCount);
  const update = (field, value) => setDraft((previous) => ({ ...previous, [field]: value }));

  return createPortal(
    <div
      className="add-group-overlay"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        className="add-group-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-mt-dialog
        data-modal-level="1000"
      >
        <header className="add-group-dialog__header">
          <h2 id={titleId}>Link Camera &amp; MIC</h2>
          <button className="icon-button" type="button" aria-label="Close add group" onClick={onClose}>
            <Icon name="close" size={22} />
          </button>
        </header>
        <form onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSave({ name, camera: draft.camera, microphoneId: draft.microphoneId, channelCount });
        }}>
          <div className="add-group-dialog__body">
            <div className="add-group-dialog__field">
              <label className="add-group-dialog__sr-only" htmlFor={nameId}>Group Name</label>
              <input
                id={nameId}
                className="add-group-dialog__name"
                type="text"
                placeholder="Group Name"
                value={draft.name}
                maxLength={60}
                required={nameRequired}
                aria-invalid={duplicateName || undefined}
                aria-describedby={duplicateName ? errorId : undefined}
                onChange={(event) => update('name', event.target.value)}
                data-initial-focus
              />
              {duplicateName && <p id={errorId} className="add-group-dialog__error" role="status">This group name is already in use.</p>}
            </div>
            <div className="add-group-dialog__field">
              <label className="add-group-dialog__sr-only" htmlFor={cameraId}>Select Camera</label>
              <div className="select-field">
                <select id={cameraId} value={draft.camera} required onChange={(event) => update('camera', event.target.value)}>
                  <option value="" disabled>Select Camera</option>
                  {cameras.map((camera) => <option key={camera} value={camera}>{camera}</option>)}
                </select>
                <Icon name="chevron" size={18} />
              </div>
            </div>
            <div className="add-group-dialog__field">
              <label className="add-group-dialog__sr-only" htmlFor={microphoneId}>Select MIC</label>
              <div className="select-field">
                <select id={microphoneId} value={draft.microphoneId} required onChange={(event) => update('microphoneId', event.target.value)}>
                  <option value="" disabled>Select MIC</option>
                  {microphones.map((microphone) => <option key={microphone.id} value={microphone.id}>{microphone.id} · {microphone.model}</option>)}
                </select>
                <Icon name="chevron" size={18} />
              </div>
            </div>
            <div className="add-group-dialog__field">
              <label className="add-group-dialog__sr-only" htmlFor={channelsId}>Select your MIC Channels</label>
              <div className="select-field">
                <select id={channelsId} value={draft.channelCount} required onChange={(event) => update('channelCount', event.target.value)}>
                  <option value="" disabled>Select your MIC Channels</option>
                  {channelCounts.map((count) => <option key={count} value={count}>{count} Channels{count === 8 ? ' (Default)' : ''}</option>)}
                </select>
                <Icon name="chevron" size={18} />
              </div>
            </div>
          </div>
          <footer className="add-group-dialog__footer">
            <button className="button" type="button" onClick={onClose}>Cancel</button>
            <button className="button add-group-dialog__save" type="submit" disabled={!valid}>Save</button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
