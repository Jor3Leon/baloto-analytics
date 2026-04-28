/* Cliente de Supabase para el Frontend.
   Las credenciales se cargan dinámicamente desde el servidor
   para evitar exponer claves en el código fuente. */

let supabaseClient = null;
let _syncToken = '';

async function initSupabase() {
  try {
    const resp = await fetch('/api/config');
    if (!resp.ok) throw new Error('No se pudo cargar la configuración');
    const config = await resp.json();

    if (config.supabaseUrl && config.supabaseAnonKey && typeof supabase !== 'undefined') {
      supabaseClient = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    }

    // Guardar el token de sync para usarlo en las llamadas
    _syncToken = config.syncToken || '';
  } catch (e) {
    console.warn('Supabase init (modo offline):', e.message);
  }
}

function getSyncToken() {
  return _syncToken || localStorage.getItem('sync_token') || '';
}

function setSyncToken(token) {
  _syncToken = token;
  if (token) {
    localStorage.setItem('sync_token', token);
  } else {
    localStorage.removeItem('sync_token');
  }
}

async function dbSaveHistory(history) {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient
    .from('history')
    .insert(history);
  if (error) console.error("Error saving history:", error);
  return data;
}

async function dbLoadHistory() {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('history')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) console.error("Error loading history:", error);
  return data || [];
}

async function dbClearHistory() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient
    .from('history')
    .delete()
    .neq('id', 0);
  if (error) console.error("Error clearing history:", error);
}

async function dbLoadDraws() {
  try {
    // Usamos nuestra API interna que tiene SERVICE_ROLE_KEY para saltar el RLS
    const resp = await fetch('/api/draws');
    if (!resp.ok) {
      console.warn("API /api/draws falló, intentando SDK directo...");
      if (!supabaseClient) return [];
      const { data, error } = await supabaseClient.from('draws').select('*').order('date_label', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return await resp.json();
  } catch (e) {
    console.error("Critical error loading draws:", e);
    return [];
  }
}
