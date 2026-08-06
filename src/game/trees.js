import { H, W } from '../core/constants.js';

export function spawnTree(state) {
  const side = Math.random() < 0.5 ? 'left' : 'right';

  state.trees.push({
    x: side === 'left'
      ? -10 + Math.random() * 10
      : W - 100 + Math.random() * 10,
    y: -80,
    width: 50,
    height: 70,
    sprite: `t${Math.floor(Math.random() * 6) + 1}`
  });
}

export function updateTrees(state) {
  for (let i = state.trees.length - 1; i >= 0; i--) {
    state.trees[i].y += state.speed;

    if (state.trees[i].y > H + 100) {
      state.trees.splice(i, 1);
    }
  }
}
