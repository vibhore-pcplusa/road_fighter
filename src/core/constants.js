export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');
export const W = canvas.width;
export const H = canvas.height;

export const lanes = [W * 0.18, W * 0.5, W * 0.82];
export let roadOffset = 0;

export function setRoadOffset(value) {
  roadOffset = value;
}

export function getRoadOffset() {
  return roadOffset;
}
