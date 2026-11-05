import { localDb } from '../lib/localDb.ts';
import {
  UserProfile,
  UserSettings,
  UserDocument,
  UserNote,
  UserFile,
} from '../types/index.ts';

export type Unsubscribe = () => void;

/**
 * Ensure user profile and settings exist upon sign in.
 * First-time user: creates profile and default settings.
 * Returning user: preserves existing profile/settings without resetting or overwriting data.
 */
export async function ensureUserProfile(user: {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}): Promise<{
  profile: UserProfile;
  settings: UserSettings;
}> {
  let profile = localDb.getItem<UserProfile>('profile', user.uid, 'main');
  if (!profile) {
    profile = {
      uid: user.uid,
      displayName: user.displayName || 'Student',
      email: user.email || 'student@studenthub.local',
      photoURL: user.photoURL || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localDb.saveItem('profile', user.uid, { ...profile, id: 'main' });
  }

  let settings = localDb.getItem<UserSettings>('settings', user.uid, 'main');
  if (!settings) {
    settings = {
      appearance: 'system',
      language: 'en',
      compactView: false,
      updatedAt: new Date().toISOString(),
    };
    localDb.saveItem('settings', user.uid, { ...settings, id: 'main' });
  }

  return { profile, settings };
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  uid: string,
  updates: Partial<UserSettings>
): Promise<void> {
  const current = localDb.getItem<UserSettings>('settings', uid, 'main') || {
    appearance: 'system',
    language: 'en',
    compactView: false,
    updatedAt: new Date().toISOString(),
  };

  const updated: UserSettings & { id: string } = {
    ...current,
    ...updates,
    id: 'main',
    updatedAt: new Date().toISOString(),
  };

  localDb.saveItem('settings', uid, updated);
}

/**
 * Subscribe to User Profile updates
 */
export function subscribeToUserProfile(
  uid: string,
  onUpdate: (profile: UserProfile | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<UserProfile & { id: string }>(
    'profile',
    uid,
    (items) => {
      const main = items.find((i) => i.id === 'main');
      onUpdate(main || null);
    }
  );
}

/**
 * Subscribe to User Settings updates
 */
export function subscribeToUserSettings(
  uid: string,
  onUpdate: (settings: UserSettings | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<UserSettings & { id: string }>(
    'settings',
    uid,
    (items) => {
      const main = items.find((i) => i.id === 'main');
      onUpdate(main || null);
    }
  );
}

/**
 * Subscribe to recent user files (real data only, empty state when none exist)
 */
export function subscribeToUserFiles(
  uid: string,
  onUpdate: (files: UserFile[]) => void
): Unsubscribe {
  return localDb.subscribe<UserFile>('files', uid, onUpdate, {
    orderByField: 'createdAt',
    orderDirection: 'desc',
    limitCount: 5,
  });
}

/**
 * Subscribe to recent user documents (real data only, empty state when none exist)
 */
export function subscribeToUserDocuments(
  uid: string,
  onUpdate: (docs: UserDocument[]) => void
): Unsubscribe {
  return localDb.subscribe<UserDocument>('documents', uid, onUpdate, {
    orderByField: 'updatedAt',
    orderDirection: 'desc',
    limitCount: 5,
  });
}

/**
 * Subscribe to all user documents for the Document Studio workspace
 */
export function subscribeToAllUserDocuments(
  uid: string,
  onUpdate: (docs: UserDocument[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<UserDocument>('documents', uid, onUpdate, {
    orderByField: 'updatedAt',
    orderDirection: 'desc',
  });
}

/**
 * Fetch a single document by ID
 */
export async function getUserDocument(
  uid: string,
  docId: string
): Promise<UserDocument | null> {
  return localDb.getItem<UserDocument>('documents', uid, docId);
}

/**
 * Save or update a document
 */
export async function saveUserDocument(
  uid: string,
  document: UserDocument
): Promise<void> {
  const now = new Date().toISOString();
  const dataToSave: UserDocument = {
    ...document,
    updatedAt: now,
    createdAt: document.createdAt || now,
  };
  localDb.saveItem('documents', uid, dataToSave);
}

/**
 * Delete a user document
 */
export async function deleteUserDocument(
  uid: string,
  docId: string
): Promise<void> {
  localDb.deleteItem('documents', uid, docId);
}

/**
 * Duplicate an existing document with a new ID and preserved contents/settings
 */
export async function duplicateUserDocument(
  uid: string,
  sourceDoc: UserDocument
): Promise<UserDocument> {
  const newId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();
  const newTitle = `${sourceDoc.title} Copy`;

  const newDoc: UserDocument = {
    ...sourceDoc,
    id: newId,
    title: newTitle,
    createdAt: now,
    updatedAt: now,
  };

  await saveUserDocument(uid, newDoc);
  return newDoc;
}

/**
 * Rename a document
 */
export async function renameUserDocument(
  uid: string,
  docId: string,
  newTitle: string
): Promise<void> {
  const current = localDb.getItem<UserDocument>('documents', uid, docId);
  if (current) {
    localDb.saveItem('documents', uid, {
      ...current,
      title: newTitle.trim(),
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Subscribe to recent user notes (real data only, empty state when none exist)
 */
export function subscribeToUserNotes(
  uid: string,
  onUpdate: (notes: UserNote[]) => void
): Unsubscribe {
  return localDb.subscribe<UserNote>('notes', uid, onUpdate, {
    orderByField: 'updatedAt',
    orderDirection: 'desc',
    limitCount: 5,
  });
}

/**
 * Record a lightweight user activity item (e.g. image converted, file compressed)
 */
export async function recordUserActivity(
  uid: string,
  activity: {
    title: string;
    description: string;
    category: 'image' | 'document' | 'general';
  }
): Promise<void> {
  const actId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  localDb.saveItem('activity', uid, {
    id: actId,
    title: activity.title,
    description: activity.description,
    category: activity.category,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Subscribe to recent user activity
 */
export function subscribeToUserActivity(
  uid: string,
  onUpdate: (activities: Array<{ id: string; title: string; description: string; timestamp: string }>) => void
): Unsubscribe {
  return localDb.subscribe<{ id: string; title: string; description: string; timestamp: string }>(
    'activity',
    uid,
    onUpdate,
    {
      orderByField: 'timestamp',
      orderDirection: 'desc',
      limitCount: 5,
    }
  );
}
