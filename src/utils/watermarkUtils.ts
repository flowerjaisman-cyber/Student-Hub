/**
 * Image Watermarking Engine for StudentHub (Phase 3).
 * Supports both text and logo/image watermarks with live preview and custom opacity/positioning.
 */

export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'diagonal-tile';

export interface TextWatermarkConfig {
  text: string;
  fontSize: number; // in pixels relative to image size
  color: string;
  opacity: number; // 0.1 to 1.0
  position: WatermarkPosition;
  rotationDeg: number;
}

export interface ImageWatermarkConfig {
  watermarkImg: HTMLImageElement;
  scalePercent: number; // 5 to 60% of target image width
  opacity: number;
  position: WatermarkPosition;
  rotationDeg: number;
}

/**
 * Apply text watermark onto an image on canvas and export as Blob
 */
export async function applyTextWatermark(
  img: HTMLImageElement,
  config: TextWatermarkConfig,
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context unavailable.'));
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw original image
    ctx.drawImage(img, 0, 0);

    // 2. Configure watermark styling
    ctx.save();
    ctx.globalAlpha = Math.max(0.05, Math.min(1.0, config.opacity));
    ctx.fillStyle = config.color;
    ctx.font = `bold ${config.fontSize}px sans-serif`;
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(config.text);
    const textW = metrics.width;
    const textH = config.fontSize;

    if (config.position === 'diagonal-tile') {
      // Repeat watermark diagonally across the entire image
      ctx.textAlign = 'center';
      const stepX = textW * 1.5;
      const stepY = textH * 4;
      const rad = (config.rotationDeg * Math.PI) / 180;

      for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
        for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rad);
          ctx.fillText(config.text, 0, 0);
          ctx.restore();
        }
      }
    } else {
      // Single positioned watermark
      let x = 0;
      let y = 0;
      const pad = Math.max(16, Math.round(canvas.width * 0.03));

      switch (config.position) {
        case 'top-left':
          x = pad;
          y = pad + textH / 2;
          ctx.textAlign = 'left';
          break;
        case 'top-center':
          x = canvas.width / 2;
          y = pad + textH / 2;
          ctx.textAlign = 'center';
          break;
        case 'top-right':
          x = canvas.width - pad;
          y = pad + textH / 2;
          ctx.textAlign = 'right';
          break;
        case 'center':
          x = canvas.width / 2;
          y = canvas.height / 2;
          ctx.textAlign = 'center';
          break;
        case 'bottom-left':
          x = pad;
          y = canvas.height - pad - textH / 2;
          ctx.textAlign = 'left';
          break;
        case 'bottom-center':
          x = canvas.width / 2;
          y = canvas.height - pad - textH / 2;
          ctx.textAlign = 'center';
          break;
        case 'bottom-right':
        default:
          x = canvas.width - pad;
          y = canvas.height - pad - textH / 2;
          ctx.textAlign = 'right';
          break;
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((config.rotationDeg * Math.PI) / 180);
      ctx.fillText(config.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Watermark processing failed.'));
        else resolve(blob);
      },
      format,
      0.95
    );
  });
}

/**
 * Apply image/logo watermark onto base image
 */
export async function applyImageWatermark(
  baseImg: HTMLImageElement,
  config: ImageWatermarkConfig,
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context unavailable.'));
      return;
    }

    ctx.drawImage(baseImg, 0, 0);

    const targetW = (baseImg.naturalWidth * config.scalePercent) / 100;
    const wmAspect = config.watermarkImg.naturalWidth / config.watermarkImg.naturalHeight;
    const targetH = targetW / wmAspect;

    const pad = Math.max(16, Math.round(canvas.width * 0.03));
    let x = 0;
    let y = 0;

    switch (config.position) {
      case 'top-left':
        x = pad;
        y = pad;
        break;
      case 'top-center':
        x = (canvas.width - targetW) / 2;
        y = pad;
        break;
      case 'top-right':
        x = canvas.width - pad - targetW;
        y = pad;
        break;
      case 'center':
      case 'diagonal-tile':
        x = (canvas.width - targetW) / 2;
        y = (canvas.height - targetH) / 2;
        break;
      case 'bottom-left':
        x = pad;
        y = canvas.height - pad - targetH;
        break;
      case 'bottom-center':
        x = (canvas.width - targetW) / 2;
        y = canvas.height - pad - targetH;
        break;
      case 'bottom-right':
      default:
        x = canvas.width - pad - targetW;
        y = canvas.height - pad - targetH;
        break;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0.05, Math.min(1.0, config.opacity));
    ctx.translate(x + targetW / 2, y + targetH / 2);
    ctx.rotate((config.rotationDeg * Math.PI) / 180);
    ctx.drawImage(config.watermarkImg, -targetW / 2, -targetH / 2, targetW, targetH);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Image watermark failed.'));
        else resolve(blob);
      },
      format,
      0.95
    );
  });
}
