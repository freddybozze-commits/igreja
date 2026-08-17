import { supabase, isSupabaseActive } from './supabase-service.js';

const CONTENT_BUCKET = 'content-images';

export function isAdminSupabaseConfigured() {
  return isSupabaseActive();
}

export function observeAuth(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!await isAdminUser(data.user.id)) {
    await supabase.auth.signOut();
    throw new Error('Usuário autenticado, mas sem permissão de administrador.');
  }
  return data.user;
}

export async function signOutAdmin() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function isAdminUser(uid) {
  if (!supabase || !uid) return false;
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .maybeSingle();
  if (error) throw error;
  return data?.role === 'admin';
}

function tableFor(type) {
  if (type === 'posts') return 'posts';
  if (type === 'events') return 'events';
  if (type === 'prayers') return 'prayer_requests';
  throw new Error('Tipo de conteúdo inválido.');
}

export async function listDocuments(type) {
  const table = tableFor(type);
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveDocument(type, data, id = null) {
  const table = tableFor(type);
  const query = id
    ? supabase.from(table).update(data).eq('id', id).select('id').single()
    : supabase.from(table).insert(data).select('id').single();
  const { data: saved, error } = await query;
  if (error) throw error;
  return saved.id;
}

export async function removeDocument(type, id) {
  const { error } = await supabase.from(tableFor(type)).delete().eq('id', id);
  if (error) throw error;
}

export async function uploadContentImage(file, folder = 'content') {
  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(CONTENT_BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
  if (error) throw error;
  return supabase.storage.from(CONTENT_BUCKET).getPublicUrl(path).data.publicUrl;
}
