import { lanes, H } from '../core/constants.js';
import { gameConfig } from '../core/state.js';

export function spawnCoin(state) {
  const lane = Math.floor(Math.random() * 3);
  const rand = Math.random();
  let value;

  if (rand < 0.05) value = 500;
  else if (rand < 0.15) value = 200;
  else if (rand < 0.30) value = 100;
  else value = 50;

  const coin = {
    lane,
    x: lanes[lane],
    y: -40,
    width: 60,
    height: 60,
    speed: state.speed,
    type: 'coin',
    value,
    color: gameConfig.COIN_COLORS[value]
  };

  state.coins.push(coin);
}

export function updateCoins(state, collides) {
  for (let i = state.coins.length - 1; i >= 0; i--) {
    const c = state.coins[i];
    c.y += state.speed;

    if (c.y > H + 50) {
      state.coins.splice(i, 1);
      continue;
    }

    const cBox = { x: c.x, y: c.y, width: c.width, height: c.height };
    const pBox = {
      x: state.player.x,
      y: state.player.y + state.player.height / 2,
      width: state.player.width,
      height: state.player.height
    };

    if (collides(cBox, pBox)) {
      if (!state.scoreFromCoins) state.scoreFromCoins = 0;
      state.scoreFromCoins += c.value;
      state.floatingTexts.push({
        x: c.x,
        y: c.y,
        text: '+' + c.value,
        startTime: Date.now(),
        duration: 1500
      });
      state.coins.splice(i, 1);
    }
  }
}
