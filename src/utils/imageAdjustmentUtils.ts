/**
 * Real client-side image adjustments engine.
 * Applies brightness, contrast, saturation, grayscale, blur, invert, sepia, and sharpening
 * via Canvas 2D filters and pixel convolution kernels.
 */

export interface ImageAdjustmentSettings {
  brightness: number; // 0 to 200 (100 is neutral)
  contrast: number; // 0 to 200 (100 is neutral)
  saturate: number; // 0 to 200 (100 is neutral)
  grayscale: number; // 0 to 100 (0 is neutral)
  blur: number; // 0 to 20 px (0 is neutral)
  invert: number; // 0 to 100 (0 is neutral)
  sepia: number; // 0 to 100 (0 is neutral)
  sharpen: number; // 0 to 5 (0 is neutral)
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustmentSettings = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  blur: 0,
  invert: 0,
  sepia: 0,
  sharpen: 0,
};

/**
 * Apply 3x3 sharpen convolution filter to ImageData
 */
function applySharpenFilter(data: Uint8ClampedArray, width: number, height: number, strength: number) {
  if (strength <= 0) return;
  const copy = new Uint8ClampedArray(data);

  // Sharpen kernel weights scaled by strength
  // [  0, -w,  0 ]
  // [ -w, 1+4w, -w ]
  // [  0, -w,  0 ]
  const w = strength * 0.4;
  const center = 1 + 4 * w;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const top = copy[((y - 1) * width + x) * 4 + c];
        const bottom = copy[((y + 1) * width + x) * 4 + c];
        const left = copy[(y * width + (x - 1)) * 4 + c];
        const right = copy[(y * width + (x + 1)) * 4 + c];
        const current = copy[idx + c];

        const val = current * center - (top + bottom + left + right) * w;
        data[idx + c] = Math.min(255, Math.max(0, Math.round(val)));
      }
    }
  }
}

/**
 * Render adjusted image to Canvas and export as Blob
 */
export async function applyImageAdjustments(
  img: HTMLImageElement,
  adj: ImageAdjustmentSettings,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      reject(new Error('Canvas context unavailable.'));
      return;
    }

    // Build standard CSS filter string
    const filterString = [
      `brightness(${adj.brightness}%)`,
      `contrast(${adj.contrast}%)`,
      `saturate(${adj.saturate}%)`,
      `grayscale(${adj.grayscale}%)`,
      `invert(${adj.invert}%)`,
      `sepia(${adj.sepia}%)`,
      adj.blur > 0 ? `blur(${adj.blur}px)` : '',
    ]
      .filter(Boolean)
      .join(' ');

    ctx.filter = filterString;
    ctx.drawImage(img, 0, 0);

    // If sharpen is enabled, apply pixel convolution pass
    if (adj.sharpen > 0) {
      ctx.filter = 'none';
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      applySharpenFilter(imgData.data, canvas.width, canvas.height, adj.sharpen);
      ctx.putImageData(imgData, 0, 0);
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Image adjustments failed.'));
        else resolve(blob);
      },
      format,
      0.92
    );
  });
}
