// ============================================
// AUTH.JS - Autenticação com usuário/senha (VERSÃO FINAL)
// ============================================

import { supabase } from './supabase-config.js';

let currentUser = null;

// Login com nome de usuário (APENAS USERNAME + SENHA)
export async function signInWithUsername(username, password) {
  try {
    console.log('🔍 Buscando usuário:', username);
    
    // Busca o perfil pelo username
    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();
    
    if (perfilError || !perfil) {
      console.log('❌ Usuário não encontrado no perfil');
      throw new Error('Usuário não encontrado');
    }
    
    console.log('✅ Perfil encontrado, ID:', perfil.id);
    
    // 🔥 CORREÇÃO 1: Usar email interno direto (mais simples)
    const emailInterno = `${username.toLowerCase()}@dorgs.local`;
    
    console.log('📧 Tentando login com email:', emailInterno);
    
    // Login com email interno
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInterno,
      password: password
    });
    
    if (error) {
      console.log('❌ Erro no login:', error);
      throw new Error('Usuário ou senha incorretos');
    }
    
    console.log('✅ Login bem-sucedido!');
    currentUser = data.user;
    return currentUser;
    
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    throw error;
  }
}

// Cadastro com username (APENAS USERNAME + SENHA, SEM EMAIL)
export async function signUpWithUsername(username, password) {
  try {
    console.log('📝 Criando usuário:', username);
    
    const usernameLower = username.toLowerCase().trim();
    
    // Verifica se username já existe
    const { data: existing, error: checkError } = await supabase
      .from('perfis')
      .select('username')
      .eq('username', usernameLower)
      .maybeSingle();
    
    if (existing) {
      throw new Error('Nome de usuário já está em uso');
    }
    
    // 🔥 CORREÇÃO 2: Criar email interno automaticamente
    const emailInterno = `${usernameLower}@dorgs.local`;
    
    // Cria usuário no auth com email interno
    const { data, error } = await supabase.auth.signUp({
      email: emailInterno,
      password: password,
      options: {
        data: {
          username: usernameLower
        }
      }
    });
    
    if (error) throw new Error(error.message);
    
    console.log('✅ Usuário criado no auth, ID:', data.user.id);
    
    // Criar perfil imediatamente (sem esperar trigger)
    const { error: perfilError } = await supabase
      .from('perfis')
      .insert({
        id: data.user.id,
        username: usernameLower,
        nome_publico: usernameLower,
        bio: 'Novo por aqui! 🚀'
      });
    
    if (perfilError) {
      console.error('Erro ao criar perfil:', perfilError);
      throw new Error('Erro ao criar perfil');
    }
    
    console.log('✅ Perfil criado com sucesso!');
    return data;
    
  } catch (error) {
    console.error('❌ Erro no cadastro:', error.message);
    throw error;
  }
}

// Buscar usuário atual
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    currentUser = null;
    return null;
  }
  currentUser = user;
  return currentUser;
}

// Buscar dados do perfil do usuário atual
export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const { data: perfil, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) return null;
  return perfil;
}

// Logout
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  currentUser = null;
  console.log('👋 Usuário deslogado');
}

// Verificar se está logado
export function isAuthenticated() {
  return currentUser !== null;
}