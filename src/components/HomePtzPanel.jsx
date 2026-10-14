import { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import './HomePtzPanel.css';

const DEFAULT_CAMERA_STATE = { pan: 0, tilt: 0, zoom: 1, autoFocus: true, focus: 50 };
const DEFAULT_PRESET_NUMBERS = Array.from({ length: 255 }, (_, number) => number);
const PRESET_PAGE_SIZE = 9;

export default function HomePtzPanel({
  disabled = true,
  cameraName = '',
  cameraState = DEFAULT_CAMERA_STATE,
  onCameraStateChange,
  presetNumbers = DEFAULT_PRESET_NUMBERS,
  onRecallPreset,
  selectedPreset = null,
}) {
  const state = { ...DEFAULT_CAMERA_STATE, ...cameraState };
  const presetKey = presetNumbers.join(',');
  const numbers = useMemo(() => [...new Set(presetNumbers.filter((number) => Number.isInteger(number) && number >= 0 && number <= 254))], [presetKey]);
  const [page, setPage] = useState(0);
  const [highlightedPreset, setHighlightedPreset] = useState(selectedPreset);
  const pageCount = Math.max(1, Math.ceil(numbers.length / PRESET_PAGE_SIZE));
  const boundedPage = Math.min(page, pageCount - 1);
  const visibleNumbers = numbers.slice(boundedPage * PRESET_PAGE_SIZE, (boundedPage + 1) * PRESET_PAGE_SIZE);

  useEffect(() => {
    const selectedIndex = numbers.indexOf(selectedPreset);
    setPage(selectedIndex >= 0 ? Math.floor(selectedIndex / PRESET_PAGE_SIZE) : 0);
    setHighlightedPreset(selectedIndex >= 0 ? selectedPreset : null);
  }, [cameraName, selectedPreset, presetKey]);

  function updateCamera(changes) {
    if (disabled) return;
    onCameraStateChange?.({ ...state, ...changes });
  }

  function move(axis, delta) {
    const limit = axis === 'pan' ? 170 : 90;
    updateCamera({ [axis]: Math.max(-limit, Math.min(limit, state[axis] + delta)) });
  }

  function changePage(nextPage) {
    if (disabled) return;
    setPage(Math.max(0, Math.min(pageCount - 1, nextPage)));
    setHighlightedPreset(null);
  }

  function recallPreset(number) {
    if (disabled) return;
    setHighlightedPreset(number);
    onRecallPreset?.(number);
  }

  return (
    <section className={`home-ptz${disabled ? ' is-disabled' : ''}`} aria-label={cameraName ? `PTZ controls for ${cameraName}` : 'PTZ Control Panel'}>
      <h2 className="home-ptz__heading">PTZ Control Panel</h2>

      <div className="home-ptz__direction-area">
        <div className="home-ptz__direction-pad" role="group" aria-label="Live camera pan and tilt">
          <button type="button" className="home-ptz__direction is-up" aria-label="Live tilt up" disabled={disabled || state.tilt >= 90} onClick={() => move('tilt', 5)}><span aria-hidden="true">▲</span></button>
          <button type="button" className="home-ptz__direction is-left" aria-label="Live pan left" disabled={disabled || state.pan <= -170} onClick={() => move('pan', -5)}><span aria-hidden="true">◀</span></button>
          <button type="button" className="home-ptz__direction is-home" aria-label="Live home camera position" disabled={disabled} onClick={() => updateCamera({ pan: 0, tilt: 0 })}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 11 12 2l10 9-2 2-2-1.8V22h-5v-7h-2v7H6V11.2L4 13z" /></svg>
          </button>
          <button type="button" className="home-ptz__direction is-right" aria-label="Live pan right" disabled={disabled || state.pan >= 170} onClick={() => move('pan', 5)}><span aria-hidden="true">▶</span></button>
          <button type="button" className="home-ptz__direction is-down" aria-label="Live tilt down" disabled={disabled || state.tilt <= -90} onClick={() => move('tilt', -5)}><span aria-hidden="true">▼</span></button>
        </div>
      </div>

      <div className="home-ptz__lens-controls">
        <div className="home-ptz__adjustment" role="group" aria-label="Live camera focus">
          <button type="button" className={`home-ptz__focus-mode${state.autoFocus ? ' is-auto' : ''}`} aria-label="Live autofocus" aria-pressed={state.autoFocus} disabled={disabled} onClick={() => updateCamera({ autoFocus: !state.autoFocus })} title={state.autoFocus ? 'Autofocus' : 'Manual focus'}>{state.autoFocus ? 'AF' : 'MF'}</button>
          <button type="button" className="home-ptz__adjust-button" aria-label="Live decrease focus" disabled={disabled || state.autoFocus || state.focus <= 0} onClick={() => updateCamera({ focus: Math.max(0, state.focus - 5) })}>−</button>
          <button type="button" className="home-ptz__adjust-button" aria-label="Live increase focus" disabled={disabled || state.autoFocus || state.focus >= 100} onClick={() => updateCamera({ focus: Math.min(100, state.focus + 5) })}>+</button>
        </div>
        <div className="home-ptz__adjustment" role="group" aria-label="Live camera zoom">
          <span className="home-ptz__zoom-icon" title="Zoom"><Icon name="search" size={24} /></span>
          <button type="button" className="home-ptz__adjust-button" aria-label="Live zoom out" disabled={disabled || state.zoom <= 1} onClick={() => updateCamera({ zoom: Math.max(1, state.zoom - 1) })}>−</button>
          <button type="button" className="home-ptz__adjust-button" aria-label="Live zoom in" disabled={disabled || state.zoom >= 10} onClick={() => updateCamera({ zoom: Math.min(10, state.zoom + 1) })}>+</button>
        </div>
      </div>

      <section className="home-ptz__presets" aria-label="Live preset setting">
        <h3>Preset setting</h3>
        <div className="home-ptz__preset-picker">
          <button type="button" className="home-ptz__page-button is-previous" aria-label="Live previous preset page" disabled={disabled || boundedPage === 0 || numbers.length === 0} onClick={() => changePage(boundedPage - 1)}><Icon name="chevron" size={19} /></button>
          <div className="home-ptz__preset-grid" role="group" aria-label="Live preset numbers">
            {visibleNumbers.map((number) => (
              <button type="button" key={number} className={`home-ptz__preset-number${highlightedPreset === number ? ' is-selected' : ''}`} aria-label={`Live select preset ${number}`} aria-pressed={highlightedPreset === number} disabled={disabled} onClick={() => recallPreset(number)}>{number}</button>
            ))}
            {Array.from({ length: Math.max(0, PRESET_PAGE_SIZE - visibleNumbers.length) }, (_, index) => <span className="home-ptz__empty-preset" aria-hidden="true" key={`empty-${index}`} />)}
          </div>
          <button type="button" className="home-ptz__page-button is-next" aria-label="Live next preset page" disabled={disabled || boundedPage >= pageCount - 1 || numbers.length === 0} onClick={() => changePage(boundedPage + 1)}><Icon name="chevron" size={19} /></button>
        </div>
        <span className="home-ptz__page-count" aria-label={`Live preset page ${boundedPage + 1} of ${pageCount}`}>{boundedPage + 1}/{pageCount}</span>
      </section>

      <p className="home-ptz__sr-only" role="status">{disabled ? 'Select a camera in the live view to use PTZ controls.' : `${cameraName}: pan ${state.pan} degrees, tilt ${state.tilt} degrees, zoom ${state.zoom} times, ${state.autoFocus ? 'autofocus' : `manual focus ${state.focus}`}.`}</p>
    </section>
  );
}
