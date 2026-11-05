import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  ensureUserProfile,
  subscribeToUserProfile,
  subscribeToUserSettings,
  updateUserSettings as updateUserSettingsInDb,
} from '../services/userService.ts';
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

const DEFAULT_USER_PROFILE: UserProfile = {
  uid: 'student_user',
  displayName: 'Student',
  email: 'student@studenthub.local',
  photoURL: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  appearance: 'system',
  language: 'en',
  compactView: false,
  updatedAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StudentAuthUser>({
    uid: DEFAULT_USER_PROFILE.uid,
    displayName: DEFAULT_USER_PROFILE.displayName,
    email: DEFAULT_USER_PROFILE.email,
    photoURL: DEFAULT_USER_PROFILE.photoURL,
  });
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Apply theme to DOM
  useEffect(() => {
    const appearance: AppearanceMode = settings?.appearance || 'system';
    const root = document.documentElement;

    const applySystemTheme = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
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

  // Initialize and subscribe to local user profile and settings
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubSettings: (() => void) | null = null;

    async function initUser() {
      try {
        const { profile: initProfile, settings: initSettings } =
          await ensureUserProfile(user);
        if (initProfile) {
          setProfile(initProfile);
          setUser({
            uid: initProfile.uid,
            displayName: initProfile.displayName,
            email: initProfile.email,
            photoURL: initProfile.photoURL,
          });
        }
        if (initSettings) {
          setSettings(initSettings);
        }

        unsubProfile = subscribeToUserProfile(user.uid, (p) => {
          if (p) {
            setProfile(p);
            setUser({
              uid: p.uid,
              displayName: p.displayName,
              email: p.email,
              photoURL: p.photoURL,
            });
          }
        });

        unsubSettings = subscribeToUserSettings(user.uid, (s) => {
          if (s) setSettings(s);
        });
      } catch (err) {
        console.error('Failed to init local student user:', err);
      }
    }

    initUser();

    return () => {
      if (unsubProfile) unsubProfile();
      if (unsubSettings) unsubSettings();
    };
  }, [user.uid]);

  const handleSignIn = useCallback(async (): Promise<boolean> => {
    setError(null);
    return true;
  }, []);

  const handleSignOut = useCallback(async (): Promise<void> => {
    // Free workspace: resets to default without locking out
    setProfile(DEFAULT_USER_PROFILE);
    setUser({
      uid: DEFAULT_USER_PROFILE.uid,
      displayName: DEFAULT_USER_PROFILE.displayName,
      email: DEFAULT_USER_PROFILE.email,
      photoURL: null,
    });
  }, []);

  const handleUpdateSettings = useCallback(
    async (updates: Partial<UserSettings>): Promise<void> => {
      try {
        await updateUserSettingsInDb(user.uid, updates);
        setSettings((prev) => ({ ...prev, ...updates }));
      } catch (err) {
        console.error('Error updating settings:', err);
        throw err;
      }
    },
    [user.uid]
  );

  const handleUpdateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<void> => {
      try {
        const updated = { ...profile, ...updates, updatedAt: new Date().toISOString() };
        setProfile(updated);
        setUser({
          uid: updated.uid,
          displayName: updated.displayName,
          email: updated.email,
          photoURL: updated.photoURL,
        });
      } catch (err) {
        console.error('Error updating profile:', err);
        throw err;
      }
    },
    [profile]
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
