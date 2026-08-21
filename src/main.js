import { state, ui, gameConfig } from './core/state.js';
import { canvas, ctx, W, H, lanes, getRoadOffset, setRoadOffset } from './core/constants.js';
import { loadTreeImages, loadSprites, loadControlImages, getAllAssets, getTrees, getImages, getControlImages } from './assets/imageLoader.js';
import { playSound, stopAllActiveSounds, playBgMusic, stopBgMusic } from './audio/soundManager.js';
import { collides, rectContains } from './utils/collision.js';
import { clampSpeed, drawRoundedRect, $id, getSpeedKmh } from './utils/helpers.js';
import { loadLeadersFromStorage, saveLeadersToStorage, addLeaderEntry, loadPlayerStats, savePlayerStats, loadInventory, saveInventory } from './utils/storage.js';
import { createPlayer, moveLeft, moveRight, updatePlayerPosition } from './game/player.js';
import { spawnObstacle, updateObstacles } from './game/obstacles.js';
import { spawnCoin, updateCoins } from './game/coins.js';
import { shootBullet, updateBullets } from './game/bullets.js';
import { spawnTree, updateTrees } from './game/trees.js';
import { addFloatingText, updateFloatingTexts } from './game/floatingText.js';
import { resetToIdleScreen, startGame, togglePause, updateGameLogic } from './game/gameLoop.js';
import { drawRoad, drawStartScreen, drawHUD, drawLoadingScreen, drawRotateToPortrait } from './ui/rendering.js';
import { drawGameOverOverlay } from './ui/gameOverScreen.js';
import { drawLeadersPanel, drawControlsPanel, drawStatsPanel, drawShopPanel } from './ui/panels.js';
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

  const boxX = W / 2 - 160;
  const boxY = 165;
  const boxW = 320;
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
  const isBraking = ui.holding === 'brake';

  if (ui.holding) {
    ui.holdFrames++;
    if (ui.holding === 'accelerate') {
      state.speedTarget = Math.min(state.maxSpeed, state.speedTarget + 0.02);
    } else if (ui.holding === 'brake') {
      state.speedTarget = Math.max(0, state.speedTarget - 0.12);
    } else if (ui.holding === 'left' && ui.holdFrames % 12 === 0) {
      moveLeft(state, playSound);
    } else if (ui.holding === 'right' && ui.holdFrames % 12 === 0) {
      moveRight(state, playSound);
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
  updateCoins(state, collides);
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
  const markImageLoaded = function() {
    loadedImages++;
    _assetsProgress = Math.round(loadedImages / totalImages * 100);
    if (_assetsProgress > 100) _assetsProgress = 100;
  };

  return new Promise((resolve) => {
    let finished = false;
    const failedImages = [];
    const tryFinish = function() {
      if (finished) return;
      if (loadedImages >= totalImages) {
        finished = true;
        assetsReady = true;
        _assetsProgress = 100;
        resolve();
      }
    };

    imgs.forEach(function(img) {
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
      const onl = function() {
        if (img.naturalWidth && img.naturalWidth > 0) {
          img.removeEventListener('load', onl);
          img.removeEventListener('error', one);
          markImageLoaded();
          tryFinish();
        } else {
          one();
        }
      };
      const one = function() {
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
      } catch (e) {}
    });

    setTimeout(function() {
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
  
  evaluateHighScore();
  fetchLeaders().then(() => evaluateHighScore()).catch(() => {});
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
    const w = 560, h = 550;
    const sx = (W - w) / 2, sy = (H - h) / 2;
    const closeX = sx + w - 40;
    const closeY = sy + 16;
    if (rectContains(closeX - 32, closeY - 32, 64, 64, x, y) || !rectContains(sx, sy, w, h, x, y)) {
      ui.panels.stats = false;
      ui.inputActive = false;
    }
    return;
  }

  if (ui.panels.shop) {
    const w = 600, h = 550;
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
    
    // Check shop interactions
    const cars = [
      { id: 'mycar', price: 0 },
      { id: 'red', price: 5000 },
      { id: 'blue', price: 15000 },
      { id: 'green', price: 50000 }
    ];
    const itemHeight = 100;
    const startY = sy + 120;
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      const itemY = startY + i * itemHeight;
      const btnW = 140, btnH = 46;
      const btnX = sx + w - 30 - btnW;
      const btnY = itemY + 27;
      
      if (rectContains(btnX, btnY, btnW, btnH, x, y)) {
        if (state.unlockedCars.includes(car.id)) {
          state.selectedCar = car.id;
          saveInventory({ unlockedCars: state.unlockedCars, selectedCar: state.selectedCar });
        } else if (state.totalCoins >= car.price) {
          state.totalCoins -= car.price;
          state.unlockedCars.push(car.id);
          state.selectedCar = car.id;
          savePlayerStats({ totalCoins: state.totalCoins, lastRuns: state.lastRuns });
          saveInventory({ unlockedCars: state.unlockedCars, selectedCar: state.selectedCar });
        } else {
          ui.toast = 'Not enough coins!';
          setTimeout(() => ui.toast = null, 1500);
        }
        return;
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
    const btnW = 260, btnH = 80, btnX = (W - btnW) / 2, btnY = (H - btnH) / 2;
    if (rectContains(btnX, btnY, btnW, btnH, x, y)) {
      startGame();
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

  if (ui._controlPos) {
    for (const k of ['up', 'down', 'left', 'right']) {
      const p = ui._controlPos[k];
      const size = 76;
      if (Math.hypot(x - p.x, y - p.y) <= size) {
        if (k === 'left') {
          moveLeft(state, playSound);
          ui.holding = 'left';
          ui.holdFrames = 0;
        } else if (k === 'right') {
          moveRight(state, playSound);
          ui.holding = 'right';
          ui.holdFrames = 0;
        } else if (k === 'up') {
          state.speedTarget = Math.min(state.maxSpeed, state.speedTarget + 1);
          ui.holding = 'accelerate';
          ui.holdFrames = 0;
        } else if (k === 'down') {
          state.speedTarget = Math.max(0, state.speedTarget - 1);
          ui.holding = 'brake';
          ui.holdFrames = 0;
        }
        return;
      }
    }
  }

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

  input.addEventListener('input', function() {
    ui.saveName = input.value.trimStart();
  });

  input.addEventListener('blur', function() {
    // Refocus if still inputActive
    if (ui.inputActive) {
      setTimeout(() => input.focus(), 0);
    }
  });

  input.addEventListener('keydown', function(e) {
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

function setupUI() {
  // Gun button
  const gunToggle = document.getElementById('gunToggle');
  if (gunToggle) {
    gunToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      shootBullet(state, ui);
    });
  }

  // Settings menu toggle
  const settingsToggle = document.getElementById('settingsToggle');
  const quickMenu = document.getElementById('quickMenu');
  if (settingsToggle) {
    settingsToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = quickMenu.classList.toggle('open');
      settingsToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Quick menu action buttons (Help, Leaders, Share)
  if (quickMenu) {
    quickMenu.querySelectorAll('.quick-action').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
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
        } else if (panel === 'stats') {
          ui.panels.stats = !ui.panels.stats;
          ui.panels.controls = false;
          ui.panels.leaders = false;
          ui.panels.shop = false;
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
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.hud-overlay') && quickMenu) {
      quickMenu.classList.remove('open');
      if (settingsToggle) settingsToggle.setAttribute('aria-expanded', 'false');
    }
  });

  canvas.addEventListener('pointerdown', function(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    handleCanvasPointer(x, y);
  });

  canvas.addEventListener('pointerup', function(e) {
    if (ui.inputActive) return;
    ui.holding = null;
    ui.holdFrames = 0;
  });
}

window.startGame = startGame;
window.togglePause = togglePause;

preloadAssets().then(() => {
  setTimeout(function() {
    const stats = loadPlayerStats();
    state.totalCoins = stats.totalCoins;
    state.lastRuns = stats.lastRuns;
    
    const inv = loadInventory();
    state.unlockedCars = inv.unlockedCars;
    state.selectedCar = inv.selectedCar;
    
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

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
