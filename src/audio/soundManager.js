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

const activeSounds = [];

export function playSound(sound) {
  if (!sounds[sound]) return;
  try {
    const original = sounds[sound];
    const audio = original.cloneNode();
    audio.volume = original.volume;
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

export function stopAllActiveSounds() {
  while (activeSounds.length) {
    const audio = activeSounds.pop();
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (e) {}
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
