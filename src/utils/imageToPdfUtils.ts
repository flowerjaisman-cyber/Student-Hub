/**
 * Image to PDF converter utility for StudentHub.
 * Generates single-page and multi-page PDFs directly in the browser using jsPDF.
 */

import { jsPDF } from 'jspdf';

export type PdfPageSize = 'a4' | 'letter' | 'a5' | 'original' | 'custom';
export type PdfOrientation = 'portrait' | 'landscape' | 'auto';
export type PdfMarginPreset = 'none' | 'small' | 'medium' | 'large' | 'custom';
export type PdfImageScaling = 'fit' | 'fill' | 'original';

export interface PdfSettings {
  pageSize: PdfPageSize;
  customPageWidthMm?: number;
  customPageHeightMm?: number;
  orientation: PdfOrientation;
  marginPreset: PdfMarginPreset;
  customMarginMm?: number;
  scaling: PdfImageScaling;
}

export interface PdfPageItem {
  id: string;
  file: File;
  name: string;
  img: HTMLImageElement;
  width: number;
  height: number;
}

// Page dimensions in mm
export const PAGE_SIZE_DIMENSIONS: Record<string, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
  a5: { w: 148, h: 210 },
};

export const MARGIN_PRESETS: Record<PdfMarginPreset, number> = {
  none: 0,
  small: 8,
  medium: 15,
  large: 25,
  custom: 10,
};

/**
 * Convert an HTMLImageElement to JPEG / PNG Data URL safely
 */
function imageToDataUrl(img: HTMLImageElement): { dataUrl: string; format: 'JPEG' | 'PNG' } {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  return { dataUrl, format: 'JPEG' };
}

/**
 * Generate a clean PDF from a list of images according to layout settings
 */
export async function generateImagesPdf(
  pages: PdfPageItem[],
  settings: PdfSettings
): Promise<Blob> {
  if (pages.length === 0) {
    throw new Error('At least one image is required to generate a PDF.');
  }

  const marginMm =
    settings.marginPreset === 'custom'
      ? settings.customMarginMm ?? 10
      : MARGIN_PRESETS[settings.marginPreset];

  let doc: jsPDF | null = null;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const imgRatio = page.width / page.height;

    // Determine target page dimensions
    let baseW = 210;
    let baseH = 297;

    if (settings.pageSize === 'original') {
      // Calculate page matching image ratio directly (e.g., width 210mm, height = 210 / ratio)
      baseW = 210;
      baseH = Math.round(210 / imgRatio);
    } else if (settings.pageSize === 'custom') {
      baseW = settings.customPageWidthMm || 210;
      baseH = settings.customPageHeightMm || 297;
    } else {
      const dim = PAGE_SIZE_DIMENSIONS[settings.pageSize] || PAGE_SIZE_DIMENSIONS.a4;
      baseW = dim.w;
      baseH = dim.h;
    }

    // Determine orientation
    let isLandscape = false;
    if (settings.orientation === 'landscape') {
      isLandscape = true;
    } else if (settings.orientation === 'portrait') {
      isLandscape = false;
    } else {
      // 'auto': Landscape if image is wider than tall
      isLandscape = page.width > page.height;
    }

    const pageW = isLandscape ? Math.max(baseW, baseH) : Math.min(baseW, baseH);
    const pageH = isLandscape ? Math.min(baseW, baseH) : Math.max(baseW, baseH);

    const orientationStr = isLandscape ? 'landscape' : 'portrait';

    if (i === 0) {
      doc = new jsPDF({
        orientation: orientationStr,
        unit: 'mm',
        format: [pageW, pageH],
      });
    } else if (doc) {
      doc.addPage([pageW, pageH], orientationStr);
    }

    if (!doc) continue;

    const printableW = Math.max(1, pageW - marginMm * 2);
    const printableH = Math.max(1, pageH - marginMm * 2);

    let drawW = printableW;
    let drawH = printableH;
    let drawX = marginMm;
    let drawY = marginMm;

    if (settings.scaling === 'fit') {
      // Preserve aspect ratio inside printable area
      const printableRatio = printableW / printableH;
      if (imgRatio > printableRatio) {
        // Image is wider than printable area
        drawW = printableW;
        drawH = printableW / imgRatio;
        drawX = marginMm;
        drawY = marginMm + (printableH - drawH) / 2;
      } else {
        // Image is taller than printable area
        drawH = printableH;
        drawW = printableH * imgRatio;
        drawX = marginMm + (printableW - drawW) / 2;
        drawY = marginMm;
      }
    } else if (settings.scaling === 'fill') {
      // Stretch to entire printable area
      drawW = printableW;
      drawH = printableH;
      drawX = marginMm;
      drawY = marginMm;
    } else {
      // 'original': centered with minimal margin
      drawW = printableW;
      drawH = printableW / imgRatio;
      drawX = marginMm;
      drawY = marginMm + (printableH - drawH) / 2;
    }

    const { dataUrl, format } = imageToDataUrl(page.img);
    doc.addImage(dataUrl, format, drawX, drawY, drawW, drawH);
  }

  if (!doc) throw new Error('PDF generation failed to initialize.');
  return doc.output('blob');
}
