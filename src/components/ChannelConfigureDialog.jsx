import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import './ChannelConfigureDialog.css';

let openDialogs = 0;
let bodyOverflowBeforeDialogs = '';

export function useDialogFocus(open, dialogRef, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    if (openDialogs === 0) {
      bodyOverflowBeforeDialogs = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openDialogs += 1;

    const dialog = dialogRef.current;
    const focusSelector = 'button:not(:disabled), select:not(:disabled), input:not(:disabled), [tabindex="0"]';
    const focusable = () => {
      const targets = [...dialog.querySelectorAll(focusSelector)];
      // Reference options are portaled above the map dialog; keep them in its tab order.
      for (const trigger of dialog.querySelectorAll('[aria-controls]')) {
        const menu = document.getElementById(trigger.getAttribute('aria-controls'));
        if (menu?.classList.contains('group-reference-menu')) targets.push(...menu.querySelectorAll(focusSelector));
      }
      return [...new Set(targets)].filter((element) => element.getClientRects().length > 0 && !element.closest('[inert], [aria-hidden="true"]'));
    };
    const initial = dialog.querySelector('[data-initial-focus]') || focusable()[0] || dialog;
    initial.focus();

    const handleKey = (event) => {
      // The prototype version menu participates only while it is visible.
      const inVersionSwitcher = event.target instanceof Element && event.target.closest('.design-version-switcher');
      if (inVersionSwitcher && (event.key !== 'Tab' || document.querySelector('.design-version-menu'))) return;
      const visibleDialogs = [...document.querySelectorAll('[data-mt-dialog]')]
        .filter((element) => element.getClientRects().length > 0 && !element.closest('[inert], [aria-hidden="true"]'));
      const highest = visibleDialogs.reduce((top, element) => (
        !top || Number(element.dataset.modalLevel) >= Number(top.dataset.modalLevel) ? element : top
      ), null);
      if (highest !== dialog) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key === 'Tab') {
        const versionTrigger = document.querySelector('.design-version-trigger');
        const versionVisible = versionTrigger?.getClientRects().length > 0
          && !versionTrigger.closest('[inert], [aria-hidden="true"]');
        const targets = [...focusable(), ...(versionVisible ? [versionTrigger] : [])];
        event.preventDefault();
        if (targets.length === 0) dialog.focus();
        else {
          const index = targets.indexOf(document.activeElement);
          const nextIndex = index < 0 ? 0 : (index + (event.shiftKey ? -1 : 1) + targets.length) % targets.length;
          targets[nextIndex].focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      openDialogs -= 1;
      if (openDialogs === 0) document.body.style.overflow = bodyOverflowBeforeDialogs;
      if (!document.activeElement?.closest('.design-version-switcher') && previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open, dialogRef]);
}

export default function ChannelConfigureDialog({
  open,
  suspended = false,
  groupId,
  initialMode = 'Lobe',
  initialChannelInformation = 'Talker Position',
  onClose,
  onSave,
  onMapSetting,
  mapIsTab = false,
  mapTargetLabel = 'Zone Map tab',
}) {
  const titleId = useId();
  const pickupId = useId();
  const channelId = useId();
  const dialogRef = useRef(null);
  const [pickupMode, setPickupMode] = useState(initialMode);
  const [channelInformation, setChannelInformation] = useState(initialChannelInformation);

  useEffect(() => {
    if (open) {
      setPickupMode(initialMode);
      setChannelInformation(initialChannelInformation);
    }
  }, [open, groupId, initialMode, initialChannelInformation]);
  useDialogFocus(open, dialogRef, onClose);

  if (!open) return null;

  const draft = { pickupMode, channelInformation };
  return createPortal(
    <div className="configure-overlay" aria-hidden={suspended || undefined} inert={suspended ? '' : undefined} onMouseDown={(event) => { if (!suspended && event.target === event.currentTarget) onClose(); }}>
      <section
        className="configure-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal={suspended ? undefined : 'true'}
        aria-labelledby={titleId}
        tabIndex={-1}
        data-mt-dialog
        data-modal-level="1000"
      >
        <header className="configure-dialog__header">
          <div>
            <h2 id={titleId}>Channel Configure</h2>
            <span className="configure-dialog__group">{groupId} · Microphone settings</span>
          </div>
          <button type="button" className="icon-button" aria-label="Close channel configuration" onClick={onClose}>
            <Icon name="close" size={22} />
          </button>
        </header>

        <form onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
          <div className="configure-dialog__body">
            <div className="configure-dialog__model">
              <span>Microphone Model</span>
              <strong>Shure MXA925-S</strong>
            </div>

            <div className="configure-dialog__field">
              <label htmlFor={pickupId}>Pickup Mode</label>
              <div className="select-field">
                <select id={pickupId} value={pickupMode} onChange={(event) => setPickupMode(event.target.value)} data-initial-focus>
                  <option>Lobe</option>
                  <option>Coverage</option>
                  <option>Talker Position</option>
                </select>
                <Icon name="chevron" size={18} />
              </div>
            </div>

            {pickupMode === 'Talker Position' ? (
              <div className="configure-dialog__map-action">
                <div>
                  <button type="button" className="button" disabled={mapIsTab && pickupMode !== initialMode} onClick={() => onMapSetting(draft)}>Map Setting</button>
                  {mapIsTab && <span className="configure-dialog__shortcut">{pickupMode !== initialMode ? `Save Pickup Mode before opening ${mapTargetLabel}.` : `Open ${mapTargetLabel}`}</span>}
                </div>
                <span className="configure-dialog__info" title="Draw zones to map the talker position within this group." aria-label="Draw zones to map the talker position within this group.">i</span>
              </div>
            ) : (
              <>
                <p className="configure-dialog__hint">
                  Select {pickupMode}, Autocoverage needs to be turned {pickupMode === 'Lobe' ? 'off' : 'on'}
                </p>
                <div className="configure-dialog__field">
                  <label htmlFor={channelId}>Channel Information</label>
                  <div className="select-field">
                    <select id={channelId} value={channelInformation} onChange={(event) => setChannelInformation(event.target.value)}>
                      <option>Automixer Gate Out</option>
                      <option>Talker Position</option>
                    </select>
                    <Icon name="chevron" size={18} />
                  </div>
                </div>
              </>
            )}
          </div>

          <footer className="configure-dialog__footer">
            <button type="button" className="button" onClick={onClose}>Cancel</button>
            <button type="submit" className="button configure-dialog__save">Save</button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
