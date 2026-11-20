import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from 'react';
import {
  ensureUserProfile, subscribeToUserProfile, subscribeToUserSettings,
  updateUserSettings as updateUserSettingsInDb,
} from '../services/userService.ts';
import { UserProfile, UserSettings, AppearanceMode } from '../types/index.ts';
import {
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
  const [user, setUser] = useState<StudentAuthUser | null>({ uid: 'student_user', displayName: 'Student', email: null, photoURL: null });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading] = useState(false);
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

  const handleSignIn = useCallback(async () => true, []);
  const handleSignUp = useCallback(async () => true, []);
  const handleSignOut = useCallback(async () => {
    // StudentHub is open access; there is no student session to sign out of.
  }, []);

  const handleUpdateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) throw new Error('Please sign in first.');
    await updateUserSettingsInDb(user.uid, updates);
    setSettings((prev) => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
  }, [user?.uid]);

  const handleUpdateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const nextProfile = { ...(profile as UserProfile), ...updates, updatedAt: new Date().toISOString() };
    setUser((prev) => prev ? {
      ...prev,
      displayName: updates.displayName ?? prev.displayName,
      photoURL: updates.photoURL ?? prev.photoURL,
    } : prev);
    setProfile(nextProfile);
  }, [user, profile]);

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
