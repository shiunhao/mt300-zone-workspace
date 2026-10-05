import { MAP_ZOOM_MAX, MAP_ZOOM_MIN } from './useMapZoom';
import './MapViewControls.css';

function MapControlIcon({ action }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {action === 'center' ? (
        <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><circle cx="12" cy="12" r="2.5" /></>
      ) : (
        <><circle cx="10" cy="10" r="6.5" /><path d="m15 15 6 6M6.5 10h7" />{action === 'in' && <path d="M10 6.5v7" />}</>
      )}
    </svg>
  );
}

export default function MapViewControls({ zoom, onReset, onZoomIn, onZoomOut, maxZoom = MAP_ZOOM_MAX, disabled = false, label = 'Map', className = '' }) {
  return (
    <div className={`map-view-controls ${className}`.trim()} aria-label={`${label} view controls`}>
      <div className="map-view-controls__view">
        <div className="map-view-controls__heading"><span>View</span><output aria-live="polite" aria-label={`${label} zoom`}>{zoom}%</output></div>
        <div className="map-view-controls__buttons">
          <button type="button" title="Center microphone and reset zoom" aria-label={`Center ${label.toLowerCase()} and reset zoom`} disabled={disabled} onClick={onReset}><MapControlIcon action="center" /></button>
          <button type="button" title="Zoom out" aria-label={`Zoom ${label.toLowerCase()} out`} disabled={disabled || zoom <= MAP_ZOOM_MIN} onClick={onZoomOut}><MapControlIcon action="out" /></button>
          <button type="button" title="Zoom in" aria-label={`Zoom ${label.toLowerCase()} in`} disabled={disabled || zoom >= maxZoom} onClick={onZoomIn}><MapControlIcon action="in" /></button>
        </div>
      </div>
      <div className="map-view-controls__coordinates"><span>Coordinates</span><strong>(No Signal)</strong></div>
    </div>
  );
}
