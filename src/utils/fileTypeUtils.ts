/**
 * Utility functions for file types, extensions, formatting, and security
 */

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB configurable limit
export const MAX_FILE_SIZE_DISPLAY = '100 MB';
export const MAX_TEXT_PREVIEW_BYTES = 5 * 1024 * 1024; // 5 MB text preview safety limit

export type FileCategory =
  | 'documents'
  | 'pdf'
  | 'images'
  | 'spreadsheets'
  | 'presentations'
  | 'text'
  | 'archives'
  | 'code'
  | 'other';

/**
 * Format bytes into human-readable string without faking precision.
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0 || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let unitIndex = -1;
  let val = bytes;
  do {
    val /= 1024;
    unitIndex++;
  } while (val >= 1024 && unitIndex < units.length - 1);

  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${units[unitIndex]}`;
}

/**
 * Get file extension (lowercase without dot) from filename
 */
export function getFileExtension(filename: string): string {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) return '';
  return filename.substring(lastDot + 1).toLowerCase();
}

/**
 * Categorize file based on MIME type and extension
 */
export function getFileCategory(mimeType?: string, filename: string = ''): FileCategory {
  const ext = getFileExtension(filename);
  const mime = (mimeType || '').toLowerCase();

  if (ext === 'pdf' || mime === 'application/pdf') {
    return 'pdf';
  }

  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico', 'tiff'].includes(ext)
  ) {
    return 'images';
  }

  if (
    ['doc', 'docx', 'rtf', 'odt', 'pages'].includes(ext) ||
    mime.includes('wordprocessingml') ||
    mime.includes('msword')
  ) {
    return 'documents';
  }

  if (
    ['xls', 'xlsx', 'csv', 'tsv', 'ods', 'numbers'].includes(ext) ||
    mime.includes('spreadsheetml') ||
    mime.includes('ms-excel')
  ) {
    return 'spreadsheets';
  }

  if (
    ['ppt', 'pptx', 'odp', 'keynote'].includes(ext) ||
    mime.includes('presentationml') ||
    mime.includes('ms-powerpoint')
  ) {
    return 'presentations';
  }

  if (
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) ||
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime.includes('archive')
  ) {
    return 'archives';
  }

  if (
    ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'php', 'sql', 'sh', 'yaml', 'yml', 'xml'].includes(ext)
  ) {
    return 'code';
  }

  if (
    ['txt', 'md', 'markdown', 'log', 'ini', 'tex'].includes(ext) ||
    mime.startsWith('text/')
  ) {
    return 'text';
  }

  return 'other';
}

/**
 * Determine if file is previewable in-browser
 */
export function isPreviewable(mimeType?: string, filename: string = '', sizeBytes: number = 0): {
  type: 'image' | 'pdf' | 'text' | 'unsupported';
  reason?: string;
} {
  const cat = getFileCategory(mimeType, filename);
  const ext = getFileExtension(filename);

  if (cat === 'images') {
    return { type: 'image' };
  }

  if (cat === 'pdf') {
    return { type: 'pdf' };
  }

  if (cat === 'text' || cat === 'code' || ext === 'csv' || ext === 'tsv' || ext === 'json' || ext === 'txt' || ext === 'md') {
    if (sizeBytes > MAX_TEXT_PREVIEW_BYTES) {
      return {
        type: 'unsupported',
        reason: 'File exceeds 5 MB text preview limit. Please download to view.',
      };
    }
    return { type: 'text' };
  }

  return {
    type: 'unsupported',
    reason: 'Preview is not available for this file type. Click Download to open on your device.',
  };
}

/**
 * Sanitize user-provided filename to prevent path traversal and illegal characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'untitled_file';
  // Strip null bytes, path traversal sequences ../ and ..\ and slashes
  let clean = filename
    .replace(/\0/g, '')
    .replace(/\.\.+[/\\]/g, '')
    .replace(/[/\\]/g, '_')
    .replace(/[\x00-\x1f\x80-\x9f]/g, '')
    .trim();

  // If filename becomes empty or begins with dot only
  if (!clean || clean === '.') {
    clean = 'untitled_file';
  }

  // Cap length
  if (clean.length > 150) {
    const ext = getFileExtension(clean);
    const base = ext ? clean.substring(0, clean.length - ext.length - 1) : clean;
    clean = `${base.substring(0, 140)}.${ext}`;
  }

  return clean;
}

/**
 * Generate a next-available duplicate filename if one exists in the same folder
 * e.g., "essay.docx" -> "essay (1).docx"
 */
export function resolveDuplicateName(existingNames: string[], desiredName: string): string {
  const lowerNames = new Set(existingNames.map((n) => n.trim().toLowerCase()));
  if (!lowerNames.has(desiredName.trim().toLowerCase())) {
    return desiredName;
  }

  const lastDot = desiredName.lastIndexOf('.');
  const ext = lastDot > 0 ? desiredName.substring(lastDot) : '';
  const baseName = lastDot > 0 ? desiredName.substring(0, lastDot) : desiredName;

  let counter = 1;
  while (counter < 1000) {
    const candidate = `${baseName} (${counter})${ext}`;
    if (!lowerNames.has(candidate.toLowerCase())) {
      return candidate;
    }
    counter++;
  }

  return `${baseName}_${Date.now()}${ext}`;
}

/**
 * Safe ID generator
 */
export function generateSafeId(prefix: 'file' | 'folder' | 'upload' = 'file'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
