export function addFloatingText(state, x, y, text, duration = 1500) {
  state.floatingTexts.push({
    x,
    y,
    text,
    startTime: Date.now(),
    duration
  });
}

export function updateFloatingTexts(state) {
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const t = state.floatingTexts[i];
    const elapsed = Date.now() - t.startTime;
    if (elapsed > t.duration) {
      state.floatingTexts.splice(i, 1);
    }
  }
}
