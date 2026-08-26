import { gameConfig } from '../core/state.js';
import { playSound } from '../audio/soundManager.js';
import { lanes, H } from '../core/constants.js';
import { incrementMissionProgress } from '../utils/dailyTracker.js';

export function shootBullet(state, ui) {
  if (!state.running || state.paused || !state.player.alive) return;
  if (state.frames - (ui.lastShotFrame || -Infinity) < gameConfig.GUN_COOLDOWN_FRAMES) return;
  if (state.bulletsRemaining <= 0) return;

  ui.lastShotFrame = state.frames;
  state.bulletsRemaining--;
  playSound('shoot');

  const p = state.player;
  let b = state.bulletPool && state.bulletPool.length ? state.bulletPool.pop() : null;
  if (b) {
    b.x = p.x;
    b.y = p.y;
    b.lane = p.lane;
    b.speed = 24;
  } else {
    b = {
      x: p.x,
      y: p.y,
      lane: p.lane,
      speed: 24
    };
  }
  state.bullets.push(b);
}

export function updateBullets(state) {
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.y -= b.speed;

    if (b.y < -20) {
      const removed = state.bullets.splice(i, 1)[0];
      if (!state.bulletPool) state.bulletPool = [];
      state.bulletPool.push(removed);
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
      const hitObj = state.obstacles[hitIndex];
      if (hitObj.type === 'car') incrementMissionProgress('carsShot');
      if (hitObj.type === 'oil') incrementMissionProgress('oilDestroyed');
      
      const removedObj = state.obstacles.splice(hitIndex, 1)[0];
      if (!state.obstaclePool) state.obstaclePool = [];
      state.obstaclePool.push(removedObj);

      const removedBullet = state.bullets.splice(i, 1)[0];
      if (!state.bulletPool) state.bulletPool = [];
      state.bulletPool.push(removedBullet);

      state.score += 25;
    }
  }
}

export function spawnAmmo(state) {
  const lane = Math.floor(Math.random() * 3);
  let ammo = state.ammoPool && state.ammoPool.length ? state.ammoPool.pop() : null;
  if (ammo) {
    ammo.lane = lane;
    ammo.x = lanes[lane];
    ammo.y = -100;
    ammo.width = 100;
    ammo.height = 100;
    ammo.speed = state.speed;
    ammo.type = 'ammo';
  } else {
    ammo = {
      lane,
      x: lanes[lane],
      y: -100,
      width: 100,
      height: 100,
      speed: state.speed,
      type: 'ammo'
    };
  }
  state.ammos.push(ammo);
}

export function updateAmmo(state, collides) {
  for (let i = state.ammos.length - 1; i >= 0; i--) {
    const a = state.ammos[i];
    a.y += state.speed;

    if (a.y > H + 50) {
      const removed = state.ammos.splice(i, 1)[0];
      if (!state.ammoPool) state.ammoPool = [];
      state.ammoPool.push(removed);
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
      let txt = state.textPool && state.textPool.length ? state.textPool.pop() : null;
      if (txt) {
        txt.x = a.x;
        txt.y = a.y;
        txt.text = '+10 Ammo';
        txt.startTime = Date.now();
        txt.duration = 1500;
      } else {
        txt = {
          x: a.x,
          y: a.y,
          text: '+10 Ammo',
          startTime: Date.now(),
          duration: 1500
        };
      }
      state.floatingTexts.push(txt);
      
      incrementMissionProgress('ammosCollected');
      const removed = state.ammos.splice(i, 1)[0];
      if (!state.ammoPool) state.ammoPool = [];
      state.ammoPool.push(removed);
    }
  }
}
