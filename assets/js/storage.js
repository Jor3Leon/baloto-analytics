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

function normalizeRemoteDraw(item){
  if(!item || !Array.isArray(item.nums) || item.nums.length !== PICK_COUNT) return null;

  const nums = uniqueSorted(item.nums.map(n => Number(n)).filter(Number.isFinite));
  const rawSuper = item.super !== undefined ? item.super : item.super_ball;
  const superValue = Number(rawSuper);
  const validNums = nums.length === PICK_COUNT && nums.every(n => n >= 1 && n <= NUM_MAX);
  const validSuper = Number.isInteger(superValue) && superValue >= 1 && superValue <= SUPER_MAX;

  if(!validNums || !validSuper){
    return null;
  }

  return {
    nums,
    super: superValue,
    dateLabel: item.dateLabel || item.date_label || "",
    source: item.source || "baloto.com"
  };
}

// Sincronización con Supabase (Async)
async function syncDrawsFromCloud() {
    if (typeof dbLoadDraws === 'function') {
        const cloudDraws = await dbLoadDraws();
        if (cloudDraws && cloudDraws.length > 0) {
            const normalized = cloudDraws.map(normalizeRemoteDraw).filter(Boolean);
            saveJson(STORAGE_REALES, normalized);
            return normalized;
        } else {
            // Nube vacía: si el usuario tiene un historial local robusto, migrarlo a la nube.
            const local = loadDraws();
            if (local && local.length > 50) {
                console.log("Nube vacía. Migrando automáticamente " + local.length + " sorteos a la web...");
                try {
                    const resp = await fetch('/api/force-upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(local)
                    });
                    if (!resp.ok) {
                        const errData = await resp.json();
                        throw new Error(errData.error || "Fallo en la subida");
                    }
                    console.log("Migración completada con éxito.");
                } catch(e) {
                    console.error("Error en migración:", e.message);
                }
            }
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
