import { supabase } from './supabase-config.js';
import { getCurrentUser } from './auth.js';

export async function createPost() {
  const content = document.getElementById('postContent')?.value;
  const user = await getCurrentUser();
  
  if (!user) return;
  if (!content || content.trim().length === 0) {
    alert('Digite algo para publicar!');
    return;
  }
  if (content.length > 500) {
    alert('Máximo 500 caracteres!');
    return;
  }
  
  const btn = document.getElementById('publishBtn');
  btn.disabled = true;
  btn.textContent = 'Publicando...';
  
  const { error } = await supabase
    .from('posts')
    .insert([{ user_id: user.id, conteudo: content.trim(), curtidas: 0 }]);
  
  if (error) {
    alert('Erro ao publicar');
    btn.disabled = false;
    btn.textContent = 'Publicar 🚀';
    return;
  }
  
  document.getElementById('postContent').value = '';
  document.getElementById('charCount').textContent = '0';
  await loadFeed();
  
  btn.disabled = false;
  btn.textContent = 'Publicar 🚀';
}

export async function loadFeed() {
  const feed = document.getElementById('postsFeed');
  if (!feed) return;
  
  feed.innerHTML = '<div class="loading-spinner">📡 Carregando...</div>';
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`*, perfis (username)`)
    .order('created_at', { ascending: false });
  
  if (error || !posts.length) {
    feed.innerHTML = '<div class="post-card"><p>📭 Nenhum post ainda</p></div>';
    return;
  }
  
  const user = await getCurrentUser();
  
  const postsComCurtidas = await Promise.all(posts.map(async (post) => {
    const { data: curtiu } = await supabase
      .from('curtidas')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user?.id)
      .single();
    return { ...post, usuarioCurtiu: !!curtiu };
  }));
  
  feed.innerHTML = postsComCurtidas.map(post => `
        <div class="post-card">
            <div class="post-header">
                <div class="post-user">
                    <div class="post-avatar">${(post.perfis?.username?.[0] || 'U').toUpperCase()}</div>
                    <div class="post-user-info">
                        <h4>${post.perfis?.username || 'Usuário'}</h4>
                        <span class="post-date">${new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
            </div>
            <div class="post-content"><p>${escapeHtml(post.conteudo)}</p></div>
            <div class="post-stats">
                <button class="like-btn ${post.usuarioCurtiu ? 'liked' : ''}" data-post-id="${post.id}">
                    ❤️ <span>${post.curtidas || 0}</span>
                </button>
            </div>
        </div>
    `).join('');
  
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => likePost(btn.dataset.postId));
  });
}

async function likePost(postId) {
  const user = await getCurrentUser();
  if (!user) return;
  
  const { data: existing } = await supabase
    .from('curtidas')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();
  
  if (existing) {
    await supabase.from('curtidas').delete().eq('post_id', postId).eq('user_id', user.id);
  } else {
    await supabase.from('curtidas').insert([{ post_id: postId, user_id: user.id }]);
  }
  
  await loadFeed();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}