// ============================================
// POSTS.JS - Gerenciamento de posts
// ============================================

import { supabase } from './supabase-config.js';
import { getCurrentUser } from './auth.js';

// Criar novo post
export async function createPost() {
  const content = document.getElementById('postContent')?.value;
  const user = await getCurrentUser();
  
  if (!user) {
    alert('Você precisa estar logado!');
    return;
  }
  
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
  btn.innerHTML = 'Publicando...';
  
  const { error } = await supabase
    .from('posts')
    .insert([{
      user_id: user.id,
      conteudo: content.trim(),
      curtidas: 0
    }]);
  
  if (error) {
    console.error('Erro ao publicar:', error);
    alert('Erro ao publicar. Tente novamente.');
    btn.disabled = false;
    btn.innerHTML = 'Publicar';
    return;
  }
  
  // Limpar campo
  document.getElementById('postContent').value = '';
  document.getElementById('charCount').textContent = '0';
  
  // Recarregar feed
  await loadFeed();
  
  btn.disabled = false;
  btn.innerHTML = 'Publicar';
}

// Carregar feed de posts
export async function loadFeed() {
  const feed = document.getElementById('postsFeed');
  if (!feed) return;
  
  feed.innerHTML = '<div class="loading-spinner">📡 Carregando posts...</div>';
  
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
                *,
                perfis (
                    username
                )
            `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!posts || posts.length === 0) {
      feed.innerHTML = '<div class="post-card"><p style="text-align:center;">📭 Nenhum post ainda. Seja o primeiro!</p></div>';
      return;
    }
    
    const user = await getCurrentUser();
    
    // Verificar quais posts o usuário curtiu
    const postsComCurtidas = await Promise.all(posts.map(async (post) => {
      const { data: curtiu } = await supabase
        .from('curtidas')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user?.id)
        .maybeSingle();
      
      return {
        ...post,
        usuarioCurtiu: !!curtiu
      };
    }));
    
    // Renderizar posts
    feed.innerHTML = postsComCurtidas.map(post => renderPost(post)).join('');
    
    // Adicionar eventos de like
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => likePost(btn.dataset.postId));
    });
    
  } catch (error) {
    console.error('Erro ao carregar feed:', error);
    feed.innerHTML = '<div class="post-card"><p style="text-align:center;color:#ff4757;">❌ Erro ao carregar posts</p></div>';
  }
}

// Curtir/Descurtir post
async function likePost(postId) {
  const user = await getCurrentUser();
  if (!user) {
    alert('Faça login para curtir!');
    return;
  }
  
  try {
    const { data: existing } = await supabase
      .from('curtidas')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existing) {
      // Remover curtida
      await supabase
        .from('curtidas')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      // Adicionar curtida
      await supabase
        .from('curtidas')
        .insert([{ post_id: postId, user_id: user.id }]);
    }
    
    // Recarregar feed
    await loadFeed();
    
  } catch (error) {
    console.error('Erro ao curtir:', error);
  }
}

// Renderizar post individual
function renderPost(post) {
  const data = new Date(post.created_at);
  const dataFormatada = data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const nomeUsuario = post.perfis?.username || 'Usuário';
  const inicial = nomeUsuario.charAt(0).toUpperCase();
  const likeClass = post.usuarioCurtiu ? 'liked' : '';
  
  return `
        <div class="post-card">
            <div class="post-header">
                <div class="post-user">
                    <div class="post-avatar">${inicial}</div>
                    <div class="post-user-info">
                        <h4>${escapeHtml(nomeUsuario)}</h4>
                        <span class="post-date">${dataFormatada}</span>
                    </div>
                </div>
            </div>
            <div class="post-content">
                <p>${escapeHtml(post.conteudo)}</p>
            </div>
            <div class="post-stats">
                <button class="like-btn ${likeClass}" data-post-id="${post.id}">
                    ❤️ <span>${post.curtidas || 0}</span>
                </button>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}