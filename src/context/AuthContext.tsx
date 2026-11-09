import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.ts';
import {
  ensureUserProfile,
  updateUserSettings as updateUserSettingsInDb,
} from '../services/userService.ts';
import { localDb } from '../lib/localDb.ts';
import { UserProfile, UserSettings, AppearanceMode } from '../types/index.ts';

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
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

const DEFAULT_USER_SETTINGS: UserSettings = {
  appearance: 'system',
  language: 'en',
  compactView: false,
  updatedAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthUser(authUser: SupabaseUser): StudentAuthUser {
  const metadata = authUser.user_metadata || {};
  return {
    uid: authUser.id,
    displayName:
      metadata.full_name ||
      metadata.name ||
      authUser.email?.split('@')[0] ||
      'Student',
    email: authUser.email || null,
    photoURL: metadata.avatar_url || metadata.picture || null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StudentAuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply the selected theme.
  useEffect(() => {
    const appearance: AppearanceMode = settings?.appearance || 'system';
    const root = document.documentElement;

    const applySystemTheme = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    };

    if (appearance === 'dark') {
      root.classList.add('dark');
    } else if (appearance === 'light') {
      root.classList.remove('dark');
    } else {
      applySystemTheme();
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applySystemTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings?.appearance]);

  // Restore and observe the real Supabase session. All local workspace records
  // remain namespaced by this immutable Auth UUID, not by a shared demo account.
  useEffect(() => {
    let alive = true;
    let hydrateSequence = 0;

    const hydrateSession = async (authUser: SupabaseUser | null) => {
      const sequence = ++hydrateSequence;

      if (!authUser) {
        if (!alive) return;
        setUser(null);
        setProfile(null);
        setSettings(DEFAULT_USER_SETTINGS);
        setLoading(false);
        return;
      }

      if (!alive) return;
      const mappedUser = mapAuthUser(authUser);
      setUser(mappedUser);
      setLoading(true);
      setError(null);

      try {
        const { profile: localProfile, settings: localSettings } =
          await ensureUserProfile(mappedUser);

        // New accounts are normally inserted by the database trigger. This
        // fallback creates a row for accounts that predate that trigger.
        const profileResult = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url, created_at, updated_at')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profileResult.error) throw profileResult.error;

        let cloudProfile = profileResult.data;
        if (!cloudProfile) {
          const insertResult = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email || null,
              full_name: mappedUser.displayName,
              avatar_url: mappedUser.photoURL,
            })
            .select('id, email, full_name, avatar_url, created_at, updated_at')
            .single();

          if (insertResult.error) throw insertResult.error;
          cloudProfile = insertResult.data;
        }

        const nextProfile: UserProfile = {
          uid: authUser.id,
          displayName: cloudProfile.full_name || mappedUser.displayName || localProfile.displayName,
          email: cloudProfile.email || mappedUser.email || localProfile.email,
          photoURL: cloudProfile.avatar_url || mappedUser.photoURL || localProfile.photoURL,
          createdAt: cloudProfile.created_at || localProfile.createdAt,
          updatedAt: cloudProfile.updated_at || localProfile.updatedAt,
        };

        localDb.saveItem('profile', authUser.id, { ...nextProfile, id: 'main' });

        if (alive && sequence === hydrateSequence) {
          setProfile(nextProfile);
          setSettings(localSettings || DEFAULT_USER_SETTINGS);
        }
      } catch (err) {
        console.error('StudentHub profile initialization failed:', err);

        // Keep the verified Auth session usable if the optional profile query
        // is temporarily unavailable. No account receives another UID's data.
        const { profile: fallbackProfile, settings: fallbackSettings } =
          await ensureUserProfile(mappedUser);

        if (alive && sequence === hydrateSequence) {
          setProfile(fallbackProfile);
          setSettings(fallbackSettings || DEFAULT_USER_SETTINGS);
          setError(
            'You are signed in, but your cloud profile could not be loaded. Check the Supabase Data API settings and profile table permissions.'
          );
        }
      } finally {
        if (alive && sequence === hydrateSequence) setLoading(false);
      }
    };

    // Keep the Auth callback synchronous; perform profile I/O after it returns.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void Promise.resolve().then(() => hydrateSession(session?.user || null));
    });

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) throw sessionError;
        return hydrateSession(data.session?.user || null);
      })
      .catch((err: unknown) => {
        console.error('Could not restore Supabase session:', err);
        if (alive) {
          setError('Your sign-in session could not be restored. Please refresh and try again.');
          setLoading(false);
        }
      });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (signInError) throw signInError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in could not be started.');
      return false;
    }
  }, []);

  const handleSignOut = useCallback(async (): Promise<void> => {
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) {
      setError(signOutError.message);
      throw signOutError;
    }
    setUser(null);
    setProfile(null);
    setSettings(DEFAULT_USER_SETTINGS);
  }, []);

  const handleUpdateSettings = useCallback(
    async (updates: Partial<UserSettings>): Promise<void> => {
      if (!user) throw new Error('You must be signed in to update settings.');
      const updated: UserSettings = {
        ...(settings || DEFAULT_USER_SETTINGS),
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await updateUserSettingsInDb(user.uid, updated);
      setSettings(updated);
    },
    [user, settings]
  );

  const handleUpdateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<void> => {
      if (!user || !profile) throw new Error('You must be signed in to update your profile.');

      const nextDisplayName = updates.displayName?.trim() || profile.displayName;
      const nextPhotoURL = updates.photoURL ?? profile.photoURL;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: nextDisplayName,
          avatar_url: nextPhotoURL,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.uid);

      if (updateError) throw updateError;

      const updatedProfile: UserProfile = {
        ...profile,
        displayName: nextDisplayName,
        photoURL: nextPhotoURL,
        updatedAt: new Date().toISOString(),
      };

      localDb.saveItem('profile', user.uid, { ...updatedProfile, id: 'main' });
      setProfile(updatedProfile);
      setUser({ ...user, displayName: nextDisplayName, photoURL: nextPhotoURL });
    },
    [user, profile]
  );

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        settings,
        loading,
        error,
        signIn: handleSignIn,
        signOut: handleSignOut,
        updateSettings: handleUpdateSettings,
        updateProfile: handleUpdateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
