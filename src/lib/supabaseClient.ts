import { createClient } from '@supabase/supabase-js';

// Criar uma função para inicializar o cliente Supabase de forma segura
const initializeSupabase = () => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Verificar se as variáveis de ambiente estão presentes
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('As variáveis de ambiente Supabase não estão configuradas corretamente');
      return null;
    }
    
    // Criar client do Supabase com opções persistentes
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // Manter a sessão entre recargas de página
        autoRefreshToken: true, // Renovar automaticamente o token quando estiver prestes a expirar
        detectSessionInUrl: true, // Detectar o token de sessão na URL ao usar autenticação por magic link
        storageKey: 'pmerj_supabase_auth' // Chave de armazenamento personalizada para evitar conflitos
      }
    });
  } catch (error) {
    console.error('Erro ao inicializar cliente Supabase:', error);
    return null;
  }
};

// Exportar o cliente Supabase inicializado
export const supabase = initializeSupabase();

// Interceptador para lidar com alterações de estado de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  // Eventos possíveis: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, MFA_CHALLENGE_VERIFIED
  if (event === 'SIGNED_IN' && session) {
    // Usuário acabou de fazer login
    console.log('Usuário autenticado:', session.user.email);
  } else if (event === 'SIGNED_OUT') {
    // Usuário fez logout
    console.log('Usuário deslogado');
  } else if (event === 'TOKEN_REFRESHED') {
    // Token foi atualizado automaticamente
    console.log('Token de autenticação atualizado');
  }
});
