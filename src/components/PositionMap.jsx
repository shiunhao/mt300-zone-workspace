import { useId } from 'react';
import MapViewControls from './MapViewControls';
import useMapZoom from './useMapZoom';
import './PositionMap.css';

export default function PositionMap({ groupName = 'G2', microphoneLabel = 'MIC', showControls = true, interactive = true }) {
  const { mapRef, zoom, reset, zoomIn, zoomOut } = useMapZoom({ enabled: interactive });
  const gridId = `position-grid-${useId().replaceAll(':', '')}`;
  const gridSize = (36 * zoom) / 100;

  return (
    <section ref={mapRef} className="position-map" aria-label={`${groupName} ${microphoneLabel} position map`}>
      <svg className="position-map__grid" width="100%" height="100%" aria-hidden="true">
        <defs>
          <pattern id={gridId} width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
            <path d={`M ${gridSize} 0 H 0 V ${gridSize}`} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 2.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${gridId})`} />
        <line className="position-map__axis" x1="0" y1="50%" x2="100%" y2="50%" />
        <line className="position-map__axis" x1="50%" y1="0" x2="50%" y2="100%" />
      </svg>

      <div className="position-map__microphone" title={microphoneLabel} aria-label={`${microphoneLabel} at map center`}>
        <svg viewBox="0 0 32 34" aria-hidden="true">
          <rect x="2.5" y="2.5" width="27" height="29" rx="1.5" />
          <rect className="position-map__microphone-body" x="8" y="7" width="16" height="20" rx="1" />
          <path d="M11 10h10M11 13h10M11 16h10M13 24h6" />
          <circle cx="16" cy="20.5" r="1" />
        </svg>
      </div>

      {showControls && <MapViewControls zoom={zoom} onReset={reset} onZoomIn={zoomIn} onZoomOut={zoomOut} />}
    </section>
  );
}
