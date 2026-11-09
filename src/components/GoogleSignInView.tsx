import { useState } from 'react';
import { GraduationCap, ShieldCheck, LockKeyhole, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { LoadingScreen } from './LoadingScreen.tsx';

export function GoogleSignInView() {
  const { signIn, error, clearError, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <LoadingScreen />;

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    clearError();
    await signIn();
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-950/60">
          <GraduationCap className="h-8 w-8" />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-300">Student workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome to StudentHub</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Sign in with your Google account to open your personal student workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={submitting}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.05 5.05 0 0 1-2.2 3.31v2.77h3.57c2.09-1.92 3.27-4.75 3.27-8.09Z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.28-1.93-6.15-4.53H2.16v2.84A11 11 0 0 0 12 23Z"/>
              <path fill="#FBBC05" d="M5.85 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.35-2.1V7.06H2.16A11 11 0 0 0 1 12c0 1.78.43 3.46 1.16 4.94l3.69-2.84Z"/>
              <path fill="#EA4335" d="M12 5.37c1.62 0 3.06.56 4.21 1.67l3.15-3.15C17.45 2.1 14.97 1 12 1a11 11 0 0 0-9.84 6.06L5.85 9.9C6.72 7.3 9.14 5.37 12 5.37Z"/>
            </svg>
          )}
          <span>{submitting ? 'Connecting to Google…' : 'Continue with Google'}</span>
        </button>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-7 grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2 rounded-xl bg-slate-800/70 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-xs leading-5 text-slate-300">Your account has its own private workspace.</span>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-slate-800/70 p-3">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
            <span className="text-xs leading-5 text-slate-300">Protected pages require a valid session.</span>
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] leading-5 text-slate-500">
          Your Google account is used only to identify your StudentHub account.
        </p>
      </section>
    </main>
  );
}
