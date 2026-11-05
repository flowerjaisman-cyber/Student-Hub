/**
 * Pure browser-side image processing utilities for StudentHub (Phase 2).
 * 100% client-side privacy using HTML5 Canvas, Blob, and File APIs.
 */

import JSZip from 'jszip';

export interface ImageMetadata {
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  objectUrl: string;
}

export type SupportedFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_SAFE_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Format bytes into human readable format (e.g. 2.4 MB, 850 KB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Validate image file format and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // Type check
  const isAcceptedType = ACCEPTED_IMAGE_TYPES.includes(file.type);
  const lowerName = file.name.toLowerCase();
  const hasAcceptedExt = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  if (!isAcceptedType && !hasAcceptedExt) {
    return {
      valid: false,
      error: 'Please select a valid JPG, PNG, or WebP image.',
    };
  }

  // Size limit check
  if (file.size > MAX_SAFE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds safe browser limit of 50 MB (selected: ${formatBytes(file.size)}). Try a smaller image.`,
    };
  }

  return { valid: true };
}

/**
 * Load an image from File into HTMLImageElement with metadata
 */
export function loadImageFromFile(file: File): Promise<{
  img: HTMLImageElement;
  metadata: ImageMetadata;
}> {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve({
        img,
        metadata: {
          name: file.name,
          type: file.type || 'image/jpeg',
          size: file.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
          objectUrl,
        },
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          'Failed to decode image data. The file may be corrupted or unreadable by your browser.'
        )
      );
    };

    img.src = objectUrl;
  });
}

/**
 * Strip file extension from filename
 */
export function getBaseFilename(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0) return filename;
  return filename.substring(0, lastDot);
}

/**
 * Get extension from MIME type
 */
export function getExtensionFromMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
    default:
      return 'jpg';
  }
}

/**
 * Generate an appropriate descriptive output filename
 */
export function getSuggestedFilename(
  originalName: string,
  suffix: string,
  targetMimeOrExt: string
): string {
  const base = getBaseFilename(originalName) || 'image';
  const ext = targetMimeOrExt.startsWith('image/')
    ? getExtensionFromMime(targetMimeOrExt)
    : targetMimeOrExt.replace('.', '');
  return suffix ? `${base}-${suffix}.${ext}` : `${base}.${ext}`;
}

/**
 * Trigger browser file download from Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Convert an image with optional background color (essential for PNG->JPG transparency)
 */
export function convertImageCanvas(
  img: HTMLImageElement,
  options: {
    targetFormat: SupportedFormat;
    quality?: number; // 0.1 to 1.0
    backgroundColor?: string; // hex or color string
    width?: number;
    height?: number;
  }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const targetWidth = options.width || img.naturalWidth;
    const targetHeight = options.height || img.naturalHeight;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Browser canvas 2D context is unavailable.'));
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // If output is JPEG, it cannot support transparency. Fill background first.
    if (options.targetFormat === 'image/jpeg') {
      ctx.fillStyle = options.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else {
      // Clear for PNG/WebP transparency
      ctx.clearRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // PNG does not use quality parameter in toBlob
    const quality =
      options.targetFormat === 'image/png' ? undefined : options.quality ?? 0.92;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas conversion produced an empty image blob.'));
        } else {
          resolve(blob);
        }
      },
      options.targetFormat,
      quality
    );
  });
}

/**
 * Crop an image to specified pixel coordinates
 */
export function cropImageCanvas(
  img: HTMLImageElement,
  cropArea: { x: number; y: number; width: number; height: number },
  targetFormat: SupportedFormat = 'image/png',
  quality = 0.92,
  backgroundColor = '#ffffff'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(cropArea.width));
    canvas.height = Math.max(1, Math.round(cropArea.height));

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context unavailable.'));
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(
      img,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const q = targetFormat === 'image/png' ? undefined : quality;
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Cropping failed to produce image.'));
        else resolve(blob);
      },
      targetFormat,
      q
    );
  });
}

/**
 * Transform (rotate and/or flip) an image
 */
export function transformImageCanvas(
  img: HTMLImageElement,
  rotationDeg: number, // 0, 90, 180, 270
  flipH: boolean,
  flipV: boolean,
  targetFormat: SupportedFormat = 'image/png',
  quality = 0.92,
  backgroundColor = '#ffffff'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const rad = (rotationDeg * Math.PI) / 180;
    const isQuarterTurn = rotationDeg === 90 || rotationDeg === 270;

    const canvasWidth = isQuarterTurn ? img.naturalHeight : img.naturalWidth;
    const canvasHeight = isQuarterTurn ? img.naturalWidth : img.naturalHeight;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context unavailable.'));
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    ctx.save();
    // Move to center of canvas
    ctx.translate(canvasWidth / 2, canvasHeight / 2);

    // Apply rotation
    ctx.rotate(rad);

    // Apply flip
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Draw image centered
    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );
    ctx.restore();

    const q = targetFormat === 'image/png' ? undefined : quality;
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Transform operation failed.'));
        else resolve(blob);
      },
      targetFormat,
      q
    );
  });
}

/**
 * Compress an image iteratively toward a target file size (in bytes)
 */
export async function compressTowardTargetSize(
  img: HTMLImageElement,
  targetBytes: number,
  format: SupportedFormat = 'image/jpeg',
  backgroundColor = '#ffffff'
): Promise<{
  blob: Blob;
  achievedBytes: number;
  qualityUsed: number;
  scaleUsed: number;
  iterations: number;
}> {
  // If target format is PNG, PNG is lossless so quality param does not reduce size directly.
  // In that case, we notify or adjust scale, but for JPEG and WebP we tune quality + scale.
  let bestBlob: Blob | null = null;
  let bestQuality = 0.8;
  let bestScale = 1.0;
  let iterations = 0;

  // Initial quality search between 0.1 and 0.95
  let minQ = 0.1;
  let maxQ = 0.95;
  let currentQ = 0.75;
  let currentScale = 1.0;

  // Try up to 6 iterations on quality first
  for (let i = 0; i < 6; i++) {
    iterations++;
    const targetW = Math.max(32, Math.round(img.naturalWidth * currentScale));
    const targetH = Math.max(32, Math.round(img.naturalHeight * currentScale));

    const testBlob = await convertImageCanvas(img, {
      targetFormat: format,
      quality: currentQ,
      backgroundColor,
      width: targetW,
      height: targetH,
    });

    bestBlob = testBlob;
    bestQuality = currentQ;
    bestScale = currentScale;

    // Check if within 5% of target
    if (Math.abs(testBlob.size - targetBytes) / targetBytes < 0.05) {
      break;
    }

    if (testBlob.size > targetBytes) {
      maxQ = currentQ;
      currentQ = (minQ + maxQ) / 2;
    } else {
      minQ = currentQ;
      currentQ = (minQ + maxQ) / 2;
    }
  }

  // If even at low quality (minQ) the blob is still significantly larger than target,
  // we scale down dimensions iteratively
  if (bestBlob && bestBlob.size > targetBytes * 1.15) {
    let scale = 0.85;
    while (scale >= 0.25 && iterations < 12) {
      iterations++;
      const targetW = Math.max(32, Math.round(img.naturalWidth * scale));
      const targetH = Math.max(32, Math.round(img.naturalHeight * scale));

      const scaledBlob = await convertImageCanvas(img, {
        targetFormat: format,
        quality: Math.max(0.3, bestQuality),
        backgroundColor,
        width: targetW,
        height: targetH,
      });

      bestBlob = scaledBlob;
      bestScale = scale;

      if (scaledBlob.size <= targetBytes) {
        break;
      }
      scale -= 0.15;
    }
  }

  if (!bestBlob) {
    throw new Error('Could not compress image to target size.');
  }

  return {
    blob: bestBlob,
    achievedBytes: bestBlob.size,
    qualityUsed: Math.round(bestQuality * 100),
    scaleUsed: Math.round(bestScale * 100),
    iterations,
  };
}

/**
 * Package multiple blobs into a single ZIP archive for "Download All"
 */
export async function createZipArchive(
  files: { name: string; blob: Blob }[]
): Promise<Blob> {
  const zip = new JSZip();
  files.forEach((f) => {
    zip.file(f.name, f.blob);
  });
  return await zip.generateAsync({ type: 'blob' });
}
