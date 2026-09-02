import { state, ui, gameConfig } from './core/state.js';
import { canvas, ctx, W, H, lanes, getRoadOffset, setRoadOffset } from './core/constants.js';
import { loadTreeImages, loadSprites, loadControlImages, getAllAssets, getTrees, getImages, getControlImages } from './assets/imageLoader.js';
import { playSound, stopAllActiveSounds, playBgMusic, stopBgMusic } from './audio/soundManager.js';
import { collides, rectContains } from './utils/collision.js';
import { clampSpeed, drawRoundedRect, $id, getSpeedKmh } from './utils/helpers.js';
import { loadLeadersFromStorage, saveLeadersToStorage, addLeaderEntry, loadPlayerStats, savePlayerStats, loadInventory, saveInventory } from './utils/storage.js';
import { checkDailyReset, loadDailyData, claimDailyLogin, claimDailyMission, canPlayRPS, getRPSPlays, incrementRPSPlays } from './utils/dailyTracker.js';
import { getCPUChoice, playRPS, RPS_CHOICES, RPS_RESULTS } from './utils/rpsGame.js';
import { createPlayer, moveLeft, moveRight, updatePlayerPosition } from './game/player.js';
import { spawnObstacle, updateObstacles } from './game/obstacles.js';
import { spawnCoin, updateCoins } from './game/coins.js';
import { shootBullet, updateBullets, spawnAmmo, updateAmmo } from './game/bullets.js';
import { spawnTree, updateTrees } from './game/trees.js';
import { addFloatingText, updateFloatingTexts } from './game/floatingText.js';
import { resetToIdleScreen, startGame, togglePause } from './game/gameLoop.js';
import { drawRoad, drawStartScreen, drawHUD, drawLoadingScreen, drawRotateToPortrait } from './ui/rendering.js';
import { drawGameOverOverlay } from './ui/gameOverScreen.js';
import { drawLeadersPanel, drawControlsPanel, drawStatsPanel, drawShopPanel, drawDailyPanel } from './ui/panels.js';
import { renderGameObjects, renderCanvasControls, renderExplosion } from './ui/gameRenderer.js';

let assetsReady = false;
let _assetsProgress = 0;
let _assetsLoadingStuck = false;
let showRotateToPortrait = false;

const trees = loadTreeImages();
const images = loadSprites();
const controlImgs = loadControlImages();

state.player = createPlayer();

function updatePortraitState() {
  showRotateToPortrait = window.innerWidth > window.innerHeight;
  ui.toast = showRotateToPortrait ? 'Please rotate back to portrait mode' : null;
}

window.addEventListener('resize', updatePortraitState);
window.addEventListener('orientationchange', updatePortraitState);
updatePortraitState();

function drawToastMessage() {
  if (!ui.toast) return;
  ctx.save();

  ctx.font = 'bold 22px sans-serif';
  const textW = ctx.measureText(ui.toast).width;
  const boxW = Math.max(320, textW + 60);
  const boxX = W / 2 - boxW / 2;
  const boxY = 165;
  const boxH = 55;
  const borderRadius = 10;

  // Draw rounded rectangle background
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(boxX + borderRadius, boxY);
  ctx.lineTo(boxX + boxW - borderRadius, boxY);
  ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + borderRadius);
  ctx.lineTo(boxX + boxW, boxY + boxH - borderRadius);
  ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - borderRadius, boxY + boxH);
  ctx.lineTo(boxX + borderRadius, boxY + boxH);
  ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - borderRadius);
  ctx.lineTo(boxX, boxY + borderRadius);
  ctx.quadraticCurveTo(boxX, boxY, boxX + borderRadius, boxY);
  ctx.closePath();
  ctx.fill();

  // Determine text color based on message type
  let textColor = '#000000';
  if (ui.toast.includes('blank') || ui.toast.includes('failed') || ui.toast.includes('error')) {
    textColor = '#ff0000';
  } else if (ui.toast.includes('Saved')) {
    textColor = '#00aa00';
  }

  // Draw border
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw text
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(ui.toast, W / 2, 198);
  ctx.restore();
}

function render() {
  if (showRotateToPortrait) {
    drawRotateToPortrait();
    return;
  }
  if (!assetsReady) {
    drawLoadingScreen(_assetsProgress || 0);
    return;
  }

  ctx.clearRect(0, 0, W, H);
  drawRoad();
  renderGameObjects(images, trees, controlImgs);
  drawHUD();
  renderCanvasControls(controlImgs);

  if (!state.running && state.player.alive) {
    drawStartScreen();
  }

  drawTopmostPanels();
  renderExplosion();

  if (!state.running && !state.player.alive) {
    drawGameOverOverlay(renderExplosion);
  }

  drawToastMessage();
}

function update() {
  if (showRotateToPortrait) return;
  if (!state.running || state.paused) return;

  state.frames++;
  const isBraking = ui.activeControls.down;

  const anyActive = ui.activeControls.up || ui.activeControls.down || ui.activeControls.left || ui.activeControls.right;
  if (anyActive) {
    ui.holdFrames++;
  } else {
    ui.holdFrames = 0;
  }

  if (ui.activeControls.up) {
    state.speedTarget = Math.min(state.maxSpeed, state.speedTarget + 0.02);
  } else if (ui.activeControls.down) {
    state.speedTarget = Math.max(0, state.speedTarget - 0.12);
  } else {
    if (state.speedTarget < state.minSpeed) {
      state.speedTarget = Math.min(state.minSpeed, state.speedTarget + 0.015);
    } else {
      state.speedTarget = Math.max(state.minSpeed, state.speedTarget - 0.015);
    }
  }

  if (ui.activeControls.left && ui.holdFrames % 12 === 0) {
    moveLeft(state, playSound);
  }
  if (ui.activeControls.right && ui.holdFrames % 12 === 0) {
    moveRight(state, playSound);
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
  updateCoins(state, collides);
  updateBullets(state);
  updateAmmo(state, collides);
  updateFloatingTexts(state);

  state.distance += state.speed * 0.1;

  // Calculate day/night cycle based on 800m intervals (0 = day, 1 = night)
  if (state.difficultyMode === 'hard') {
    state.nightMode = (-Math.cos(state.distance * Math.PI / 800) + 1) / 2;
  } else {
    state.nightMode = 0;
  }

  if (state.distance >= state.lastAmmoDistance + 200) {
    state.lastAmmoDistance += 200;
    spawnAmmo(state);
  }

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

  let roadOffset = getRoadOffset();
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
      prepareGameOverState();
      break;
    }
  }

  updatePlayerPosition(state.player);
}

function handleInput() {
  if (!state.running) return;
  if (keys["arrowup"] || keys["w"]) state.speedTarget = Math.min(state.maxSpeed, state.speedTarget + 0.2);
  if (keys["arrowdown"] || keys["s"]) state.speedTarget = Math.max(0, state.speedTarget - 0.2);
}

function drawTopmostPanels() {
  if (ui.panels.leaders) drawLeadersPanel();
  if (ui.panels.controls) drawControlsPanel();
  if (ui.panels.stats) drawStatsPanel();
  if (ui.panels.shop) drawShopPanel();
  if (ui.panels.daily) drawDailyPanel();
}

function loop() {
  requestAnimationFrame(loop);
  handleInput();
  update();
  render();
}

const keys = {};

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';

  if (!isTyping && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();

  switch (e.key) {
    case "ArrowLeft":
      moveLeft(state, playSound);
      break;
    case "ArrowUp":
      state.speedTarget = Math.min(state.maxSpeed, state.speedTarget + 0.4);
      playSound("accelerate");
      break;
    case "ArrowDown":
      state.speedTarget = Math.max(0, state.speedTarget - 0.4);
      playSound("brake");
      break;
    case "ArrowRight":
      moveRight(state, playSound);
      break;
  }
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function preloadAssets(options) {
  options = options || {};
  const timeoutMs = options.timeoutMs || 30000;
  const imgs = getAllAssets();
  const audios = Object.values({ accelerate: new Audio(), brake: new Audio(), move: new Audio(), crash: new Audio(), pause: new Audio(), bg: new Audio() });

  const totalImages = imgs.length;
  if (totalImages === 0) {
    assetsReady = true;
    _assetsProgress = 100;
    return Promise.resolve();
  }

  let loadedImages = 0;
  const markImageLoaded = function () {
    loadedImages++;
    _assetsProgress = Math.round(loadedImages / totalImages * 100);
    if (_assetsProgress > 100) _assetsProgress = 100;
  };

  return new Promise((resolve) => {
    let finished = false;
    const failedImages = [];
    const tryFinish = function () {
      if (finished) return;
      if (loadedImages >= totalImages) {
        finished = true;
        assetsReady = true;
        _assetsProgress = 100;
        resolve();
      }
    };

    imgs.forEach(function (img) {
      if (!img) {
        markImageLoaded();
        tryFinish();
        return;
      }
      if (img.complete && img.naturalWidth && img.naturalWidth > 0) {
        markImageLoaded();
        tryFinish();
        return;
      }
      const onl = function () {
        if (img.naturalWidth && img.naturalWidth > 0) {
          img.removeEventListener('load', onl);
          img.removeEventListener('error', one);
          markImageLoaded();
          tryFinish();
        } else {
          one();
        }
      };
      const one = function () {
        img.removeEventListener('load', onl);
        img.removeEventListener('error', one);
        failedImages.push(img && img.src);
        markImageLoaded();
        tryFinish();
        if (_assetsLoadingStuck) _assetsLoadingStuck = false;
      };
      img.addEventListener('load', onl);
      img.addEventListener('error', one);
      try {
        if (!img.src) img.src = img.getAttribute && img.getAttribute('data-src') || img.src || '';
      } catch (e) { }
    });

    setTimeout(function () {
      if (finished) return;
      _assetsLoadingStuck = true;
      _assetsProgress = Math.round(loadedImages / totalImages * 100);
    }, timeoutMs);
  });
}

function evaluateHighScore() {
  const list = state.leaders || [];
  if (list.length < 10) {
    ui.showHighScorePrompt = true;
  } else {
    const lowest = list[list.length - 1];
    ui.showHighScorePrompt = state.score > (lowest.score || 0);
  }
  ui.highScoreChecked = true;
  if (ui.showHighScorePrompt) {
    ui.saveName = '';
    ui.inputActive = false;
  }
}

function prepareGameOverState() {
  ui.showHighScorePrompt = false;
  ui.highScoreChecked = false;

  // Save coins and run stats
  state.totalCoins += state.scoreFromCoins;
  state.lastRuns.unshift({
    score: state.score,
    distance: Math.floor(state.distance),
    coins: state.scoreFromCoins,
    date: Date.now()
  });
  savePlayerStats({ totalCoins: state.totalCoins, lastRuns: state.lastRuns });

  // AdMob Interstitial Ad logic
  let adCounter = parseInt(localStorage.getItem('adGameOverCounter') || '0', 10);
  adCounter++;

  if (adCounter >= 4) {
    if (window.AndroidApp && typeof window.AndroidApp.showInterstitialAd === 'function') {
      window.AndroidApp.showInterstitialAd();
    }
    adCounter = 0; // Reset after showing ad
  }
  localStorage.setItem('adGameOverCounter', adCounter.toString());

  evaluateHighScore();
  fetchLeaders().then(() => evaluateHighScore()).catch(() => { });
}

function saveScoreByName(name) {
  name = (name || 'Player').substring(0, 20);
  return fetch('save_score.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score: state.score })
  }).then(r => r.json()).then(j => {
    if (j.success) {
      ui.toast = 'Saved!';
      setTimeout(() => ui.toast = null, 1200);
      fetchLeaders();
    } else {
      ui.toast = 'Save failed';
      setTimeout(() => ui.toast = null, 1200);
    }
  }).catch(e => {
    ui.toast = 'Save error';
    setTimeout(() => ui.toast = null, 1200);
  });
}

function fetchLeaders() {
  return fetch('get_scores.php').then(r => r.json()).then(list => {
    state.leaders = list || [];
  }).catch(e => {
    state.leaders = [];
  });
}

function getControlKey(x, y) {
  if (ui.panels.save || ui.panels.leaders || ui.panels.controls || ui.panels.stats || ui.panels.shop || ui.panels.daily) {
    return null;
  }
  if (!state.running || state.paused) {
    return null;
  }
  if (ui._controlPos) {
    for (const k of ['up', 'down', 'left', 'right']) {
      const p = ui._controlPos[k];
      const size = 85;
      if (Math.hypot(x - p.x, y - p.y) <= size) {
        return k;
      }
    }
  }
  return null;
}

function handleCanvasPointer(x, y) {
  if (ui.panels.leaders) {
    const w = 560, h = 550;
    const sx = (W - w) / 2, sy = (H - h) / 2;
    const closeX = sx + w - 40;
    const closeY = sy + 16;
    if (rectContains(closeX - 32, closeY - 32, 64, 64, x, y) || !rectContains(sx, sy, w, h, x, y)) {
      ui.panels.leaders = false;
      ui.inputActive = false;
    }
    return;
  }

  if (ui.panels.stats) {
    const w = 560, h = 660; // increased height
    const sx = (W - w) / 2, sy = (H - h) / 2 - 100; // moved up
    const closeX = sx + w - 40;
    const closeY = sy + 16;
    if (rectContains(closeX - 32, closeY - 32, 64, 64, x, y) || !rectContains(sx, sy, w, h, x, y)) {
      ui.panels.stats = false;
      ui.inputActive = false;
    }
    return;
  }

  if (ui.panels.daily) {
    const w = 620, h = 600;
    const sx = (W - w) / 2, sy = (H - h) / 2;
    const closeX = sx + w - 40;
    const closeY = sy + 16;

    // Close button or outside click
    if (rectContains(closeX - 32, closeY - 32, 64, 64, x, y) || !rectContains(sx, sy, w, h, x, y)) {
      ui.panels.daily = false;
      ui.inputActive = false;
      return;
    }

    // Check Login claim button
    const loginBtnW = 160, loginBtnH = 50;
    const loginBtnX = sx + w - loginBtnW - 26;
    const loginBtnY = sy + 85;
    if (rectContains(loginBtnX, loginBtnY, loginBtnW, loginBtnH, x, y)) {
      if (claimDailyLogin()) {
        ui.toast = 'Daily Login Claimed!';
        setTimeout(() => ui.toast = null, 1500);
      }
      return;
    }

    // Check Missions claim buttons
    const missions = ['carsShot', 'oilDestroyed', 'ammosCollected'];
    let my = sy + 280;
    for (let m of missions) {
      const mBtnW = 140, mBtnH = 46;
      const mBtnX = sx + w - mBtnW - 40;
      const mBtnY = my + 22;

      if (rectContains(mBtnX, mBtnY, mBtnW, mBtnH, x, y)) {
        if (claimDailyMission(m)) {
          ui.toast = 'Mission Reward Claimed!';
          setTimeout(() => ui.toast = null, 1500);
        }
        return; // Click handled
      }
      my += 105;
    }
    return;
  }

  if (ui.panels.shop) {
    const w = 560, h = 660; // Fixed to match panels.js rendering
    const sx = (W - w) / 2, sy = (H - h) / 2;
    const closeX = sx + w - 40;
    const closeY = sy + 16;
    if (rectContains(closeX - 32, closeY - 32, 64, 64, x, y)) {
      ui.panels.shop = false;
      ui.inputActive = false;
      return;
    }
    if (!rectContains(sx, sy, w, h, x, y)) {
      ui.panels.shop = false;
      ui.inputActive = false;
      return;
    }

    const tabY = sy + 80;
    const tabW = (w - 32) / 2;
    // Cars Tab Click
    if (rectContains(sx + 16, tabY, tabW, 40, x, y)) {
      ui.shopTab = 'cars';
      ui.shopScrollY = 0;
      return;
    }
    // Drivers Tab Click
    if (rectContains(sx + 16 + tabW, tabY, tabW, 40, x, y)) {
      ui.shopTab = 'drivers';
      ui.shopScrollY = 0;
      return;
    }

    const startY = sy + 130;
    const scrollOffset = ui.shopScrollY || 0;
    const itemHeight = 100;

    if (ui.shopTab === 'cars') {
      const cars = [
        { id: 'mycar', price: 0 },
        { id: 'red', price: 5000 },
        { id: 'blue', price: 15000 },
        { id: 'green', price: 50000 }
      ];
      for (let i = 0; i < cars.length; i++) {
        const car = cars[i];
        const itemY = startY - scrollOffset + i * itemHeight;
        if (itemY > sy + h - 20 || itemY + itemHeight < startY) continue;

        const btnW = 140, btnH = 46;
        const btnX = sx + w - 30 - btnW;
        const btnY = itemY + 27;

        if (rectContains(btnX, btnY, btnW, btnH, x, y)) {
          if (state.unlockedCars.includes(car.id)) {
            state.selectedCar = car.id;
            saveInventory({ unlockedCars: state.unlockedCars, selectedCar: state.selectedCar, unlockedDrivers: state.unlockedDrivers, selectedDriver: state.selectedDriver, gunLevel: state.gunLevel });
          } else if (state.totalCoins >= car.price) {
            state.totalCoins -= car.price;
            state.unlockedCars.push(car.id);
            state.selectedCar = car.id;
            savePlayerStats({ totalCoins: state.totalCoins, lastRuns: state.lastRuns });
            saveInventory({ unlockedCars: state.unlockedCars, selectedCar: state.selectedCar, unlockedDrivers: state.unlockedDrivers, selectedDriver: state.selectedDriver, gunLevel: state.gunLevel });
          } else {
            ui.toast = 'Not enough coins!';
            setTimeout(() => ui.toast = null, 1500);
          }
          return;
        }
      }

      const i = cars.length;
      const gunItemY = startY - scrollOffset + i * itemHeight;
      if (gunItemY <= sy + h - 20 && gunItemY + itemHeight >= startY) {
        const uBtnW = 140, uBtnH = 46;
        const uBtnX = sx + w - 30 - uBtnW;
        const uBtnY = gunItemY + 27;

        if (rectContains(uBtnX, uBtnY, uBtnW, uBtnH, x, y)) {
          const lvl = state.gunLevel || 1;
          const upgradeCost = 10000 * Math.pow(2, lvl - 1);
          if (state.totalCoins >= upgradeCost) {
            state.totalCoins -= upgradeCost;
            state.gunLevel = lvl + 1;
            savePlayerStats({ totalCoins: state.totalCoins, lastRuns: state.lastRuns });
            saveInventory({ unlockedCars: state.unlockedCars, selectedCar: state.selectedCar, unlockedDrivers: state.unlockedDrivers, selectedDriver: state.selectedDriver, gunLevel: state.gunLevel });
          } else {
            ui.toast = 'Not enough coins!';
            setTimeout(() => ui.toast = null, 1500);
          }
          return;
        }
      }
    } else if (ui.shopTab === 'drivers') {
      const drivers = [
        { id: 'driver_none', price: 0 },
        { id: 'driver_alex', price: 10000 },
        { id: 'driver_gaurav', price: 20000 },
        { id: 'driver_helina', price: 30000 },
        { id: 'driver_jasmine', price: 40000 },
        { id: 'driver_mathew', price: 50000 },
        { id: 'driver_nina', price: 60000 },
        { id: 'driver_paul', price: 70000 },
        { id: 'driver_rahul', price: 80000 },
        { id: 'driver_vibhore', price: 90000 }
      ];
      for (let i = 0; i < drivers.length; i++) {
        const driver = drivers[i];
        const itemY = startY - scrollOffset + i * itemHeight;
        if (itemY > sy + h - 20 || itemY + itemHeight < startY) continue;

        const btnW = 140, btnH = 46;
        const btnX = sx + w - 30 - btnW;
        const btnY = itemY + 27;

        if (rectContains(btnX, btnY, btnW, btnH, x, y)) {
          if (driver.id === 'driver_none' || state.unlockedDrivers.includes(driver.id)) {
            state.selectedDriver = driver.id === 'driver_none' ? null : driver.id;
            saveInventory({ unlockedCars: state.unlockedCars, selectedCar: state.selectedCar, unlockedDrivers: state.unlockedDrivers, selectedDriver: state.selectedDriver, gunLevel: state.gunLevel });
          } else if (state.totalCoins >= driver.price) {
            state.totalCoins -= driver.price;
            state.unlockedDrivers.push(driver.id);
            state.selectedDriver = driver.id;
            savePlayerStats({ totalCoins: state.totalCoins, lastRuns: state.lastRuns });
            saveInventory({ unlockedCars: state.unlockedCars, selectedCar: state.selectedCar, unlockedDrivers: state.unlockedDrivers, selectedDriver: state.selectedDriver, gunLevel: state.gunLevel });
          } else {
            ui.toast = 'Not enough coins!';
            setTimeout(() => ui.toast = null, 1500);
          }
          return;
        }
      }
    }

    return;
  }

  if (ui.panels.controls) {
    const w = 520, h = 340;
    const sx = (W - w) / 2, sy = (H - h) / 2;
    const closeX = sx + w - 40;
    const closeY = sy + 16;
    if (rectContains(closeX - 32, closeY - 32, 64, 64, x, y) || !rectContains(sx, sy, w, h, x, y)) {
      ui.panels.controls = false;
      ui.inputActive = false;
    }
    return;
  }

  if (!state.running && state.player.alive) {
    const btnW = 320, btnH = 70;
    const btnX = (W - btnW) / 2;
    const easyBtnY = H / 2 + 10;
    const hardBtnY = easyBtnY + btnH + 20;

    if (rectContains(btnX, easyBtnY, btnW, btnH, x, y)) {
      startGame('easy');
    } else if (rectContains(btnX, hardBtnY, btnW, btnH, x, y)) {
      startGame('hard');
    }
    return;
  }

  if (!state.running && !state.player.alive) {
    const panelW = Math.min(520, W - 40);
    const panelH = 380;
    const panelX = (W - panelW) / 2;
    const panelY = (H - panelH) / 2 - 150;
    const buttonW = 220;
    const buttonH = 62;
    const buttonX = (W - buttonW) / 2;
    const buttonY = panelY + panelH - 96;
    const closeX = panelX + panelW - 34;
    const closeY = panelY + 24;

    if (rectContains(closeX - 40, closeY - 40, 80, 80, x, y)) {
      resetToIdleScreen();
      return;
    }

    if (ui.showHighScorePrompt) {
      const promptX = panelX + 24;
      const promptWidth = panelW - 48;
      const promptY = panelY + 210;
      const promptHeight = 64;
      const saveX = W / 2 - 160 - 10;
      const cancelX = W / 2 + 10;
      const promptBtnY = panelY + panelH - 90;

      if (rectContains(promptX, promptY, promptWidth, promptHeight, x, y)) {
        activateSaveNameInput();
        return;
      }
      if (rectContains(saveX, promptBtnY, 160, 52, x, y)) {
        if (!ui.saveName || !ui.saveName.trim()) {
          ui.toast = 'Name cannot be blank';
          setTimeout(() => ui.toast = null, 2400);
          return;
        }
        saveScoreByName(ui.saveName || 'Player');
        ui.showHighScorePrompt = false;
        ui.inputActive = false;
        return;
      }
      if (rectContains(cancelX, promptBtnY, 160, 52, x, y)) {
        ui.showHighScorePrompt = false;
        ui.inputActive = false;
        return;
      }
    }

    if (rectContains(buttonX, buttonY, buttonW, buttonH, x, y)) {
      startGame();
      return;
    }
  }

  if (ui._resumeBtn && state.paused && state.running) {
    const btn = ui._resumeBtn;
    if (rectContains(btn.x, btn.y, btn.w, btn.h, x, y)) {
      togglePause();
      return;
    }
  }

  // Control handling moved to getControlKey and pointerdown

  const btnW = 120, btnH = 44;
  const bx = 18, by = 48;
  if (rectContains(bx, by, btnW, btnH, x, y)) {
    togglePause();
    return;
  }
}

function ensureHiddenTextInput() {
  if (ui.hiddenInput) return ui.hiddenInput;
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'text';
  input.name = 'vjname';
  input.maxLength = 13;
  input.autocapitalize = 'words';
  input.autocorrect = 'off';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Save your score name');

  // Match canvas textbox position exactly (centered in viewport)
  input.style.position = 'fixed';
  input.style.left = '50%';
  input.style.top = '50%';
  input.style.transform = 'translate(-50%, -50%)';
  input.style.width = '260px';
  input.style.height = '48px';
  input.style.fontSize = '18px';
  input.style.padding = '8px 12px';
  input.style.fontFamily = 'sans-serif';
  input.style.opacity = '0';
  input.style.pointerEvents = 'none';
  input.style.zIndex = '9999';
  input.style.backgroundColor = '#ffffff';
  input.style.color = '#000000';
  input.style.border = '3px solid #ffd166';
  input.style.borderRadius = '0px';
  input.style.boxShadow = 'none';
  input.style.margin = '0';
  input.style.padding = '0';
  input.style.border = 'none';
  input.style.outline = 'none';

  // Prevent layout shift and keyboard issues
  input.style.display = 'block';
  input.style.visibility = 'hidden';
  input.style.clip = 'rect(0,0,0,0)';
  input.style.clipPath = 'inset(50%)';
  input.style.height = '1px';
  input.style.width = '1px';
  input.style.overflow = 'hidden';
  input.style.whiteSpace = 'nowrap';

  input.addEventListener('input', function () {
    ui.saveName = input.value.trimStart();
  });

  input.addEventListener('blur', function () {
    // Refocus if still inputActive
    if (ui.inputActive) {
      setTimeout(() => input.focus(), 0);
    }
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (!ui.saveName || !ui.saveName.trim()) {
        ui.toast = 'Name cannot be blank';
        setTimeout(() => ui.toast = null, 1400);
        e.preventDefault();
        return;
      }
      saveScoreByName(ui.saveName || 'Player');
      ui.inputActive = false;
      input.blur();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      ui.inputActive = false;
      input.blur();
      e.preventDefault();
    }
  });

  document.body.appendChild(input);
  ui.hiddenInput = input;
  return input;
}

function activateSaveNameInput() {
  ui.inputActive = true;
  ui.saveName = ui.saveName || '';
  const input = ensureHiddenTextInput();
  input.value = ui.saveName;

  // Make input actually usable but keep it off-screen visually
  input.style.visibility = 'visible';
  input.style.clip = 'auto';
  input.style.clipPath = 'none';
  input.style.height = '44px';
  input.style.width = '200px';
  input.style.overflow = 'visible';
  input.style.whiteSpace = 'normal';
  input.style.position = 'fixed';
  input.style.left = '10px';
  input.style.top = '10px';
  input.style.zIndex = '10001';
  input.style.pointerEvents = 'auto';

  // Focus immediately to trigger keyboard (don't move viewport)
  input.focus();
  input.select();

  // Helper to cleanup input and restore hidden state
  const cleanupInput = () => {
    ui.inputActive = false;
    input.style.visibility = 'hidden';
    input.style.clip = 'rect(0,0,0,0)';
    input.style.clipPath = 'inset(50%)';
    input.style.height = '1px';
    input.style.width = '1px';
    input.style.overflow = 'hidden';
    input.style.whiteSpace = 'nowrap';
    input.style.pointerEvents = 'none';
    input.blur();
  };

  // Add global keyboard handler for input
  const handleGlobalKeydown = (e) => {
    if (!ui.inputActive) return;

    if (e.key === 'Enter') {
      if (!ui.saveName || !ui.saveName.trim()) {
        ui.toast = 'Name cannot be blank';
        setTimeout(() => ui.toast = null, 1400);
        e.preventDefault();
        return;
      }
      saveScoreByName(ui.saveName || 'Player');
      cleanupInput();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      cleanupInput();
      e.preventDefault();
    } else if (e.key.length === 1) {
      // Regular character input
      ui.saveName = (ui.saveName || '') + e.key;
      input.value = ui.saveName;
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      ui.saveName = (ui.saveName || '').slice(0, -1);
      input.value = ui.saveName;
      e.preventDefault();
    }
  };

  // Store reference to remove listener later
  if (window._currentInputHandler) {
    window.removeEventListener('keydown', window._currentInputHandler);
  }
  window._currentInputHandler = handleGlobalKeydown;
  window.addEventListener('keydown', handleGlobalKeydown);
}

function setupRPSGame() {
  const rpsBtn = document.getElementById('rpsGameBtn');
  if (rpsBtn) {
    rpsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!canPlayRPS()) {
        ui.toast = 'Limit reached. Come back tomorrow!';
        setTimeout(() => ui.toast = null, 2000);
        return;
      }
      openRPSGame();
    });
  }
}

function setupUI() {
  // Add a generic click sound to all UI buttons
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.id !== 'gunToggle') playSound('pause');
    });
  });

  // Gun button
  const gunToggle = document.getElementById('gunToggle');
  if (gunToggle) {
    const fireAction = function (e) {
      e.stopPropagation();
      if (e.cancelable && e.type === 'touchstart') e.preventDefault(); // prevent synthesized click and canvas interruption
      shootBullet(state, ui);
    };
    gunToggle.addEventListener('touchstart', fireAction, { passive: false });
    gunToggle.addEventListener('mousedown', fireAction);
  }

  // Settings menu toggle
  const settingsToggle = document.getElementById('settingsToggle');
  const quickMenu = document.getElementById('quickMenu');
  if (settingsToggle) {
    settingsToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = quickMenu.classList.toggle('open');
      settingsToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Quick menu action buttons (Help, Leaders, Share)
  if (quickMenu) {
    quickMenu.querySelectorAll('.quick-action').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const panel = btn.getAttribute('data-panel');
        if (panel === 'controls') {
          ui.panels.controls = !ui.panels.controls;
          ui.panels.leaders = false;
          ui.panels.stats = false;
          ui.panels.shop = false;
        } else if (panel === 'leaders') {
          ui.panels.leaders = !ui.panels.leaders;
          ui.panels.controls = false;
          ui.panels.stats = false;
          ui.panels.shop = false;
          ui.panels.daily = false;
        } else if (panel === 'stats') {
          ui.panels.stats = !ui.panels.stats;
          ui.panels.leaders = false;
          ui.panels.controls = false;
          ui.panels.shop = false;
          ui.panels.daily = false;
        } else if (panel === 'daily') {
          ui.panels.daily = !ui.panels.daily;
          ui.panels.leaders = false;
          ui.panels.controls = false;
          ui.panels.stats = false;
          ui.panels.shop = false;
        } else if (panel === 'rps') {
          if (!canPlayRPS()) {
            ui.toast = 'Limit reached. Come back tomorrow!';
            setTimeout(() => ui.toast = null, 2000);
            return;
          }
          openRPSGame();
        } else if (panel === 'shop') {
          ui.panels.shop = !ui.panels.shop;
          ui.panels.controls = false;
          ui.panels.leaders = false;
          ui.panels.stats = false;
        } else if (panel === 'share') {
          const shareUrl = 'https://play.google.com/store/apps/details?id=com.vibhorejain.road_fighter';
          const shareText = 'Check out this awesome game!';
          const shareTitle = 'Road Fighter';

          if (window.AndroidApp && window.AndroidApp.shareUrl) {
            window.AndroidApp.shareUrl(shareTitle, shareText, shareUrl);
          } else if (navigator.share) {
            navigator.share({
              title: shareTitle,
              text: shareText,
              url: shareUrl
            }).catch(console.error);
          } else {
            window.open(shareUrl, '_blank');
          }
        }
        quickMenu.classList.remove('open');
        settingsToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Close menu when clicking outside
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.hud-overlay') && quickMenu) {
      quickMenu.classList.remove('open');
      if (settingsToggle) settingsToggle.setAttribute('aria-expanded', 'false');
    }
  });

  let isDraggingStats = false;
  let lastTouchY = 0;

  canvas.addEventListener('wheel', function (e) {
    if (ui.panels.stats) {
      ui.statsScrollY -= e.deltaY;
      const listLength = state.lastRuns ? state.lastRuns.length : 0;
      const rowHeight = 70;
      const maxScroll = Math.max(0, listLength * rowHeight + 430 - 400);
      ui.statsScrollY = Math.max(-maxScroll, Math.min(0, ui.statsScrollY));
      e.preventDefault();
    } else if (ui.panels.shop) {
      if (!ui.shopScrollY) ui.shopScrollY = 0;
      ui.shopScrollY += e.deltaY;
      const itemCount = ui.shopTab === 'cars' ? 5 : 10; // 4 cars + 1 gun OR 10 drivers
      const maxScroll = Math.max(0, itemCount * 100 + 130 - 640);
      ui.shopScrollY = Math.max(0, Math.min(maxScroll, ui.shopScrollY));
      e.preventDefault();
    }
  }, { passive: false });

  canvas.addEventListener('pointerdown', function (e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (ui.panels.stats) {
      isDraggingStats = true;
      lastTouchY = e.clientY;
    } else if (ui.panels.shop) {
      isDraggingStats = true; // reuse flag for shop scroll
      lastTouchY = e.clientY;
    }

    const ctrlKey = getControlKey(x, y);
    if (ctrlKey) {
      ui.activePointers[e.pointerId] = ctrlKey;
      ui.activeControls[ctrlKey] = true;
      if (ctrlKey === 'left' || ctrlKey === 'right') {
        ui.holdFrames = 0;
      } else if (ctrlKey === 'up') {
        state.speedTarget = Math.min(state.maxSpeed, state.speedTarget + 1);
      } else if (ctrlKey === 'down') {
        state.speedTarget = Math.max(0, state.speedTarget - 1);
      }
      return;
    }

    handleCanvasPointer(x, y);
  });

  canvas.addEventListener('pointermove', function (e) {
    if (isDraggingStats) {
      const deltaY = e.clientY - lastTouchY;
      const rect = canvas.getBoundingClientRect();
      const scale = canvas.height / rect.height;

      if (ui.panels.stats) {
        ui.statsScrollY += deltaY * scale;
        const listLength = state.lastRuns ? state.lastRuns.length : 0;
        const rowHeight = 70;
        const maxScroll = Math.max(0, listLength * rowHeight + 430 - 400);
        ui.statsScrollY = Math.max(-maxScroll, Math.min(0, ui.statsScrollY));
      } else if (ui.panels.shop) {
        if (!ui.shopScrollY) ui.shopScrollY = 0;
        ui.shopScrollY -= deltaY * scale; // inverted drag scroll logic compared to stats? Wait, stats does += deltaY, meaning dragging down increases scrollY.
        const itemCount = ui.shopTab === 'cars' ? 5 : 10;
        const maxScroll = Math.max(0, itemCount * 100 + 130 - 640);
        ui.shopScrollY = Math.max(0, Math.min(maxScroll, ui.shopScrollY));
      }

      lastTouchY = e.clientY;
    } else if (e.pointerType === 'touch' || e.pointerType === 'mouse') {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      const ctrlKey = getControlKey(x, y);
      
      if (ui.activePointers[e.pointerId] !== undefined || ctrlKey) {
        const oldKey = ui.activePointers[e.pointerId];
        if (oldKey && oldKey !== ctrlKey) {
          ui.activeControls[oldKey] = false;
        }
        if (ctrlKey) {
          ui.activePointers[e.pointerId] = ctrlKey;
          ui.activeControls[ctrlKey] = true;
        } else {
          delete ui.activePointers[e.pointerId];
        }
      }
    }
  });

  function handlePointerUp(e) {
    isDraggingStats = false;
    const key = ui.activePointers[e.pointerId];
    if (key) {
      ui.activeControls[key] = false;
      delete ui.activePointers[e.pointerId];
    }
    if (Object.keys(ui.activePointers).length === 0) {
      ui.holdFrames = 0;
    }
  }

  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
}

window.startGame = startGame;
window.togglePause = togglePause;

preloadAssets().then(() => {
  setTimeout(function () {
    const stats = loadPlayerStats();
    state.totalCoins = stats.totalCoins;
    state.lastRuns = stats.lastRuns;

    const inv = loadInventory();
    state.unlockedCars = inv.unlockedCars;
    state.selectedCar = inv.selectedCar;
    state.unlockedDrivers = inv.unlockedDrivers;
    state.selectedDriver = inv.selectedDriver;
    state.gunLevel = inv.gunLevel || 1;
    state.bulletsRemaining = state.gunLevel * 10;

    const dailyData = checkDailyReset();
    if (!dailyData.loginClaimed) {
      ui.panels.daily = true;
    }

    setupUI();
    fetchLeaders();
  }, 180);
});

loop();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (!state.paused) {
      togglePause();
    }
  }
});

function resizeCanvas() {
  const gameWidth = 720;
  const gameHeight = 1200;
  const scale = Math.min(window.innerWidth / gameWidth, window.innerHeight / gameHeight);
  canvas.style.width = `${gameWidth * scale}px`;
  canvas.style.height = `${gameHeight * scale}px`;

  // Scale the gun overlay to follow the resolution of the canvas
  const gunOverlay = document.getElementById('gunOverlay');
  if (gunOverlay) {
    gunOverlay.style.transformOrigin = 'bottom left';
    gunOverlay.style.transform = `scale(${Math.max(1, scale * 1.5)})`;
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==========================================
// RPS Mini Game Logic
// ==========================================

let currentRPSBet = 0;

function showRPSToast(msg, isError = false) {
  const el = document.getElementById('rpsToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  el.style.color = isError ? 'red' : '#333';

  if (el.timeoutId) clearTimeout(el.timeoutId);
  el.timeoutId = setTimeout(() => {
    el.classList.add('hidden');
  }, 2500);
}

window.openRPSGame = function () {
  const overlay = document.getElementById('rpsOverlay');
  const betSelection = document.getElementById('rpsBetSelection');
  const arena = document.getElementById('rpsArena');
  const playsText = document.getElementById('rpsPlaysText');
  const closeBtn = document.getElementById('rpsCloseBtn');
  const playAgainBtn = document.getElementById('rpsPlayAgainBtn');

  if (!overlay) return;

  overlay.classList.remove('hidden');
  betSelection.classList.remove('hidden');
  arena.classList.add('hidden');
  playAgainBtn.classList.add('hidden');

  // Re-enable and reset bet buttons
  document.querySelectorAll('.rps-bet-btn').forEach(b => {
    b.disabled = false;
    b.classList.remove('selected');
  });

  const playsLeft = 5 - getRPSPlays();
  playsText.textContent = `Plays left today: ${playsLeft}/5`;
  const totalCoinsText = document.getElementById('rpsTotalCoins');
  if (totalCoinsText) totalCoinsText.textContent = `Coins: ${state.totalCoins}`;

  closeBtn.onclick = () => overlay.classList.add('hidden');

  document.querySelectorAll('.rps-bet-btn').forEach(btn => {
    btn.onclick = (e) => {
      if (btn.disabled) return;
      playSound('move');
      document.querySelectorAll('.rps-bet-btn').forEach(b => b.disabled = true);

      const bet = parseInt(e.target.getAttribute('data-bet'));
      if (state.totalCoins < bet) {
        showRPSToast('Not enough coins!', true);
        document.querySelectorAll('.rps-bet-btn').forEach(b => b.disabled = false);
        return;
      }
      currentRPSBet = bet;
      document.getElementById('rpsCurrentBet').textContent = bet;
      state.totalCoins -= bet;
      if (totalCoinsText) totalCoinsText.textContent = `Coins: ${state.totalCoins}`;
      savePlayerStats({ totalCoins: state.totalCoins, lastRuns: state.lastRuns });

      e.target.classList.add('selected');
      e.target.classList.add('bet-animating');
      setTimeout(() => {
        e.target.classList.remove('bet-animating');
        betSelection.classList.add('hidden');
        arena.classList.remove('hidden');
        resetRPSArena();
      }, 500);
    };
  });

  document.querySelectorAll('.rps-action-btn').forEach(btn => {
    btn.onclick = (e) => {
      playSound('move');
      document.querySelectorAll('.rps-action-btn').forEach(b => b.disabled = true);
      const playerChoice = parseInt(e.currentTarget.getAttribute('data-choice'));
      playRPSMatch(playerChoice);
    };
  });

  playAgainBtn.onclick = () => {
    if (!canPlayRPS()) {
      showRPSToast('Daily limit reached! Come back tomorrow.', true);
      return;
    }
    window.openRPSGame();
  };
}

function resetRPSArena() {
  const playerChoice = document.getElementById('rpsPlayerChoice');
  const cpuChoice = document.getElementById('rpsCpuChoice');
  playerChoice.textContent = '❓';
  cpuChoice.textContent = '🐻‍❄️';
  playerChoice.classList.remove('fly-to-center');
  cpuChoice.classList.remove('fly-to-center');

  const resultText = document.getElementById('rpsResultText');
  resultText.textContent = 'VS';
  resultText.style.color = '#333';
  resultText.classList.remove('win-animating');

  document.querySelectorAll('.rps-action-btn').forEach(b => b.disabled = false);
  document.getElementById('rpsPlayAgainBtn').classList.add('hidden');
}

function playRPSMatch(playerChoice) {
  incrementRPSPlays();
  const playsLeft = 5 - getRPSPlays();
  document.getElementById('rpsPlaysText').textContent = `Plays left today: ${playsLeft}/5`;

  const cpuChoice = getCPUChoice();
  const emojis = ['🪨', '📄', '✂️'];

  const playerEmojiEl = document.getElementById('rpsPlayerChoice');
  const cpuEmojiEl = document.getElementById('rpsCpuChoice');
  const resultText = document.getElementById('rpsResultText');
  const playAgainBtn = document.getElementById('rpsPlayAgainBtn');

  playerEmojiEl.textContent = emojis[playerChoice];
  cpuEmojiEl.textContent = emojis[cpuChoice];

  playSound('shoot'); // Fly sound
  playerEmojiEl.classList.add('fly-to-center');
  cpuEmojiEl.classList.add('fly-to-center');
  resultText.textContent = ''; // Clear VS during animation

  setTimeout(() => {
    playerEmojiEl.classList.remove('fly-to-center');
    cpuEmojiEl.classList.remove('fly-to-center');

    const result = playRPS(playerChoice, cpuChoice);

    if (result === RPS_RESULTS.WIN) {
      playSound('accelerate');
      resultText.textContent = `YOU WIN +${currentRPSBet * 2}!`;
      resultText.style.color = '#4CAF50';
      resultText.classList.add('win-animating');
      state.totalCoins += currentRPSBet * 2;
    } else if (result === RPS_RESULTS.DRAW) {
      playSound('pause');
      resultText.textContent = `DRAW! Refunded ${currentRPSBet}`;
      resultText.style.color = '#FF9800';
      state.totalCoins += currentRPSBet;
    } else {
      playSound('crash');
      resultText.textContent = `YOU LOSE! -${currentRPSBet}`;
      resultText.style.color = '#F44336';
    }

    const totalCoinsText = document.getElementById('rpsTotalCoins');
    if (totalCoinsText) totalCoinsText.textContent = `Coins: ${state.totalCoins}`;

    savePlayerStats({ totalCoins: state.totalCoins, lastRuns: state.lastRuns });

    setTimeout(() => {
      playAgainBtn.classList.remove('hidden');
    }, 2000);
  }, 2000); // 2 second flying animation
}
