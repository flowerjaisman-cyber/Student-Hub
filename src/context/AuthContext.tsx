import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from 'react';
import {
  ensureUserProfile, subscribeToUserProfile, subscribeToUserSettings,
  updateUserSettings as updateUserSettingsInDb,
} from '../services/userService.ts';
import { UserProfile, UserSettings, AppearanceMode } from '../types/index.ts';
import {
  StudentSession, readStudentSession, storeStudentSession, signInStudent,
  signUpStudent, getStudentUser, signOutStudent, refreshStudentSession,
  updateStudentMetadata,
} from '../lib/supabase.ts';

export interface StudentAuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: StudentAuthUser | null;
  profile: UserProfile | null;
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

const DEFAULT_USER_SETTINGS: UserSettings = {
  appearance: 'system', language: 'en', compactView: false, updatedAt: new Date().toISOString(),
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StudentAuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [session, setSession] = useState<StudentSession | null>(() => readStudentSession());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const appearance: AppearanceMode = settings?.appearance || 'system';
    const root = document.documentElement;
    const applySystemTheme = () => root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (appearance === 'dark') root.classList.add('dark');
    else if (appearance === 'light') root.classList.remove('dark');
    else {
      applySystemTheme();
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', applySystemTheme);
      return () => media.removeEventListener('change', applySystemTheme);
    }
  }, [settings?.appearance]);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        let current = session;
        if (current && current.expires_at && current.expires_at < Date.now() + 60_000) {
          current = await refreshStudentSession(current);
          if (active) setSession(current);
        }
        if (!current?.access_token) return;
        const authUser = await getStudentUser(current.access_token);
        if (!active) return;
        const nextUser: StudentAuthUser = {
          uid: authUser.id,
          displayName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Student',
          email: authUser.email || null,
          photoURL: authUser.user_metadata?.avatar_url || null,
        };
        const initial = await ensureUserProfile(nextUser);
        if (!active) return;
        setUser(nextUser);
        setProfile(initial.profile);
        setSettings(initial.settings);
      } catch (err) {
        console.error('Student session restore failed:', err);
        storeStudentSession(null);
        if (active) { setSession(null); setUser(null); }
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();
    return () => { active = false; };
  // Initial session restoration only; auth actions update the state explicitly.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?.uid) { setProfile(null); setSettings(DEFAULT_USER_SETTINGS); return; }
    let unsubProfile: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;
    ensureUserProfile(user).then(({ profile: p, settings: s }) => {
      setProfile(p); setSettings(s);
      unsubProfile = subscribeToUserProfile(user.uid, (next) => { if (next) setProfile(next); });
      unsubSettings = subscribeToUserSettings(user.uid, (next) => { if (next) setSettings(next); });
    }).catch((err) => console.error('Student profile load failed:', err));
    return () => { unsubProfile?.(); unsubSettings?.(); };
  }, [user?.uid]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const next = await signInStudent(email, password);
      const authUser = next.user || await getStudentUser(next.access_token);
      const nextUser = {
        uid: authUser.id,
        displayName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Student',
        email: authUser.email || null,
        photoURL: authUser.user_metadata?.avatar_url || null,
      };
      const initial = await ensureUserProfile(nextUser);
      setSession(next); setUser(nextUser); setProfile(initial.profile); setSettings(initial.settings);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in.');
      return false;
    }
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, fullName: string) => {
    setError(null);
    try {
      const result = await signUpStudent(email, password, fullName);
      if (!result.session) return false;
      const authUser = result.session.user || await getStudentUser(result.session.access_token);
      const nextUser = {
        uid: authUser.id, displayName: fullName, email: authUser.email || email,
        photoURL: authUser.user_metadata?.avatar_url || null,
      };
      const initial = await ensureUserProfile(nextUser);
      setSession(result.session); setUser(nextUser); setProfile(initial.profile); setSettings(initial.settings);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Unable to create account.');
      return false;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOutStudent(session?.access_token);
    setSession(null); setUser(null); setProfile(null); setSettings(DEFAULT_USER_SETTINGS);
  }, [session?.access_token]);

  const handleUpdateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) throw new Error('Please sign in first.');
    await updateUserSettingsInDb(user.uid, updates);
    setSettings((prev) => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
  }, [user?.uid]);

  const handleUpdateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user || !session?.access_token) throw new Error('Please sign in first.');
    const metadata: Record<string, unknown> = {};
    if (updates.displayName !== undefined) metadata.full_name = updates.displayName;
    if (updates.photoURL !== undefined) metadata.avatar_url = updates.photoURL;
    const authUser = await updateStudentMetadata(session.access_token, metadata);
    const next = {
      ...user,
      displayName: authUser.user_metadata?.full_name ?? updates.displayName ?? user.displayName,
      photoURL: authUser.user_metadata?.avatar_url ?? updates.photoURL ?? user.photoURL,
    };
    const nextProfile = { ...(profile as UserProfile), ...updates, ...next, updatedAt: new Date().toISOString() };
    setUser(next); setProfile(nextProfile);
  }, [user, profile, session?.access_token]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      user, profile, settings, loading, error, signIn: handleSignIn, signUp: handleSignUp,
      signOut: handleSignOut, updateSettings: handleUpdateSettings,
      updateProfile: handleUpdateProfile, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
