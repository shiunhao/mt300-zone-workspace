import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import ZoneMapPanel from './ZoneMapPanel';
import GroupZonePreviews from './GroupZonePreviews';
import { useDialogFocus } from './ChannelConfigureDialog';
import { getMicrophoneGroups } from './workspaceGeometry';
import {
  initializeZoneSettings, getSettingsMaps, assignSettings, createSettings,
  renameSettings, removeSettingsBatch, updateSettingsZones,
} from './zoneSettingsLibrary';
import './ZoneSettingsWorkspace.css';

function ActionIcon({ name }) {
  const paths = {
    rename: <path d="m4 16 12-12 4 4-12 12-5 1zM14 6l4 4" />,
    copy: <path d="M8 8h13v13H8zM16 8V3H3v13h5" />,
    delete: <path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" />,
  };
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function SettingsActionDialog({ action, settings, settingsList, groups, assignments, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  const inputId = useId();
  const titleId = useId();
  const [name, setName] = useState(action.kind === 'rename' ? settings.name
    : action.kind === 'copy' ? `${settings.name.slice(0, 54)} 副本` : '');
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState('');
  const titles = { create: '新增設定檔', rename: '重新命名', copy: '建立副本', delete: '刪除設定檔' };
  const affectedGroups = groups.filter(group => selectedIds.includes(assignments[group.id]));
  useDialogFocus(true, dialogRef, onClose);

  const submit = event => {
    event.preventDefault();
    try {
      if (action.kind === 'delete' && !selectedIds.length) return;
      onConfirm(action.kind === 'delete' ? selectedIds : name);
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
            <p className="zone-settings-action-dialog__question">選擇要刪除的設定檔</p>
            <div className="zone-settings-delete-list">
              {settingsList.map((item, index) => {
                const users = groups.filter(group => assignments[group.id] === item.id);
                return <label className="zone-settings-delete-option" key={item.id}>
                  <input type="checkbox" aria-label={`刪除 ${item.name}`} checked={selectedIds.includes(item.id)}
                    data-initial-focus={index === 0 ? '' : undefined}
                    onChange={event => {
                      const checked = event.target.checked;
                      setSelectedIds(previous => checked
                        ? [...previous, item.id] : previous.filter(id => id !== item.id));
                      setError('');
                    }} />
                  <span className="zone-settings-delete-option__text"><strong>{item.name}</strong>
                    <span>{users.length ? `使用中：${users.map(group => group.name || group.id).join('、')}` : '未使用'}</span>
                  </span>
                </label>;
              })}
            </div>
            <p className="zone-settings-delete-impact" aria-live="polite">
              {!selectedIds.length ? '尚未選擇設定檔。'
                : affectedGroups.length
                  ? `已選擇 ${selectedIds.length} 項。刪除後，${affectedGroups.map(group => group.name || group.id).join('、')} 將不使用設定檔。`
                  : `已選擇 ${selectedIds.length} 項，沒有 Group 使用這些設定檔。`}
            </p>
          </> : <label htmlFor={inputId}>設定檔名稱
            <input id={inputId} value={name} maxLength={60} autoComplete="off" placeholder="輸入名稱"
              onChange={event => { setName(event.target.value); setError(''); }} data-initial-focus />
          </label>}
          {error && <p className="zone-settings-action-dialog__error" role="alert">{error}</p>}
        </div>
        <footer><button className="zone-map__button" type="button" onClick={onClose}>取消</button>
          <button className={`zone-map__button ${action.kind === 'delete' ? 'is-danger' : 'is-primary'}`} type="submit"
            disabled={action.kind === 'delete' && !selectedIds.length}>
            {action.kind === 'create' ? '建立' : action.kind === 'copy' ? '建立副本' : action.kind === 'delete' ? `刪除 ${selectedIds.length} 項` : '確認'}
          </button></footer>
      </form>
    </section>
  </div>, document.body);
}

export default function ZoneSettingsWorkspace({
  microphones = [], groups = [], active = true, visible = true, initialMaps,
  mapRequest, sidebarTarget, onToggleGroup, onMapOpenChange,
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
  const modalOpenerRef = useRef(null);
  const previousModalOpenRef = useRef(false);
  const inlineEditorRef = useRef(null);
  const modalEditorRef = useRef(null);
  const previousActionRef = useRef(null);
  const requestTokenRef = useRef(null);
  const nextId = useRef(1);
  const microphone = microphones.find(item => item.id === microphoneId) || microphones[0];
  const scopedGroups = getMicrophoneGroups(groups, microphone?.id);
  const group = scopedGroups.find(item => item.id === lastGroupByMicrophone[microphone?.id]);
  const settingsId = group ? library.assignments[group.id] : null;
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
    const modalClosed = previousModalOpenRef.current && !modalOpen;
    previousModalOpenRef.current = modalOpen;
    if (!active) {
      modalOpenerRef.current = null;
      return undefined;
    }
    if (!modalClosed) return undefined;
    const opener = modalOpenerRef.current;
    modalOpenerRef.current = null;
    let restoreFrame;
    // The parent first removes Configure's suspended/inert state in response to
    // onMapOpenChange. Restore after that commit, without stealing valid focus.
    const waitFrame = requestAnimationFrame(() => {
      restoreFrame = requestAnimationFrame(() => {
        const canFocus = element => element instanceof HTMLElement && element.isConnected
          && element !== document.body && element.getClientRects().length
          && !element.matches(':disabled') && !element.closest('[inert], [aria-hidden="true"]');
        if (!canFocus(document.activeElement) && canFocus(opener)) opener.focus();
      });
    });
    return () => {
      cancelAnimationFrame(waitFrame);
      if (restoreFrame) cancelAnimationFrame(restoreFrame);
    };
  }, [active, modalOpen]);

  useEffect(() => {
    const actionClosed = previousActionRef.current && !action;
    previousActionRef.current = action;
    if (!actionClosed || !active) return undefined;
    const frame = requestAnimationFrame(() => {
      const focused = document.activeElement;
      if (focused && focused !== document.body && focused.isConnected
        && focused.getClientRects().length && !focused.matches(':disabled')
        && !focused.closest('[inert]')) return;
      const addZone = [...editorHost.querySelectorAll('button')]
        .find(button => button.textContent.trim() === 'Add Zone');
      const target = [addZone, menuTriggerRef.current, document.getElementById(settingsSelectId)]
        .find(element => element && !element.disabled && element.getClientRects().length
          && !element.closest('[inert]'));
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [action, active, settingsSelectId, editorHost]);

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
    const requestedGroup = getMicrophoneGroups(groups, requestedMicrophone.id)
      .find(item => item.id === mapRequest.groupId);
    if (!requestedGroup) return;
    requestTokenRef.current = mapRequest.token;
    modalOpenerRef.current = document.activeElement;
    setMicrophoneId(requestedMicrophone.id);
    setLastGroupByMicrophone(previous => ({ ...previous, [requestedMicrophone.id]: requestedGroup.id }));
    setEntry({ groupId: requestedGroup.id, pickupMode: mapRequest.pickupMode });
    setAction(null);
    setMenuOpen(false);
    setModalOpen(true);
  }, [active, mapRequest, microphones, groups]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    menuRef.current?.querySelector('[role="menuitem"]:not(:disabled)')?.focus();
    const outside = event => { if (!menuRef.current?.contains(event.target)) setMenuOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [menuOpen]);

  useEffect(() => {
    if (!enabled) setMenuOpen(false);
  }, [enabled]);

  const selectGroup = id => {
    if (!microphone || !scopedGroups.some(item => item.id === id)) return;
    setLastGroupByMicrophone(previous => ({ ...previous, [microphone.id]: id }));
    setMenuOpen(false);
  };

  const openAction = (kind, addFirstZone = false) => {
    if (!group || !enabled) return;
    setMenuOpen(false);
    if (!addFirstZone) menuTriggerRef.current?.focus();
    setAction({ kind, settingsId: settings?.id, groupId: group.id, microphoneId: microphone.id,
      addFirstZone,
      newId: `custom-${microphone.id}-${Date.now()}-${nextId.current++}` });
  };

  const confirmAction = value => {
    // Validate before scheduling React state updates so the dialog can display
    // name conflicts without closing. No separate geometry-save step exists.
    const apply = previous => {
      if (action.kind === 'create' || action.kind === 'copy') {
        const created = createSettings(previous, groups, action.groupId, value, action.newId,
          action.kind === 'copy' ? action.settingsId : null);
        return action.addFirstZone ? updateSettingsZones(created, action.newId, [
          { id: 'zone-1', name: 'Zone 1', x: 0, y: 0, width: 2, height: 1.5 },
        ]) : created;
      }
      if (action.kind === 'rename') return renameSettings(previous, action.settingsId, value);
      return removeSettingsBatch(previous, groups, action.microphoneId, value);
    };
    apply(library);
    setLibrary(apply);
    setAction(null);
  };

  const updateMaps = updater => {
    if (!group || !settings || !enabled) return;
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
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
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
    <label htmlFor={settingsSelectId}>Zone Settings</label>
    <div className="select-field zone-settings-controls__select">
      <select id={settingsSelectId} aria-label="Zone Settings" value={settings?.id || ''} disabled={!group || !enabled}
        onChange={event => {
          if (!group || !enabled) return;
          setMenuOpen(false);
          setLibrary(previous => assignSettings(previous, groups, group.id, event.target.value || null));
        }}>
        {!settings && <option value="">{scopedSettings.length ? '選擇設定檔' : '尚無設定檔'}</option>}
        {scopedSettings.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select><Icon name="chevron" size={16} />
    </div>
  </div>;

  const settingsManagement = <div className="zone-settings-controls__manage" ref={menuRef}>
      <button ref={menuTriggerRef} className="zone-map__button zone-settings-controls__more" type="button" aria-label="管理設定檔"
        aria-haspopup="menu" aria-expanded={menuOpen} aria-controls={menuOpen ? menuId : undefined}
        disabled={!group || !enabled} onClick={() => setMenuOpen(previous => !previous)}
        onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setMenuOpen(true); } }}>⋯</button>
      {menuOpen && <div className="zone-settings-menu" id={menuId} role="menu" onKeyDown={handleMenuKeys}>
        <button type="button" role="menuitem" onClick={() => openAction('create')}><Icon name="plus" size={17} />新增設定檔</button>
        <button type="button" role="menuitem" disabled={!settings} onClick={() => openAction('rename')}><ActionIcon name="rename" />重新命名</button>
        <button type="button" role="menuitem" disabled={!settings} onClick={() => openAction('copy')}><ActionIcon name="copy" />建立副本</button>
        <button type="button" role="menuitem" className="is-danger" disabled={!scopedSettings.length} onClick={() => openAction('delete')}><ActionIcon name="delete" />刪除設定檔</button>
      </div>}
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

  const editor = microphone ? <ZoneMapPanel compactSettings toolbarStart={settingsControls} toolbarEnd={settingsManagement}
    groupId={group?.id ?? null} groupSelected={Boolean(group)} groups={scopedGroups} microphone={microphone} maps={maps} onMapsChange={updateMaps}
    mapIdentity={`${microphone.id}/${group?.id ?? 'none'}/${settings?.id || 'none'}`} readOnly={!settings} showReferences={false}
    onAddZoneWithoutSettings={group && !settings ? () => openAction('create', true) : undefined}
    enabled={!group || enabled} active={active && (visible || modalOpen) && !action}
    disabledMessage={group?.enabled === false ? `請先開啟左側的 ${group.name || group.id} 群組開關，再編輯區域。`
      : group && !enabled ? '請在 Channel Configure 中選擇 Talker Position，再編輯區域。' : undefined}
    emptyMessage={!scopedGroups.length ? '此麥克風尚未連接攝影機群組。' : !group ? '請先從左側選擇群組，開始設定區域。' : !settings ? scopedSettings.length
      ? '請選擇設定檔，或按 Add Zone 建立新的設定檔與區域。'
      : '請按 Add Zone，建立設定檔與第一個區域。' : undefined} /> : <p className="zone-settings-empty">尚未連接麥克風。</p>;

  const actionSettings = action && library.settings.find(item => item.id === action.settingsId);
  const actionSettingsList = action ? library.settings.filter(item => item.microphoneId === action.microphoneId) : [];
  const actionGroups = action ? getMicrophoneGroups(groups, action.microphoneId) : [];

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
      settingsList={actionSettingsList} groups={actionGroups} assignments={library.assignments}
      onClose={() => setAction(null)} onConfirm={confirmAction} />}
  </>;
}
