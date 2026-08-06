const MAX_BULLETS = 10;

export const state = {
  running: false,
  paused: false,
  score: 0,
  distance: 0,
  level: 1,
  speed: 3,
  speedTarget: 3,
  spawnTimer: 0,
  spawnInterval: 90,
  obstacles: [],
  bullets: [],
  bulletsRemaining: MAX_BULLETS,
  coins: [],
  floatingTexts: [],
  trees: [],
  player: null,
  frames: 0,
  minSpeed: 2,
  maxSpeed: 12,
  explosion: null,
  leaders: [],
  scoreFromCoins: 0
};

export const ui = {
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
  lastCursorToggle: Date.now(),
  holding: null,
  holdFrames: 0,
  lastShotFrame: -Infinity,
  startLabel: 'Running',
  saveName: '',
  _controlPos: null,
  _resumeBtn: null
};

export const gameConfig = {
  MAX_BULLETS,
  MIN_REVERSE_SPEED: 0,
  GUN_COOLDOWN_FRAMES: 15,
  COIN_COLORS: {
    500: '#FFD700',
    200: '#FF6B6B',
    100: '#4ECDC4',
    50: '#9D84B7'
  }
};
