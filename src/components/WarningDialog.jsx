import { useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDialogFocus } from './ChannelConfigureDialog';
import './WarningDialog.css';

export default function WarningDialog({ open, message, onClose, returnFocusRef }) {
  const messageId = useId();
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const overlay = overlayRef.current;
    const background = [...document.body.children].filter((element) => element !== overlay);
    const previous = background.map((element) => [element, element.inert]);
    background.forEach((element) => { element.inert = true; });
    // A warning opened by blur must consume the click that caused that blur.
    const blockBackgroundClick = (event) => {
      if (!overlay.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    document.addEventListener('click', blockBackgroundClick, true);
    return () => {
      document.removeEventListener('click', blockBackgroundClick, true);
      previous.forEach(([element, inert]) => { element.inert = inert; });
    };
  }, [open]);
  useDialogFocus(open, dialogRef, onClose, { includeVersionSwitcher: false, returnFocusRef });

  if (!open) return null;
  return createPortal(
    <div className="warning-dialog-overlay" ref={overlayRef}>
      <section className="warning-dialog" role="alertdialog" aria-modal="true"
        aria-label="Warning" aria-describedby={messageId} tabIndex={-1}
        ref={dialogRef} data-mt-dialog data-modal-level="1600">
        <p className="warning-dialog__message" id={messageId}>{message}</p>
        <footer><button className="button warning-dialog__confirm" type="button" onClick={onClose} data-initial-focus>OK</button></footer>
      </section>
    </div>, document.body,
  );
}
