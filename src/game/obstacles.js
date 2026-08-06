import { lanes, H } from '../core/constants.js';
import { gameConfig } from '../core/state.js';

export function spawnObstacle(state) {
  const lane = Math.floor(Math.random() * 3);
  const type = Math.random() < 0.12 ? 'oil' : 'car';
  const w = type === 'car' ? 88 : 120;
  const h = type === 'car' ? 120 : 60;

  let baseGap = 280;
  if (state.speed < 40) baseGap = 400;

  const minGap = baseGap + state.speed * 5;
  const lastInLane = state.obstacles.find(o => o.lane === lane);

  if (lastInLane && lastInLane.y < minGap) {
    return;
  }

  const obj = {
    lane,
    x: lanes[lane],
    y: -h - 10,
    width: w,
    height: h,
    speed: state.speed,
    type,
    color: type === 'car' ? "#cc3333" : "#444"
  };

  state.obstacles.push(obj);
}

export function updateObstacles(state) {
  for (let i = state.obstacles.length - 1; i >= 0; i--) {
    const o = state.obstacles[i];
    o.y += state.speed + (state.level - 1) * 0.6;

    if (o.type === 'oil' && Math.abs(o.y - state.player.y) < 100 && o.lane === state.player.lane) {
      state.player.x += (Math.random() - 0.5) * 6;
    }

    if (o.y > H + 200) state.obstacles.splice(i, 1);
  }
}
