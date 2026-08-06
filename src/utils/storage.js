const STORAGE_KEY = 'rf_leaders_v1';
const MAX_LEADERS = 10;

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
