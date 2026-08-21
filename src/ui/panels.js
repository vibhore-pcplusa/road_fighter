import { ctx, W, H } from '../core/constants.js';
import { drawRoundedRect } from '../utils/helpers.js';
import { state } from '../core/state.js';
import { getImages } from '../assets/imageLoader.js';

export function drawLeadersPanel() {
  const w = 560, h = 550;
  const x = (W - w) / 2, y = (H - h) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(22, 205, 220, 0.95)';
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + w - 20, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 20);
  ctx.lineTo(x + w, y + h - 20);
  ctx.quadraticCurveTo(x + w, y + h, x + w - 20, y + h);
  ctx.lineTo(x + 20, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - 20);
  ctx.lineTo(x, y + 20);
  ctx.quadraticCurveTo(x, y, x + 20, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(2, 100, 120, 0.96)';
  ctx.fillRect(x + 16, y + 16, w - 32, 56);
  ctx.fillStyle = '#fff';
  ctx.font = '32px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Top Scores (IST)', x + 26, y + 48);

  const list = state.leaders && state.leaders.length ? state.leaders : [];
  ctx.font = '27px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  const closeX = x + w - 40;
  const closeY = y + 16;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(closeX, closeY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#026478';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', closeX, closeY + 8);
  ctx.restore();

  if (!list.length) {
    ctx.fillText('No scores yet. Play to save your best run!', x + 26, y + 100);
  } else {
    const rowY = y + 122;
    const rowHeight = 42;
    const maxRows = Math.min(10, list.length);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '26px sans-serif';
    ctx.fillText('Rank', x + 30, rowY - 14);
    ctx.fillText('Player', x + 110, rowY - 14);
    ctx.fillText('Score', x + 280, rowY - 14);
    ctx.fillText('Date', x + 390, rowY - 14);

    for (let i = 0; i < maxRows; i++) {
      const it = list[i];
      const rowTop = rowY + i * rowHeight;
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x + 18, rowTop - 11, w - 36, rowHeight);
      }
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      const date = new Date(it.created_at);
      const options = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      const istTime = new Intl.DateTimeFormat('en-IN', options).format(date);
      ctx.fillText((i + 1) + '.', x + 30, rowTop + 18);
      ctx.fillText(it.name, x + 110, rowTop + 18);
      ctx.fillText(it.score.toString(), x + 290, rowTop + 18);
      ctx.fillText(istTime, x + 390, rowTop + 18);
    }
  }
  ctx.restore();
}

export function drawControlsPanel() {
  const w = 520, h = 340;
  const x = (W - w) / 2, y = (H - h) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(24, 220, 210, 0.95)';
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + w - 20, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 20);
  ctx.lineTo(x + w, y + h - 20);
  ctx.quadraticCurveTo(x + w, y + h, x + w - 20, y + h);
  ctx.lineTo(x + 20, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - 20);
  ctx.lineTo(x, y + 20);
  ctx.quadraticCurveTo(x, y, x + 20, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 120, 140, 0.96)';
  ctx.fillRect(x + 16, y + 16, w - 32, 47);
  ctx.fillStyle = '#fff';
  ctx.font = '30px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Controls & Rules', x + 26, y + 52);

  const lines = [
    'Arrow keys to move left/right',
    'Up to speed up, Down to slow',
    'Speed increases with levels;',
    'It level-up every 400 points',
    'Developed by Vibhore Jain',
    'Email Id - vibhore.mit@gmail.com'
  ];
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = '26px sans-serif';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x + 26, y + 90 + i * 40);
  }

  const closeX = x + w - 40;
  const closeY = y + 16;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(closeX, closeY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f6f7a';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', closeX, closeY + 8);
  ctx.restore();

  ctx.restore();
}

export function drawStatsPanel() {
  const w = 560, h = 550;
  const x = (W - w) / 2, y = (H - h) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 165, 0, 0.95)';
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + w - 20, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 20);
  ctx.lineTo(x + w, y + h - 20);
  ctx.quadraticCurveTo(x + w, y + h, x + w - 20, y + h);
  ctx.lineTo(x + 20, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - 20);
  ctx.lineTo(x, y + 20);
  ctx.quadraticCurveTo(x, y, x + 20, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(200, 100, 0, 0.96)';
  ctx.fillRect(x + 16, y + 16, w - 32, 56);
  ctx.fillStyle = '#fff';
  ctx.font = '32px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Player Stats', x + 26, y + 52);
  
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('Total Coins: ' + state.totalCoins, x + 30, y + 110);

  ctx.fillStyle = '#fff';
  ctx.font = '26px sans-serif';
  ctx.fillText('Last 5 Runs:', x + 30, y + 150);

  const list = state.lastRuns || [];
  if (!list.length) {
    ctx.fillText('No recent runs.', x + 30, y + 200);
  } else {
    const rowY = y + 180;
    const rowHeight = 60;
    for (let i = 0; i < list.length; i++) {
      const run = list[i];
      const rowTop = rowY + i * rowHeight;
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(x + 18, rowTop - 11, w - 36, rowHeight);
      }
      ctx.fillStyle = '#fff';
      ctx.font = '22px sans-serif';
      
      const date = new Date(run.date);
      const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      ctx.fillText(`${i+1}. Score: ${run.score}`, x + 30, rowTop + 25);
      ctx.fillText(`Dist: ${run.distance}m, Coins: ${run.coins}`, x + 30, rowTop + 50);
      ctx.fillText(timeStr, x + 440, rowTop + 38);
    }
  }

  const closeX = x + w - 40;
  const closeY = y + 16;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(closeX, closeY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b35900';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', closeX, closeY + 8);
  ctx.restore();

  ctx.restore();
}

export function drawShopPanel() {
  const w = 600, h = 550;
  const x = (W - w) / 2, y = (H - h) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(50, 150, 50, 0.95)';
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + w - 20, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 20);
  ctx.lineTo(x + w, y + h - 20);
  ctx.quadraticCurveTo(x + w, y + h, x + w - 20, y + h);
  ctx.lineTo(x + 20, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - 20);
  ctx.lineTo(x, y + 20);
  ctx.quadraticCurveTo(x, y, x + 20, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(20, 100, 20, 0.96)';
  ctx.fillRect(x + 16, y + 16, w - 32, 56);
  ctx.fillStyle = '#fff';
  ctx.font = '32px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Car Shop', x + 26, y + 52);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Coins: ' + state.totalCoins, x + w - 30, y + 52);

  const cars = [
    { id: 'mycar', name: 'Default', price: 0 },
    { id: 'red', name: 'Red Car', price: 5000 },
    { id: 'blue', name: 'Blue Car', price: 15000 },
    { id: 'green', name: 'Green Car', price: 50000 }
  ];
  
  const images = getImages();
  const startY = y + 120;
  const itemHeight = 100;
  
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    const itemY = startY + i * itemHeight;
    
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x + 16, itemY, w - 32, itemHeight);
    }
    
    // Draw car sprite
    const img = images[car.id];
    if (img && img.complete) {
      // Draw centered in a 60x100 box
      const scale = 80 / img.height;
      const imgW = img.width * scale;
      const imgH = img.height * scale;
      ctx.drawImage(img, x + 30 + (60 - imgW)/2, itemY + (itemHeight - imgH)/2, imgW, imgH);
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 40, itemY + 20, 40, 60);
    }
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(car.name, x + 120, itemY + 45);
    
    if (car.price > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.font = '22px sans-serif';
      ctx.fillText(car.price + ' Coins', x + 120, itemY + 75);
    } else {
      ctx.fillStyle = '#aaa';
      ctx.font = '22px sans-serif';
      ctx.fillText('Free', x + 120, itemY + 75);
    }

    // Button
    const btnW = 140, btnH = 46;
    const btnX = x + w - 30 - btnW;
    const btnY = itemY + 27;
    
    const isUnlocked = state.unlockedCars.includes(car.id);
    const isSelected = state.selectedCar === car.id;
    
    if (isSelected) {
      ctx.fillStyle = '#888';
      drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 8);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Selected', btnX + btnW/2, btnY + 30);
    } else if (isUnlocked) {
      ctx.fillStyle = '#2196F3';
      drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 8);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Select', btnX + btnW/2, btnY + 30);
    } else {
      ctx.fillStyle = state.totalCoins >= car.price ? '#4CAF50' : '#d32f2f';
      drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 8);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Buy', btnX + btnW/2, btnY + 30);
    }
  }

  const closeX = x + w - 40;
  const closeY = y + 16;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(closeX, closeY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#146414';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', closeX, closeY + 8);
  ctx.restore();

  ctx.restore();
}
