import { lanes, H } from '../core/constants.js';

export function createPlayer() {
  return {
    lane: 1,
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

export function moveLeft(state, playSound) {
  if (!state.running || state.paused || state.gameOver) return;
  if (playSound) playSound("move", 0.5);
  const p = state.player;
  p.lane = Math.max(0, p.lane - 1);
  p.targetX = lanes[p.lane];
}

export function moveRight(state, playSound) {
  if (!state.running || state.paused || state.gameOver) return;
  if (playSound) playSound("move", 0.5);
  const p = state.player;
  p.lane = Math.min(2, p.lane + 1);
  p.targetX = lanes[p.lane];
}

export function updatePlayerPosition(player) {
  player.x += (player.targetX - player.x) * 0.25;
}
