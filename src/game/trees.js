import { H, W } from '../core/constants.js';

export function spawnTree(state) {
  const side = Math.random() < 0.5 ? 'left' : 'right';

  let tree = state.treePool && state.treePool.length ? state.treePool.pop() : null;
  const xPos = side === 'left' ? -10 + Math.random() * 10 : W - 100 + Math.random() * 10;
  
  if (tree) {
    tree.x = xPos;
    tree.y = -80;
    tree.width = 50;
    tree.height = 70;
    tree.sprite = `t${Math.floor(Math.random() * 6) + 1}`;
  } else {
    tree = {
      x: xPos,
      y: -80,
      width: 50,
      height: 70,
      sprite: `t${Math.floor(Math.random() * 6) + 1}`
    };
  }
  
  state.trees.push(tree);
}

export function updateTrees(state) {
  for (let i = state.trees.length - 1; i >= 0; i--) {
    state.trees[i].y += state.speed;

    if (state.trees[i].y > H + 100) {
      const removed = state.trees.splice(i, 1)[0];
      if (!state.treePool) state.treePool = [];
      state.treePool.push(removed);
    }
  }
}
