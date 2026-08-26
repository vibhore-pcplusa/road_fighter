const sounds = {
  accelerate: new Audio("assets/sounds/accelerate.mp3"),
  brake: new Audio("assets/sounds/brake.mp3"),
  move: new Audio("assets/sounds/move.mp3"),
  crash: new Audio("assets/sounds/crash.mp3"),
  pause: new Audio("assets/sounds/pause.mp3"),
  bg: new Audio("assets/sounds/bg_music.mp3"),
  shoot: new Audio("assets/sounds/shoot.wav")
};

sounds.bg.loop = true;
sounds.bg.volume = 0.8;
sounds.move.volume = 0.2;
sounds.shoot.volume = 0.3;

const soundPools = {};
const POOL_SIZE = 5;

// Initialize pools
for (const key in sounds) {
  soundPools[key] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const audio = sounds[key].cloneNode();
    audio.volume = sounds[key].volume;
    if (sounds[key].loop) audio.loop = true;
    soundPools[key].push(audio);
  }
}

let poolIndex = 0;

export function playSound(sound) {
  if (!soundPools[sound]) return;
  try {
    const pool = soundPools[sound];
    // Find an available audio element (paused or ended)
    let audio = pool.find(a => a.paused || a.ended);
    
    // If all are playing, override one
    if (!audio) {
      audio = pool[poolIndex % POOL_SIZE];
      poolIndex++;
    }
    
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  } catch (e) {}
}

export function stopAllActiveSounds() {
  for (const key in soundPools) {
    soundPools[key].forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {}
    });
  }
}

export function playBgMusic() {
  try {
    sounds.bg.currentTime = 0;
    sounds.bg.play().catch(() => {});
  } catch (e) {}
}

export function stopBgMusic() {
  try {
    sounds.bg.pause();
  } catch (e) {}
}

export function getSounds() {
  return sounds;
}
