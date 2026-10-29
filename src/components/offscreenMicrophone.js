// All coordinates are CSS pixels in the visible canvas, including SVG letterboxing.
export function getOffscreenMicrophone({ width, height, x, y }) {
  if (![width, height, x, y].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  if (x >= 0 && x <= width && y >= 0 && y <= height) return null;

  const centerX = width / 2;
  const centerY = height / 2;
  const dx = x - centerX;
  const dy = y - centerY;
  const insetX = Math.min(22, centerX);
  const insetY = Math.min(26, centerY);
  const tx = dx === 0 ? Infinity : (centerX - insetX) / Math.abs(dx);
  const ty = dy === 0 ? Infinity : (centerY - insetY) / Math.abs(dy);
  const t = Math.min(tx, ty);
  const edge = tx <= ty ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'top' : 'bottom');
  const indicatorX = centerX + dx * t;
  const indicatorY = centerY + dy * t;

  const label = {
    left: { x: 15, y: 0, anchor: 'start' },
    right: { x: -15, y: 0, anchor: 'end' },
    top: { x: 0, y: 20, anchor: 'middle' },
    bottom: { x: 0, y: -20, anchor: 'middle' },
  }[edge];
  return {
    x: indicatorX,
    y: indicatorY,
    angle: Math.atan2(y - indicatorY, x - indicatorX) * 180 / Math.PI,
    edge,
    label,
  };
}
