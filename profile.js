import { supabase } from './supabase-config.js';
import { getCurrentUser } from './auth.js';

export async function loadUserProfile() {
  const user = await getCurrentUser();
  if (!user) return;
  
  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', user.id)
    .single();
  
  const { data: posts, count } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  const nome = perfil?.username || user.email.split('@')[0];
  document.getElementById('profileAvatar').textContent = nome[0].toUpperCase();
  document.getElementById('profileName').textContent = nome;
  document.getElementById('profileBio').textContent = perfil?.bio || 'Olá! 🚀';
  document.getElementById('profilePostsCount').textContent = count || 0;
  
  const container = document.getElementById('userPosts');
  if (!posts?.length) {
    container.innerHTML = '<p style="text-align:center;color:#999;">📝 Nenhum post ainda</p>';
    return;
  }
  
  container.innerHTML = posts.map(post => `
        <div class="post-card">
            <div class="post-content"><p>${escapeHtml(post.conteudo)}</p></div>
            <div class="post-stats">
                <span>❤️ ${post.curtidas || 0}</span>
                <span>📅 ${new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}