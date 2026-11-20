const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yssoddwbmqthhaqfvsku.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ksL4bmddl0wPEEvE0vBNuQ_KUst0UiH';
const SESSION_KEY = 'studenthub_student_session_v1';

export interface StudentSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: { id: string; email?: string; user_metadata?: Record<string, any> };
}

export function readStudentSession(): StudentSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as StudentSession : null;
  } catch { return null; }
}

export function storeStudentSession(session: StudentSession | null): void {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

async function request(path: string, init: RequestInit = {}, token?: string): Promise<any> {
  const headers = new Headers(init.headers);
  headers.set('apikey', SUPABASE_KEY);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${SUPABASE_URL}${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || 'Supabase request failed.');
  return data;
}

export async function signInStudent(email: string, password: string): Promise<StudentSession> {
  const data = await request('/auth/v1/token?grant_type=password', {
    method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const session = { ...data, expires_at: Date.now() + (Number(data.expires_in || 3600) * 1000) } as StudentSession;
  storeStudentSession(session);
  return session;
}

export async function signUpStudent(email: string, password: string, fullName: string): Promise<{ session: StudentSession | null; needsEmailConfirmation: boolean }> {
  const data = await request('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, data: { full_name: fullName.trim() } }),
  });
  if (data.access_token) {
    const session = { ...data, expires_at: Date.now() + (Number(data.expires_in || 3600) * 1000) } as StudentSession;
    storeStudentSession(session);
    return { session, needsEmailConfirmation: false };
  }
  return { session: null, needsEmailConfirmation: true };
}

export async function getStudentUser(token: string) {
  return request('/auth/v1/user', {}, token);
}

export async function signOutStudent(token?: string): Promise<void> {
  try { if (token) await request('/auth/v1/logout', { method: 'POST' }, token); }
  finally { storeStudentSession(null); }
}

export async function refreshStudentSession(session: StudentSession): Promise<StudentSession> {
  const data = await request('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  const next = { ...data, expires_at: Date.now() + (Number(data.expires_in || 3600) * 1000) } as StudentSession;
  storeStudentSession(next);
  return next;
}

export async function updateStudentMetadata(token: string, updates: Record<string, unknown>) {
  return request('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ data: updates }) }, token);
}

export async function cloudListRecords(token: string, userId: string, collection: string) {
  return request(`/rest/v1/student_records?select=item_id,payload&user_id=eq.${encodeURIComponent(userId)}&collection=eq.${encodeURIComponent(collection)}&order=updated_at.asc`, {}, token);
}

export async function cloudUpsertRecord(token: string, userId: string, collection: string, item: { id: string; [key: string]: any }) {
  return request('/rest/v1/student_records?on_conflict=user_id,collection,item_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, collection, item_id: item.id, payload: item, updated_at: new Date().toISOString() }),
  }, token);
}

export async function cloudDeleteRecord(token: string, userId: string, collection: string, itemId: string) {
  return request(`/rest/v1/student_records?user_id=eq.${encodeURIComponent(userId)}&collection=eq.${encodeURIComponent(collection)}&item_id=eq.${encodeURIComponent(itemId)}`, {
    method: 'DELETE', headers: { Prefer: 'return=minimal' },
  }, token);
}
