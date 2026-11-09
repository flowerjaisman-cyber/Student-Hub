import { createClient } from '@supabase/supabase-js';

// These are public client settings. The publishable key is designed for browser use;
// database access is still controlled by authenticated JWTs and Row Level Security.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://yssoddwbmqthhaqfvsku.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_ksL4bmddl0wPEEvE0vBNuQ_KUst0UiH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
