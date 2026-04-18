// ============================================
// SUPABASE-CONFIG.JS - Configuração do banco
// ============================================

const SUPABASE_URL = 'https://owxqzyrrhmwsmgimasiw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BgL7QBUEzeHOlWd5KNo0EQ_t3dF8aMu';

// Criar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar para módulos ES6
export { supabase };

// Versão global para usar em qualquer lugar
window.supabase = supabase;
window.supabaseClient = supabase;

// Log de verificação (opcional, mostra no console que conectou)
console.log('🚀 Supabase conectado!');