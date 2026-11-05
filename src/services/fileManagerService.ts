import JSZip from 'jszip';
import { localDb } from '../lib/localDb.ts';
import { UserFile, CloudFolder } from '../types/index.ts';
import {
  sanitizeFilename,
  generateSafeId,
  getFileExtension,
  resolveDuplicateName,
  MAX_FILE_SIZE_BYTES,
} from '../utils/fileTypeUtils.ts';

export type Unsubscribe = () => void;

/**
 * Subscribe to all user files in real-time
 */
export function subscribeUserFiles(
  uid: string,
  onUpdate: (files: UserFile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<UserFile>('files', uid, onUpdate, {
    orderByField: 'createdAt',
    orderDirection: 'desc',
  });
}

/**
 * Subscribe to all user folders in real-time
 */
export function subscribeUserFolders(
  uid: string,
  onUpdate: (folders: CloudFolder[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<CloudFolder>('folders', uid, onUpdate, {
    orderByField: 'name',
    orderDirection: 'asc',
  });
}

export interface UploadOptions {
  folderId?: string | null;
  onProgress?: (progress: number, bytesTransferred: number, totalBytes: number) => void;
  onStatusChange?: (status: 'uploading' | 'saving' | 'completed' | 'failed') => void;
  customFilename?: string;
}

export interface UploadResult {
  fileRecord: UserFile;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Upload a file to local database & IndexedDB binary blob store
 */
export function uploadUserFile(
  uid: string,
  file: File | Blob,
  rawFilename: string,
  options: UploadOptions = {}
): {
  promise: Promise<UserFile>;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
} {
  const size = file.size;
  if (size > MAX_FILE_SIZE_BYTES) {
    throw new Error('This file is too large to upload. Maximum allowed size is 100 MB.');
  }

  const cleanFilename = sanitizeFilename(options.customFilename || rawFilename);
  const fileId = generateSafeId('file');
  const ext = getFileExtension(cleanFilename);
  const mimeType = file.type || 'application/octet-stream';
  const nowIso = new Date().toISOString();

  let isCancelled = false;
  const cancel = () => { isCancelled = true; };
  const pause = () => {};
  const resume = () => {};

  const promise = new Promise<UserFile>(async (resolve, reject) => {
    try {
      options.onStatusChange?.('uploading');
      options.onProgress?.(30, Math.floor(size * 0.3), size);

      if (isCancelled) {
        options.onStatusChange?.('failed');
        return reject(new Error('Upload cancelled'));
      }

      // Save blob into IndexedDB
      await localDb.saveBlob(fileId, file);

      options.onProgress?.(80, Math.floor(size * 0.8), size);
      options.onStatusChange?.('saving');

      const fileRecord: UserFile = {
        id: fileId,
        name: cleanFilename,
        originalName: rawFilename,
        storagePath: `local://files/${fileId}/${cleanFilename}`,
        downloadUrl: undefined,
        size,
        mimeType,
        extension: ext,
        folderId: options.folderId || null,
        createdAt: nowIso,
        updatedAt: nowIso,
        uploadedAt: nowIso,
        deleted: false,
        deletedAt: null,
        starred: false,
      };

      localDb.saveItem('files', uid, fileRecord);

      options.onProgress?.(100, size, size);
      options.onStatusChange?.('completed');
      resolve(fileRecord);
    } catch (err: any) {
      options.onStatusChange?.('failed');
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });

  return { promise, cancel, pause, resume };
}

/**
 * Retrieve blob for a UserFile from local database
 */
export async function getFileBlob(file: UserFile): Promise<Blob> {
  const blob = await localDb.getBlob(file.id);
  if (blob) return blob;

  if (file.downloadUrl) {
    const res = await fetch(file.downloadUrl);
    return await res.blob();
  }

  throw new Error(`File binary data not found for ${file.name}`);
}

/**
 * Create a new folder
 */
export async function createFolder(
  uid: string,
  name: string,
  parentFolderId?: string | null
): Promise<CloudFolder> {
  const folderId = generateSafeId('folder');
  const nowIso = new Date().toISOString();
  const cleanName = sanitizeFilename(name).replace(/\.[^/.]+$/, '') || 'New Folder';

  const folder: CloudFolder = {
    id: folderId,
    name: cleanName,
    parentFolderId: parentFolderId || null,
    createdAt: nowIso,
    updatedAt: nowIso,
    deleted: false,
    deletedAt: null,
    starred: false,
  };

  localDb.saveItem('folders', uid, folder);
  return folder;
}

/**
 * Rename a folder
 */
export async function renameFolder(uid: string, folderId: string, newName: string): Promise<void> {
  const folder = localDb.getItem<CloudFolder>('folders', uid, folderId);
  if (folder) {
    const cleanName = sanitizeFilename(newName).replace(/\.[^/.]+$/, '') || 'Folder';
    localDb.saveItem('folders', uid, {
      ...folder,
      name: cleanName,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Rename a file
 */
export async function renameFile(uid: string, file: UserFile, newName: string): Promise<void> {
  let cleanName = sanitizeFilename(newName);
  if (file.extension && !cleanName.toLowerCase().endsWith(`.${file.extension.toLowerCase()}`)) {
    cleanName = `${cleanName}.${file.extension}`;
  }

  const existing = localDb.getItem<UserFile>('files', uid, file.id);
  if (existing) {
    localDb.saveItem('files', uid, {
      ...existing,
      name: cleanName,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Move a file to another folder
 */
export async function moveFile(
  uid: string,
  fileId: string,
  targetFolderId: string | null
): Promise<void> {
  const existing = localDb.getItem<UserFile>('files', uid, fileId);
  if (existing) {
    localDb.saveItem('files', uid, {
      ...existing,
      folderId: targetFolderId || null,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Move a folder to another parent folder
 */
export async function moveFolder(
  uid: string,
  folderId: string,
  targetParentFolderId: string | null
): Promise<void> {
  if (folderId === targetParentFolderId) {
    throw new Error('A folder cannot be moved into itself.');
  }

  const existing = localDb.getItem<CloudFolder>('folders', uid, folderId);
  if (existing) {
    localDb.saveItem('folders', uid, {
      ...existing,
      parentFolderId: targetParentFolderId || null,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Toggle starred status of a file
 */
export async function toggleStarFile(
  uid: string,
  fileId: string,
  currentStarred: boolean = false
): Promise<void> {
  const existing = localDb.getItem<UserFile>('files', uid, fileId);
  if (existing) {
    localDb.saveItem('files', uid, {
      ...existing,
      starred: !currentStarred,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Toggle starred status of a folder
 */
export async function toggleStarFolder(
  uid: string,
  folderId: string,
  currentStarred: boolean = false
): Promise<void> {
  const existing = localDb.getItem<CloudFolder>('folders', uid, folderId);
  if (existing) {
    localDb.saveItem('folders', uid, {
      ...existing,
      starred: !currentStarred,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Soft delete file to Trash
 */
export async function softDeleteFile(uid: string, file: UserFile): Promise<void> {
  const existing = localDb.getItem<UserFile>('files', uid, file.id);
  if (existing) {
    localDb.saveItem('files', uid, {
      ...existing,
      deleted: true,
      deletedAt: new Date().toISOString(),
      previousFolderId: file.folderId || null,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Restore file from Trash
 */
export async function restoreFile(
  uid: string,
  file: UserFile,
  existingFolderIds: Set<string>
): Promise<{ restoredToRoot: boolean }> {
  const existing = localDb.getItem<UserFile>('files', uid, file.id);
  if (!existing) return { restoredToRoot: false };

  const targetFolderValid = file.previousFolderId && existingFolderIds.has(file.previousFolderId);
  const targetFolderId = targetFolderValid ? file.previousFolderId : null;

  localDb.saveItem('files', uid, {
    ...existing,
    deleted: false,
    deletedAt: null,
    folderId: targetFolderId,
    updatedAt: new Date().toISOString(),
  });

  return { restoredToRoot: !targetFolderValid && !!file.previousFolderId };
}

/**
 * Soft delete folder to Trash
 */
export async function softDeleteFolder(
  uid: string,
  folderId: string,
  containedFiles: UserFile[] = []
): Promise<void> {
  const nowIso = new Date().toISOString();
  const folder = localDb.getItem<CloudFolder>('folders', uid, folderId);
  if (folder) {
    localDb.saveItem('folders', uid, {
      ...folder,
      deleted: true,
      deletedAt: nowIso,
      updatedAt: nowIso,
    });
  }

  containedFiles.forEach((file) => {
    const f = localDb.getItem<UserFile>('files', uid, file.id);
    if (f) {
      localDb.saveItem('files', uid, {
        ...f,
        deleted: true,
        deletedAt: nowIso,
        previousFolderId: folderId,
        updatedAt: nowIso,
      });
    }
  });
}

/**
 * Restore folder from Trash
 */
export async function restoreFolder(
  uid: string,
  folder: CloudFolder,
  existingFolderIds: Set<string>,
  containedFiles: UserFile[] = []
): Promise<{ restoredToRoot: boolean }> {
  const existing = localDb.getItem<CloudFolder>('folders', uid, folder.id);
  if (!existing) return { restoredToRoot: false };

  const targetParentValid = folder.parentFolderId && existingFolderIds.has(folder.parentFolderId);
  const targetParentId = targetParentValid ? folder.parentFolderId : null;
  const nowIso = new Date().toISOString();

  localDb.saveItem('folders', uid, {
    ...existing,
    deleted: false,
    deletedAt: null,
    parentFolderId: targetParentId,
    updatedAt: nowIso,
  });

  containedFiles.forEach((file) => {
    const f = localDb.getItem<UserFile>('files', uid, file.id);
    if (f) {
      localDb.saveItem('files', uid, {
        ...f,
        deleted: false,
        deletedAt: null,
        folderId: folder.id,
        updatedAt: nowIso,
      });
    }
  });

  return { restoredToRoot: !targetParentValid && !!folder.parentFolderId };
}

/**
 * Permanently delete a file
 */
export async function permanentDeleteFile(uid: string, file: UserFile): Promise<void> {
  await localDb.deleteBlob(file.id);
  localDb.deleteItem('files', uid, file.id);
}

/**
 * Permanently delete a folder and all its files
 */
export async function permanentDeleteFolder(
  uid: string,
  folderId: string,
  allFiles: UserFile[],
  allFolders: CloudFolder[]
): Promise<void> {
  const folderIdsToDelete = new Set<string>([folderId]);
  let added = true;
  while (added) {
    added = false;
    allFolders.forEach((f) => {
      if (f.parentFolderId && folderIdsToDelete.has(f.parentFolderId) && !folderIdsToDelete.has(f.id)) {
        folderIdsToDelete.add(f.id);
        added = true;
      }
    });
  }

  const filesToDelete = allFiles.filter((f) => f.folderId && folderIdsToDelete.has(f.folderId));

  for (const file of filesToDelete) {
    await permanentDeleteFile(uid, file);
  }

  for (const fId of folderIdsToDelete) {
    localDb.deleteItem('folders', uid, fId);
  }
}

/**
 * Duplicate a file
 */
export async function duplicateUserFile(
  uid: string,
  file: UserFile,
  existingFilenames: string[]
): Promise<UserFile> {
  const blob = await getFileBlob(file);

  const lastDot = file.name.lastIndexOf('.');
  const ext = lastDot > 0 ? file.name.substring(lastDot) : '';
  const baseName = lastDot > 0 ? file.name.substring(0, lastDot) : file.name;
  const desiredCopyName = `${baseName} (Copy)${ext}`;
  const finalFilename = resolveDuplicateName(existingFilenames, desiredCopyName);

  const newFileId = generateSafeId('file');
  await localDb.saveBlob(newFileId, blob);

  const nowIso = new Date().toISOString();
  const newFileRecord: UserFile = {
    id: newFileId,
    name: finalFilename,
    originalName: finalFilename,
    storagePath: `local://files/${newFileId}/${finalFilename}`,
    downloadUrl: undefined,
    size: blob.size,
    mimeType: file.mimeType,
    extension: file.extension,
    folderId: file.folderId || null,
    createdAt: nowIso,
    updatedAt: nowIso,
    uploadedAt: nowIso,
    deleted: false,
    deletedAt: null,
    starred: false,
  };

  localDb.saveItem('files', uid, newFileRecord);
  return newFileRecord;
}

/**
 * Batch soft-delete files and folders
 */
export async function batchSoftDelete(
  uid: string,
  files: UserFile[],
  folders: CloudFolder[]
): Promise<void> {
  const nowIso = new Date().toISOString();

  files.forEach((f) => {
    const existing = localDb.getItem<UserFile>('files', uid, f.id);
    if (existing) {
      localDb.saveItem('files', uid, {
        ...existing,
        deleted: true,
        deletedAt: nowIso,
        previousFolderId: f.folderId || null,
        updatedAt: nowIso,
      });
    }
  });

  folders.forEach((fold) => {
    const existing = localDb.getItem<CloudFolder>('folders', uid, fold.id);
    if (existing) {
      localDb.saveItem('folders', uid, {
        ...existing,
        deleted: true,
        deletedAt: nowIso,
        updatedAt: nowIso,
      });
    }
  });
}

/**
 * Batch move files and folders to a target folder
 */
export async function batchMove(
  uid: string,
  fileIds: string[],
  folderIds: string[],
  targetFolderId: string | null
): Promise<void> {
  const nowIso = new Date().toISOString();

  fileIds.forEach((id) => {
    const existing = localDb.getItem<UserFile>('files', uid, id);
    if (existing) {
      localDb.saveItem('files', uid, {
        ...existing,
        folderId: targetFolderId || null,
        updatedAt: nowIso,
      });
    }
  });

  folderIds.forEach((id) => {
    if (id !== targetFolderId) {
      const existing = localDb.getItem<CloudFolder>('folders', uid, id);
      if (existing) {
        localDb.saveItem('folders', uid, {
          ...existing,
          parentFolderId: targetFolderId || null,
          updatedAt: nowIso,
        });
      }
    }
  });
}

/**
 * Download a single file securely via browser
 */
export async function downloadFile(file: UserFile): Promise<void> {
  let blobUrl: string | null = null;
  try {
    const blob = await getFileBlob(file);
    blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    if (blobUrl) {
      setTimeout(() => URL.revokeObjectURL(blobUrl!), 10000);
    }
  }
}

/**
 * Download multiple files as a single ZIP archive
 */
export async function batchDownloadAsZip(
  files: UserFile[],
  onProgress?: (current: number, total: number, filename: string) => void
): Promise<void> {
  if (files.length === 0) return;

  const zip = new JSZip();
  const usedFilenames: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length, file.name);

    try {
      const blob = await getFileBlob(file);
      const arrayBuffer = await blob.arrayBuffer();
      const safeZipName = resolveDuplicateName(usedFilenames, file.name);
      usedFilenames.push(safeZipName);
      zip.file(safeZipName, arrayBuffer);
    } catch (err) {
      console.warn(`Could not add ${file.name} to ZIP:`, err);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const blobUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `StudentHub_Files_${new Date().toISOString().substring(0, 10)}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

export const renameUserFile = renameFile;
export const moveUserFile = moveFile;
export async function trashUserFile(uid: string, fileId: string): Promise<void> {
  await softDeleteFile(uid, { id: fileId } as UserFile);
}
