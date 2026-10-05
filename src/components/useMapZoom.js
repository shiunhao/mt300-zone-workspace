import { useCallback, useEffect, useRef, useState } from 'react';

export const MAP_ZOOM_MIN = 25;
export const MAP_ZOOM_MAX = 125;
export const MAP_ZOOM_DEFAULT = 100;
const STEP = 25;
const WHEEL_THRESHOLD = 60;
const WHEEL_INTERVAL = 80;

// Wheel handling belongs to the canvas, never the document. A non-passive
// listener keeps the page still even when the map reaches either zoom limit.
export default function useMapZoom({ enabled = true, maxZoom = MAP_ZOOM_MAX } = {}) {
  const mapRef = useRef(null);
  const [zoom, setZoom] = useState(MAP_ZOOM_DEFAULT);
  const gestureRef = useRef({ accumulated: 0, direction: 0, lastEvent: 0, lastStep: 0 });
  const reset = useCallback(() => {
    setZoom(MAP_ZOOM_DEFAULT);
    gestureRef.current = { accumulated: 0, direction: 0, lastEvent: 0, lastStep: 0 };
  }, []);
  const zoomIn = useCallback(() => setZoom((value) => Math.min(maxZoom, Math.max(MAP_ZOOM_MIN, value + STEP))), [maxZoom]);
  const zoomOut = useCallback(() => setZoom((value) => Math.min(maxZoom, Math.max(MAP_ZOOM_MIN, value - STEP))), [maxZoom]);

  useEffect(() => {
    const canvas = mapRef.current;
    if (!enabled || !canvas) return undefined;
    function onWheel(event) {
      if (event.target instanceof Element && event.target.closest('input, select, textarea, [contenteditable="true"]')) return;
      if (event.deltaY === 0) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight || 800 : 1);
      const direction = Math.sign(delta);
      const now = performance.now();
      const gesture = gestureRef.current;
      if (direction !== gesture.direction || now - gesture.lastEvent > 180) {
        gesture.accumulated = 0;
        gesture.lastStep = 0;
      }
      gesture.direction = direction;
      gesture.lastEvent = now;
      gesture.accumulated += Math.abs(delta);
      if (gesture.accumulated < WHEEL_THRESHOLD || (gesture.lastStep && now - gesture.lastStep < WHEEL_INTERVAL)) return;
      // One step per event prevents high-resolution trackpads from jumping
      // across the entire range while still accumulating small movements.
      gesture.accumulated = Math.min(WHEEL_THRESHOLD - 1, gesture.accumulated - WHEEL_THRESHOLD);
      gesture.lastStep = now;
      setZoom((value) => Math.min(maxZoom, Math.max(MAP_ZOOM_MIN, value + (direction < 0 ? STEP : -STEP))));
    }
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [enabled, maxZoom]);

  return { mapRef, zoom, reset, zoomIn, zoomOut };
}
