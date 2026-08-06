export function collides(a, b) {
  return Math.abs(a.x - b.x) * 2 < (a.width + b.width) &&
         Math.abs(a.y - b.y) * 2 < (a.height + b.height);
}

export function rectContains(rx, ry, rw, rh, x, y) {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}
