// ============================================
// AUTH.JS - Autenticação com usuário/senha
// ============================================

import { supabase } from './supabase-config.js';

let currentUser = null;

// Login com nome de usuário
export async function signInWithUsername(username, password) {
  try {
    // Primeiro, busca o email pelo username na tabela perfis
    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('id')
      .eq('username', username)
      .single();
    
    if (perfilError || !perfil) {
      throw new Error('Usuário não encontrado');
    }
    
    // Busca o usuário pelo ID para pegar o email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(perfil.id);
    
    if (userError) {
      // Fallback: tenta login direto (para testes)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@dorgs.temp`,
        password: password
      });
      
      if (error) throw new Error('Usuário ou senha incorretos');
      currentUser = data.user;
      return currentUser;
    }
    
    // Login com o email real
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: password
    });
    
    if (error) throw new Error('Usuário ou senha incorretos');
    
    currentUser = data.user;
    return currentUser;
    
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

// Cadastro com username
export async function signUpWithUsername(username, email, password) {
  try {
    // Verifica se username já existe
    const { data: existing } = await supabase
      .from('perfis')
      .select('username')
      .eq('username', username)
      .single();
    
    if (existing) {
      throw new Error('Nome de usuário já está em uso');
    }
    
    // Cria usuário no auth
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
    
    // Aguarda a trigger criar o perfil e atualiza o username
    setTimeout(async () => {
      const { error: updateError } = await supabase
        .from('perfis')
        .update({ username: username })
        .eq('id', data.user.id);
      
      if (updateError) console.error('Erro ao atualizar username:', updateError);
    }, 1000);
    
    return data;
    
  } catch (error) {
    console.error('Erro no cadastro:', error);
    throw error;
  }
}

// Buscar usuário atual
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
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
}

// Verificar se está logado
export function isAuthenticated() {
  return currentUser !== null;
}