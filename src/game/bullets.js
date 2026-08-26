import { gameConfig } from '../core/state.js';
import { playSound } from '../audio/soundManager.js';
import { lanes, H } from '../core/constants.js';

export function shootBullet(state, ui) {
  if (!state.running || state.paused || !state.player.alive) return;
  if (state.frames - (ui.lastShotFrame || -Infinity) < gameConfig.GUN_COOLDOWN_FRAMES) return;
  if (state.bulletsRemaining <= 0) return;

  ui.lastShotFrame = state.frames;
  state.bulletsRemaining--;
  playSound('shoot');

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

export function spawnAmmo(state) {
  const lane = Math.floor(Math.random() * 3);
  const ammo = {
    lane,
    x: lanes[lane],
    y: -100,
    width: 100,
    height: 100,
    speed: state.speed,
    type: 'ammo'
  };
  state.ammos.push(ammo);
}

export function updateAmmo(state, collides) {
  for (let i = state.ammos.length - 1; i >= 0; i--) {
    const a = state.ammos[i];
    a.y += state.speed;

    if (a.y > H + 50) {
      state.ammos.splice(i, 1);
      continue;
    }

    const aBox = { x: a.x - a.width / 2, y: a.y, width: a.width, height: a.height };
    const pBox = {
      x: state.player.x - state.player.width / 2,
      y: state.player.y,
      width: state.player.width,
      height: state.player.height
    };

    if (collides(aBox, pBox)) {
      const maxB = state.gunLevel * 10;
      state.bulletsRemaining = Math.min(state.bulletsRemaining + 10, maxB);
      state.floatingTexts.push({
        x: a.x,
        y: a.y,
        text: '+10 Ammo',
        startTime: Date.now(),
        duration: 1500
      });
      state.ammos.splice(i, 1);
    }
  }
}
