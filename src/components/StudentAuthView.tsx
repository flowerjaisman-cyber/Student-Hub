import { FormEvent, useState } from 'react';
import { GraduationCap, LockKeyhole, Mail, UserRound, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export function StudentAuthView() {
  const { signIn, signUp, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    clearError(); setNotice(''); setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        const created = await signUp(email, password, name);
        if (!created) setNotice('Account request submitted. If email confirmation is enabled, open the verification link sent to your inbox, then sign in.');
      }
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-7 sm:p-9 shadow-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600"><GraduationCap className="h-7 w-7" /></div>
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-[11px] font-semibold text-indigo-300"><Sparkles className="h-3 w-3" /> Student workspace</div>
          <h1 className="mt-4 text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your student account'}</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to securely access your study planner, notes and academic progress on any device.</p>
        </div>
        <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-800 p-1">
          <button type="button" onClick={() => { setMode('login'); clearError(); setNotice(''); }} className={`rounded-lg py-2.5 text-sm font-semibold ${mode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Sign in</button>
          <button type="button" onClick={() => { setMode('signup'); clearError(); setNotice(''); }} className={`rounded-lg py-2.5 text-sm font-semibold ${mode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Create account</button>
        </div>
        {(error || notice) && <div role="status" className={`mt-5 flex gap-2 rounded-xl border p-3 text-sm ${error ? 'border-red-900 bg-red-950/50 text-red-200' : 'border-emerald-900 bg-emerald-950/50 text-emerald-200'}`}>{error ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <Mail className="h-4 w-4 shrink-0 mt-0.5" />}<span>{error || notice}</span></div>}
        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === 'signup' && <div><label htmlFor="student-name" className="mb-1.5 block text-xs font-semibold text-slate-300">Full name</label><div className="relative"><UserRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" /><input id="student-name" value={name} onChange={e => setName(e.target.value)} required minLength={2} autoComplete="name" placeholder="Your full name" className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" /></div></div>}
          <div><label htmlFor="student-email" className="mb-1.5 block text-xs font-semibold text-slate-300">Email address</label><div className="relative"><Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" /><input id="student-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" autoCapitalize="none" placeholder="you@example.com" className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" /></div></div>
          <div><label htmlFor="student-password" className="mb-1.5 block text-xs font-semibold text-slate-300">Password</label><div className="relative"><LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" /><input id="student-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" /></div></div>
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Please wait…' : mode === 'login' ? 'Sign in to StudentHub' : 'Create account'}</button>
        </form>
        <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-500">Your academic records are private to your account. Never share your password with anyone.</p>
      </div>
    </main>
  );
}
