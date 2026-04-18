// ============================================
// AUTH.JS - Autenticação com usuário/senha (CORRIGIDO)
// ============================================

import { supabase } from './supabase-config.js';

let currentUser = null;

// Login com nome de usuário (VERSÃO CORRIGIDA)
export async function signInWithUsername(username, password) {
  try {
    console.log('🔍 Buscando usuário:', username);
    
    // Busca o perfil pelo username
    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('id')
      .eq('username', username)
      .single();
    
    if (perfilError || !perfil) {
      console.log('❌ Usuário não encontrado no perfil');
      throw new Error('Usuário não encontrado');
    }
    
    console.log('✅ Perfil encontrado, ID:', perfil.id);
    
    // AGORA CORRETO: Buscar o email do usuário pela tabela auth.users
    // Usando RPC (função SQL) ou query direta
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('email')
      .eq('id', perfil.id)
      .single();
    
    if (userError || !userData) {
      console.log('⚠️ Erro ao buscar email, usando fallback');
      // Fallback: tenta login com email temporário
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@dorgs.temp`,
        password: password
      });
      
      if (error) {
        console.log('❌ Fallback falhou:', error);
        throw new Error('Usuário ou senha incorretos');
      }
      
      console.log('✅ Login via fallback bem-sucedido');
      currentUser = data.user;
      return currentUser;
    }
    
    console.log('📧 Email encontrado:', userData.email);
    
    // Login com o email real
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
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

// Cadastro com username (CORRIGIDO)
export async function signUpWithUsername(username, email, password) {
  try {
    console.log('📝 Criando usuário:', username);
    
    // Verifica se username já existe
    const { data: existing } = await supabase
      .from('perfis')
      .select('username')
      .eq('username', username)
      .maybeSingle();
    
    if (existing) {
      throw new Error('Nome de usuário já está em uso');
    }
    
    // Cria usuário no auth com email REAL
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username
        }
      }
    });
    
    if (error) throw new Error(error.message);
    
    console.log('✅ Usuário criado no auth, ID:', data.user.id);
    
    // Aguarda e força criação do perfil
    setTimeout(async () => {
      const { error: perfilError } = await supabase
        .from('perfis')
        .upsert({
          id: data.user.id,
          username: username,
          bio: 'Novo por aqui! 🚀'
        });
      
      if (perfilError) {
        console.error('Erro ao criar perfil:', perfilError);
      } else {
        console.log('✅ Perfil criado com sucesso!');
      }
    }, 1000);
    
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