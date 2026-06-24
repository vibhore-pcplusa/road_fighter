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
//const scoreEl = document.getElementById('score');
//const levelEl = document.getElementById('level');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const saveBtn = document.getElementById('saveBtn');
const playerNameInput = document.getElementById('playerName');
const leaderList = document.getElementById('leaderList');
const touchControls = document.getElementById('touchControls');
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
    startBtn.textContent = "Restart";
  }
}

// basic mobile detection to show touch controls
function setupTouch(){
     //console.log(window.innerWidth);
  if(window.innerWidth < 700){
    touchControls.style.display = 'block';
    document.getElementById('leftTouch').addEventListener('touchstart', e => { e.preventDefault(); moveLeft(); });
    document.getElementById('rightTouch').addEventListener('touchstart', e => { e.preventDefault(); moveRight(); });
    document.getElementById('brakeTouch').addEventListener('touchstart', e => { e.preventDefault(); state.speed = Math.max(state.minSpeed, state.speed - 2); playSound("brake"); }); // --- SOUND ADDITION ---
    document.getElementById('accelerateTouch').addEventListener('touchstart', e => { e.preventDefault(); state.speed = Math.min(state.maxSpeed, state.speed + 2); playSound("accelerate"); }); // --- SOUND ADDITION ---
  }
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
  saveBtn.disabled = false;

  // reset button text while running
  startBtn.textContent = "Start";

  // --- SOUND ADDITION ---
  playSound("start");
  playBgMusic();
}

// pause toggle
pauseBtn.addEventListener('click', () => {
  state.paused = !state.paused;
  pauseBtn.textContent = state.paused ? "Resume" : "Pause";
  if (state.paused) {
    playSound("pause"); // --- SOUND ADDITION ---
    sounds.bg.pause();
  } else {
    playSound("pause"); // --- SOUND ADDITION ---
    sounds.bg.play().catch(err => console.log("Resume blocked:", err));
  }
});

// start button
startBtn.addEventListener('click', ()=>{
  startGame();
});

// save score button
saveBtn.addEventListener('click', ()=>{
  const name = (playerNameInput.value || 'Player').substring(0,20);
  fetch('save_score.php', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ name, score: state.score })
  })
  .then(r => r.json())
  .then(j => {
    if(j.success) {
      alert('Score saved!');
      fetchLeaders();
    } else alert('Save failed');
  })
  .catch(e => alert('Save error'));
  playerNameInput.value = '';
  saveBtn.disabled = true;

});

// fetch leaders
function fetchLeaders(){
  fetch('get_scores.php')
    .then(r => r.json())
    .then(list => {
      leaderList.innerHTML = '';
      if(!list || list.length === 0) leaderList.innerHTML = '<li>No scores</li>';
      else list.forEach(it => {
        const li = document.createElement('li');
        // Convert to Date object
        const date = new Date(it.created_at);

        // Format in IST
        const options = {
          timeZone: "Asia/Kolkata",
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit"
        };

        const istTime = new Intl.DateTimeFormat("en-IN", options).format(date);
        li.textContent = it.name + ' — ' + it.score + ' At '+istTime +' (IST)';
        leaderList.appendChild(li);
      });
    }).catch(e => {
      leaderList.innerHTML = '<li>Error</li>';
    });
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

  // ✅ Add this line to sanitize player input
  document.getElementById('playerName').addEventListener('input', e => {
    e.target.value = e.target.value.replace(/[^a-zA-Z0-9 _-]/g, '');
  });
  
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
  var quick = $id('leaderList');
  if (!quick) return;
  var list = loadLeadersFromStorage();
  quick.innerHTML = '';
  if (!list.length) {
    quick.innerHTML = '<li>No scores</li>';
    return;
  }
  list.forEach(function(it){
    var li = document.createElement('li');
    li.textContent = it.name + ' — ' + it.score;
    quick.appendChild(li);
  });
}

function renderFullLeaders() {
  var container = $id('leaderListFull');
  if (!container) return;
  var list = loadLeadersFromStorage();
  container.innerHTML = '';
  if (!list.length) {
    container.innerHTML = '<li>No scores</li>';
    return;
  }
  list.forEach(function(it, idx){
    var li = document.createElement('li');
    li.textContent = (idx+1) + '. ' + it.name + ' — ' + it.score + ' (L' + it.level + ')';
    container.appendChild(li);
  });
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
  // open buttons (some already attached in inline script, reattach safely)
  var mappings = [
    {btn:'openSave', panel:'savePanel'},
    {btn:'openLeaders', panel:'leadersPanel'},
    {btn:'openControls', panel:'controlsPanel'}
  ];
  mappings.forEach(function(m){
    var btn = $id(m.btn);
    if (btn) btn.addEventListener('click', function(e){ e.stopPropagation(); openPanel(m.panel); });
  });

  // close buttons in panels
  document.querySelectorAll('.panel .close').forEach(function(btn){
    var target = btn.getAttribute('data-close');
    if (target) btn.addEventListener('click', function(e){ e.stopPropagation(); closePanel(target); });
  });

  // close when clicking outside panels (keeps index behavior)
  document.addEventListener('click', function(e){
    var insidePanel = !!e.target.closest('.panel');
    var clickedToggler = !!e.target.closest('#openSave, #openLeaders, #openControls');
    if (!insidePanel && !clickedToggler) {
      ['savePanel','leadersPanel','controlsPanel'].forEach(closePanel);
    }
  });

  // Save score action
  var saveBtn = $id('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function(){
      var nameInput = $id('playerName');
      var name = nameInput ? nameInput.value.trim() : 'Player';
      var score = getCurrentScore();
      var level = getCurrentLevel();
      if (!name) {
        // quick inline feedback
        if (nameInput) {
          nameInput.focus();
          nameInput.style.border = '1px solid #e66';
          setTimeout(function(){ nameInput.style.border=''; }, 900);
        }
        return;
      }
      addLeaderEntry(name, score, level);
      renderQuickLeaders();
      renderFullLeaders();
      // success feedback
      var original = saveBtn.textContent;
      saveBtn.textContent = 'Saved ✓';
      setTimeout(function(){ saveBtn.textContent = original; }, 1000);
      // optionally close panel after saving
      setTimeout(function(){ closePanel('savePanel'); }, 600);
    });
  }

  // Start / Pause bridging
  var startBtn = $id('startBtn');
  var pauseBtn = $id('pauseBtn');
  if (startBtn) startBtn.addEventListener('click', function(){
    if (typeof window.startGame === 'function') return window.startGame();
    window.dispatchEvent(new CustomEvent('gameStart'));
  });
  if (pauseBtn) pauseBtn.addEventListener('click', function(){
    if (typeof window.pauseGame === 'function') return window.pauseGame();
    window.dispatchEvent(new CustomEvent('gamePause'));
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
  document.addEventListener('DOMContentLoaded', setupUI);
} else {
  setupUI();
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