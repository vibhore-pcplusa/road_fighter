import { ctx, W, H, getRoadOffset } from '../core/constants.js';
import { state, ui } from '../core/state.js';

export function renderGameObjects(images, trees, controlImgs) {
  for (const tree of state.trees) {
    const img = trees[tree.sprite];
    if (img && img.complete && img.naturalWidth && img.naturalWidth > 0) {
      ctx.drawImage(img, tree.x, tree.y, tree.width, tree.height);
    }
  }

  for (const o of state.obstacles) {
    ctx.save();
    ctx.translate(o.x - o.width / 2, o.y);
    if (o.type === "car") {
      const fallbackColors = ['red', 'blue', 'green'];
      const cType = o.carColor || fallbackColors[o.lane % fallbackColors.length];

      let img;
      let applyFilter = false;
      if (cType === 'yellow') {
        img = images.red;
        applyFilter = true;
      } else {
        img = images[cType];
      }

      if (img && img.complete && img.naturalWidth && img.naturalWidth > 0) {
        if (applyFilter) ctx.filter = 'hue-rotate(60deg)';
        ctx.drawImage(img, 0, 0, o.width, o.height);
        if (applyFilter) ctx.filter = 'none';
      } else {
        ctx.fillStyle = o.color;
        ctx.fillRect(0, 0, o.width, o.height);
      }
    } else if (o.type === "oil") {
      if (images.gadda && images.gadda.complete && images.gadda.naturalWidth && images.gadda.naturalWidth > 0) {
        ctx.drawImage(images.gadda, 0, 0, o.width, o.height);
      } else {
        ctx.fillStyle = "#444";
        ctx.fillRect(0, 0, o.width, o.height);
      }
    }
    ctx.restore();
  }

  const p = state.player;
  ctx.save();
  ctx.translate(p.x - p.width / 2, p.y);

  if (state.selectedCar === 'green' || state.selectedCar === 'blue') {
    ctx.translate(p.width / 2, p.height / 2);
    ctx.rotate(Math.PI);
    ctx.translate(-p.width / 2, -p.height / 2);
  }

  const carImg = images[state.selectedCar] || images.mycar;
  if (carImg && carImg.complete && carImg.naturalWidth && carImg.naturalWidth > 0) {
    ctx.drawImage(carImg, 0, 0, p.width, p.height);
  } else {
    ctx.fillStyle = p.color;
    ctx.fillRect(0, 0, p.width, p.height);
  }
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(8, 18, p.width - 16, 18);
  ctx.fillStyle = "#111";
  ctx.fillRect(6, p.height - 12, 12, 8);
  ctx.fillRect(p.width - 18, p.height - 12, 12, 8);
  ctx.restore();

  for (const c of state.coins) {
    ctx.save();
    ctx.fillStyle = c.color;
    ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.value, c.x, c.y);
    ctx.restore();
  }

  for (const a of state.ammos || []) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'; // Golden circle
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔫', a.x, a.y);
    ctx.restore();
  }

  for (const t of state.floatingTexts) {
    const elapsed = Date.now() - t.startTime;
    const progress = elapsed / t.duration;
    const alpha = Math.max(0, 1 - progress);
    const offsetY = progress * 40;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.text, t.x, t.y - offsetY);
    ctx.restore();
  }

  for (const b of state.bullets) {
    ctx.save();
    ctx.fillStyle = '#ffe066';
    ctx.shadowColor = '#ff9900';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 5, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function renderCanvasControls(controlImgs) {
  ctx.save();
  const btnW = 120, btnH = 44;
  const x = 18, y = 48;
  ctx.fillStyle = '#222';
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x - 8, y - 12, btnW + 17, btnH + 24);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(x, y, btnW, btnH);
  ctx.fillStyle = '#000';
  ctx.font = '23px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ui.pauseLabel, x + btnW / 2, y + 28);

  const size = 76;
  const cx = W - 210;
  const cy = H - 125;
  const positions = {
    up: { x: cx, y: cy - size },
    down: { x: cx, y: cy + size },
    left: { x: cx - size, y: cy },
    right: { x: cx + size, y: cy }
  };
  ui._controlPos = positions;

  for (const k of ['up', 'down', 'left', 'right']) {
    const img = controlImgs[k];
    const p = positions[k];
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.arc(p.x, p.y, size / 1.6, 0, Math.PI * 2);
    ctx.fill();
    if (img && img.complete && img.naturalWidth && img.naturalWidth > 0) {
      ctx.globalAlpha = 0.7;
      ctx.drawImage(img, p.x - size / 1.6, p.y - size / 1.6, size * 1.2, size * 1.2);
      ctx.globalAlpha = 1.0;
    } else {
      ctx.fillStyle = '#888';
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    }
  }

  const bulletCountX = W - 450;
  const bulletCountY = H - 70;
  ctx.save();
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#FF9900';
  ctx.shadowBlur = 12;
  ctx.fillText(state.bulletsRemaining + '/' + ((state.gunLevel || 1) * 10), bulletCountX, bulletCountY);
  ctx.restore();

  if (state.paused && state.running) {
    const resumeBtnW = 200, resumeBtnH = 70;
    const resumeBtnX = (W - resumeBtnW) / 2, resumeBtnY = (H - resumeBtnH) / 2;
    ui._resumeBtn = { x: resumeBtnX, y: resumeBtnY, w: resumeBtnW, h: resumeBtnH };
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(resumeBtnX, resumeBtnY, resumeBtnW, resumeBtnH);
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RESUME', W / 2, resumeBtnY + resumeBtnH / 2 + 12);
  }

  ctx.restore();
}

export function renderExplosion() {
  if (!state.explosion) return;
  const elapsed = Date.now() - state.explosion.start;
  if (elapsed >= 3500) {
    state.explosion = null;
    return;
  }

  const progress = elapsed / 3500;
  const size = 80 + progress * 60;
  const alpha = 1 - progress;
  const ex = state.explosion.x || W / 2;
  const ey = state.explosion.y || H / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(255,100,0,' + (0.8 * alpha) + ')';
  ctx.beginPath();
  ctx.arc(ex, ey, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,200,0,' + (0.9 * alpha) + ')';
  ctx.beginPath();
  ctx.arc(ex, ey, size * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,100,' + (1 * alpha) + ')';
  ctx.beginPath();
  ctx.arc(ex, ey, size * 0.12, 0, Math.PI * 2);
  ctx.fill();

  const textY = ey - 20 + Math.sin(elapsed / 200) * 8;

  ctx.globalAlpha = alpha;
  ctx.shadowColor = 'rgb(244, 66, 7)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';

  for (let i = 0; i < 5; i++) {
    ctx.fillText('BOOM!', ex, textY);
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.fillText('BOOM!', ex, textY);
  ctx.restore();
}
