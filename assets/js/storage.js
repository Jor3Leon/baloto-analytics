/* Utilidades de persistencia.
   Maneja localStorage como cache y Supabase como nube. */

function loadJson(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch{
    return fallback;
  }
}

function saveJson(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function uniqueSorted(values){
  return [...new Set(values)].sort((a, b) => a - b);
}

// Sincronización con Supabase (Async)
async function syncDrawsFromCloud() {
    if (typeof dbLoadDraws === 'function') {
        const cloudDraws = await dbLoadDraws();
        if (cloudDraws && cloudDraws.length > 0) {
            saveJson(STORAGE_REALES, cloudDraws);
            return cloudDraws;
        }
    }
    return loadDraws();
}

async function syncHistoryFromCloud() {
    if (typeof dbLoadHistory === 'function') {
        const cloudHistory = await dbLoadHistory();
        if (cloudHistory) {
            saveJson(STORAGE_HISTORY, cloudHistory);
            return cloudHistory;
        }
    }
    return loadHistory();
}

async function saveToCloud(key, value) {
    saveJson(key, value); // Siempre guardamos localmente
    if (key === STORAGE_HISTORY && typeof dbSaveHistory === 'function') {
        await dbSaveHistory(value);
    }
}

function loadDraws(){
  return loadJson(STORAGE_REALES, []);
}

function loadHistory(){
  return loadJson(STORAGE_HISTORY, []);
}
