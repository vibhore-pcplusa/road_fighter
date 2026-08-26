export function addFloatingText(state, x, y, text, duration = 1500) {
  let txt = state.textPool && state.textPool.length ? state.textPool.pop() : null;
  if (txt) {
    txt.x = x;
    txt.y = y;
    txt.text = text;
    txt.startTime = Date.now();
    txt.duration = duration;
  } else {
    txt = {
      x,
      y,
      text,
      startTime: Date.now(),
      duration
    };
  }
  state.floatingTexts.push(txt);
}

export function updateFloatingTexts(state) {
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const t = state.floatingTexts[i];
    const elapsed = Date.now() - t.startTime;
    if (elapsed > t.duration) {
      const removed = state.floatingTexts.splice(i, 1)[0];
      if (!state.textPool) state.textPool = [];
      state.textPool.push(removed);
    }
  }
}
