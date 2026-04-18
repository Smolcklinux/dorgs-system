const SUPABASE_URL = 'https://owxqzyrrhmwsmgimasiw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BgL7QBUEzeHOlWd5KNo0EQ_t3dF8aMu';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabase;