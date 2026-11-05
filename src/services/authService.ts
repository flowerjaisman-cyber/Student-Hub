/**
 * Authentication Service (Local, Free of Use)
 * StudentHub is fully open and free: no Google login, no credentials required.
 */

export interface LocalUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}

export interface AuthResult {
  user: LocalUser | null;
  error?: string;
}

export const DEFAULT_STUDENT_USER: LocalUser = {
  uid: 'student_user',
  displayName: 'Student',
  email: 'student@studenthub.local',
  photoURL: null,
};

/**
 * Sign in (Local instant pass)
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  return { user: DEFAULT_STUDENT_USER };
}

/**
 * Sign out (No-op or session reset)
 */
export async function signOutUser(): Promise<void> {
  // Free workspace does not lock the user out
}
