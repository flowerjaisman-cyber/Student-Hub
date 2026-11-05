import { localDb } from '../lib/localDb.ts';
import { UserDocument } from '../types/index.ts';
import {
  generatePdfBlob,
  generateDocxBlob,
  generateTxtBlob,
  generateHtmlBlob,
  generateMarkdownBlob,
  calculateDocumentStats,
  importDocxFile,
  importTxtFile,
  importMarkdownFile,
  importHtmlFile,
} from '../utils/documentUtils.ts';
import { uploadUserFile } from './fileManagerService.ts';

export type Unsubscribe = () => void;

/**
 * Subscribe to all user documents for Document Studio
 */
export function subscribeUserDocuments(
  uid: string,
  onUpdate: (docs: UserDocument[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<UserDocument>(
    'documents',
    uid,
    (items) => {
      const normalized = items.map((data) => ({
        ...data,
        starred: data.starred ?? data.isStarred ?? false,
        isStarred: data.isStarred ?? data.starred ?? false,
        deleted: data.deleted ?? data.isTrashed ?? false,
        isTrashed: data.isTrashed ?? data.deleted ?? false,
      }));
      onUpdate(normalized);
    },
    { orderByField: 'updatedAt', orderDirection: 'desc' }
  );
}

/**
 * Subscribe to recent active user documents (non-deleted only, up to 5)
 */
export function subscribeRecentDocuments(
  uid: string,
  onUpdate: (docs: UserDocument[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<UserDocument>(
    'documents',
    uid,
    (items) => {
      const active = items
        .filter((d) => !d.deleted && !d.isTrashed)
        .map((data) => ({
          ...data,
          starred: data.starred ?? data.isStarred ?? false,
          isStarred: data.isStarred ?? data.starred ?? false,
          deleted: false,
          isTrashed: false,
        }))
        .slice(0, 5);
      onUpdate(active);
    },
    { orderByField: 'updatedAt', orderDirection: 'desc' }
  );
}

/**
 * Fetch a single document by ID
 */
export async function getUserDocument(
  uid: string,
  docId: string
): Promise<UserDocument | null> {
  const data = localDb.getItem<UserDocument>('documents', uid, docId);
  if (!data) return null;
  return {
    ...data,
    starred: data.starred ?? data.isStarred ?? false,
    isStarred: data.isStarred ?? data.starred ?? false,
    deleted: data.deleted ?? data.isTrashed ?? false,
    isTrashed: data.isTrashed ?? data.deleted ?? false,
  };
}

/**
 * Save or update a document in Local Database
 */
export async function saveUserDocument(
  uid: string,
  document: UserDocument
): Promise<void> {
  const now = new Date().toISOString();
  const stats = calculateDocumentStats(document.content || '');

  const dataToSave: UserDocument = {
    ...document,
    userId: uid,
    wordCount: stats.words,
    charCount: stats.charactersWithSpaces,
    charWithoutSpacesCount: stats.charactersWithoutSpaces,
    paragraphCount: stats.paragraphs,
    readingTimeMinutes: stats.readingTimeMinutes,
    updatedAt: now,
    createdAt: document.createdAt || now,
    starred: document.starred ?? document.isStarred ?? false,
    isStarred: document.isStarred ?? document.starred ?? false,
    deleted: document.deleted ?? document.isTrashed ?? false,
    isTrashed: document.isTrashed ?? document.deleted ?? false,
    deletedAt: document.deletedAt || null,
    folderId: document.folderId || null,
  };

  localDb.saveItem('documents', uid, dataToSave);
}

/**
 * Move document to Trash (soft delete)
 */
export async function trashUserDocument(
  uid: string,
  docId: string
): Promise<void> {
  const doc = localDb.getItem<UserDocument>('documents', uid, docId);
  if (doc) {
    const now = new Date().toISOString();
    localDb.saveItem('documents', uid, {
      ...doc,
      deleted: true,
      isTrashed: true,
      deletedAt: now,
      updatedAt: now,
    });
  }
}

/**
 * Restore document from Trash
 */
export async function restoreUserDocument(
  uid: string,
  docId: string,
  validFolderIds?: Set<string>
): Promise<void> {
  const doc = localDb.getItem<UserDocument>('documents', uid, docId);
  if (!doc) return;

  let targetFolderId = doc.folderId || null;
  if (targetFolderId && validFolderIds && !validFolderIds.has(targetFolderId)) {
    targetFolderId = null;
  }

  const now = new Date().toISOString();
  localDb.saveItem('documents', uid, {
    ...doc,
    deleted: false,
    isTrashed: false,
    deletedAt: null,
    folderId: targetFolderId,
    updatedAt: now,
  });
}

/**
 * Permanently delete a document
 */
export async function deleteUserDocument(
  uid: string,
  docId: string
): Promise<void> {
  localDb.deleteItem('documents', uid, docId);
}

/**
 * Toggle Star / Favorite on a document
 */
export async function toggleStarUserDocument(
  uid: string,
  docId: string,
  starred: boolean
): Promise<void> {
  const doc = localDb.getItem<UserDocument>('documents', uid, docId);
  if (doc) {
    localDb.saveItem('documents', uid, {
      ...doc,
      starred,
      isStarred: starred,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Move document to another folder or Root
 */
export async function moveUserDocument(
  uid: string,
  docId: string,
  folderId: string | null
): Promise<void> {
  const doc = localDb.getItem<UserDocument>('documents', uid, docId);
  if (doc) {
    localDb.saveItem('documents', uid, {
      ...doc,
      folderId: folderId || null,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Rename a document
 */
export async function renameUserDocument(
  uid: string,
  docId: string,
  newTitle: string
): Promise<void> {
  const doc = localDb.getItem<UserDocument>('documents', uid, docId);
  if (doc) {
    localDb.saveItem('documents', uid, {
      ...doc,
      title: newTitle.trim(),
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Duplicate a document with a new ID
 */
export async function duplicateUserDocument(
  uid: string,
  sourceDoc: UserDocument
): Promise<UserDocument> {
  const newId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();
  const newTitle = `${sourceDoc.title} (Copy)`;

  const newDoc: UserDocument = {
    ...sourceDoc,
    id: newId,
    userId: uid,
    title: newTitle,
    createdAt: now,
    updatedAt: now,
    deleted: false,
    isTrashed: false,
    deletedAt: null,
  };

  await saveUserDocument(uid, newDoc);
  return newDoc;
}

/**
 * Empty all trashed documents
 */
export async function emptyTrashDocuments(
  uid: string,
  trashedDocs: UserDocument[]
): Promise<number> {
  if (trashedDocs.length === 0) return 0;
  localDb.batchDeleteItems(
    'documents',
    uid,
    trashedDocs.map((d) => d.id)
  );
  return trashedDocs.length;
}

/**
 * Export a document directly to My Files (saving locally & creating UserFile)
 */
export async function exportDocumentToMyFiles(
  uid: string,
  document: UserDocument,
  format: 'pdf' | 'docx' | 'txt' | 'html' | 'md',
  folderId: string | null = null,
  options?: {
    customFilename?: string;
    onProgress?: (percent: number) => void;
  }
) {
  let blob: Blob;
  let ext: string;

  const title = (options?.customFilename || document.title || 'Untitled Document').trim();

  switch (format) {
    case 'pdf':
      blob = await generatePdfBlob(document);
      ext = 'pdf';
      break;
    case 'docx':
      blob = await generateDocxBlob(title, document.content || '');
      ext = 'docx';
      break;
    case 'html':
      blob = generateHtmlBlob(title, document.content || '', {
        fontFamily: document.fontFamily,
        fontSize: document.fontSize,
        pageSize: document.pageSize,
      });
      ext = 'html';
      break;
    case 'md':
      blob = generateMarkdownBlob(document.content || '');
      ext = 'md';
      break;
    case 'txt':
    default:
      blob = generateTxtBlob(document.content || '');
      ext = 'txt';
      break;
  }

  const safeBaseName = title.replace(/\.[^/.]+$/, '').trim() || 'Document';
  const finalFilename = `${safeBaseName}.${ext}`;

  const { promise } = uploadUserFile(uid, blob, finalFilename, {
    folderId: folderId || null,
    onProgress: (percent) => {
      options?.onProgress?.(percent);
    },
  });

  const createdFile = await promise;

  const currentDoc = localDb.getItem<UserDocument>('documents', uid, document.id);
  if (currentDoc) {
    localDb.saveItem('documents', uid, {
      ...currentDoc,
      exportedFileId: createdFile.id,
      updatedAt: new Date().toISOString(),
    });
  }

  return createdFile;
}

/**
 * Import a file (.docx, .txt, .md, .html) into a new StudentHub UserDocument
 */
export async function importDocumentFromFile(
  uid: string,
  file: File,
  folderId?: string | null
): Promise<UserDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let title = file.name.replace(/\.[^/.]+$/, '') || 'Imported Document';
  let content = '<p></p>';

  if (ext === 'docx') {
    const res = await importDocxFile(file);
    title = res.title;
    content = res.content;
  } else if (ext === 'md' || ext === 'markdown') {
    const res = await importMarkdownFile(file);
    title = res.title;
    content = res.content;
  } else if (ext === 'html' || ext === 'htm') {
    const res = await importHtmlFile(file);
    title = res.title;
    content = res.content;
  } else {
    const res = await importTxtFile(file);
    title = res.title;
    content = res.content;
  }

  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();
  const stats = calculateDocumentStats(content);

  const newDoc: UserDocument = {
    id: docId,
    userId: uid,
    title,
    content,
    category: 'Other',
    docType: 'Imported',
    pageSize: 'A4',
    orientation: 'portrait',
    margins: 'normal',
    wordCount: stats.words,
    charCount: stats.charactersWithSpaces,
    charWithoutSpacesCount: stats.charactersWithoutSpaces,
    paragraphCount: stats.paragraphs,
    readingTimeMinutes: stats.readingTimeMinutes,
    folderId: folderId || null,
    starred: false,
    isStarred: false,
    deleted: false,
    isTrashed: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await saveUserDocument(uid, newDoc);
  return newDoc;
}

export const permanentDeleteUserDocument = deleteUserDocument;
export const moveUserDocumentToFolder = moveUserDocument;

/**
 * Permanently empty all documents currently in Trash
 */
export async function emptyUserDocumentTrash(uid: string): Promise<void> {
  const docs = localDb.getItems<UserDocument>('documents', uid);
  const trashedIds = docs.filter((d) => d.deleted || d.isTrashed).map((d) => d.id);
  localDb.batchDeleteItems('documents', uid, trashedIds);
}
