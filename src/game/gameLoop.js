import { state, ui } from '../core/state.js';
import { createPlayer } from './player.js';
import { playSound, stopBgMusic, playBgMusic } from '../audio/soundManager.js';
import { setRoadOffset } from '../core/constants.js';

export function resetToIdleScreen() {
  state.running = false;
  state.paused = false;
  state.score = 0;
  state.distance = 0;
  state.lastAmmoDistance = 0;
  state.scoreFromCoins = 0;
  state.level = 1;
  state.speed = 3;
  state.speedTarget = 3;
  state.spawnTimer = 0;
  state.spawnInterval = 90;
  state.obstacles.length = 0;
  state.bullets.length = 0;
  state.ammos.length = 0;
  state.bulletsRemaining = (state.gunLevel || 1) * 10;
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

export function startGame(mode = state.difficultyMode || 'easy') {
  if (state.running) return;
  state.difficultyMode = mode;
  stopBgMusic();
  state.trees.length = 0;
  state.running = true;
  state.paused = false;
  state.score = 0;
  state.distance = 0;
  state.lastAmmoDistance = 0;
  state.scoreFromCoins = 0;
  state.level = 1;
  state.speed = 3;
  state.minSpeed = 2;
  state.maxSpeed = 12;
  state.speedTarget = 3;
  state.spawnInterval = 90;
  state.obstacles.length = 0;
  state.bullets.length = 0;
  state.ammos.length = 0;
  state.bulletsRemaining = (state.gunLevel || 1) * 10;
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
