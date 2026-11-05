/**
 * Client-side Background Removal and Color Replacement Utility.
 * 100% private, browser-based image processing using Canvas and ImageData.
 */

export interface BackgroundRemovalOptions {
  sensitivity: number; // 5 to 90 (color distance tolerance)
  edgeSmoothing: number; // 0 to 8 (feather radius in px)
  samplePoints?: Array<{ x: number; y: number }>; // optional manual sample points
  replacementBg: 'transparent' | 'white' | 'black' | 'custom';
  customColorHex?: string;
  contiguousOnly?: boolean; // if true, only remove background connected to edges (flood fill)
}

/**
 * Calculate Euclidean color distance between two RGB colors (0 to 441)
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  // Weighted Euclidean for human perceptual sensitivity
  return Math.sqrt(dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114) * 2;
}

/**
 * Parse hex color into RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 255, g: 255, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Remove background from an image on canvas and optionally replace background
 */
export async function removeBackground(
  img: HTMLImageElement,
  options: BackgroundRemovalOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Browser Canvas 2D context unavailable.'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // 1. Gather background color samples
      const bgSamples: Array<{ r: number; g: number; b: number }> = [];

      if (options.samplePoints && options.samplePoints.length > 0) {
        // Use user-provided sample points
        for (const pt of options.samplePoints) {
          const px = Math.min(width - 1, Math.max(0, Math.round(pt.x)));
          const py = Math.min(height - 1, Math.max(0, Math.round(pt.y)));
          const idx = (py * width + px) * 4;
          bgSamples.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
          });
        }
      } else {
        // Auto-sample border pixels: 4 corners + edge midpoints
        const borderCoords = [
          [2, 2], // top-left
          [width - 3, 2], // top-right
          [2, height - 3], // bottom-left
          [width - 3, height - 3], // bottom-right
          [Math.round(width / 2), 2], // top-center
          [Math.round(width / 2), height - 3], // bottom-center
          [2, Math.round(height / 2)], // left-center
          [width - 3, Math.round(height / 2)], // right-center
        ];

        for (const [x, y] of borderCoords) {
          const idx = (y * width + x) * 4;
          bgSamples.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
          });
        }
      }

      const threshold = options.sensitivity * 2.2; // map 1..100 to ~2.2..220
      const mask = new Uint8Array(width * height); // 1 = background, 0 = foreground

      // 2. Classify background pixels
      // If contiguousOnly is true, we flood fill from the borders; otherwise per-pixel threshold
      if (options.contiguousOnly !== false) {
        // Flood fill from all border pixels
        const queue: number[] = [];
        const visited = new Uint8Array(width * height);

        // Seed with all perimeter pixels that match any sample
        for (let x = 0; x < width; x++) {
          queue.push(0 * width + x); // top edge
          queue.push((height - 1) * width + x); // bottom edge
        }
        for (let y = 1; y < height - 1; y++) {
          queue.push(y * width + 0); // left edge
          queue.push(y * width + (width - 1)); // right edge
        }

        while (queue.length > 0) {
          const idx = queue.pop()!;
          if (visited[idx]) continue;
          visited[idx] = 1;

          const pxIdx = idx * 4;
          const r = data[pxIdx];
          const g = data[pxIdx + 1];
          const b = data[pxIdx + 2];

          // Check if matches any background sample
          let isBg = false;
          for (const s of bgSamples) {
            if (colorDistance(r, g, b, s.r, s.g, s.b) <= threshold) {
              isBg = true;
              break;
            }
          }

          if (isBg) {
            mask[idx] = 1; // Mark as background
            const x = idx % width;
            const y = Math.floor(idx / width);

            // Add 4-way neighbors
            if (x > 0 && !visited[idx - 1]) queue.push(idx - 1);
            if (x < width - 1 && !visited[idx + 1]) queue.push(idx + 1);
            if (y > 0 && !visited[idx - width]) queue.push(idx - width);
            if (y < height - 1 && !visited[idx + width]) queue.push(idx + width);
          }
        }
      } else {
        // Global color distance match
        for (let i = 0; i < width * height; i++) {
          const pxIdx = i * 4;
          const r = data[pxIdx];
          const g = data[pxIdx + 1];
          const b = data[pxIdx + 2];

          for (const s of bgSamples) {
            if (colorDistance(r, g, b, s.r, s.g, s.b) <= threshold) {
              mask[i] = 1;
              break;
            }
          }
        }
      }

      // 3. Apply edge feathering if requested
      const feather = Math.max(0, Math.min(8, Math.round(options.edgeSmoothing)));

      // Prepare replacement color
      let replaceR = 0;
      let replaceG = 0;
      let replaceB = 0;
      let replaceAlpha = 0;

      if (options.replacementBg === 'white') {
        replaceR = 255;
        replaceG = 255;
        replaceB = 255;
        replaceAlpha = 255;
      } else if (options.replacementBg === 'black') {
        replaceR = 0;
        replaceG = 0;
        replaceB = 0;
        replaceAlpha = 255;
      } else if (options.replacementBg === 'custom') {
        const rgb = hexToRgb(options.customColorHex || '#ffffff');
        replaceR = rgb.r;
        replaceG = rgb.g;
        replaceB = rgb.b;
        replaceAlpha = 255;
      } // else 'transparent', replaceAlpha = 0

      // 4. Update image data
      for (let i = 0; i < width * height; i++) {
        const pxIdx = i * 4;

        if (mask[i] === 1) {
          if (options.replacementBg === 'transparent') {
            data[pxIdx + 3] = 0; // Transparent
          } else {
            data[pxIdx] = replaceR;
            data[pxIdx + 1] = replaceG;
            data[pxIdx + 2] = replaceB;
            data[pxIdx + 3] = replaceAlpha;
          }
        } else if (feather > 0) {
          // Check if near an edge for alpha feathering
          const x = i % width;
          const y = Math.floor(i / width);
          let bgNeighborCount = 0;
          let totalChecked = 0;

          for (let dy = -feather; dy <= feather; dy++) {
            for (let dx = -feather; dx <= feather; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                totalChecked++;
                if (mask[ny * width + nx] === 1) {
                  bgNeighborCount++;
                }
              }
            }
          }

          if (bgNeighborCount > 0 && options.replacementBg === 'transparent') {
            const alphaFactor = 1 - bgNeighborCount / totalChecked;
            data[pxIdx + 3] = Math.round(data[pxIdx + 3] * alphaFactor);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Return as high-quality PNG Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Background removal produced an empty image.'));
          } else {
            resolve(blob);
          }
        },
        'image/png'
      );
    } catch (err) {
      reject(err);
    }
  });
}
