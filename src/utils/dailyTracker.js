import { loadPlayerStats, savePlayerStats } from './storage.js';
import { state } from '../core/state.js';

const DAILY_KEY = 'rf_daily_v1';

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

export function loadDailyData() {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return createDefaultDailyData();
    const parsed = JSON.parse(raw);
    
    // Ensure all mission fields exist in case of old save format
    if (!parsed.missions) {
      parsed.missions = createDefaultMissions();
    }
    return parsed;
  } catch (e) {
    return createDefaultDailyData();
  }
}

export function saveDailyData(data) {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(data));
  } catch(e) {}
}

function createDefaultMissions() {
  return {
    carsShot: { progress: 0, claimed: false },
    oilDestroyed: { progress: 0, claimed: false },
    ammosCollected: { progress: 0, claimed: false }
  };
}

function createDefaultDailyData() {
  return {
    lastDate: getTodayString(),
    streakDay: 1,
    loginClaimed: false,
    missions: createDefaultMissions()
  };
}

export function checkDailyReset() {
  const data = loadDailyData();
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (data.lastDate !== today) {
    if (data.lastDate === yesterday) {
      // Continued streak
      data.streakDay = Math.min(10, data.streakDay + 1);
    } else {
      // Missed a day
      data.streakDay = 1;
    }
    // Reset daily state
    data.lastDate = today;
    data.loginClaimed = false;
    data.missions = createDefaultMissions();
    saveDailyData(data);
  }
  return data;
}

export function getMissionTarget(streakDay) {
  return streakDay * 5;
}

export function getMissionReward(streakDay) {
  return 50 * streakDay;
}

export function getLoginReward(streakDay) {
  return streakDay * 100; // 100, 200, ..., 1000
}

export function claimDailyLogin() {
  const data = loadDailyData();
  if (data.loginClaimed) return false;
  
  data.loginClaimed = true;
  saveDailyData(data);
  
  // Give reward
  const reward = getLoginReward(data.streakDay);
  state.totalCoins += reward;
  savePlayerStats({ totalCoins: state.totalCoins, lastRuns: state.lastRuns });
  return reward;
}

export function claimDailyMission(type) {
  const data = loadDailyData();
  const target = getMissionTarget(data.streakDay);
  const mission = data.missions[type];
  
  if (!mission || mission.claimed || mission.progress < target) {
    return false;
  }
  
  mission.claimed = true;
  saveDailyData(data);
  
  const reward = getMissionReward(data.streakDay);
  state.totalCoins += reward;
  savePlayerStats({ totalCoins: state.totalCoins, lastRuns: state.lastRuns });
  return reward;
}

export function incrementMissionProgress(type) {
  const data = loadDailyData();
  if (!data.missions[type]) return;
  
  const target = getMissionTarget(data.streakDay);
  if (data.missions[type].progress < target) {
    data.missions[type].progress++;
    saveDailyData(data);
  }
}
