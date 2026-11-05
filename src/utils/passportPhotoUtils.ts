/**
 * Passport Photo and Printable Sheet Generator.
 * Provides exact real mathematical dimensions (mm / inches / DPI / pixels)
 * and generates high-resolution passport photos and printable multi-photo sheets.
 */

import { jsPDF } from 'jspdf';

export interface PassportPreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  ratioW: number;
  ratioH: number;
  description: string;
}

export const PASSPORT_PRESETS: PassportPreset[] = [
  {
    id: '35x45',
    name: '35 × 45 mm (Standard International / Schengen / UK)',
    widthMm: 35,
    heightMm: 45,
    ratioW: 35,
    ratioH: 45,
    description: 'Most common European, UK, Schengen, Australian & Canadian visa format.',
  },
  {
    id: '2x2',
    name: '2 × 2 inch / 51 × 51 mm (US Passport / Indian Visa)',
    widthMm: 50.8,
    heightMm: 50.8,
    ratioW: 1,
    ratioH: 1,
    description: 'US Passport, US Visa, OCI card, and Indian Visa requirement.',
  },
  {
    id: '30x40',
    name: '30 × 40 mm (ID / Student Badge)',
    widthMm: 30,
    heightMm: 40,
    ratioW: 3,
    ratioH: 4,
    description: 'Common college student ID, exam registration & badge card format.',
  },
  {
    id: 'custom',
    name: 'Custom Dimensions',
    widthMm: 35,
    heightMm: 45,
    ratioW: 35,
    ratioH: 45,
    description: 'Enter your custom width, height, and unit.',
  },
];

export function mmToPixels(mm: number, dpi = 300): number {
  return Math.round((mm / 25.4) * dpi);
}

export function inchesToPixels(inches: number, dpi = 300): number {
  return Math.round(inches * dpi);
}

export function pixelsToMm(px: number, dpi = 300): number {
  return (px / dpi) * 25.4;
}

/**
 * Generate a single high-resolution passport photo from an image and crop box
 */
export async function renderPassportPhoto(
  img: HTMLImageElement,
  cropArea: { x: number; y: number; width: number; height: number },
  targetWidthPx: number,
  targetHeightPx: number,
  backgroundColor = '#ffffff'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidthPx;
    canvas.height = targetHeightPx;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context unavailable.'));
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill passport background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);

    // Draw cropped photo area scaled to exact target passport dimensions
    ctx.drawImage(
      img,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      targetWidthPx,
      targetHeightPx
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Passport photo rendering failed.'));
        else resolve(blob);
      },
      'image/jpeg',
      0.95
    );
  });
}

/**
 * Calculate how many photos fit on a print sheet (A4 or Letter) with cutting borders
 */
export function calculatePrintSheetLayout(
  photoWidthMm: number,
  photoHeightMm: number,
  pageSize: 'a4' | 'letter' = 'a4',
  marginMm = 10,
  spacingMm = 4
) {
  // Page dimensions in mm
  const pageWidthMm = pageSize === 'a4' ? 210 : 215.9;
  const pageHeightMm = pageSize === 'a4' ? 297 : 279.4;

  const usableWidth = pageWidthMm - marginMm * 2;
  const usableHeight = pageHeightMm - marginMm * 2;

  const cols = Math.floor((usableWidth + spacingMm) / (photoWidthMm + spacingMm));
  const rows = Math.floor((usableHeight + spacingMm) / (photoHeightMm + spacingMm));
  const totalPhotos = Math.max(1, cols * rows);

  return {
    cols: Math.max(1, cols),
    rows: Math.max(1, rows),
    totalPhotos,
    pageWidthMm,
    pageHeightMm,
    marginMm,
    spacingMm,
  };
}

/**
 * Render a printable multi-photo sheet to Canvas
 */
export async function renderPrintSheetCanvas(
  singlePhotoImg: HTMLImageElement,
  photoWidthMm: number,
  photoHeightMm: number,
  pageSize: 'a4' | 'letter' = 'a4',
  dpi = 300,
  showCutLines = true
): Promise<{ canvas: HTMLCanvasElement; totalCount: number }> {
  const layout = calculatePrintSheetLayout(photoWidthMm, photoHeightMm, pageSize);

  const canvas = document.createElement('canvas');
  const canvasW = mmToPixels(layout.pageWidthMm, dpi);
  const canvasH = mmToPixels(layout.pageHeightMm, dpi);
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // White paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const photoWidthPx = mmToPixels(photoWidthMm, dpi);
  const photoHeightPx = mmToPixels(photoHeightMm, dpi);
  const marginPx = mmToPixels(layout.marginMm, dpi);
  const spacingPx = mmToPixels(layout.spacingMm, dpi);

  // Center the grid of photos on page
  const gridWidthPx = layout.cols * photoWidthPx + (layout.cols - 1) * spacingPx;
  const gridHeightPx = layout.rows * photoHeightPx + (layout.rows - 1) * spacingPx;
  const startXPx = Math.max(marginPx, Math.round((canvasW - gridWidthPx) / 2));
  const startYPx = Math.max(marginPx, Math.round((canvasH - gridHeightPx) / 2));

  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      const x = startXPx + c * (photoWidthPx + spacingPx);
      const y = startYPx + r * (photoHeightPx + spacingPx);

      ctx.drawImage(singlePhotoImg, x, y, photoWidthPx, photoHeightPx);

      if (showCutLines) {
        // Thin cutting guide border
        ctx.strokeStyle = '#cbd5e1'; // light slate
        ctx.lineWidth = Math.max(1, Math.round(dpi / 300));
        ctx.strokeRect(x, y, photoWidthPx, photoHeightPx);
      }
    }
  }

  // Header / Footer text
  ctx.fillStyle = '#94a3b8';
  ctx.font = `${Math.round(dpi * 0.035)}px sans-serif`;
  ctx.fillText(
    `StudentHub Passport Photo Sheet — ${photoWidthMm} × ${photoHeightMm} mm (${layout.totalPhotos} copies) — Print at 100% scale`,
    startXPx,
    startYPx - Math.round(dpi * 0.02)
  );

  return { canvas, totalCount: layout.totalPhotos };
}

/**
 * Generate a PDF for the print sheet using jsPDF
 */
export async function generatePrintSheetPdf(
  singlePhotoImg: HTMLImageElement,
  photoWidthMm: number,
  photoHeightMm: number,
  pageSize: 'a4' | 'letter' = 'a4',
  showCutLines = true
): Promise<Blob> {
  const layout = calculatePrintSheetLayout(photoWidthMm, photoHeightMm, pageSize);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pageSize,
  });

  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = singlePhotoImg.naturalWidth;
  photoCanvas.height = singlePhotoImg.naturalHeight;
  const pctx = photoCanvas.getContext('2d');
  if (pctx) pctx.drawImage(singlePhotoImg, 0, 0);
  const photoDataUrl = photoCanvas.toDataURL('image/jpeg', 0.95);

  const gridWidth = layout.cols * photoWidthMm + (layout.cols - 1) * layout.spacingMm;
  const gridHeight = layout.rows * photoHeightMm + (layout.rows - 1) * layout.spacingMm;
  const startX = (layout.pageWidthMm - gridWidth) / 2;
  const startY = (layout.pageHeightMm - gridHeight) / 2;

  // Title notice
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `StudentHub Passport Photo Sheet (${photoWidthMm} × ${photoHeightMm} mm) — Do not scale when printing (select "Actual Size / 100%")`,
    startX,
    startY - 3
  );

  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      const x = startX + c * (photoWidthMm + layout.spacingMm);
      const y = startY + r * (photoHeightMm + layout.spacingMm);

      doc.addImage(photoDataUrl, 'JPEG', x, y, photoWidthMm, photoHeightMm);

      if (showCutLines) {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.1);
        doc.rect(x, y, photoWidthMm, photoHeightMm);
      }
    }
  }

  return doc.output('blob');
}
