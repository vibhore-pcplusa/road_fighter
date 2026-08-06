import { ctx, W, H } from '../core/constants.js';
import { drawRoundedRect } from '../utils/helpers.js';
import { state, ui } from '../core/state.js';

export function drawGameOverOverlay(drawExplosion) {
  const panelW = Math.min(520, W - 40);
  const panelH = 380;
  const panelX = (W - panelW) / 2;
  const panelY = (H - panelH) / 2 - 150;
  const buttonW = 220;
  const buttonH = 62;
  const buttonX = (W - buttonW) / 2;
  const buttonY = panelY + panelH - 96;
  const closeX = panelX + panelW - 34;
  const closeY = panelY + 24;

  ctx.save();
  ctx.fillStyle = "rgba(3, 8, 18, 0.76)";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  const panelGradient = ctx.createLinearGradient(0, panelY, 0, panelY + panelH);
  panelGradient.addColorStop(0, "#223255");
  panelGradient.addColorStop(1, "#0d1426");
  ctx.fillStyle = panelGradient;
  ctx.strokeStyle = "#ffcf5c";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 24);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px sans-serif";
  ctx.fillText("GAME OVER", W / 2, panelY + 95);

  ctx.fillStyle = "#87CEEB";
  ctx.font = "24px sans-serif";
  let distanceText;
  if (state.distance >= 1000) {
    distanceText = "Distance: " + (Math.floor(state.distance / 100) / 10).toFixed(1) + " Km";
  } else {
    distanceText = "Distance: " + Math.floor(state.distance) + " m";
  }
  ctx.fillText(distanceText, W / 2, panelY + 119);

  ctx.fillStyle = "#ffd166";
  ctx.font = "30px sans-serif";
  ctx.fillText("Final Score: " + state.score, W / 2, panelY + 150);


  if (ui.showHighScorePrompt) {
    drawHighScorePrompt(panelX, panelY, panelW, panelH);
  } else {
    ctx.fillStyle = "#dbe7ff";
    ctx.font = "28px sans-serif";
    ctx.fillText("Tap the button below to race again", W / 2, panelY + 195);

    ctx.fillStyle = "#ff5d73";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, buttonX, buttonY, buttonW, buttonH, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Restart", W / 2, buttonY + 39);
  }

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(closeX, closeY, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0d1426";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("X", closeX, closeY + 8);
  ctx.restore();

  drawExplosion();
}

function drawHighScorePrompt(panelX, panelY, panelW, panelH) {
  const promptX = panelX + 24;
  const promptWidth = panelW - 48;
  const promptY = panelY + 210;
  const promptHeight = 64;
  const saveX = W / 2 - 160 - 10;
  const cancelX = W / 2 + 10;
  const promptBtnY = panelY + panelH - 80;

  ctx.fillStyle = '#ffd166';
  ctx.font = '28px sans-serif';
  ctx.fillText('Congratulations! 🎉 New High Score', W / 2, panelY + 180);

  // Bright input box
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(promptX, promptY, promptWidth, promptHeight);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.strokeRect(promptX, promptY, promptWidth, promptHeight);

  ctx.fillStyle = '#000000';
  ctx.font = '26px sans-serif';
  ctx.textAlign = 'left';
  const displayText = ui.saveName || 'Tap here to type your name';
  ctx.fillText(displayText, promptX + 14, promptY + 38);

  // Cursor
  if (ui.inputActive) {
    const now = Date.now();
    if (now - ui.lastCursorToggle > 500) {
      ui.cursorVisible = !ui.cursorVisible;
      ui.lastCursorToggle = now;
    }
    if (ui.cursorVisible) {
      const textWidth = ctx.measureText(ui.saveName || '').width;
      const cursorX = promptX + 14 + textWidth + 2;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cursorX, promptY + 16);
      ctx.lineTo(cursorX, promptY + 48);
      ctx.stroke();
    }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(43,190,120,0.96)';
  drawRoundedRect(ctx, saveX, promptBtnY, 160, 52, 18);
  ctx.fill();
  ctx.strokeStyle = '#eff8ff';
  ctx.stroke();
  ctx.fillStyle = '#0d1426';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Save', saveX + 80, promptBtnY + 34);

  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  drawRoundedRect(ctx, cancelX, promptBtnY, 160, 52, 18);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillText('Cancel', cancelX + 80, promptBtnY + 34);
}
