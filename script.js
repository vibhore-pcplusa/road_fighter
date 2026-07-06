/* ---- Road Fighter - Canvas Game ----
  Features:
  - 3 lanes, player car moves left/right smoothly
  - obstacles spawn and move down
  - increasing speed/level with score
  - collision detection (AABB)
  - mobile touch support
  - optional sprite loading (commented)
  - randomly trees added on footpath and moving down
*/

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// UI will be drawn inside canvas. Keep minimal UI state here.
const ui = {
  startLabel: 'Start',
  pauseLabel: 'Pause',
  panels: { save: false, leaders: false, controls: false },
  toast: null,
  touchVisible: false,
  saveMessage: '',
  inputActive: false,
  hiddenInput: null,
  quickMenuOpen: false,
  showHighScorePrompt: false,
  highScoreChecked: false,
  cursorVisible: true,
  lastCursorToggle: Date.now()
};
// ---load trees---
const trees = {};

for (let i = 1; i <= 6; i++) {
  trees[`t${i}`] = new Image();
  trees[`t${i}`].src = `./assets/trees/t${i}.png`;
}

// --- Sprites ---
const images = {};
const spriteFiles = {
  mycar: "mycar.png",
  red: "red_car.png",
  blue: "blue_car.png",
  green: "green_car.png",
  gadda: "gadda.png" 
};

for (const key in spriteFiles) {
  images[key] = new Image();
  images[key].src = "./assets/" + spriteFiles[key]; // adjust path if needed
}

// Retry loader for important sprite `mycar` in case of intermittent failures
if (images.mycar) {
  images.mycar._retryCount = 0;
  (function attachRetry(img){
    function handleError(){
      if (img._retryCount < 2) {
        img._retryCount++;
        const base = img.src.split('?')[0];
        img.src = base + '?r=' + Date.now();
      } else {
        img.removeEventListener('error', handleError);
      }
    }
    function handleLoad(){
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    }
    img.addEventListener('error', handleError);
    img.addEventListener('load', handleLoad);
  })(images.mycar);
}

// control button images (up/down/left/right)
const controlImgs = {};
['up','down','left','right'].forEach(k => {
  controlImgs[k] = new Image();
  controlImgs[k].src = `./assets/${k}.jpg`;
});

// --- SOUND ADDITION ---
const sounds = {
  accelerate: new Audio("assets/sounds/accelerate.mp3"),
  brake: new Audio("assets/sounds/brake.mp3"),
  move: new Audio("assets/sounds/move.mp3"),
  crash: new Audio("assets/sounds/crash.mp3"),
  pause: new Audio("assets/sounds/pause.mp3"),
  bg: new Audio("assets/sounds/bg_music.mp3")  // background music
};
sounds.bg.loop = true;
sounds.bg.volume = 0.8;

sounds.move.volume = 0.2;//left right horn sound is reduced..

const activeSounds = [];

function playSound(sound) {
  if (!sounds[sound]) return;
  try {
    //const audio = sounds[sound].cloneNode();
    const original = sounds[sound];
    const audio = original.cloneNode();

    audio.volume = original.volume;      // <-- copy volume
    audio.playbackRate = original.playbackRate;
    activeSounds.push(audio);
    const removeFromList = () => {
      const index = activeSounds.indexOf(audio);
      if (index >= 0) activeSounds.splice(index, 1);
    };
    audio.addEventListener('ended', removeFromList);
    audio.addEventListener('pause', removeFromList);
    audio.play().catch(removeFromList);
  } catch (e) {}
}

function stopAllActiveSounds() {
  while (activeSounds.length) {
    const audio = activeSounds.pop();
    try { audio.pause(); audio.currentTime = 0; } catch (e) {}
  }
}

function playBgMusic() {
  try {
    sounds.bg.currentTime = 0;
    sounds.bg.play().catch(()=>{});
  } catch (e) {}
}

function stopBgMusic() {
  try { sounds.bg.pause(); } catch (e) {}
}

// Canvas UI helpers : These helpers are used to join the ui design cords, with the button press cords. 
// and ui design cords must be equal to button press cords. This is "THE BRIDGE"
function rectContains(rx, ry, rw, rh, x, y) {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}// where rx=rectangle start x cordinate, ry=rectangle start y cords, rw=width of rectangle, rh=height of rectangle, 
// x and y normal are the mouse pointer coordinates, where it is clicked. 


let roadOffset = 0;

const W = canvas.width, H = canvas.height;
const lanes = [W*0.18, W*0.5, W*0.82]; // center x positions for 3 lanes
let state = {
  running: false,
  paused: false,
  score: 0,
  level: 1,
  speed: 3,
  speedTarget: 3,
  spawnTimer: 0,
  spawnInterval: 90, // frames
  obstacles: [],
  trees:[],
  player: createPlayer(), 
  frames: 0,
  minSpeed: 2,  
  maxSpeed: 12  
};

// explosion state (shown on collision)
state.explosion = null;

// UI hold state for pointer presses
ui.holding = null;
ui.holdFrames = 0;

function clampSpeed(value){
  return Math.min(state.maxSpeed, Math.max(state.minSpeed, value));
}

function setSpeedTarget(value){
  if (!state.running || state.paused || state.gameOver) return;
  state.speedTarget = clampSpeed(value);
}

// Player definition
function createPlayer(){
  return {
    lane:1, // 0..2
    x: lanes[1],
    y: H - 400,
    width: 88,
    height: 120,
    targetX: lanes[1],
    speedX: 8,
    color: "#00cc66",
    alive: true
  };
}

// Obstacle
function spawnObstacle(){
  const lane = Math.floor(Math.random()*3);
  const type = Math.random() < 0.12 ? 'oil' : 'car'; // small variety
  const w = type==='car' ? 88 : 120;
  const h = type==='car' ? 120 : 60;

// Base gap
  let baseGap = 280;
  // Increase base gap at low speeds
  if (state.speed < 40) baseGap = 400; // more breathing space

  const minGap = baseGap + state.speed * 5; // adjust as needed

  const lastInLane = state.obstacles.find(o => o.lane === lane);
  if (lastInLane && lastInLane.y < minGap) {
    return; // skip this spawn
  }

  const obj = {
    lane,
    x: lanes[lane],
    y: -h - 10,
    width: w,
    height: h,
    speed: state.speed,
    type,
    color: type==='car' ? "#cc3333" : "#444"
  };
  state.obstacles.push(obj);
}

function spawnTree() {
    const side = Math.random() < 0.5 ? 'left' : 'right';

    state.trees.push({
        x: side === 'left'
    ? -10 + Math.random() * 10
    : canvas.width - 100 + Math.random() * 10,
        y: -80,
        width: 50,
        height: 70,
        sprite: `t${Math.floor(Math.random() * 6) + 1}`
    });
}
// AABB collision
function collides(a,b){
  return Math.abs(a.x - b.x) * 2 < (a.width + b.width) &&
         Math.abs(a.y - b.y) * 2 < (a.height + b.height);
}

// draw road and lane markings
function drawRoad(){
  // sides
  //ctx.fillStyle = "#1a1a1a";
  ctx.fillStyle = "brown";
  ctx.fillRect(0,0,W,H);
  // road center area
  const roadW = W*0.8;
  const roadX = W*0.05; 
  ctx.fillStyle = "gray";
  ctx.fillRect(roadX,0,roadW+30,H);
  // lane lines
  ctx.strokeStyle = "#bfbfbf";
  ctx.lineWidth = 6;
  ctx.setLineDash([50,110]);
  ctx.lineDashOffset = -roadOffset; // 👈 animate using offset
  ctx.beginPath();
  ctx.moveTo(W/3, 0); ctx.lineTo(W/3, H);
  ctx.moveTo(2*W/3, 0); ctx.lineTo(2*W/3, H);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function resetToIdleScreen(){
  stopAllActiveSounds();
  stopBgMusic();
  state.running = false;
  state.paused = false;
  state.score = 0;
  state.level = 1;
  state.speed = 3;
  state.speedTarget = 3;
  state.spawnTimer = 0;
  state.spawnInterval = 90;
  state.obstacles.length = 0;
  state.trees.length = 0;
  state.frames = 0;
  roadOffset = 0;
  state.player = createPlayer();
  state.player.alive = true;
  state.explosion = null;
  ui.startLabel = 'Start';
  ui.pauseLabel = 'Pause';
  ui.saveName = '';
  ui.showHighScorePrompt = false;
  ui.highScoreChecked = false;
}

function evaluateHighScore(){
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

function prepareGameOverState(){
  ui.showHighScorePrompt = false;
  ui.highScoreChecked = false;
  evaluateHighScore();
  fetchLeaders().then(() => evaluateHighScore()).catch(()=>{});
}

function drawGameOverOverlay(){
  const panelW = Math.min(520, W - 40);
  const panelH = 380;
  const panelX = (W - panelW) / 2;
  const panelY = (H - panelH) / 2;
  const buttonW = 220;
  const buttonH = 62;
  const buttonX = (W - buttonW) / 2;
  const buttonY = panelY + panelH - 96;
  const closeX = panelX + panelW - 34;
  const closeY = panelY + 24;

  ctx.save();
  ctx.fillStyle = "rgba(3, 8, 18, 0.76)";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  const panelGradient = ctx.createLinearGradient(0, panelY, 0, panelY + panelH);
  panelGradient.addColorStop(0, "#223255");
  panelGradient.addColorStop(1, "#0d1426");
  ctx.fillStyle = panelGradient;
  ctx.strokeStyle = "#ffcf5c";
  ctx.lineWidth = 3;
  drawRoundedRect(panelX, panelY, panelW, panelH, 24);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px sans-serif";
  ctx.fillText("GAME OVER", W / 2, panelY + 95);

  ctx.fillStyle = "#ffd166";
  ctx.font = "30px sans-serif";
  ctx.fillText("Final Score: " + state.score, W / 2, panelY + 150);

  if (ui.showHighScorePrompt) {
    const promptX = panelX + 24;
    const promptWidth = panelW - 48;
    const promptY = panelY + 210;
    const promptHeight = 64;
    const saveX = W / 2 - 160 - 10;
    const cancelX = W / 2 + 10;
    const promptBtnY = panelY + panelH - 80;

    ctx.fillStyle = '#ffd166';
    ctx.font = '28px sans-serif';
    ctx.fillText('Congratulations! 🎉 New High Score', W / 2, panelY + 180);
    ctx.fillStyle = '#dbe7ff';
    ctx.font = '22px sans-serif';
    //ctx.fillText('Please enter your name', W / 2, panelY + 212);

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(promptX, promptY, promptWidth, promptHeight);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(promptX, promptY, promptWidth, promptHeight);

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'left';
    const displayText = ui.saveName || 'Tap here to type your name';
    ctx.fillText(displayText, promptX + 14, promptY + 38);

    // Draw blinking cursor
    if (ui.inputActive) {
      const now = Date.now();
      if (now - ui.lastCursorToggle > 500) {
        ui.cursorVisible = !ui.cursorVisible;
        ui.lastCursorToggle = now;
      }
      if (ui.cursorVisible && ui.saveName) {
        const textWidth = ctx.measureText(ui.saveName).width;
        const cursorX = promptX + 14 + textWidth + 2;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cursorX, promptY + 16);
        ctx.lineTo(cursorX, promptY + 48);
        ctx.stroke();
      }
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(43,190,120,0.96)';
    drawRoundedRect(saveX, promptBtnY, 160, 52, 18);
    ctx.fill();
    ctx.strokeStyle = '#eff8ff';
    ctx.stroke();
    ctx.fillStyle = '#0d1426';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Save', saveX + 80, promptBtnY + 34);

    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    drawRoundedRect(cancelX, promptBtnY, 160, 52, 18);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText('Cancel', cancelX + 80, promptBtnY + 34);
  } else {
    ctx.fillStyle = "#dbe7ff";
    ctx.font = "22px sans-serif";
    ctx.fillText("Tap the button below to race again", W / 2, panelY + 195);

    ctx.fillStyle = "#ff5d73";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    drawRoundedRect(buttonX, buttonY, buttonW, buttonH, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Restart", W / 2, buttonY + 39);
  }

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(closeX, closeY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0d1426";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("X", closeX, closeY + 7);
  ctx.restore();

  drawExplosion();
  ui.startLabel = 'Restart';
}

// main render
function render(){
  if (showRotateToPortrait) {
    drawRotateToPortrait();
    return;
  }
  if (!assetsReady) {
    drawLoadingScreen(_assetsProgress || 0);
    return;
  }
  ctx.clearRect(0,0,W,H);
  drawRoad();
  for(const tree of state.trees) {
    const img = trees[tree.sprite];
    if(img && img.complete && img.naturalWidth && img.naturalWidth > 0) {
        ctx.drawImage(
            img,
            tree.x,
            tree.y,
            tree.width,
            tree.height
        );
    }
}

  // draw obstacles
  for(const o of state.obstacles){
    ctx.save();
    ctx.translate(o.x - o.width/2, o.y);
    if (o.type === "car") {
    const carChoices = [images.red, images.blue, images.green];
    const img = carChoices[o.lane % carChoices.length];
    if (img && img.complete && img.naturalWidth && img.naturalWidth > 0) {
            ctx.drawImage(img, 0, 0, o.width, o.height);
    } else {
      ctx.fillStyle = o.color;
      ctx.fillRect(0, 0, o.width, o.height);
    }
  } else if (o.type === "oil") {
    // draw oil sprite if available
    if (images.gadda && images.gadda.complete && images.gadda.naturalWidth && images.gadda.naturalWidth > 0) {
      ctx.drawImage(images.gadda,0, 0, o.width, o.height);
    } else {
      ctx.fillStyle = "#444";
      ctx.fillRect(0, 0, o.width, o.height);
    }
    }
    
    ctx.restore();
  }

  // draw player (interpolate to targetX)
  const p = state.player;
  // smooth movement toward targetX
  p.x += (p.targetX - p.x) * 0.25;
  ctx.save();
  ctx.translate(p.x - p.width/2, p.y);
  if (images.mycar && images.mycar.complete && images.mycar.naturalWidth && images.mycar.naturalWidth > 0) {
  ctx.drawImage(images.mycar, 0, 0, p.width, p.height);
} else {
  // fallback rectangle while image is loading
  ctx.fillStyle = p.color;
  ctx.fillRect(0, 0, p.width, p.height);
}
  // windows
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(8,18,p.width-16,18);
  // wheels
  ctx.fillStyle = "#111";
  ctx.fillRect(6,p.height-12,12,8);
  ctx.fillRect(p.width-18,p.height-12,12,8);
  ctx.restore();

  // HUD Header Dashboard Starts
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, W, 38);

  ctx.fillStyle = "yellow";
  ctx.font = "30px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Level: " + state.level, 100, 30);

  ctx.textAlign = "center";
  ctx.fillText("Speed: " + getSpeedKmh() + " km/h", W/2, 30);

  ctx.textAlign = "right";
  ctx.fillText("Score: " + state.score, W - 80, 30);
  ctx.restore();
  // HUD Header Dashboard Ends

  // draw in-canvas UI controls
  drawCanvasUI();
}

// Canvas UI drawing
function drawCanvasUI(){
  // top HUD background already drawn; draw buttons top-left
  ctx.save();
  // Start / Pause buttons (top-left)
  const btnW = 120, btnH = 44, gap = 12;
  const x = 18, y = 48;
  ctx.fillStyle = '#222'; ctx.globalAlpha = 0.9;
  ctx.fillRect(x-8, y-12, btnW*2 + gap + 24, btnH + 24);
  ctx.globalAlpha = 1;

  
  // Pause
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(x, y, btnW, btnH);
  ctx.fillStyle = '#000'; 
  ctx.font = '23px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(ui.pauseLabel, x + btnW/2, y + 28);

  // Start
  ctx.fillStyle = '#0a8';
  ctx.fillRect(x + btnW + gap, y, btnW, btnH);
  ctx.fillStyle = '#000';  ctx.fillText(ui.startLabel, x + btnW/2 + btnW + gap, y + 28);

  // Draw panels if open
  if (ui.panels.leaders) drawLeadersPanel();
  if (ui.panels.controls) drawControlsPanel();
  positionHiddenSaveInput();

  // draw control images (up/down/left/right) near bottom-right
  //const size = Math.min(72, Math.max(48, Math.floor(W * 0.08)));
  const size = 76;//fixed size
  const cx = W - 170; const cy = H - 125;
  const positions = {
    up: { x: cx, y: cy - size },
    down: { x: cx, y: cy + size },
    left: { x: cx - size, y: cy },
    right: { x: cx + size, y: cy }
  };
  ui._controlPos = positions; // cache for hit tests
  for (const k of ['up','down','left','right']){
    const img = controlImgs[k];
    const p = positions[k];
    // background circle
    ctx.beginPath(); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.arc(p.x, p.y, size/1.6, 0, Math.PI*2); ctx.fill();
    if (img && img.complete && img.naturalWidth && img.naturalWidth > 0)
      {ctx.globalAlpha = 0.7;
      ctx.drawImage(img, p.x - size/1.6, p.y - size/1.6, size*1.2, size*1.2);
      ctx.globalAlpha = 1.0;}
    else { ctx.fillStyle = '#888'; ctx.fillRect(p.x - size/2, p.y - size/2, size, size); }
  }
  ui._controlPos = positions; // cache for hit tests

  // toast
  if (ui.toast) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(W/2 - 140, 80, 280, 40);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(ui.toast, W/2, 105);
  }

  ctx.restore();
}


function drawLeadersPanel(){
  const w = 560, h = 550; const x = (W - w)/2, y = (H - h)/2;
  ctx.save();
  ctx.fillStyle = 'rgba(22, 205, 220, 0.95)';
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + w - 20, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 20);
  ctx.lineTo(x + w, y + h - 20);
  ctx.quadraticCurveTo(x + w, y + h, x + w - 20, y + h);
  ctx.lineTo(x + 20, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - 20);
  ctx.lineTo(x, y + 20);
  ctx.quadraticCurveTo(x, y, x + 20, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(2, 100, 120, 0.96)';
  ctx.fillRect(x + 16, y + 16, w - 32, 56);
  ctx.fillStyle = '#fff';
  ctx.font = '32px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Top Scores (IST)', x + 26, y + 48);

  const list = state.leaders && state.leaders.length ? state.leaders : [];
  ctx.font = '27px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  const closeX = x + w - 40;
  const closeY = y + 16;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(closeX, closeY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#026478';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', closeX, closeY + 8);
  ctx.restore();

  if (!list.length) {
    ctx.fillText('No scores yet. Play to save your best run!', x + 26, y + 100);
  } else {
    const rowY = y + 122;
    const rowHeight = 42;
    const maxRows = Math.min(10, list.length);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '26px sans-serif';
    ctx.fillText('Rank', x + 30, rowY - 14);
    ctx.fillText('Player', x + 110, rowY - 14);
    ctx.fillText('Score', x + 260, rowY - 14);
    ctx.fillText('Date', x + 390, rowY - 14);

    for (let i = 0; i < maxRows; i++) {
      const it = list[i];
      const rowTop = rowY + i * rowHeight;
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x + 18, rowTop - 11, w - 36, rowHeight);
      }
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      const date = new Date(it.created_at);
      const options = {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric'
        /*,
        hour: '2-digit', minute: '2-digit', second: '2-digit'*/
      };
      const istTime = new Intl.DateTimeFormat('en-IN', options).format(date);
      ctx.fillText((i + 1) + '.', x + 30, rowTop + 18);
      ctx.fillText(it.name, x + 110, rowTop + 18);
      ctx.fillText(it.score.toString(), x + 260, rowTop + 18);
      ctx.fillText(istTime, x + 390, rowTop + 18);
    }
  }
  ctx.restore();
}

function drawControlsPanel(){
  const w = 520, h = 340; const x = (W - w)/2, y = (H - h)/2;
  ctx.save();
  ctx.fillStyle = 'rgba(24, 220, 210, 0.95)';
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + w - 20, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 20);
  ctx.lineTo(x + w, y + h - 20);
  ctx.quadraticCurveTo(x + w, y + h, x + w - 20, y + h);
  ctx.lineTo(x + 20, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - 20);
  ctx.lineTo(x, y + 20);
  ctx.quadraticCurveTo(x, y, x + 20, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 120, 140, 0.96)';
  ctx.fillRect(x + 16, y + 16, w - 32, 47);
  ctx.fillStyle = '#fff';
  ctx.font = '30px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Controls & Rules', x + 26, y + 52);

  const lines = [
    
    'Arrow keys to move left/right',
    'Up to speed up, Down to slow',
    'Speed increases with levels;',
    'It level-up every 400 points',
    'Developed by Vibhore Jain',
    'Email Id - vibhore.mit@gmail.com'
    
  ];
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = '26px sans-serif';
  for (let i=0;i<lines.length;i++) ctx.fillText(lines[i], x + 26, y + 90 + i*40);

  const closeX = x + w - 40;
  const closeY = y + 16;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(closeX, closeY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f6f7a';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', closeX, closeY + 8);
  ctx.restore();

  ctx.restore();
}

function drawExplosion() {
  if (!state.explosion) return;
  const elapsed = Date.now() - state.explosion.start;
  if (elapsed >= 3000) {
    state.explosion = null;
    return;
  }
  
  const progress = elapsed / 3000;
  const size = 80 + progress * 60;
  const alpha = 1 - progress;
  const ex = state.explosion.x || W/2;
  const ey = state.explosion.y || H/2;
  
  ctx.save();
  ctx.globalAlpha = alpha;
  
  // outer orange ring
  ctx.fillStyle = 'rgba(255,100,0,' + (0.8 * alpha) + ')';
  ctx.beginPath();
  ctx.arc(ex, ey, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // middle yellow
  ctx.fillStyle = 'rgba(255,200,0,' + (0.9 * alpha) + ')';
  ctx.beginPath();
  ctx.arc(ex, ey, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
  
  // inner white hot core
  ctx.fillStyle = 'rgba(255,255,100,' + (1 * alpha) + ')';
  ctx.beginPath();
  ctx.arc(ex, ey, size * 0.12, 0, Math.PI * 2);
  ctx.fill();
  
  // BOOM text with oscillation and glow
  const textY = ey - 20 + Math.sin(elapsed / 200) * 8;
  
  ctx.globalAlpha = alpha;
  ctx.shadowColor = 'rgb(244, 66, 7)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';

  // Draw glow multiple times
  for (let i = 0; i < 5; i++) {
      ctx.fillText('BOOM!', ex, textY);
  }

  // Final crisp text
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.fillText('BOOM!', ex, textY);
  ctx.restore();
}

// update game logic
function update(){
  if (showRotateToPortrait) return;
  if(!state.running || state.paused) return;

  state.frames++;
  // handle continuous hold actions
  if (ui.holding) {
    ui.holdFrames++;
    if (ui.holding === 'accelerate') {
      setSpeedTarget(state.speedTarget + 0.08);
    } else if (ui.holding === 'brake') {
      setSpeedTarget(state.speedTarget - 0.12);
    } else if (ui.holding === 'left' && ui.holdFrames % 12 === 0) {
      moveLeft();
    } else if (ui.holding === 'right' && ui.holdFrames % 12 === 0) {
      moveRight();
    }
  } else {
    // natural friction so the car slows down smoothly when no input is pressed
    setSpeedTarget(Math.max(state.minSpeed, state.speedTarget - 0.015));
  }

  state.speed += (state.speedTarget - state.speed) * 0.12;
  if (Math.abs(state.speedTarget - state.speed) < 0.001) {
    state.speed = state.speedTarget;
  }
  // spawn obstacles
  state.spawnTimer++;
  if(state.spawnTimer >= state.spawnInterval){
    state.spawnTimer = 0;
    spawnObstacle();
     if (Math.random() < 0.5) {
        spawnTree();
    }
    // slowly decrease interval as game progresses
    if(state.spawnInterval > 36 && state.frames % 600 === 0) state.spawnInterval -= 6;
  }

  // update obstacle positions
  for(let i = state.obstacles.length - 1; i >= 0; i--){
    const o = state.obstacles[i];
    o.y += state.speed + (state.level - 1) * 0.6;

    // slow effect for oil patches
    if(o.type === 'oil' && Math.abs(o.y - state.player.y) < 100 && o.lane === state.player.lane){
      // if player is over oil, slightly reduce control (we just jitter target slightly)
      state.player.x += (Math.random()-0.5)*6;
    }

    // remove off-screen
    if(o.y > H + 200) state.obstacles.splice(i,1);
  }

  for(let i = state.trees.length - 1; i >= 0; i--) {
    state.trees[i].y += state.speed;

    if(state.trees[i].y > H + 100) {
        state.trees.splice(i, 1);
    }
}

  // collision check: use approximated bbox with lane centers
  for(const o of state.obstacles){
    if (!state.running) break;  // ✅ stop checking if game already ended
    const objBox = {
      x: o.x,
      y: o.y + o.height/2,
      width: o.width,
      height: o.height
    };
    const pBox = {
      x: state.player.x,
      y: state.player.y + state.player.height/2,
      width: state.player.width,
      height: state.player.height
    };
    if(collides(objBox, pBox)){
      // collision! end game
      state.player.alive = false;
      state.running = false;
      // create explosion at crash point
      state.explosion = {
        start: Date.now(),
        x: state.player.x,
        y: state.player.y
      };
      // --- SOUND ADDITION ---
      playSound("crash");
      stopBgMusic();
      prepareGameOverState();
      break;
    }
  }

  
  if(state.frames % 6 === 0) {
    // scoring: add points over time
    state.score += Math.floor(1 + state.level*0.3); //time based.
    //scoreEl.textContent = state.score;
  }


  // level up every 1000 points
  const newLevel = Math.floor(state.score / 400) + 1;
  if(newLevel !== state.level){
    state.level = newLevel;
    state.speed += 0.6;
    
    // 👇 update caps dynamically
    state.minSpeed = 2 + (state.level - 1) * 2;
    state.maxSpeed = 12 + (state.level - 1) * 2;
    
    //levelEl.textContent = state.level;
  }

    // scroll lane dashes
    roadOffset += state.speed * 0.8; // slower because pattern is bigger
    if (roadOffset > 160) roadOffset = 0; // match dash+gap total

}

// keyboard and controls
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  
  const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';


  // prevent scrolling on arrow keys in many browsers
  if(!isTyping && ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," "].includes(e.key)) e.preventDefault();
  switch (e.key) {
    case "ArrowLeft":
    case "a":
      moveLeft();
      break;
    case "ArrowUp":
    case "w":
      setSpeedTarget(state.speedTarget + 0.4);
      playSound("accelerate"); // --- SOUND ADDITION ---
      break;
    case "ArrowDown":
    case "s":
      setSpeedTarget(state.speedTarget - 0.4);
      playSound("brake"); // --- SOUND ADDITION ---
      break;
    case "ArrowRight":
    case "d":
      moveRight();
      break;
  }
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function handleInput(){
  if(!state.running) return;
  if(keys["arrowup"] || keys["w"]) setSpeedTarget(state.speedTarget + 0.2);
  if(keys["arrowdown"] || keys["s"]) setSpeedTarget(state.speedTarget - 0.2);
}

function moveLeft(){
  if (!state.running || state.paused || state.gameOver) return;
  playSound("move", 0.5); // --- SOUND ADDITION ---
  const p = state.player;
  p.lane = Math.max(0, p.lane - 1);
  p.targetX = lanes[p.lane];
}
function moveRight(){
  if (!state.running || state.paused || state.gameOver) return;
  playSound("move", 0.5); // --- SOUND ADDITION ---
  const p = state.player;
  p.lane = Math.min(2, p.lane + 1);
  p.targetX = lanes[p.lane];
}

// game loop
function loop(){
  requestAnimationFrame(loop);
  handleInput();
  update();
  render();
  if(!state.running && !state.player.alive){
    drawGameOverOverlay();
  }
}

// start / restart
function startGame(){
  if(state.running) return;
  stopAllActiveSounds();
  stopBgMusic();

  state.trees.length = 0;
  state.running = true;
  state.paused = false;
  state.score = 0;
  state.level = 1;
  state.speed = 3;
  state.speedTarget = 3;
  state.spawnInterval = 90;
  state.obstacles.length = 0;   // ✅ clear array fully
  state.trees.length = 0;
  roadOffset = 0;               // ✅ reset lane animation
  state.frames = 0;
  state.spawnTimer = 0;
  state.player = createPlayer();
  state.player.alive = true;
  // ensure UI labels
  ui.startLabel = 'Running';
  ui.pauseLabel = 'Pause';
  ui.saveName = '';

  playBgMusic();
}

// pause toggle
// Pause toggle (canvas-driven)
function togglePause(){
  state.paused = !state.paused;
  ui.pauseLabel = state.paused ? 'Resume' : 'Pause';
  if (state.paused) { playSound('pause'); stopBgMusic(); }
  else { playSound('pause'); playBgMusic(); }
}

// start button
// start button click handled via canvas; expose for compatibility
window.startGame = startGame;
window.togglePause = togglePause;

// save score button
// Save handled via canvas UI. Provide a helper to save by name.
function saveScoreByName(name){
  name = (name || 'Player').substring(0,20);
  return fetch('save_score.php', {
    method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ name, score: state.score })
  }).then(r=>r.json()).then(j=>{
    if(j.success){ ui.toast = 'Saved!'; setTimeout(()=>ui.toast=null,1200); fetchLeaders(); }
    else { ui.toast = 'Save failed'; setTimeout(()=>ui.toast=null,1200); }
  }).catch(e=>{ ui.toast = 'Save error'; setTimeout(()=>ui.toast=null,1200); });
}

// fetch leaders
function fetchLeaders(){
  return fetch('get_scores.php').then(r=>r.json()).then(list=>{ state.leaders = list || []; }).catch(e=>{ state.leaders = []; });
}

function getSpeedKmh() {
  return Math.round(state.speed * 10); // 10x multiplier → tweak for realism
}

// Preloader: wait for images and sounds before continuing
let assetsReady = false;
let _assetsProgress = 0;
let _assetsLoadingStuck = false;
let showRotateToPortrait = false;

function updatePortraitState(){
  showRotateToPortrait = window.innerWidth > window.innerHeight;
  ui.toast = showRotateToPortrait ? 'Please rotate back to portrait mode' : null;
}
window.addEventListener('resize', updatePortraitState);
window.addEventListener('orientationchange', updatePortraitState);
updatePortraitState();

function drawLoadingScreen(pct){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#111'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#fff'; ctx.font = '30px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Loading ' + pct + '%', W/2, H/2 - 40);
  if (_assetsLoadingStuck) {
    ctx.font = '18px sans-serif';
    ctx.fillText('Still loading assets, please wait...', W/2, H/2);
  }
  // progress bar
  const bw = Math.min(600, W * 0.7);
  const bh = 24;
  const bx = (W - bw)/2;
  const by = H/2 + 20;
  ctx.fillStyle = '#333'; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#0a8'; ctx.fillRect(bx, by, Math.round(bw * pct/100), bh);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
}

function drawRotateToPortrait(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#050505';
  ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('Rotate to Portrait', W/2, H/2 - 50);
  ctx.font = '20px sans-serif';
  const lines = [
    'This game works best in portrait mode.',
    'Please rotate your device back to portrait.'
  ];
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W/2, H/2 + i * 28 + 10);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  const boxW = W * 0.85;
  const boxH = 220;
  ctx.fillRect((W - boxW)/2, H/2 - 110, boxW, boxH);
  ctx.strokeStyle = '#0af';
  ctx.lineWidth = 3;
  ctx.strokeRect((W - boxW)/2, H/2 - 110, boxW, boxH);
}

function preloadAssets(options){
  options = options || {};
  const timeoutMs = options.timeoutMs || 30000; // allow up to 30s for slow mobile networks
  const imgs = [];
  // collect trees
  for (let i=1;i<=6;i++) imgs.push(trees[`t${i}`]);
  // sprites
  for (const k in images) imgs.push(images[k]);
  // controls
  for (const k in controlImgs) imgs.push(controlImgs[k]);
  

  const audios = [];
  for (const k in sounds) {
    try {
      const a = sounds[k];
      if (a) audios.push(a);
    } catch(e){}
  }

  const totalImages = imgs.length;
  if (totalImages === 0) { assetsReady = true; _assetsProgress = 100; return Promise.resolve(); }

  let loadedImages = 0;
  const markImageLoaded = function(){ loadedImages++; _assetsProgress = Math.round(loadedImages/totalImages*100); if (_assetsProgress>100) _assetsProgress=100; };

  return new Promise((resolve)=>{
    let finished = false;
    const failedImages = [];
    const tryFinish = function(){ if (finished) return; if (loadedImages >= totalImages){ finished = true; assetsReady = true; _assetsProgress = 100; resolve(); } };

    imgs.forEach(function(img){
      if (!img) { markImageLoaded(); tryFinish(); return; }
      if (img.complete && img.naturalWidth && img.naturalWidth > 0) { markImageLoaded(); tryFinish(); return; }
      const onl = function(){ if (img.naturalWidth && img.naturalWidth > 0) { img.removeEventListener('load', onl); img.removeEventListener('error', one); markImageLoaded(); tryFinish(); } else { one(); } };
      const one = function(){ img.removeEventListener('load', onl); img.removeEventListener('error', one); failedImages.push(img && img.src); markImageLoaded(); tryFinish(); if (_assetsLoadingStuck) _assetsLoadingStuck = false; };
      img.addEventListener('load', onl);
      img.addEventListener('error', one);
      try { if (!img.src) img.src = img.getAttribute && img.getAttribute('data-src') || img.src || ''; } catch(e){}
    });

    audios.forEach(function(a){
      if (!a) return;
      const onCan = function(){ a.removeEventListener('canplaythrough', onCan); a.removeEventListener('loadeddata', onCan); a.removeEventListener('error', onErr); };
      const onErr = function(){ a.removeEventListener('canplaythrough', onCan); a.removeEventListener('loadeddata', onCan); a.removeEventListener('error', onErr); };
      a.addEventListener('canplaythrough', onCan, { once: true });
      a.addEventListener('loadeddata', onCan, { once: true });
      a.addEventListener('error', onErr, { once: true });
      try { a.preload = 'auto'; a.load(); } catch(e){ onErr(); }
    });

    setTimeout(function(){ if (finished) return; _assetsLoadingStuck = true; _assetsProgress = Math.round(loadedImages/totalImages*100);
      // keep waiting until images actually complete or fail
    }, timeoutMs);
  });
}

// start preloading and keep the main loop running to render progress
preloadAssets().then(()=>{
  // small delay to let UI show 100%
  setTimeout(function(){
    // continue with original initialization
    setupUI();
    fetchLeaders();
    // Do NOT auto-start the game; keep Start button behavior as before
  }, 180);
});

// start main render loop; it will show loading until assetsReady becomes true
loop();

// === SHARE BUTTON HANDLER ===
document.addEventListener('DOMContentLoaded', () => {
  const shareBtn = document.getElementById('shareBtn');

  // ✅ Sanitize player input if DOM input exists (kept for backward compatibility)
  const pnameEl = document.getElementById('playerName');
  if (pnameEl) pnameEl.addEventListener('input', e => { e.target.value = e.target.value.replace(/[^a-zA-Z0-9 _-]/g, ''); });
  
  if (!shareBtn) return; // safety

  if (navigator.share) {
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: 'Road Fighter - Vibhore',
          text: 'Play this cool Road Fighter game!',
          //url: 'https://rohan.manishadaycare.in/road_fighter/'
        });
      } catch (err) {
        // share action cancelled or unavailable
      }
    });
  } else {
    // fallback if Web Share API not supported
    shareBtn.addEventListener('click', () => {
      //navigator.clipboard.writeText('https://rohan.manishadaycare.in/road_fighter/');
      //alert('Link copied! You can paste it anywhere.');
      //
      alert('this feature will be comming soon');
    });
  }
});

// Lightweight UI & leaderboard manager for Road Fighter

// Helpers
function $id(id) { return document.getElementById(id); }
function qs(sel, ctx) { return (ctx||document).querySelector(sel); }
function now() { return Date.now(); }

// Leaderboard storage key and limits
var STORAGE_KEY = 'rf_leaders_v1';
var MAX_LEADERS = 10;

// Read numeric values from DOM (game may update these)
function getCurrentScore() {
  var el = $id('score');
  if (!el) return 0;
  var v = parseInt(el.textContent || el.innerText || '0', 10);
  return isNaN(v) ? 0 : v;
}
function getCurrentLevel() {
  var el = $id('level');
  if (!el) return 1;
  var v = parseInt(el.textContent || el.innerText || '1', 10);
  return isNaN(v) ? 1 : v;
}

// Storage helpers
function loadLeadersFromStorage() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) { return []; }
}
function saveLeadersToStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save leaders', e);
  }
}

function addLeaderEntry(name, score, level) {
  var list = loadLeadersFromStorage();
  list.push({ name: (name||'Player').substr(0,20), score: parseInt(score||0,10)||0, level: parseInt(level||1,10)||1, ts: now() });
  // sort desc by score, then newest first
  list.sort(function(a,b){ if (b.score !== a.score) return b.score - a.score; return b.ts - a.ts; });
  list = list.slice(0, MAX_LEADERS);
  saveLeadersToStorage(list);
  return list;
}

function renderQuickLeaders() {
  // UI now renders leaders from state.leaders inside canvas
}

function ensureHiddenTextInput(){
  if (ui.hiddenInput) return ui.hiddenInput;
  const input = document.createElement('input');
  input.type = 'text';
  input.name = 'vjname';
  input.maxLength = 13;
  input.autocapitalize = 'words';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Save your score name');
  input.style.position = 'absolute';
  input.style.opacity = '0';
  input.style.pointerEvents = 'none';
  input.style.border = 'none';
  input.style.background = 'transparent';
  input.style.outline = 'none';
  input.style.zIndex = '9999';
  input.style.fontSize = '16px';
  input.style.padding = '0';
  input.style.margin = '0';
  input.addEventListener('input', function(){
    ui.saveName = input.value.trimStart();
  });
  input.addEventListener('focus', function(){
    if (ui.saveName === '' || ui.saveName === 'Tap here to type your name' || ui.saveName === 'Tap to type your name') {
      ui.saveName = '';
      input.value = '';
    }
  });
  input.addEventListener('keydown', function(e){
    if (e.key === 'Enter') {
      saveScoreByName(ui.saveName || 'Player');
      ui.panels.save = false;
      ui.inputActive = false;
      input.blur();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      ui.inputActive = false;
      input.blur();
      e.preventDefault();
    }
  });
  input.addEventListener('blur', function(){
    ui.inputActive = false;
  });
  document.body.appendChild(input);
  ui.hiddenInput = input;
  return input;
}

function positionHiddenSaveInput(){
  const input = ensureHiddenTextInput();
  if ((!ui.panels.save && !ui.showHighScorePrompt) || !ui.inputActive) {
    input.style.pointerEvents = 'none';
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / canvas.width;
  const scaleY = rect.height / canvas.height;
  let inputX, inputY, width;

  if (ui.panels.save) {
    const w = 460;
    const sx = (canvas.width - w) / 2;
    const sy = (canvas.height - 240) / 2;
    inputX = rect.left + (sx + 24) * scaleX;
    inputY = rect.top + (sy + 98) * scaleY;
    width = (w - 48) * scaleX;
  } else {
    const w = Math.min(520, canvas.width - 40);
    const sx = (canvas.width - w) / 2;
    const sy = (canvas.height - 320) / 2;
    inputX = rect.left + (sx + 24) * scaleX;
    inputY = rect.top + (sy + 180) * scaleY;
    width = (w - 48) * scaleX;
  }

  input.style.left = inputX + 'px';
  input.style.top = inputY + 'px';
  input.style.width = width + 'px';
  input.style.height = 52 * scaleY + 'px';
  input.style.pointerEvents = 'auto';
}

function activateSaveNameInput(){
  ui.inputActive = true;
  ui.saveName = ui.saveName || '';
  const input = ensureHiddenTextInput();
  input.value = ui.saveName;
  positionHiddenSaveInput();
  input.focus({ preventScroll: true });
  input.setSelectionRange(input.value.length, input.value.length);
  setTimeout(()=>{
    if (document.activeElement !== input) {
      input.focus({ preventScroll: true });
    }
  }, 50);
}

// Handle pointer interactions on canvas
function handleCanvasPointer(x,y){
  if (!state.running && !state.player.alive) {
    const panelW = Math.min(520, W - 40);
    const panelH = 380;
    const panelX = (W - panelW) / 2;
    const panelY = (H - panelH) / 2;
    const buttonW = 220;
    const buttonH = 62;
    const buttonX = (W - buttonW) / 2;
    const buttonY = panelY + panelH - 96;
    const closeX = panelX + panelW - 34;
    const closeY = panelY + 24;
    const promptX = panelX + 24;
    const promptWidth = panelW - 48;
    const promptY = panelY + 180;
    const saveX = W / 2 - 160 - 10;
    const cancelX = W / 2 + 10;
    const promptBtnY = panelY + panelH - 92;
    if (rectContains(closeX - 16, closeY - 16, 32, 32, x, y)) {
      resetToIdleScreen();
      return;
    }
    if (ui.showHighScorePrompt) {
        if (rectContains(promptX, promptY, promptWidth, 54, x, y)) {
        activateSaveNameInput();
        return;
      }
      if (rectContains(saveX, promptBtnY, 160, 52, x, y)) {
        if (!ui.saveName || !ui.saveName.trim()) {
          ui.toast = 'Name cannot be blank';
          setTimeout(()=> ui.toast = null, 1400);
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

  // check control images first
  if (ui._controlPos){
    for (const k of ['up','down','left','right']){
      const p = ui._controlPos[k];
      //const size = Math.min(72, Math.max(48, Math.floor(W * 0.08)));
      const size = 76;//fixed size
      if (Math.hypot(x - p.x, y - p.y) <= size){
        if (k === 'left') { moveLeft(); ui.holding = 'left'; ui.holdFrames = 0; }
        else if (k === 'right') { moveRight(); ui.holding = 'right'; ui.holdFrames = 0; }
        else if (k === 'up') { setSpeedTarget(state.speedTarget + 1); ui.holding = 'accelerate'; ui.holdFrames = 0; }
        else if (k === 'down') { setSpeedTarget(state.speedTarget - 1); ui.holding = 'brake'; ui.holdFrames = 0; }
        return;
      }
    }
  }
  // Start / Pause buttons (bottom-left)
  const btnW = 120, btnH = 44, gap = 12;
  const bx = 18, by = 48;
  if (rectContains(bx,by,btnW,btnH,x,y)) { togglePause(); return; }
  if (rectContains(bx + btnW + gap,by,btnW,btnH,x,y)) { startGame(); return; }
  
  // Panel buttons (bottom-right)
  const pW = 96, pH = 36; const px = W - pW - 18, py = H - pH - 18;
  if (rectContains(px,py,pW,pH,x,y)) { ui.panels.save = !ui.panels.save; ui.panels.leaders = false; ui.panels.controls = false; return; }
  if (rectContains(px - (pW+8),py,pW,pH,x,y)) { ui.panels.leaders = !ui.panels.leaders; ui.panels.save = false; ui.panels.controls = false; return; }
  if (rectContains(px - 2*(pW+8),py,pW,pH,x,y)) { ui.panels.controls = !ui.panels.controls; ui.panels.save = false; ui.panels.leaders = false; return; }

  // If save panel open, detect save button inside it
  if (ui.panels.save) {
    const w = 460, h = 240; const sx = (W - w)/2, sy = (H - h)/2;
    const closeX = sx + w - 40;
    const closeY = sy + 16;
    if (rectContains(closeX - 16, closeY - 16, 32, 32, x, y)) {
      ui.panels.save = false; ui.inputActive = false; return;
    }
    // Save button rect
    if (rectContains(sx + w - 140, sy + h - 58, 140, 50, x, y)) {
      saveScoreByName(ui.saveName || 'Player'); ui.panels.save = false; ui.inputActive = false; return;
    }
    // name input area: toggle focus and start typing
    if (rectContains(sx + 24, sy + 98, w - 48, 52, x, y)) { activateSaveNameInput(); return; }
  }

  if (ui.panels.leaders) {
    const w = 560, h = 480; const sx = (W - w)/2, sy = (H - h)/2;
    const closeX = sx + w - 40;
    const closeY = sy + 16;
    if (rectContains(closeX - 16, closeY - 16, 32, 32, x, y)) {
      ui.panels.leaders = false; ui.inputActive = false; return;
    }
  }

  if (ui.panels.controls) {
    const w = 520, h = 340; const sx = (W - w)/2, sy = (H - h)/2;
    const closeX = sx + w - 40;
    const closeY = sy + 16;
    if (rectContains(closeX - 16, closeY - 16, 32, 32, x, y)) {
      ui.panels.controls = false; ui.inputActive = false; return;
    }
  }

  // close panels when tapping outside
  if (ui.panels.save || ui.panels.leaders || ui.panels.controls) {
    const open = ui.panels.save ? {x:(W-460)/2,y:(H-240)/2,w:460,h:240}
                : ui.panels.leaders ? {x:(W-560)/2,y:(H-480)/2,w:560,h:480}
                : {x:(W-520)/2,y:(H-340)/2,w:520,h:340};
    if (!rectContains(open.x, open.y, open.w, open.h, x, y)) { ui.panels.save = ui.panels.leaders = ui.panels.controls = false; ui.inputActive = false; }
  }
}

function renderFullLeaders() {
  // populate state.leaders from local storage backup
  var list = loadLeadersFromStorage();
  state.leaders = list || [];
}

function closeQuickMenu() {
  //console.log(1284);
  ui.quickMenuOpen = false;
  const menu = document.getElementById('quickMenu');
  const toggle = document.getElementById('settingsToggle');
  if (menu) {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
  }
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function toggleQuickMenu(force) {
  //console.log("toggling1296");
  const menu = document.getElementById('quickMenu');
  const toggle = document.getElementById('settingsToggle');
  if (!menu || !toggle) return;
  const shouldOpen = typeof force === 'boolean' ? force : !ui.quickMenuOpen;
  ui.quickMenuOpen = shouldOpen;
  menu.classList.toggle('open', shouldOpen);
  menu.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
}

function openQuickPanel(panelName) {
  //ui.panels.save = false;
  ui.panels.leaders = false;
  ui.panels.controls = false;

  //if (panelName === 'save') ui.panels.save = true;
  if (panelName === 'leaders') ui.panels.leaders = true;
  if (panelName === 'controls') ui.panels.controls = true;

  closeQuickMenu();
}

// Panels & buttons
function openPanel(id) {
  var el = $id(id);
  if (!el) return;
  // close others
  ['leadersPanel','controlsPanel'].forEach(function(pid){ if(pid!==id){ var p=$id(pid); if(p) p.style.display='none'; } });
  el.style.display = 'block';
  el.setAttribute('aria-hidden','false');
  // populate when opened
  if (id === 'leadersPanel') renderFullLeaders();
}
function closePanel(id) {
  var el = $id(id);
  if (!el) return;
  el.style.display = 'none';
  el.setAttribute('aria-hidden','true');
}

// Setup event bindings
function setupUI() {
  console.log("1278 setup ui");
  const settingsToggle = document.getElementById('settingsToggle');
  const quickMenu = document.getElementById('quickMenu');

  if (settingsToggle) {
    settingsToggle.addEventListener('click', function(e){
      e.stopPropagation();
      toggleQuickMenu();
    });
  }

  if (quickMenu) {
    quickMenu.querySelectorAll('.quick-action').forEach(function(btn){
      btn.addEventListener('click', function(){
        openQuickPanel(btn.getAttribute('data-panel'));
      });
    });
  }

  document.addEventListener('click', function(e){
    if (!e.target.closest('.hud-overlay')) {
      closeQuickMenu();
    }
  });

  // All UI is rendered inside canvas. Bind pointer events for canvas interactions.
  canvas.addEventListener('pointerdown', function(e){
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    handleCanvasPointer(x,y);
  });

  canvas.addEventListener('pointerup', function(e){
    ui.holding = null;
    ui.holdFrames = 0;
    window.requestAnimationFrame(() => {
      if (!ui.hiddenInput || document.activeElement !== ui.hiddenInput) {
        ui.inputActive = false;
      }
    });
  });

  // keyboard shortcuts
  canvas.addEventListener('keydown', function(e){
    if (ui.inputActive && !document.activeElement) {
      if (e.key === 'Backspace') ui.saveName = (ui.saveName||'').slice(0,-1);
      else if (e.key.length === 1) ui.saveName = (ui.saveName||'') + e.key;
      e.preventDefault();
      return;
    }
  });

  window.addEventListener('keydown', function(e) {
    if (!ui.inputActive) return;
    if (e.target === ui.hiddenInput) return;
    if (e.key === 'Backspace') {
      ui.saveName = (ui.saveName||'').slice(0,-1);
      e.preventDefault();
    } else if (e.key.length === 1) {
      ui.saveName = (ui.saveName||'') + e.key;
      e.preventDefault();
    }
  });

  // Share
  var shareBtn = $id('shareBtn');
  if (shareBtn) shareBtn.addEventListener('click', function(){
    var score = getCurrentScore();
    var level = getCurrentLevel();
    var txt = 'I scored ' + score + ' points (Level ' + level + ') in Road Fighter!';
    if (navigator.share) {
      navigator.share({ title: 'Road Fighter', text: txt, url: location.href }).catch(function(){});
    } else {
      // fallback: copy to clipboard if available
      if (navigator.clipboard) {
        navigator.clipboard.writeText(txt + ' ' + location.href).then(function(){
          var prev = shareBtn.textContent;
          shareBtn.textContent = 'Copied ✓';
          setTimeout(function(){ shareBtn.textContent = prev; }, 900);
        });
      } else {
        alert(txt + '\n' + location.href);
      }
    }
  });

  // Touch controls (left/right/brake/accelerate)
  function bindTouch(id, eventName) {
    var el = $id(id);
    if (!el) return;
    el.addEventListener('pointerdown', function(e){ e.preventDefault(); dispatchControl(eventName, true); });
    el.addEventListener('pointerup', function(e){ e.preventDefault(); dispatchControl(eventName, false); });
    el.addEventListener('pointerleave', function(e){ e.preventDefault(); dispatchControl(eventName, false); });
  }
  function dispatchControl(name, active) {
    // If the game exposes onControl or similar use it; otherwise dispatch events
    if (window.onGameControl && typeof window.onGameControl === 'function') {
      try { window.onGameControl(name, !!active); } catch(e) {}
    } else {
      window.dispatchEvent(new CustomEvent('gameControl', { detail: { control: name, active: !!active } }));
    }
  }
  bindTouch('leftTouch', 'left');
  bindTouch('rightTouch', 'right');
  bindTouch('brakeTouch', 'brake');
  bindTouch('accelerateTouch', 'accelerate');

  // Show/hide touch UI based on environment
  function updateTouchVisibility() {
    var tc = $id('touchControls');
    if (!tc) return;
    var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    var smallScreen = window.innerWidth <= 700;
    tc.style.display = (isTouch || smallScreen) ? 'block' : 'none';
  }
  window.addEventListener('resize', updateTouchVisibility);
  window.addEventListener('orientationchange', updateTouchVisibility);
  updateTouchVisibility();

  // Initialize leader lists
  renderQuickLeaders();
  renderFullLeaders();
  // focus canvas for keyboard input
  try { canvas.tabIndex = canvas.tabIndex || 0; canvas.focus(); } catch(e) {}
}

// Expose a tiny API if the game wants to call into UI (optional)
window.RoadFighterUI = {
  refreshLeaders: function(){ renderQuickLeaders(); renderFullLeaders(); },
  addLeader: function(name, score, level){ addLeaderEntry(name, score, level); renderQuickLeaders(); renderFullLeaders(); }
};

// Add speed getter (reads #speed if game updates it)
function getCurrentSpeed() {
  var el = document.getElementById('speed');
  if (!el) return 0;
  var txt = (el.textContent || el.innerText || '0').replace(/[^0-9\.]/g,'');
  var v = parseFloat(txt || '0');
  return isNaN(v) ? 0 : v;
}

// Expose via UI API
window.RoadFighterUI = window.RoadFighterUI || {};
window.RoadFighterUI.getScore = getCurrentScore;
window.RoadFighterUI.getLevel = getCurrentLevel;
window.RoadFighterUI.getSpeed = getCurrentSpeed;

// Notify game logic that UI requests a slight scale-up for car/sprites.
// Game code may listen to 'ui:scale' and apply its own sprite scaling if available.
function sendScaleHint() {
  try {
    var desired = { carScale: 1.2, reason: 'ui-enlarge' };
    window.dispatchEvent(new CustomEvent('ui:scale', { detail: desired }));
  } catch (e) { /* ignore */ }
}
// fire once after UI initialization (game can listen to this)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function(){ sendScaleHint(); });
} else {
  sendScaleHint();
}

// Responsive canvas sizing: ensure internal scripts relying on canvas size can read attributes
//var canvas = document.getElementById('game');

function getCssScale(el) {
  try {
    var s = window.getComputedStyle(el).transform;
    if (!s || s === 'none') return 1;
    // matrix(a, b, c, d, e, f) => scaleX = a
    var m = s.match(/matrix\(([^)]+)\)/);
    if (!m) return 1;
    var parts = m[1].split(',').map(function(p){ return parseFloat(p.trim()); });
    if (parts.length >= 1) return parts[0] || 1;
  } catch (e) {}
  return 1;
}

// Touch controls visibility: toggle class instead of inline styles
function updateTouchVisibility() {
  var tc = document.getElementById('touchControls');
  if (!tc) return;
  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  var smallScreen = window.innerWidth <= 700;
  if (isTouch || smallScreen) tc.classList.add('visible'); else tc.classList.remove('visible');
}
window.addEventListener('resize', updateTouchVisibility);
window.addEventListener('orientationchange', updateTouchVisibility);
updateTouchVisibility();

function resizeCanvas() {

    const gameWidth = 720;
    const gameHeight = 1200;

    const scale = Math.min(
        window.innerWidth / gameWidth,
        window.innerHeight / gameHeight
    );

    canvas.style.width = `${gameWidth * scale}px`;
    canvas.style.height = `${gameHeight * scale}px`;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();