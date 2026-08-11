import { state, ui } from '../core/state.js';
import { createPlayer, updatePlayerPosition } from './player.js';
import { updateObstacles, spawnObstacle } from './obstacles.js';
import { updateCoins, spawnCoin } from './coins.js';
import { updateBullets } from './bullets.js';
import { updateTrees, spawnTree } from './trees.js';
import { updateFloatingTexts } from './floatingText.js';
import { collides } from '../utils/collision.js';
import { playSound, stopBgMusic, playBgMusic } from '../audio/soundManager.js';
import { setRoadOffset } from '../core/constants.js';

export function resetToIdleScreen() {
  state.running = false;
  state.paused = false;
  state.score = 0;
  state.distance = 0;
  state.scoreFromCoins = 0;
  state.level = 1;
  state.speed = 3;
  state.speedTarget = 3;
  state.spawnTimer = 0;
  state.spawnInterval = 90;
  state.obstacles.length = 0;
  state.bullets.length = 0;
  state.bulletsRemaining = 10;
  state.coins.length = 0;
  state.floatingTexts.length = 0;
  state.trees.length = 0;
  state.frames = 0;
  setRoadOffset(0);
  state.player = createPlayer();
  state.player.alive = true;
  state.explosion = null;
  ui.lastShotFrame = -Infinity;
  ui.pauseLabel = 'Pause';
  ui.saveName = '';
  ui.showHighScorePrompt = false;
  ui.highScoreChecked = false;
  
  if (ui.hiddenInput) {
    ui.inputActive = false;
    ui.hiddenInput.style.visibility = 'hidden';
    ui.hiddenInput.style.clip = 'rect(0,0,0,0)';
    ui.hiddenInput.style.pointerEvents = 'none';
    ui.hiddenInput.blur();
  }
}

export function startGame() {
  if (state.running) return;
  stopBgMusic();

  state.trees.length = 0;
  state.running = true;
  state.paused = false;
  state.score = 0;
  state.distance = 0;
  state.scoreFromCoins = 0;
  state.level = 1;
  state.speed = 3;
  state.minSpeed = 2;
  state.maxSpeed = 12;
  state.speedTarget = 3;
  state.spawnInterval = 90;
  state.obstacles.length = 0;
  state.bullets.length = 0;
  state.bulletsRemaining = 10;
  state.coins.length = 0;
  state.floatingTexts.length = 0;
  state.trees.length = 0;
  state.explosion = null;
  setRoadOffset(0);
  state.frames = 0;
  state.spawnTimer = 0;
  state.player = createPlayer();
  state.player.alive = true;
  ui.lastShotFrame = -Infinity;
  ui.startLabel = 'Running';
  ui.pauseLabel = 'Pause';
  ui.saveName = '';

  playBgMusic();
}

export function togglePause() {
  state.paused = !state.paused;
  ui.pauseLabel = state.paused ? 'Resume' : 'Pause';
  if (state.paused) {
    playSound('pause');
    stopBgMusic();
  } else {
    playSound('pause');
    playBgMusic();
  }
}

export function updateGameLogic(roadOffset) {
  if (!state.running || state.paused) return;

  state.frames++;
  const isBraking = ui.holding === 'brake';

  if (ui.holding) {
    ui.holdFrames++;
    if (ui.holding === 'accelerate') {
      state.speedTarget = Math.min(state.maxSpeed, state.speedTarget + 0.02);
    } else if (ui.holding === 'brake') {
      state.speedTarget = Math.max(0, state.speedTarget - 0.12);
    } else if (ui.holding === 'left' && ui.holdFrames % 12 === 0) {
      // handled by player module
    } else if (ui.holding === 'right' && ui.holdFrames % 12 === 0) {
      // handled by player module
    }
  } else {
    if (state.speedTarget < state.minSpeed) {
      state.speedTarget = Math.min(state.minSpeed, state.speedTarget + 0.015);
    } else {
      state.speedTarget = Math.max(state.minSpeed, state.speedTarget - 0.015);
    }
  }

  state.speed += (state.speedTarget - state.speed) * 0.12;
  if (Math.abs(state.speedTarget - state.speed) < 0.001) {
    state.speed = state.speedTarget;
  }

  state.speed = Math.max(0, Math.min(state.maxSpeed, state.speed));

  state.spawnTimer++;
  if (state.spawnTimer >= state.spawnInterval) {
    state.spawnTimer = 0;
    spawnObstacle(state);
    if (Math.random() < 0.3) spawnCoin(state);

    spawnTree(state);
    spawnTree(state);

    if (state.spawnInterval > 36 && state.frames % 600 === 0) {
      state.spawnInterval -= 6;
    }
  }

  updateObstacles(state);
  updateTrees(state);
  updateCoins(state, collides, (x, y, t) => {
    state.floatingTexts.push({ x, y, text: t, startTime: Date.now(), duration: 1500 });
  });
  updateBullets(state);
  updateFloatingTexts(state);

  state.distance += state.speed * 0.1;
  const distanceScore = Math.floor(state.distance);
  if (!state.scoreFromCoins) state.scoreFromCoins = 0;
  state.score = distanceScore + state.scoreFromCoins;

  const newLevel = Math.floor(state.distance / 400) + 1;
  if (newLevel !== state.level) {
    state.level = newLevel;
    state.speed += 0.6;
    state.minSpeed = 2 + (state.level - 1) * 2;
    state.maxSpeed = 12 + (state.level - 1) * 2;
  }

  setRoadOffset(roadOffset + state.speed * 0.8);

  for (const o of state.obstacles) {
    if (!state.running) break;
    const objBox = {
      x: o.x,
      y: o.y + o.height / 2,
      width: o.width,
      height: o.height
    };
    const pBox = {
      x: state.player.x,
      y: state.player.y + state.player.height / 2,
      width: state.player.width,
      height: state.player.height
    };

    if (collides(objBox, pBox)) {
      state.player.alive = false;
      state.running = false;
      state.explosion = {
        start: Date.now(),
        x: state.player.x,
        y: state.player.y
      };
      playSound("crash");
      stopBgMusic();
      return false;
    }
  }

  return true;
}
