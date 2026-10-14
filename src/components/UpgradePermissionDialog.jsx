import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import { useDialogFocus } from './ChannelConfigureDialog';
import './UpgradePermissionDialog.css';

function FieldIcon({ lock = false }) {
  return lock ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 10V7a5 5 0 0 1 10 0v3h1.5v11h-13V10Zm2 0h6V7a3 3 0 0 0-6 0Z" fill="currentColor" />
      <path d="M12 14v3" stroke="#0d0e10" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="6" r="4" fill="currentColor" />
      <path d="M3 22c0-6 3.2-10 9-10s9 4 9 10Z" fill="currentColor" />
    </svg>
  );
}

export default function UpgradePermissionDialog({ open, onClose, onVerify, error = '', verifying = false }) {
  const titleId = useId();
  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();
  const dialogRef = useRef(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    setUsername('');
    setPassword('');
  }, [open]);
  useDialogFocus(open, dialogRef, onClose);

  if (!open) return null;
  const canSubmit = typeof onVerify === 'function' && username.trim() !== '' && password !== '' && !verifying;

  return createPortal(
    <div className="upgrade-permission-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section
        className="upgrade-permission-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={verifying || undefined}
        tabIndex={-1}
        ref={dialogRef}
        data-mt-dialog
        data-modal-level="1500"
      >
        <header className="upgrade-permission-dialog__header">
          <h2 id={titleId}>Upgrade Permission</h2>
          <button type="button" className="icon-button" aria-label="Close upgrade permission" onClick={onClose}>
            <Icon name="close" size={22} />
          </button>
        </header>
        <form onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onVerify({ username: username.trim(), password });
        }}>
          <div className="upgrade-permission-dialog__body">
            <div className="upgrade-permission-dialog__field">
              <label className="upgrade-permission-dialog__sr-only" htmlFor={usernameId}>Username</label>
              <input
                id={usernameId}
                type="text"
                placeholder="Username"
                value={username}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                onChange={(event) => setUsername(event.target.value)}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? true : undefined}
                disabled={verifying}
                required
                data-initial-focus
              />
              <FieldIcon />
            </div>
            <div className="upgrade-permission-dialog__field">
              <label className="upgrade-permission-dialog__sr-only" htmlFor={passwordId}>Password</label>
              <input
                id={passwordId}
                type="password"
                placeholder="Password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? true : undefined}
                disabled={verifying}
                required
              />
              <FieldIcon lock />
            </div>
            {error && <p id={errorId} className="upgrade-permission-dialog__error" role="alert">{error}</p>}
          </div>
          <footer className="upgrade-permission-dialog__footer">
            <button className="button" type="button" onClick={onClose}>Cancel</button>
            <button className="button upgrade-permission-dialog__save" type="submit" disabled={!canSubmit}>Save</button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
