export function clampSpeed(value, minSpeed, maxSpeed) {
  return Math.min(maxSpeed, Math.max(minSpeed, value));
}

export function $id(id) {
  return document.getElementById(id);
}

export function qs(sel, ctx) {
  return (ctx || document).querySelector(sel);
}

export function getSpeedKmh(speed) {
  return Math.round(speed * 10);
}

export function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

export function getCurrentScore() {
  const el = $id('score');
  if (!el) return 0;
  const v = parseInt(el.textContent || el.innerText || '0', 10);
  return isNaN(v) ? 0 : v;
}

export function getCurrentLevel() {
  const el = $id('level');
  if (!el) return 1;
  const v = parseInt(el.textContent || el.innerText || '1', 10);
  return isNaN(v) ? 1 : v;
}

export function getCurrentSpeed() {
  const el = document.getElementById('speed');
  if (!el) return 0;
  const txt = (el.textContent || el.innerText || '0').replace(/[^0-9\.]/g, '');
  const v = parseFloat(txt || '0');
  return isNaN(v) ? 0 : v;
}

export function getCssScale(el) {
  try {
    const s = window.getComputedStyle(el).transform;
    if (!s || s === 'none') return 1;
    const m = s.match(/matrix\(([^)]+)\)/);
    if (!m) return 1;
    const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
    if (parts.length >= 1) return parts[0] || 1;
  } catch (e) {}
  return 1;
}
