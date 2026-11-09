# Supabase Auth Setup

Project ref: yssoddwbmqthhaqfvsku

The private per-user profile table, RLS policies, signup trigger, and backfill
are installed by migration `add_studenthub_profiles_and_auth_trigger`.

## Required dashboard configuration

1. In Supabase Dashboard > Authentication > Sign In / Providers, enable Google.
2. Add a Google OAuth Web Client ID and Client Secret. Do not commit the secret.
3. In Google Cloud Console, add this Authorized redirect URI:
   `https://yssoddwbmqthhaqfvsku.supabase.co/auth/v1/callback`
4. In Supabase Dashboard > Authentication > URL Configuration:
   - Site URL: `https://studenthub786.netlify.app`
   - Redirect URLs: `https://studenthub786.netlify.app/**`
   - Add local development: `http://localhost:5173/**`
5. Add the Netlify production domain and any custom domain to Google Authorized JavaScript origins.

The browser app uses a Supabase publishable key only. Never add a service_role
or secret API key to frontend code.
