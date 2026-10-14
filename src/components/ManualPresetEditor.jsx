import { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import './ManualPresetEditor.css';

const DEFAULT_PRESET_NUMBERS = Array.from({ length: 255 }, (_, index) => index);
const DEFAULT_CAMERA_STATE = { pan: 0, tilt: 0, zoom: 1, autoFocus: true, focus: 50 };
const PAGE_SIZE = 9;

export default function ManualPresetEditor({
  cameraName,
  presetNumbers = DEFAULT_PRESET_NUMBERS,
  initialPresetNumber,
  cameraState = DEFAULT_CAMERA_STATE,
  onCameraStateChange,
  onBack,
  onSave,
  previewImageUrl,
}) {
  const presetKey = presetNumbers.join(',');
  const numbers = useMemo(() => [...new Set(presetNumbers.filter(Number.isFinite))], [presetKey]);
  const initialNumber = numbers.includes(initialPresetNumber) ? initialPresetNumber : numbers[0];
  const [selectedNumber, setSelectedNumber] = useState(initialNumber);
  const [page, setPage] = useState(Math.max(0, Math.floor(numbers.indexOf(initialNumber) / PAGE_SIZE)));
  const [saveStatus, setSaveStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const state = { ...DEFAULT_CAMERA_STATE, ...cameraState };
  const pageCount = Math.max(1, Math.ceil(numbers.length / PAGE_SIZE));
  const pageNumbers = numbers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    const nextNumber = numbers.includes(initialPresetNumber) ? initialPresetNumber : numbers[0];
    setSelectedNumber(nextNumber);
    setPage(Math.max(0, Math.floor(numbers.indexOf(nextNumber) / PAGE_SIZE)));
    setSaveStatus('');
  }, [cameraName, initialPresetNumber, presetKey]);

  function updateCamera(changes) {
    onCameraStateChange?.({ ...state, ...changes });
    setSaveStatus('');
  }

  function move(axis, delta) {
    const limit = axis === 'pan' ? 170 : 90;
    updateCamera({ [axis]: Math.max(-limit, Math.min(limit, state[axis] + delta)) });
  }

  function changePage(nextPage) {
    const boundedPage = Math.max(0, Math.min(pageCount - 1, nextPage));
    setPage(boundedPage);
    setSelectedNumber(numbers[boundedPage * PAGE_SIZE]);
    setSaveStatus('');
  }

  async function savePreset() {
    if (selectedNumber === undefined || saving) return;
    setSaving(true);
    setSaveStatus('');
    try {
      await onSave?.(selectedNumber, state);
      setSaveStatus(`Preset ${selectedNumber} saved`);
    } catch {
      setSaveStatus('Unable to save preset. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="manual-preset-editor" aria-label={`Set preset for ${cameraName}`}>
      <header className="manual-preset-editor__header">
        <h2>{cameraName}</h2>
        <button type="button" className="button manual-preset-editor__back" onClick={onBack} data-manual-preset-back>
          <span aria-hidden="true">←</span> Back
        </button>
      </header>

      <div className="manual-preset-editor__body">
        <div className="manual-preset-editor__preview-area">
          <div className="manual-preset-editor__preview" aria-label={`${cameraName} camera preview`}>
            {previewImageUrl ? (
              <img src={previewImageUrl} alt={`${cameraName} preview`} />
            ) : (
              <div className="manual-preset-editor__no-signal">
                <Icon name="camera" size={48} />
                <span>No signal</span>
              </div>
            )}
          </div>
        </div>

        <aside className="manual-preset-editor__controls" aria-label="PTZ Control Panel" tabIndex={0}>
          <h3>PTZ Control Panel</h3>
          <div className="manual-preset-editor__direction-pad" role="group" aria-label="Pan and tilt">
            <button type="button" className="manual-preset-editor__direction is-up" aria-label="Tilt up" disabled={state.tilt >= 90} onClick={() => move('tilt', 5)}>↑</button>
            <button type="button" className="manual-preset-editor__direction is-left" aria-label="Pan left" disabled={state.pan <= -170} onClick={() => move('pan', -5)}>←</button>
            <button type="button" className="manual-preset-editor__direction is-home" aria-label="Home camera position" onClick={() => updateCamera({ pan: 0, tilt: 0 })}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m3 11 9-8 9 8M6 9v11h12V9M10 20v-7h4v7" />
              </svg>
            </button>
            <button type="button" className="manual-preset-editor__direction is-right" aria-label="Pan right" disabled={state.pan >= 170} onClick={() => move('pan', 5)}>→</button>
            <button type="button" className="manual-preset-editor__direction is-down" aria-label="Tilt down" disabled={state.tilt <= -90} onClick={() => move('tilt', -5)}>↓</button>
          </div>

          <div className="manual-preset-editor__adjustment" role="group" aria-label="Camera focus">
            <span className="manual-preset-editor__control-label">Focus</span>
            <div className="manual-preset-editor__adjustment-actions">
              <button type="button" className={`manual-preset-editor__control-button manual-preset-editor__autofocus${state.autoFocus ? ' is-active' : ''}`} aria-label="Autofocus" aria-pressed={state.autoFocus} onClick={() => updateCamera({ autoFocus: !state.autoFocus })}>AF</button>
              <button type="button" className="manual-preset-editor__control-button" aria-label="Decrease focus" disabled={state.autoFocus || state.focus <= 0} onClick={() => updateCamera({ focus: Math.max(0, state.focus - 5) })}>−</button>
              <button type="button" className="manual-preset-editor__control-button" aria-label="Increase focus" disabled={state.autoFocus || state.focus >= 100} onClick={() => updateCamera({ focus: Math.min(100, state.focus + 5) })}>+</button>
            </div>
          </div>

          <div className="manual-preset-editor__adjustment" role="group" aria-label="Camera zoom">
            <span className="manual-preset-editor__control-label">Zoom</span>
            <div className="manual-preset-editor__adjustment-actions">
              <button type="button" className="manual-preset-editor__control-button" aria-label="Zoom out camera" disabled={state.zoom <= 1} onClick={() => updateCamera({ zoom: Math.max(1, state.zoom - 1) })}>−</button>
              <button type="button" className="manual-preset-editor__control-button" aria-label="Zoom in camera" disabled={state.zoom >= 10} onClick={() => updateCamera({ zoom: Math.min(10, state.zoom + 1) })}>+</button>
            </div>
          </div>

          <section className="manual-preset-editor__presets" aria-label="Preset setting">
            <div className="manual-preset-editor__preset-heading">
              <h4>Preset setting</h4>
              <div className="manual-preset-editor__pagination" role="group" aria-label="Preset pages">
                <button type="button" className="manual-preset-editor__page-button is-previous" aria-label="Previous preset page" disabled={page === 0} onClick={() => changePage(page - 1)}><Icon name="chevron" size={17} /></button>
                <span aria-label={`Preset page ${page + 1} of ${pageCount}`}>{page + 1}/{pageCount}</span>
                <button type="button" className="manual-preset-editor__page-button is-next" aria-label="Next preset page" disabled={page >= pageCount - 1} onClick={() => changePage(page + 1)}><Icon name="chevron" size={17} /></button>
              </div>
            </div>
            <div className="manual-preset-editor__preset-grid" role="group" aria-label="Preset numbers">
              {pageNumbers.map((number) => (
                <button
                  key={number}
                  type="button"
                  className={`manual-preset-editor__preset-number${selectedNumber === number ? ' is-selected' : ''}`}
                  aria-label={`Preset ${number}`}
                  aria-pressed={selectedNumber === number}
                  onClick={() => { setSelectedNumber(number); setSaveStatus(''); }}
                >{number}</button>
              ))}
            </div>
            <button type="button" className="button manual-preset-editor__save" disabled={selectedNumber === undefined || saving} onClick={savePreset}>{saving ? 'Saving…' : 'Save'}</button>
            <p className="manual-preset-editor__save-status" role="status">{saveStatus}</p>
          </section>
        </aside>
      </div>
    </section>
  );
}
