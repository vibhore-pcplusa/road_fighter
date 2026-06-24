/* ---- Road Fighter - Canvas Game ----
  Features:
  - 3 lanes, player car moves left/right smoothly
  - obstacles spawn and move down
  - increasing speed/level with score
  - collision detection (AABB)
  - mobile touch support
  - optional sprite loading (commented)
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
  saveMessage: ''
};
//state = state || {};
//state.leaders = [];
// ---load trees---
const trees = {};

for (let i = 1; i <= 6; i++) {
    trees[`t${i}`] = new Image();
    trees[`t${i}`].src = `assets/trees/t${i}.png`;
}

// --- Sprites ---
const images = {};
const spriteFiles = {
  mycar: "mycar.png",
  red: "red_car.png",
  blue: "blue_car.png",
  green: "green_car.png",
  gadda: "gadda.jpg" // if you have one; else keep fillRect
};

for (const key in spriteFiles) {
  images[key] = new Image();
  images[key].src = "assets/" + spriteFiles[key]; // adjust path if needed
}

// --- SOUND ADDITION ---
const sounds = {
  accelerate: new Audio("assets/sounds/accelerate.mp3"),
  brake: new Audio("assets/sounds/brake.mp3"),
  move: new Audio("assets/sounds/move.mp3"),
  crash: new Audio("assets/sounds/crash.mp3"),
  start: new Audio("assets/sounds/start.mp3"),
  pause: new Audio("assets/sounds/pause.mp3"),
  /*resume: new Audio("assets/sounds/resume.mp3"),*/
  bg: new Audio("assets/sounds/bg_music.mp3")  // background music
};
sounds.bg.loop = true;
sounds.bg.volume = 0.8;

function playSound(sound) {
  if (sounds[sound]) {
    const s = sounds[sound].cloneNode();
    s.play().catch(err => console.log("Sound blocked:", err));
  }
}
function playBgMusic() {
  sounds.bg.currentTime = 0;
  sounds.bg.play().catch(err => console.log("BG music blocked:", err));
}
function stopBgMusic() {
  sounds.bg.pause();
}

// Canvas UI helpers
function rectContains(rx, ry, rw, rh, x, y) {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

let roadOffset = 0;

const W = canvas.width, H = canvas.height;
console.log(W);
console.log("vj");
console.log(H);
const lanes = [W*0.18, W*0.5, W*0.82]; // center x positions for 3 lanes

let state = {
  running: false,
  paused: false,
  score: 0,
  level: 1,
  speed: 3,
  spawnTimer: 0,
  spawnInterval: 90, // frames
  obstacles: [],
  trees:[],
  /*player: null,*/
  player: createPlayer(), 
  frames: 0,
  minSpeed: 2,   // 👈 NEW
  maxSpeed: 12   // 👈 NEW
};



// Player definition
function createPlayer(){
  return {
    lane:1, // 0..2
    x: lanes[1],
    y: H - 180,
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
    ? -15 + Math.random() * 10
    : canvas.width - 115 + Math.random() * 10,
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
  ctx.fillStyle = "grey";
  ctx.fillRect(roadX,0,roadW,H);
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

// main render
function render(){
  ctx.clearRect(0,0,W,H);
  drawRoad();
  for(const tree of state.trees) {
    const img = trees[tree.sprite];

    if(img && img.complete) {
        ctx.drawImage(
            img,
            tree.x,
            tree.y,
            tree.width,
            tree.height
        );
    }
}
    // HUD Header Dashboard Starts
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, 38); // semi-transparent bar at top

    ctx.fillStyle = "#fff";
    ctx.font = "26px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Level: " + state.level, 100, 22);

    ctx.textAlign = "center";
    ctx.fillText("Speed: " + getSpeedKmh() + " km/h", W/2, 22);

    ctx.textAlign = "right";
    ctx.fillText("Score: " + state.score, W - 130, 22);
    ctx.restore();
    // HUD Header Dashboard Ends

  // draw obstacles
  for(const o of state.obstacles){
    ctx.save();
    ctx.translate(o.x - o.width/2, o.y);
    if (o.type === "car") {
    const carChoices = [images.red, images.blue, images.green];
    const img = carChoices[o.lane % carChoices.length];
    if (img.complete) {
            ctx.drawImage(img, 0, 0, o.width, o.height);
    } else {
      ctx.fillStyle = o.color;
      ctx.fillRect(0, 0, o.width, o.height);
    }
  } else if (o.type === "oil") {
    //ctx.fillStyle = "brown";
    ctx.drawImage(images.gadda,0, 0, o.width, o.height);
    }
    
    ctx.restore();
  }

  // draw player (interpolate to targetX)
  const p = state.player;
  // smooth movement toward targetX
  p.x += (p.targetX - p.x) * 0.25;
  ctx.save();
  ctx.translate(p.x - p.width/2, p.y);
  if (images.mycar.complete) {
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

  // draw in-canvas UI controls
  drawCanvasUI();
}

// Canvas UI drawing
function drawCanvasUI(){
  // top HUD background already drawn; draw buttons bottom-left
  ctx.save();
  // Start / Pause buttons (bottom-left)
  const btnW = 120, btnH = 44, gap = 12;
  const x = 18, y = H - btnH - 18;
  ctx.fillStyle = '#222'; ctx.globalAlpha = 0.9;
  ctx.fillRect(x-8, y-12, btnW*2 + gap + 24, btnH + 24);
  ctx.globalAlpha = 1;

  // Start
  ctx.fillStyle = '#0a8';
  ctx.fillRect(x, y, btnW, btnH);
  ctx.fillStyle = '#000'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ui.startLabel, x + btnW/2, y + 28);
  // Pause
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(x + btnW + gap, y, btnW, btnH);
  ctx.fillStyle = '#000'; ctx.fillText(ui.pauseLabel, x + btnW + gap + btnW/2, y + 28);

  // Panel buttons (bottom-right)
  const pW = 96, pH = 36; const px = W - pW - 18, py = H - pH - 18;
  ctx.fillStyle = '#0af'; ctx.fillRect(px, py, pW, pH); ctx.fillStyle = '#000'; ctx.fillText('Save', px + pW/2, py + 23);
  ctx.fillStyle = '#8af'; ctx.fillRect(px - (pW+8), py, pW, pH); ctx.fillStyle = '#000'; ctx.fillText('Leaders', px - (pW+8) + pW/2, py + 23);
  ctx.fillStyle = '#cfc'; ctx.fillRect(px - 2*(pW+8), py, pW, pH); ctx.fillStyle = '#000'; ctx.fillText('Help', px - 2*(pW+8) + pW/2, py + 23);

  // Draw panels if open
  if (ui.panels.save) drawSavePanel();
  if (ui.panels.leaders) drawLeadersPanel();
  if (ui.panels.controls) drawControlsPanel();

  // toast
  if (ui.toast) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(W/2 - 140, 80, 280, 40);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(ui.toast, W/2, 105);
  }

  ctx.restore();
}

function drawSavePanel(){
  const w = 420, h = 180; const x = (W - w)/2, y = (H - h)/2;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Save Score', x + 16, y + 34);
  ctx.font = '16px sans-serif'; ctx.fillText('Name: ' + (ui.saveName || ''), x + 16, y + 74);
  // Save button
  ctx.fillStyle = '#0a8'; ctx.fillRect(x + w - 120, y + h - 54, 96, 36);
  ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.fillText('Save', x + w - 120 + 48, y + h - 28);
  ctx.restore();
}

function drawLeadersPanel(){
  const w = 520, h = 420; const x = (W - w)/2, y = (H - h)/2;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Top Scores (IST Time)', x + 16, y + 34);
  ctx.font = '16px sans-serif';
  const list = state.leaders && state.leaders.length ? state.leaders : [];
  if (!list.length) ctx.fillText('No scores', x + 16, y + 64);
  else {
    for (let i=0;i<Math.min(10, list.length); i++){
      const it = list[i];
       // Convert to Date object
        const date = new Date(it.created_at);

        // Format in IST
        const options = {
          timeZone: "Asia/Kolkata",
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit"
        };

        const istTime = new Intl.DateTimeFormat("en-IN", options).format(date);
        ctx.fillText((i+1)+'. '+it.name+' — '+it.score+' At '+istTime+' ', x + 16, y + 64 + i*28);
    }
  }
  ctx.restore();
}

function drawControlsPanel(){
  const w = 520, h = 320; const x = (W - w)/2, y = (H - h)/2;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif'; ctx.textAlign = 'left';
  const lines = [
    'Controls & Rules',
    'Arrow keys / A D to move left/right',
    'Up to speed up, Down to slow',
    'Touch controls appear on small screens',
    'Speed increases with levels; level-up every 400 points',
    'Developed by Vibhore Jain'
  ];
  for (let i=0;i<lines.length;i++) ctx.fillText(lines[i], x + 16, y + 36 + i*28);
  ctx.restore();
}

// update game logic
function update(){
  if(!state.running || state.paused) return;

  state.frames++;
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
      // --- SOUND ADDITION ---
      playSound("crash");
      stopBgMusic();
      break;
    }
  }

  
  if(state.frames % 6 === 0) {
    // scoring: add points over time
    state.score += Math.floor(1 + state.level*0.3); //time based.
    //scoreEl.textContent = state.score;
  }
  
  // scoring: add points based on distance traveled
  //state.score += Math.floor(state.speed);
  //scoreEl.textContent = state.score;

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
    case "ArrowRight":
    case "d":
      moveRight();
      break;
    case "ArrowUp":
    case "w":
      state.speed = Math.min(state.maxSpeed, state.speed + 0.4);
      playSound("accelerate"); // --- SOUND ADDITION ---
      break;
    case "ArrowDown":
    case "s":
      state.speed = Math.max(state.minSpeed, state.speed - 0.4);
      playSound("brake"); // --- SOUND ADDITION ---
      break;
  }
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function handleInput(){
  if(!state.running) return;
  if(keys["arrowup"] || keys["w"]) state.speed = Math.min(state.maxSpeed, state.speed + 0.2);
  if(keys["arrowdown"] || keys["s"]) state.speed = Math.max(state.minSpeed, state.speed - 0.2);
}

function moveLeft(){
  console.log("move left");
  playSound("move"); // --- SOUND ADDITION ---
  const p = state.player;
  p.lane = Math.max(0, p.lane - 1);
  p.targetX = lanes[p.lane];
}
function moveRight(){
  console.log("move right");
  playSound("move"); // --- SOUND ADDITION ---
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
    // show GAME OVER overlay
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "38px sans-serif";
    ctx.fillText("GAME OVER", W/2, H/2 - 10);
    ctx.font = "38px sans-serif";
    ctx.fillText("Score: " + state.score, W/2, H/2 + 22);
    ctx.restore();
    // 👇 change Start button text
    ui.startLabel = 'Restart';
  }
}

// basic mobile detection to show touch controls
function setupTouch(){
  // handled by canvas UI now; keep placeholder for compatibility
}


// start / restart
function startGame(){
  state.trees.length = 0;
  state.running = true;
  state.paused = false;
  state.score = 0;
  state.level = 1;
  state.speed = 3;
  state.spawnInterval = 90;
  //state.obstacles = [];
  state.obstacles.length = 0;   // ✅ clear array fully
  state.trees.length = 0;
  roadOffset = 0;               // ✅ reset lane animation
  state.frames = 0;
  state.spawnTimer = 0;
  state.player = createPlayer();
  state.player.alive = true;
  //scoreEl.textContent = state.score;
  //levelEl.textContent = state.level;
  // ensure UI labels
  ui.startLabel = 'Start';
  ui.pauseLabel = 'Pause';
  ui.saveName = '';

  // reset button text while running
  //startBtn.textContent = "Start";

  // --- SOUND ADDITION ---
  playSound("start");
  playBgMusic();
}

// pause toggle
// Pause toggle (canvas-driven)
function togglePause(){
  state.paused = !state.paused;
  ui.pauseLabel = state.paused ? 'Resume' : 'Pause';
  if (state.paused) { playSound('pause'); sounds.bg.pause(); }
  else { playSound('pause'); sounds.bg.play().catch(()=>{}); }
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

// initial setup
setupTouch();
fetchLeaders();
//startGame(); It should start only on button click.
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
        console.log('Share cancelled', err);
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

// Handle pointer interactions on canvas
function handleCanvasPointer(x,y){
  // Start / Pause buttons (bottom-left)
  const btnW = 120, btnH = 44, gap = 12;
  const bx = 18, by = H - btnH - 18;
  if (rectContains(bx,by,btnW,btnH,x,y)) { startGame(); return; }
  if (rectContains(bx + btnW + gap,by,btnW,btnH,x,y)) { togglePause(); return; }
  // Panel buttons (bottom-right)
  const pW = 96, pH = 36; const px = W - pW - 18, py = H - pH - 18;
  if (rectContains(px,py,pW,pH,x,y)) { ui.panels.save = !ui.panels.save; ui.panels.leaders = false; ui.panels.controls = false; return; }
  if (rectContains(px - (pW+8),py,pW,pH,x,y)) { ui.panels.leaders = !ui.panels.leaders; ui.panels.save = false; ui.panels.controls = false; return; }
  if (rectContains(px - 2*(pW+8),py,pW,pH,x,y)) { ui.panels.controls = !ui.panels.controls; ui.panels.save = false; ui.panels.leaders = false; return; }

  // If save panel open, detect save button inside it
  if (ui.panels.save) {
    const w = 420, h = 180; const sx = (W - w)/2, sy = (H - h)/2;
    // Save button rect
    if (rectContains(sx + w - 120, sy + h - 54, 96, 36, x, y)) {
      saveScoreByName(ui.saveName || 'Player'); ui.panels.save = false; ui.inputActive = false; return;
    }
    // name input area: toggle focus and start typing
    if (rectContains(sx + 16, sy + 58, w - 32, 28, x, y)) { ui.inputActive = true; ui.saveName = ui.saveName || ''; return; }
  }

  // close panels when tapping outside
  if (ui.panels.save || ui.panels.leaders || ui.panels.controls) {
    const open = ui.panels.save ? {x:(W-420)/2,y:(H-180)/2,w:420,h:180}
                : ui.panels.leaders ? {x:(W-520)/2,y:(H-420)/2,w:520,h:420}
                : {x:(W-520)/2,y:(H-320)/2,w:520,h:320};
    if (!rectContains(open.x, open.y, open.w, open.h, x, y)) { ui.panels.save = ui.panels.leaders = ui.panels.controls = false; ui.inputActive = false; }
  }
}

function renderFullLeaders() {
  // populate state.leaders from local storage backup
  var list = loadLeadersFromStorage();
  state.leaders = list || [];
}

// Panels & buttons
function openPanel(id) {
  var el = $id(id);
  if (!el) return;
  // close others
  ['savePanel','leadersPanel','controlsPanel'].forEach(function(pid){ if(pid!==id){ var p=$id(pid); if(p) p.style.display='none'; } });
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
  // All UI is rendered inside canvas. Bind pointer events for canvas interactions.
  canvas.addEventListener('pointerdown', function(e){
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    handleCanvasPointer(x,y);
  });

  // keyboard shortcuts
  canvas.addEventListener('keydown', function(e){
    // typing into save name
    if (ui.inputActive) {
      if (e.key === 'Backspace') ui.saveName = (ui.saveName||'').slice(0,-1);
      else if (e.key.length === 1) ui.saveName = (ui.saveName||'') + e.key;
      e.preventDefault(); return;
    }
    /*const k = e.key.toLowerCase();
    if (k === 'a' || k === 'arrowleft') moveLeft();
    if (k === 'd' || k === 'arrowright') moveRight();
    if (k === ' ' || k === 'enter') startGame();
    if (k === 'p') togglePause();
    if (k === 'w' || k === 'arrowup') state.speed = Math.min(state.maxSpeed, state.speed + 1);
    if (k === 's' || k === 'arrowdown') state.speed = Math.max(state.minSpeed, state.speed - 1);*/
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
/*
function syncCanvasSize(){
  if (!canvas) return;
  var rect = canvas.getBoundingClientRect();
  var scale = window.devicePixelRatio || 1;
  // account for any CSS transform scale so drawing resolution matches visual size
  var cssScale = getCssScale(canvas) || 1;
  var w = Math.max(480, Math.floor(rect.width * scale / cssScale));
  var h = Math.max(640, Math.floor(rect.height * scale / cssScale));
  canvas.width = w;
  canvas.height = h;
  // keep CSS sizing controlled by stylesheet
  canvas.style.width = '100%';
  canvas.style.height = '100%';
}

window.addEventListener('resize', syncCanvasSize);
window.addEventListener('orientationchange', syncCanvasSize);
document.addEventListener('DOMContentLoaded', function(){ setTimeout(syncCanvasSize,50); });
*/
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

// ensure canvas sync runs after possible CSS transform changes
//setTimeout(syncCanvasSize, 300);

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function(){ setupUI(); fetchLeaders(); renderQuickLeaders(); });
} else {
  setupUI(); fetchLeaders(); renderQuickLeaders();
}


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