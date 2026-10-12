import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import ZoneMapPanel from './ZoneMapPanel';
import GroupZonePreviews from './GroupZonePreviews';
import { useDialogFocus } from './ChannelConfigureDialog';
import { getMicrophoneGroups } from './workspaceGeometry';
import {
  initializeZoneSettings, getSettingsMaps, assignSettings, createSettings,
  renameSettings, removeSettings, updateSettingsZones,
} from './zoneSettingsLibrary';
import './ZoneSettingsWorkspace.css';

function preferredGroup(groups, microphoneId, remembered, preferred) {
  const scoped = getMicrophoneGroups(groups, microphoneId);
  return scoped.find(group => group.id === remembered)
    || scoped.find(group => group.id === preferred)
    || scoped.find(group => group.enabled !== false) || scoped[0];
}

function ActionIcon({ name }) {
  const paths = {
    rename: <path d="m4 16 12-12 4 4-12 12-5 1zM14 6l4 4" />,
    copy: <path d="M8 8h13v13H8zM16 8V3H3v13h5" />,
    delete: <path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" />,
  };
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function SettingsActionDialog({ action, settings, usageCount, alternatives, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  const inputId = useId();
  const titleId = useId();
  const [name, setName] = useState(action.kind === 'rename' ? settings.name
    : action.kind === 'copy' ? `${settings.name.slice(0, 54)} 副本` : '');
  const [replacementId, setReplacementId] = useState(alternatives[0]?.id || '');
  const [error, setError] = useState('');
  const titles = { create: '新增設定檔', rename: '重新命名', copy: '建立副本', delete: '刪除設定檔' };
  useDialogFocus(true, dialogRef, onClose);

  const submit = event => {
    event.preventDefault();
    try {
      onConfirm(action.kind === 'delete' ? replacementId || null : name);
    } catch (problem) {
      setError(problem.message);
    }
  };

  return createPortal(<div className="zone-settings-action-overlay" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="zone-settings-action-dialog" ref={dialogRef} role="dialog" aria-modal="true"
      aria-labelledby={titleId} data-mt-dialog data-modal-level="1300" tabIndex={-1}>
      <header><h2 id={titleId}>{titles[action.kind]}</h2><button className="icon-button" type="button" aria-label="關閉設定檔操作" onClick={onClose}><Icon name="close" size={21} /></button></header>
      <form onSubmit={submit}>
        <div className="zone-settings-action-dialog__body">
          {action.kind === 'delete' ? <>
            <p className="zone-settings-action-dialog__question">刪除「{settings.name}」？</p>
            {usageCount > 0 ? <label htmlFor={inputId}>目前有 {usageCount} 個 Group 使用，刪除後改用：
              <select id={inputId} value={replacementId} onChange={event => setReplacementId(event.target.value)} data-initial-focus>
                {alternatives.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                <option value="">不使用設定檔</option>
              </select>
            </label> : <p className="zone-settings-action-dialog__hint">這項設定檔將從清單移除。</p>}
          </> : <label htmlFor={inputId}>設定檔名稱
            <input id={inputId} value={name} maxLength={60} autoComplete="off" placeholder="輸入名稱"
              onChange={event => { setName(event.target.value); setError(''); }} data-initial-focus />
          </label>}
          {error && <p className="zone-settings-action-dialog__error" role="alert">{error}</p>}
        </div>
        <footer><button className="zone-map__button" type="button" onClick={onClose}>取消</button>
          <button className={`zone-map__button ${action.kind === 'delete' ? 'is-danger' : 'is-primary'}`} type="submit">
            {action.kind === 'create' ? '建立' : action.kind === 'copy' ? '建立副本' : action.kind === 'delete' ? '刪除' : '確認'}
          </button></footer>
      </form>
    </section>
  </div>, document.body);
}

export default function ZoneSettingsWorkspace({
  microphones = [], groups = [], active = true, visible = true, initialMaps,
  preferredGroupId, mapRequest, sidebarTarget, onToggleGroup, onMapOpenChange,
}) {
  const microphoneSelectId = useId();
  const settingsSelectId = useId();
  const menuId = useId();
  const modalTitleId = useId();
  const [library, setLibrary] = useState(() => initializeZoneSettings(microphones, groups, initialMaps));
  const [microphoneId, setMicrophoneId] = useState(microphones[0]?.id || '');
  const [lastGroupByMicrophone, setLastGroupByMicrophone] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [entry, setEntry] = useState(null);
  const [action, setAction] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorHost] = useState(() => {
    const host = document.createElement('div');
    host.className = 'zone-settings-editor';
    return host;
  });
  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const modalRef = useRef(null);
  const inlineEditorRef = useRef(null);
  const modalEditorRef = useRef(null);
  const addSettingsRef = useRef(null);
  const previousActionRef = useRef(null);
  const requestTokenRef = useRef(null);
  const nextId = useRef(1);
  const microphone = microphones.find(item => item.id === microphoneId) || microphones[0];
  const scopedGroups = getMicrophoneGroups(groups, microphone?.id);
  const group = preferredGroup(groups, microphone?.id, lastGroupByMicrophone[microphone?.id], preferredGroupId);
  const settingsId = library.assignments[group?.id];
  const settings = library.settings.find(item => item.id === settingsId);
  const scopedSettings = library.settings.filter(item => item.microphoneId === microphone?.id);
  const maps = useMemo(() => getSettingsMaps(library, groups), [library, groups]);
  const groupPickupMode = modalOpen && entry?.groupId === group?.id && entry.pickupMode
    ? entry.pickupMode : group?.pickupMode || 'Talker Position';
  const enabled = Boolean(group) && group.enabled !== false && groupPickupMode === 'Talker Position';
  const showWorkspace = active && visible && !modalOpen;

  const closeModal = useCallback(() => { setModalOpen(false); setEntry(null); setAction(null); setMenuOpen(false); }, []);
  useDialogFocus(active && modalOpen, modalRef, closeModal);

  useLayoutEffect(() => {
    // Move only the portal's DOM host. The editor keeps the same React owner and
    // stays mounted, preserving its view and selected zone across both entries.
    const target = active && modalOpen ? modalEditorRef.current : inlineEditorRef.current;
    if (target && editorHost.parentNode !== target) target.appendChild(editorHost);
  }, [active, modalOpen, editorHost]);

  useLayoutEffect(() => () => editorHost.remove(), [editorHost]);

  useEffect(() => {
    const actionClosed = previousActionRef.current && !action;
    previousActionRef.current = action;
    if (!actionClosed || !active) return undefined;
    const frame = requestAnimationFrame(() => {
      const focused = document.activeElement;
      if (focused && focused !== document.body && focused.isConnected
        && focused.getClientRects().length && !focused.matches(':disabled')
        && !focused.closest('[inert]')) return;
      // Deleting the final setting disables the former Manage trigger, so the
      // shared dialog hook cannot restore focus to it. Continue at Add instead.
      const target = [addSettingsRef.current, document.getElementById(settingsSelectId)]
        .find(element => element && !element.disabled && element.getClientRects().length
          && !element.closest('[inert]'));
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [action, active, settingsSelectId]);

  useEffect(() => {
    if (!active) closeModal();
  }, [active, closeModal]);

  useEffect(() => {
    onMapOpenChange?.(active && (modalOpen || Boolean(action)));
  }, [active, modalOpen, action, onMapOpenChange]);

  useEffect(() => {
    if (!active || !mapRequest || mapRequest.token === requestTokenRef.current) return;
    const requestedMicrophone = microphones.find(item => item.id === mapRequest.microphoneId);
    if (!requestedMicrophone) return;
    const requestedGroup = preferredGroup(groups, requestedMicrophone.id, mapRequest.groupId);
    requestTokenRef.current = mapRequest.token;
    setMicrophoneId(requestedMicrophone.id);
    setLastGroupByMicrophone(previous => ({ ...previous, [requestedMicrophone.id]: requestedGroup?.id }));
    setEntry({ groupId: requestedGroup?.id, pickupMode: mapRequest.pickupMode });
    setAction(null);
    setMenuOpen(false);
    setModalOpen(true);
  }, [active, mapRequest, microphones, groups]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();
    const outside = event => { if (!menuRef.current?.contains(event.target)) setMenuOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [menuOpen]);

  const selectGroup = id => {
    setLastGroupByMicrophone(previous => ({ ...previous, [microphone.id]: id }));
    setMenuOpen(false);
  };

  const openAction = kind => {
    setMenuOpen(false);
    menuTriggerRef.current?.focus();
    setAction({ kind, settingsId: settings?.id, groupId: group.id, microphoneId: microphone.id,
      newId: `custom-${microphone.id}-${Date.now()}-${nextId.current++}` });
  };

  const confirmAction = value => {
    // Validate before scheduling React state updates so the dialog can display
    // name conflicts without closing. No separate geometry-save step exists.
    const apply = previous => {
      if (action.kind === 'create' || action.kind === 'copy') {
        return createSettings(previous, groups, action.groupId, value, action.newId,
          action.kind === 'copy' ? action.settingsId : null);
      }
      if (action.kind === 'rename') return renameSettings(previous, action.settingsId, value);
      return removeSettings(previous, groups, action.settingsId, value);
    };
    apply(library);
    setLibrary(apply);
    setAction(null);
  };

  const updateMaps = updater => {
    if (!settings || !enabled) return;
    const editingSettingsId = settings.id;
    const editingGroupId = group.id;
    setLibrary(previous => {
      // Ignore a gesture if its Group has since switched to another setting.
      if (previous.assignments[editingGroupId] !== editingSettingsId) return previous;
      const previousMaps = getSettingsMaps(previous, groups);
      const nextMaps = typeof updater === 'function' ? updater(previousMaps) : updater;
      return updateSettingsZones(previous, editingSettingsId, nextMaps[editingGroupId] || []);
    });
  };

  const handleMenuKeys = event => {
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation(); setMenuOpen(false); menuTriggerRef.current.focus();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    } else if (event.key === 'Tab') setMenuOpen(false);
  };

  const settingsControls = <div className="zone-settings-controls">
    <label htmlFor={settingsSelectId}>區域設定檔</label>
    <div className="select-field zone-settings-controls__select">
      <select id={settingsSelectId} aria-label="區域設定檔" value={settings?.id || ''} disabled={!enabled}
        onChange={event => { setMenuOpen(false); setLibrary(previous => assignSettings(previous, groups, group.id, event.target.value || null)); }}>
        {!settings && <option value="">選擇設定檔</option>}
        {scopedSettings.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select><Icon name="chevron" size={16} />
    </div>
    <button ref={addSettingsRef} className="zone-map__button" type="button" disabled={!enabled} onClick={() => openAction('create')}><Icon name="plus" size={15} />新增</button>
    <div className="zone-settings-controls__manage" ref={menuRef}>
      <button ref={menuTriggerRef} className="zone-map__button zone-settings-controls__more" type="button" aria-label="管理目前設定檔"
        aria-haspopup="menu" aria-expanded={menuOpen} aria-controls={menuOpen ? menuId : undefined}
        disabled={!enabled || !settings} onClick={() => setMenuOpen(previous => !previous)}
        onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setMenuOpen(true); } }}>⋯</button>
      {menuOpen && <div className="zone-settings-menu" id={menuId} role="menu" onKeyDown={handleMenuKeys}>
        <button type="button" role="menuitem" onClick={() => openAction('rename')}><ActionIcon name="rename" />重新命名</button>
        <button type="button" role="menuitem" onClick={() => openAction('copy')}><ActionIcon name="copy" />建立副本</button>
        <button type="button" role="menuitem" className="is-danger" onClick={() => openAction('delete')}><ActionIcon name="delete" />刪除設定檔</button>
      </div>}
    </div>
  </div>;

  const navigation = <div className="zone-settings-navigation" hidden={!active || (!visible && !modalOpen)}>
    <header><label htmlFor={microphoneSelectId}>Select microphone</label>
      <div className="select-field"><select id={microphoneSelectId} aria-label="Select microphone for zone settings" value={microphone?.id || ''}
        disabled={!active || !microphones.length} onChange={event => { setMicrophoneId(event.target.value); setMenuOpen(false); }}>
        {microphones.map(item => <option key={item.id} value={item.id}>{item.id} · {item.model}</option>)}
      </select><Icon name="chevron" size={16} /></div>
    </header>
    <GroupZonePreviews groups={scopedGroups.map(item => item.id === entry?.groupId && modalOpen && entry.pickupMode ? { ...item, pickupMode: entry.pickupMode } : item)}
      maps={maps} currentGroupId={group?.id} active={active && (visible || modalOpen)} onSelectGroup={selectGroup} onToggleGroup={onToggleGroup} />
  </div>;

  const editor = group && microphone ? <ZoneMapPanel compactSettings toolbarStart={settingsControls}
    groupId={group.id} groups={scopedGroups} microphone={microphone} maps={maps} onMapsChange={updateMaps}
    mapIdentity={`${microphone.id}/${group.id}/${settings?.id || 'none'}`} readOnly={!settings} showReferences={false}
    enabled={enabled} active={active && (visible || modalOpen) && !action}
    emptyMessage={!settings ? '選擇或新增設定檔以設定範圍' : undefined} /> : <p className="zone-settings-empty">No camera groups connected.</p>;

  const actionSettings = action && library.settings.find(item => item.id === action.settingsId);
  const actionAlternatives = action ? library.settings.filter(item => item.microphoneId === action.microphoneId && item.id !== action.settingsId) : [];

  return <>
    <section className="zone-settings-workspace" aria-label="區域設定檔工作區" hidden={!showWorkspace}>
      {sidebarTarget && showWorkspace ? createPortal(navigation, sidebarTarget) : showWorkspace && navigation}
      <div ref={inlineEditorRef} className="zone-settings-editor" inert={action ? '' : undefined} />
    </section>
    {active && modalOpen && createPortal(<div className="zone-settings-modal-overlay" onMouseDown={event => { if (event.target === event.currentTarget) closeModal(); }}>
      <section className="zone-settings-modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby={modalTitleId}
        data-mt-dialog data-modal-level="1200" tabIndex={-1}>
        <header><h2 id={modalTitleId}>Microphone Zones</h2><button className="icon-button" type="button" aria-label="Close zone settings" onClick={closeModal}><Icon name="close" size={22} /></button></header>
        <div className="zone-settings-modal__body" inert={action ? '' : undefined}>{navigation}<div ref={modalEditorRef} className="zone-settings-editor" /></div>
      </section>
    </div>, document.body)}
    {createPortal(editor, editorHost)}
    {active && action && <SettingsActionDialog key={`${action.kind}/${action.settingsId || 'new'}`} action={action} settings={actionSettings}
      alternatives={actionAlternatives} usageCount={Object.values(library.assignments).filter(id => id === action.settingsId).length}
      onClose={() => setAction(null)} onConfirm={confirmAction} />}
  </>;
}
