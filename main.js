import { supabase } from './supabase-config.js';
import { initAuth, getCurrentUser, signIn, signUp, logout } from './auth.js';
import { createPost, loadFeed } from './posts.js';
import { loadUserProfile } from './profile.js';

async function initApp() {
  await initAuth();
  const user = await getCurrentUser();
  const page = window.location.pathname;
  
  if (!user && !page.includes('login') && !page.includes('cadastro')) {
    window.location.href = 'login.html';
    return;
  }
  
  if (page.includes('index.html') || page === '/' || page.endsWith('/')) {
    await loadFeed();
    await loadMiniProfile();
    document.getElementById('publishBtn')?.addEventListener('click', createPost);
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      await logout();
      window.location.href = 'login.html';
    });
    
    const textarea = document.getElementById('postContent');
    const counter = document.getElementById('charCount');
    textarea?.addEventListener('input', () => {
      counter.textContent = textarea.value.length;
    });
  }
  
  if (page.includes('perfil.html')) {
    await loadUserProfile();
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      await logout();
      window.location.href = 'login.html';
    });
  }
  
  if (page.includes('login.html')) {
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      await signIn(email, password);
      window.location.href = 'index.html';
    });
  }
  
  if (page.includes('cadastro.html')) {
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirmPassword').value;
      
      if (password !== confirm) {
        alert('Senhas não coincidem');
        return;
      }
      
      await signUp(email, password, { username });
      alert('Conta criada! Faça login.');
      window.location.href = 'login.html';
    });
    
    // Força da senha
    document.getElementById('password')?.addEventListener('input', (e) => {
      const pwd = e.target.value;
      let strength = 0;
      if (pwd.length >= 6) strength++;
      if (pwd.length >= 8) strength++;
      if (/[A-Z]/.test(pwd)) strength++;
      if (/[0-9]/.test(pwd)) strength++;
      if (/[^A-Za-z0-9]/.test(pwd)) strength++;
      
      const bar = document.getElementById('strengthBar');
      const text = document.getElementById('strengthText');
      if (bar) {
        bar.style.width = (strength / 5) * 100 + '%';
        bar.style.background = strength <= 2 ? '#ff4757' : strength <= 4 ? '#ffa502' : '#2ed573';
        if (text) text.textContent = strength <= 2 ? 'Senha fraca' : strength <= 4 ? 'Senha média' : 'Senha forte!';
      }
    });
  }
}

async function loadMiniProfile() {
  const user = await getCurrentUser();
  if (!user) return;
  
  const { data: perfil } = await supabase
    .from('perfis')
    .select('username')
    .eq('id', user.id)
    .single();
  
  const nome = perfil?.username || user.email.split('@')[0];
  document.getElementById('userAvatar').textContent = nome[0].toUpperCase();
  document.getElementById('miniAvatar').textContent = nome[0].toUpperCase();
  document.getElementById('userName').textContent = nome;
  document.getElementById('userBio').textContent = `@${nome}`;
  
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);
  
  document.getElementById('postsCount').textContent = count || 0;
}

document.addEventListener('DOMContentLoaded', initApp);