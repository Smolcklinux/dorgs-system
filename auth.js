import { supabase } from './supabase-config.js';

let currentUser = null;

export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user || null;
  
  supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
  });
  
  return currentUser;
}

export async function getCurrentUser() {
  if (!currentUser) {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
  }
  return currentUser;
}

export async function signUp(email, password, userData = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: userData }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  currentUser = data.user;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  currentUser = null;
}