import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import './AccountMenu.css';

const roles = ['Admin', 'User'];

function AccountAvatar() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" fill="currentColor" />
      <circle cx="16" cy="11" r="5" className="account-menu__avatar-cutout" />
      <path d="M6.5 26c.7-5.1 4.1-8 9.5-8s8.8 2.9 9.5 8a14 14 0 0 1-19 0Z" className="account-menu__avatar-cutout" />
    </svg>
  );
}

export default function AccountMenu({ role = 'Admin', onSelectRole, active = true }) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const itemsRef = useRef([]);
  const initialFocusRef = useRef(0);

  useEffect(() => {
    if (!active) setOpen(false);
  }, [active]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('focusin', closeOutside);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('focusin', closeOutside);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (open) itemsRef.current[initialFocusRef.current]?.focus();
  }, [open]);

  const closeAndFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openAt = (index) => {
    initialFocusRef.current = index;
    setOpen(true);
    if (open) itemsRef.current[index]?.focus();
  };

  const handleMenuKey = (event) => {
    const index = itemsRef.current.indexOf(document.activeElement);
    let nextIndex;
    if (event.key === 'ArrowDown') nextIndex = (index + 1) % roles.length;
    if (event.key === 'ArrowUp') nextIndex = (index - 1 + roles.length) % roles.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = roles.length - 1;
    if (nextIndex !== undefined) {
      event.preventDefault();
      itemsRef.current[nextIndex]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeAndFocus();
    } else if (event.key === 'Tab') {
      closeAndFocus();
    }
  };

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        className="account-menu__trigger"
        type="button"
        ref={triggerRef}
        aria-label={`Account: ${role}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        data-account-trigger
        onClick={() => {
          if (open) closeAndFocus();
          else openAt(Math.max(0, roles.indexOf(role)));
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openAt(event.key === 'ArrowDown' ? 0 : roles.length - 1);
          }
        }}
      >
        <span>{role}</span>
        <AccountAvatar />
      </button>
      {open && active && (
        <div id={menuId} className="account-menu__options" role="menu" aria-label="Account role" onKeyDown={handleMenuKey}>
          {roles.map((option, index) => (
            <button
              className={`account-menu__option${role === option ? ' is-selected' : ''}`}
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={role === option}
              ref={(element) => { itemsRef.current[index] = element; }}
              tabIndex={-1}
              onClick={() => {
                closeAndFocus();
                if (option !== role) onSelectRole?.(option);
              }}
            >
              <AccountAvatar />
              <span>{option}</span>
              {role === option && (
                <svg className="account-menu__check" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="m4 12 5 5L20 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
