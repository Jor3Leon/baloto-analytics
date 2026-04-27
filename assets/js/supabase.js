/* Cliente de Supabase para el Frontend */
// Estos datos se cargarán de la config o se inyectarán
const SUPABASE_URL = "https://fuygccurtzjjbstwxaly.supabase.co";
const SUPABASE_KEY = "sb_publishable_4a508AX-u2-eN0QpPOjdKg_TRi6nLfT"; // Clave pública real

let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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
        .neq('id', 0); // Delete all
    if (error) console.error("Error clearing history:", error);
}
