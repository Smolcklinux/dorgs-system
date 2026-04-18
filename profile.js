// ============================================
// PROFILE.JS - Perfil do usuário
// ============================================

import { supabase } from './supabase-config.js';
import { getCurrentUser } from './auth.js';

export async function loadUserProfile() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  try {
    // Buscar perfil
    const { data: perfil } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', user.id)
      .single();
    
    const nome = perfil?.username || user.email?.split('@')[0] || 'Usuário';
    const bio = perfil?.bio || 'Olá! Estou usando o Dorgs 🚀';
    const inicial = nome.charAt(0).toUpperCase();
    
    // Atualizar UI
    const avatarEl = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    const bioEl = document.getElementById('profileBio');
    
    if (avatarEl) avatarEl.textContent = inicial;
    if (nameEl) nameEl.textContent = nome;
    if (bioEl) bioEl.textContent = bio;
    
    // Buscar posts do usuário
    const { data: posts, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    const postsCountEl = document.getElementById('profilePostsCount');
    if (postsCountEl) postsCountEl.textContent = count || 0;
    
    // Renderizar posts
    const container = document.getElementById('userPosts');
    if (!container) return;
    
    if (!posts || posts.length === 0) {
      container.innerHTML = `
                <div class="empty-posts">
                    📝 Você ainda não fez nenhum post<br>
                    <a href="index.html" style="color: #667eea;">Voltar ao feed</a>
                </div>
            `;
      return;
    }
    
    container.innerHTML = posts.map(post => `
            <div class="post-card">
                <div class="post-content">
                    <p>${escapeHtml(post.conteudo)}</p>
                </div>
                <div class="post-stats">
                    <span>❤️ ${post.curtidas || 0} curtidas</span>
                    <span>📅 ${new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>
        `).join('');
    
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}