import { ctx, W, H } from '../core/constants.js';
import { drawRoundedRect } from '../utils/helpers.js';
import { state, ui } from '../core/state.js';
import { getImages } from '../assets/imageLoader.js';
import { loadDailyData, getMissionTarget, getMissionReward, getLoginReward } from '../utils/dailyTracker.js';

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
  const w = 560, h = 660; // Increased height
  const x = (W - w) / 2, y = (H - h) / 2 - 100; // Moved upside 100px
  
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

  const list = state.lastRuns || [];
  
  // Set up clipping region for the scrolling list
  const listAreaY = y + 130;
  const listAreaH = h - 150;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 16, listAreaY, w - 32, listAreaH);
  ctx.clip();

  if (!list.length) {
    ctx.fillText('No recent runs.', x + 30, y + 200);
  } else {
    const scrollOffset = ui.statsScrollY || 0;
    let currentY = listAreaY + 10 + scrollOffset;
    
    const topRuns = [...list].sort((a, b) => b.score - a.score).slice(0, 5);
    
    const renderItems = [];
    if (topRuns.length > 0) {
      renderItems.push({ type: 'header', text: 'Top 5 Best Runs:' });
      topRuns.forEach((r, idx) => renderItems.push({ type: 'run', run: r, index: idx }));
    }
    
    if (list.length > 0) {
      renderItems.push({ type: 'header', text: 'Recent History (Last 100 games):' });
      list.forEach((r, idx) => renderItems.push({ type: 'run', run: r, index: idx }));
    }

    for (let item of renderItems) {
      const itemHeight = item.type === 'header' ? 40 : 70;
      
      if (currentY + itemHeight > listAreaY && currentY < listAreaY + listAreaH) {
        if (item.type === 'header') {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText(item.text, x + 30, currentY + 30);
        } else {
          const run = item.run;
          const i = item.index;
          if (i % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(x + 18, currentY, w - 36, itemHeight);
          }
          
          ctx.fillStyle = '#fff';
          ctx.font = '22px sans-serif';
          
          const date = new Date(run.date);
          const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          const dateStr = date.toLocaleDateString([], {month: 'short', day: 'numeric'});
          
          ctx.fillText(`${i+1}. Score: ${run.score}`, x + 30, currentY + 30);
          ctx.fillText(`Dist: ${run.distance}m, Coins: ${run.coins}`, x + 30, currentY + 58);
          
          ctx.textAlign = 'right';
          ctx.fillText(dateStr, x + w - 30, currentY + 30);
          ctx.fillText(timeStr, x + w - 30, currentY + 58);
          ctx.textAlign = 'left';
        }
      }
      currentY += itemHeight;
    }
  }
  ctx.restore(); // end clip

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
}

export function drawShopPanel() {
  const w = 560, h = 660;
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
  ctx.fillText('Garage Shop', x + 26, y + 52);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Coins: ' + state.totalCoins, x + w - 30, y + 52);

  // Draw Tabs
  const tabY = y + 80;
  const tabW = (w - 32) / 2;
  ctx.fillStyle = ui.shopTab === 'cars' ? 'rgba(20, 150, 20, 0.8)' : 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(x + 16, tabY, tabW, 40);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Cars & Upgrades', x + 16 + tabW / 2, tabY + 28);

  ctx.fillStyle = ui.shopTab === 'drivers' ? 'rgba(20, 150, 20, 0.8)' : 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(x + 16 + tabW, tabY, tabW, 40);
  ctx.fillStyle = '#fff';
  ctx.fillText('Drivers', x + 16 + tabW + tabW / 2, tabY + 28);

  const images = getImages();
  const startY = tabY + 50;
  const itemHeight = 100;

  // Clip area for scrolling
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 16, startY, w - 32, h - (startY - y) - 20);
  ctx.clip();
  
  // Use ui.shopScrollY (default 0)
  if (!ui.shopScrollY) ui.shopScrollY = 0;
  const scrollOffset = ui.shopScrollY;

  if (ui.shopTab === 'cars') {
    const cars = [
      { id: 'mycar', name: 'Default', price: 0 },
      { id: 'red', name: 'Red Car', price: 5000 },
      { id: 'blue', name: 'Blue Car', price: 15000 },
      { id: 'green', name: 'Green Car', price: 50000 }
    ];
    
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      const itemY = startY - scrollOffset + i * itemHeight;
      if (itemY > startY + h || itemY + itemHeight < startY) continue;
      
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 16, itemY, w - 32, itemHeight);
      }
      
      // Draw car sprite
      const img = images[car.id];
      if (img && img.complete) {
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

    // Draw Gun Upgrade
    const i = cars.length;
    const gunItemY = startY - scrollOffset + i * itemHeight;
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x + 16, gunItemY, w - 32, itemHeight);
    }

    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x + 40, gunItemY + 20, 40, 60);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AMMO', x + 60, gunItemY + 50);

    const lvl = state.gunLevel || 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Gun Upgrade (Lv ' + lvl + ')', x + 120, gunItemY + 45);

    const upgradeCost = 10000 * Math.pow(2, lvl - 1);
    ctx.fillStyle = '#FFD700';
    ctx.font = '20px sans-serif';
    ctx.fillText(upgradeCost + ' Coins (+10 Max)', x + 120, gunItemY + 75);

    const uBtnW = 140, uBtnH = 46;
    const uBtnX = x + w - 30 - uBtnW;
    const uBtnY = gunItemY + 27;

    ctx.fillStyle = state.totalCoins >= upgradeCost ? '#9C27B0' : '#d32f2f'; // Purple for upgrade
    drawRoundedRect(ctx, uBtnX, uBtnY, uBtnW, uBtnH, 8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Upgrade', uBtnX + uBtnW / 2, uBtnY + 30);
  } else {
    // Drivers Tab
    const drivers = [
      { id: 'driver_none', name: 'No Driver', price: 0 },
      { id: 'driver_alex', name: 'Alex', price: 10000 },
      { id: 'driver_gaurav', name: 'Gaurav', price: 20000 },
      { id: 'driver_helina', name: 'Helina', price: 30000 },
      { id: 'driver_jasmine', name: 'Jasmine', price: 40000 },
      { id: 'driver_mathew', name: 'Mathew', price: 50000 },
      { id: 'driver_nina', name: 'Nina', price: 60000 },
      { id: 'driver_paul', name: 'Paul', price: 70000 },
      { id: 'driver_rahul', name: 'Rahul', price: 80000 },
      { id: 'driver_vibhore', name: 'Vibhore', price: 90000 }
    ];

    for (let i = 0; i < drivers.length; i++) {
      const driver = drivers[i];
      const itemY = startY - scrollOffset + i * itemHeight;
      if (itemY > startY + h || itemY + itemHeight < startY) continue;
      
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 16, itemY, w - 32, itemHeight);
      }
      
      // Draw driver sprite
      const img = images[driver.id];
      if (img && img.complete) {
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
      ctx.fillText(driver.name, x + 120, itemY + 45);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '22px sans-serif';
      ctx.fillText(driver.price + ' Coins', x + 120, itemY + 75);

      // Button
      const btnW = 140, btnH = 46;
      const btnX = x + w - 30 - btnW;
      const btnY = itemY + 27;
      
      const isUnlocked = driver.id === 'driver_none' || state.unlockedDrivers.includes(driver.id);
      const isSelected = (driver.id === 'driver_none' && state.selectedDriver === null) || state.selectedDriver === driver.id;
      
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
        ctx.fillStyle = state.totalCoins >= driver.price ? '#4CAF50' : '#d32f2f';
        drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 8);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Buy', btnX + btnW/2, btnY + 30);
      }
    }
  }
  ctx.restore();

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

export function drawDailyPanel() {
  const data = loadDailyData();
  const w = 620, h = 600;
  const x = (W - w) / 2, y = (H - h) / 2;
  
  ctx.save();
  // Panel background
  ctx.fillStyle = 'rgba(233, 30, 99, 0.95)'; // Pink 500
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

  ctx.fillStyle = 'rgba(194, 24, 91, 0.96)'; // Pink 700
  ctx.fillRect(x + 16, y + 16, w - 32, 56);
  ctx.fillStyle = '#fff';
  ctx.font = '32px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Daily Rewards & Missions', x + 26, y + 48);

  const closeX = x + w - 40;
  const closeY = y + 16;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(closeX, closeY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#C2185B'; // Pink 700
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', closeX, closeY + 8);
  ctx.restore();

  // Streak section
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Daily Login (Streak: Day ${data.streakDay})`, x + 26, y + 110);
  
  const loginReward = getLoginReward(data.streakDay);
  const loginBtnW = 160, loginBtnH = 50;
  const loginBtnX = x + w - loginBtnW - 26;
  const loginBtnY = y + 85;

  if (data.loginClaimed) {
    ctx.fillStyle = '#4CAF50';
    drawRoundedRect(ctx, loginBtnX, loginBtnY, loginBtnW, loginBtnH, 8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Claimed', loginBtnX + loginBtnW / 2, loginBtnY + 32);
  } else {
    ctx.fillStyle = '#C2185B'; // Pink 700
    drawRoundedRect(ctx, loginBtnX, loginBtnY, loginBtnW, loginBtnH, 8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Claim +${loginReward}`, loginBtnX + loginBtnW / 2, loginBtnY + 32);
  }

  // Draw timeline
  const timelineY = y + 160;
  for (let i = 1; i <= 10; i++) {
    const tx = x + 30 + (i - 1) * 55;
    ctx.fillStyle = i <= data.streakDay ? '#FFD700' : 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(tx, timelineY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = i <= data.streakDay ? '#000' : '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(i.toString(), tx, timelineY + 5);
  }

  // Divider
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(x + 20, y + 210, w - 40, 2);

  // Missions section
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Daily Missions', x + 26, y + 250);

  const missions = [
    { id: 'carsShot', label: 'Shoot Cars' },
    { id: 'oilDestroyed', label: 'Destroy Oil' },
    { id: 'ammosCollected', label: 'Collect Ammo' }
  ];

  const target = getMissionTarget(data.streakDay);
  const missionReward = getMissionReward(data.streakDay);
  let my = y + 280;

  for (let m of missions) {
    const prog = data.missions[m.id].progress;
    const claimed = data.missions[m.id].claimed;
    
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x + 26, my, w - 52, 90);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${m.label} (${prog}/${target})`, x + 40, my + 35);
    
    // Progress bar
    const barW = 350;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    drawRoundedRect(ctx, x + 40, my + 55, barW, 20, 10);
    ctx.fill();
    const fillW = Math.min(prog / target, 1) * barW;
    ctx.fillStyle = '#4CAF50';
    if (fillW > 0) {
      drawRoundedRect(ctx, x + 40, my + 55, fillW, 20, 10);
      ctx.fill();
    }

    const mBtnW = 140, mBtnH = 46;
    const mBtnX = x + w - mBtnW - 40;
    const mBtnY = my + 22;

    if (claimed) {
      ctx.fillStyle = '#4CAF50';
      drawRoundedRect(ctx, mBtnX, mBtnY, mBtnW, mBtnH, 8);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Claimed', mBtnX + mBtnW / 2, mBtnY + 30);
    } else if (prog >= target) {
      ctx.fillStyle = '#C2185B'; // Pink 700
      drawRoundedRect(ctx, mBtnX, mBtnY, mBtnW, mBtnH, 8);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Claim +${missionReward}`, mBtnX + mBtnW / 2, mBtnY + 30);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      drawRoundedRect(ctx, mBtnX, mBtnY, mBtnW, mBtnH, 8);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Not Done', mBtnX + mBtnW / 2, mBtnY + 30);
    }

    my += 105;
  }

  ctx.restore();
}
