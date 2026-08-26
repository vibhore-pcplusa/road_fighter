import { ctx, W, H, getRoadOffset } from '../core/constants.js';
import { drawRoundedRect, getSpeedKmh } from '../utils/helpers.js';
import { state, ui } from '../core/state.js';

export function drawRoad() {
  ctx.fillStyle = "brown";
  ctx.fillRect(0, 0, W, H);

  const roadW = W * 0.8;
  const roadX = W * 0.05;
  ctx.fillStyle = "gray";
  ctx.fillRect(roadX, 0, roadW + 30, H);

  ctx.strokeStyle = "#bfbfbf";
  ctx.lineWidth = 6;
  ctx.setLineDash([50, 110]);
  ctx.lineDashOffset = -getRoadOffset();
  ctx.beginPath();
  ctx.moveTo(W / 3, 0);
  ctx.lineTo(W / 3, H);
  ctx.moveTo(2 * W / 3, 0);
  ctx.lineTo(2 * W / 3, H);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawStartScreen() {
  const btnW = 260;
  const btnH = 80;
  const btnX = (W - btnW) / 2;
  const btnY = (H - btnH) / 2;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, W, H);

  const title = "ROAD FIGHTER";
  const colors = ["#EA4335", "#4285F4", "#FBBC04", "#34A853", "#EA4335", "#4285F4", "#FBBC04", "#34A853", "#EA4335", "#4285F4", "#FBBC04", "#34A853"];
  const titleFontSize = 64;
  const titleY = btnY - 80;

  ctx.font = `bold ${titleFontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const titleWidth = ctx.measureText(title).width;
  const boxPadding = 30;
  const boxX = W / 2 - titleWidth / 2 - boxPadding;
  const boxY = titleY - titleFontSize / 2 - boxPadding;
  const boxW = titleWidth + boxPadding * 2;
  const boxH = titleFontSize + boxPadding * 2;

  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 15);
  ctx.fill();
  ctx.stroke();

  let xOffset = W / 2 - titleWidth / 2;
  const timeOffset = Date.now() / 150; // Speed of the dance
  
  for (let i = 0; i < title.length; i++) {
    const char = title[i];
    ctx.fillStyle = colors[i % colors.length];
    
    // Calculate a bouncing wave effect for each letter
    const waveY = titleY + Math.sin(i * 0.5 + timeOffset) * 12;
    
    ctx.fillText(char, xOffset + ctx.measureText(title.substring(0, i)).width + ctx.measureText(char).width / 2, waveY);
  }

  ctx.fillStyle = "#00c853";
  drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 20);
  ctx.fill();

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText("START", W / 2, btnY + 42);

  ctx.restore();
}

export function drawHUD() {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, W, 38);

  ctx.fillStyle = "yellow";
  ctx.font = "30px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Lv: " + state.level, 10, 30);

  ctx.fillText("Dist: " + Math.floor(state.distance) + "m", 87, 30);

  ctx.textAlign = "center";
  ctx.fillText("Speed: " + getSpeedKmh(state.speed) + " km/h", W / 2, 30);

  ctx.textAlign = "right";
  ctx.fillText("Score: " + state.score, W - 70, 30);
  ctx.restore();
}

export function drawLoadingScreen(pct) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.font = '30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Loading ' + pct + '%', W / 2, H / 2 - 40);

  const bw = Math.min(600, W * 0.7);
  const bh = 24;
  const bx = (W - bw) / 2;
  const by = H / 2 + 20;
  ctx.fillStyle = '#333';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#0a8';
  ctx.fillRect(bx, by, Math.round(bw * pct / 100), bh);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
}

export function drawRotateToPortrait() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('Rotate to Portrait', W / 2, H / 2 - 50);
  ctx.font = '20px sans-serif';
  const lines = [
    'This game works best in portrait mode.',
    'Please rotate your device back to portrait.'
  ];
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W / 2, H / 2 + i * 28 + 10);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  const boxW = W * 0.85;
  const boxH = 220;
  ctx.fillRect((W - boxW) / 2, H / 2 - 110, boxW, boxH);
  ctx.strokeStyle = '#0af';
  ctx.lineWidth = 3;
  ctx.strokeRect((W - boxW) / 2, H / 2 - 110, boxW, boxH);
}
