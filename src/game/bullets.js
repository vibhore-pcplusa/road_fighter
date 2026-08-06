import { gameConfig } from '../core/state.js';

export function shootBullet(state, ui) {
  if (!state.running || state.paused || !state.player.alive) return;
  if (state.frames - (ui.lastShotFrame || -Infinity) < gameConfig.GUN_COOLDOWN_FRAMES) return;
  if (state.bulletsRemaining <= 0) return;

  ui.lastShotFrame = state.frames;
  state.bulletsRemaining--;

  const p = state.player;
  state.bullets.push({
    x: p.x,
    y: p.y,
    lane: p.lane,
    speed: 24
  });
}

export function updateBullets(state) {
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.y -= b.speed;

    if (b.y < -20) {
      state.bullets.splice(i, 1);
      continue;
    }

    let hitIndex = -1;
    for (let j = state.obstacles.length - 1; j >= 0; j--) {
      const o = state.obstacles[j];
      if (o.lane !== b.lane) continue;
      if (Math.abs(o.y - b.y) < o.height / 2 + 10) {
        hitIndex = j;
        break;
      }
    }

    if (hitIndex !== -1) {
      state.obstacles.splice(hitIndex, 1);
      state.bullets.splice(i, 1);
      state.score += 25;
    }
  }
}
