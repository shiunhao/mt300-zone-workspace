import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import { useDialogFocus } from './ChannelConfigureDialog';
import { INITIAL_MANUAL_CAMERA_STATE } from './manualModeData';
import './ManualCameraDialogs.css';

function DialogFrame({ open, title, cameraName, onClose, children, footer }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  useDialogFocus(open, dialogRef, onClose);

  if (!open) return null;

  return createPortal(
    <div
      className="manual-camera-dialog__overlay"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        className="manual-camera-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
        data-mt-dialog
        data-modal-level="1400"
      >
        <header className="manual-camera-dialog__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p>{cameraName}</p>
          </div>
          <button type="button" className="icon-button" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose}>
            <Icon name="close" size={22} />
          </button>
        </header>
        <div className="manual-camera-dialog__body">{children}</div>
        <footer className="manual-camera-dialog__footer">{footer}</footer>
      </section>
    </div>,
    document.body,
  );
}

export function ManualCameraControlDialog({ open, cameraName, cameraState = INITIAL_MANUAL_CAMERA_STATE, onCameraStateChange, onClose }) {
  const position = cameraState;

  const move = (axis, delta) => {
    onCameraStateChange?.((previous) => {
      const limit = axis === 'pan' ? 170 : 90;
      return { ...previous, [axis]: Math.max(-limit, Math.min(limit, previous[axis] + delta)) };
    });
  };
  const setZoom = (delta) => {
    onCameraStateChange?.((previous) => {
      return { ...previous, zoom: Math.max(1, Math.min(10, previous.zoom + delta)) };
    });
  };
  const center = () => onCameraStateChange?.((previous) => ({
    ...previous, pan: 0, tilt: 0,
  }));

  return (
    <DialogFrame
      open={open}
      title="Camera control"
      cameraName={cameraName}
      onClose={onClose}
      footer={<button type="button" className="button" onClick={onClose}>Close</button>}
    >
      <div className="manual-camera-control">
        <div className="manual-camera-control__pan-tilt" role="group" aria-label="Pan and tilt">
          <button type="button" className="manual-camera-control__direction is-up" aria-label="Tilt up" disabled={position.tilt >= 90} onClick={() => move('tilt', 5)} data-initial-focus>↑</button>
          <button type="button" className="manual-camera-control__direction is-left" aria-label="Pan left" disabled={position.pan <= -170} onClick={() => move('pan', -5)}>←</button>
          <button type="button" className="manual-camera-control__direction is-center" aria-label="Center camera position" onClick={center}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="12" r="4" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
            </svg>
          </button>
          <button type="button" className="manual-camera-control__direction is-right" aria-label="Pan right" disabled={position.pan >= 170} onClick={() => move('pan', 5)}>→</button>
          <button type="button" className="manual-camera-control__direction is-down" aria-label="Tilt down" disabled={position.tilt <= -90} onClick={() => move('tilt', -5)}>↓</button>
        </div>
        <div className="manual-camera-control__zoom" role="group" aria-label="Camera zoom">
          <span className="manual-camera-dialog__label">Zoom</span>
          <div className="manual-camera-control__zoom-actions">
            <button type="button" className="button" aria-label="Zoom out camera" disabled={position.zoom <= 1} onClick={() => setZoom(-1)}>−</button>
            <output aria-label="Zoom level">{position.zoom}×</output>
            <button type="button" className="button" aria-label="Zoom in camera" disabled={position.zoom >= 10} onClick={() => setZoom(1)}>+</button>
          </div>
        </div>
      </div>
      <dl className="manual-camera-control__position" aria-live="polite">
        <div><dt>Pan</dt><dd>{position.pan}°</dd></div>
        <div><dt>Tilt</dt><dd>{position.tilt}°</dd></div>
      </dl>
    </DialogFrame>
  );
}
