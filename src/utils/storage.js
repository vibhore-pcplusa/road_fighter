const STORAGE_KEY = 'rf_leaders_v1';
const STATS_KEY = 'rf_player_stats_v1';
const INVENTORY_KEY = 'rf_player_inventory_v1';
const MAX_LEADERS = 10;
const MAX_LAST_RUNS = 100;

export function loadLeadersFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    return [];
  }
}

export function saveLeadersToStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save leaders', e);
  }
}

export function addLeaderEntry(name, score, level) {
  const list = loadLeadersFromStorage();
  list.push({
    name: (name || 'Player').substr(0, 20),
    score: parseInt(score || 0, 10) || 0,
    level: parseInt(level || 1, 10) || 1,
    ts: Date.now()
  });
  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.ts - a.ts;
  });
  return saveLeadersToStorage(list.slice(0, MAX_LEADERS)), list.slice(0, MAX_LEADERS);
}

export function loadPlayerStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { totalCoins: 0, lastRuns: [] };
    const parsed = JSON.parse(raw);
    return {
      totalCoins: parsed.totalCoins || 0,
      lastRuns: Array.isArray(parsed.lastRuns) ? parsed.lastRuns : []
    };
  } catch (e) {
    return { totalCoins: 0, lastRuns: [] };
  }
}

export function savePlayerStats(stats) {
  try {
    // limit to 5 runs
    if (stats.lastRuns && stats.lastRuns.length > MAX_LAST_RUNS) {
      stats.lastRuns.splice(MAX_LAST_RUNS);
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save player stats', e);
  }
}

export function loadInventory() {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (!raw) return { unlockedCars: ['mycar'], selectedCar: 'mycar', unlockedDrivers: [], selectedDriver: null, gunLevel: 1 };
    const parsed = JSON.parse(raw);
    return {
      unlockedCars: Array.isArray(parsed.unlockedCars) ? parsed.unlockedCars : ['mycar'],
      selectedCar: parsed.selectedCar || 'mycar',
      unlockedDrivers: Array.isArray(parsed.unlockedDrivers) ? parsed.unlockedDrivers : [],
      selectedDriver: parsed.selectedDriver || null,
      gunLevel: parseInt(parsed.gunLevel) || 1
    };
  } catch (e) {
    return { unlockedCars: ['mycar'], selectedCar: 'mycar', unlockedDrivers: [], selectedDriver: null, gunLevel: 1 };
  }
}

export function saveInventory(inventory) {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  } catch (e) {
    console.warn('Failed to save inventory', e);
  }
}
