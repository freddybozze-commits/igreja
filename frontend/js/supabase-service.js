import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const configured = SUPABASE_URL.startsWith('https://')
  && !SUPABASE_URL.includes('COLE_AQUI')
  && SUPABASE_ANON_KEY.length > 40
  && !SUPABASE_ANON_KEY.includes('COLE_AQUI');

let client = null;
if (configured) {
  try {
    const createClient = globalThis.supabase?.createClient;
    if (!createClient) throw new Error('Cliente local do Supabase não foi carregado.');
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  } catch (error) {
    console.warn('Supabase indisponível; iniciando no modo offline.', error);
  }
}
export const supabase = client;

export const isSupabaseActive = () => Boolean(supabase);

export async function getRemoteContent() {
  if (!supabase) return null;
  const [postsResult, eventsResult, highlightsResult] = await Promise.all([
    supabase.from('posts').select('*').eq('published', true).order('created_at', { ascending: false }),
    supabase.from('events').select('*').eq('published', true).order('starts_at', { ascending: true }),
    supabase.from('highlights').select('*').eq('published', true).order('sort_order', { ascending: true })
  ]);
  if (postsResult.error) console.warn('Supabase posts:', postsResult.error.message);
  if (eventsResult.error) console.warn('Supabase events:', eventsResult.error.message);
  if (highlightsResult.error) console.warn('Supabase highlights:', highlightsResult.error.message);
  return {
    posts: postsResult.data || [],
    events: (eventsResult.data || []).map((item) => ({
      ...item,
      date: item.date || (item.starts_at ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(item.starts_at)).toUpperCase() : ''),
      time: item.time || (item.starts_at ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.starts_at)) : '')
    })),
    highlights: highlightsResult.data || []
  };
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

export function onAuthChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
  return () => data.subscription.unsubscribe();
}

export async function signUp({ name, email, phone, password }) {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, phone } }
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function updateProfile({ name, phone, birthDate }) {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data: authData, error: authError } = await supabase.auth.updateUser({
    data: { full_name: name, phone, birth_date: birthDate || null }
  });
  if (authError) throw authError;
  const { error } = await supabase.from('profiles').upsert({
    id: authData.user.id,
    full_name: name,
    phone,
    birth_date: birthDate || null,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
  return authData.user;
}

export async function sendPrayerRequest(payload) {
  if (!supabase) {
    const saved = JSON.parse(localStorage.getItem('iepp-prayers') || '[]');
    saved.push({ ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    localStorage.setItem('iepp-prayers', JSON.stringify(saved));
    return { mode: 'local' };
  }
  const user = await getCurrentUser();
  const { error } = await supabase.from('prayer_requests').insert({
    user_id: user?.id || null,
    name: payload.name,
    phone: payload.phone || null,
    request: payload.request,
    is_private: payload.private !== false
  });
  if (error) throw error;
  return { mode: 'supabase' };
}
