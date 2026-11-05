import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ImageMetadata,
  downloadBlob,
  formatBytes,
  getSuggestedFilename,
} from '../../../utils/imageUtils.ts';
import {
  PASSPORT_PRESETS,
  mmToPixels,
  inchesToPixels,
  renderPassportPhoto,
  renderPrintSheetCanvas,
  generatePrintSheetPdf,
  PassportPreset,
} from '../../../utils/passportPhotoUtils.ts';
import {
  IdCard,
  Download,
  Printer,
  FileText,
  Sliders,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Palette,
  Maximize2,
} from 'lucide-react';

interface PassportPhotoToolProps {
  img: HTMLImageElement;
  metadata: ImageMetadata;
}

export function PassportPhotoTool({ img, metadata }: PassportPhotoToolProps) {
  const [selectedPreset, setSelectedPreset] = useState<PassportPreset>(PASSPORT_PRESETS[0]);
  const [unit, setUnit] = useState<'mm' | 'in' | 'px'>('mm');
  const [customWidth, setCustomWidth] = useState<number>(35);
  const [customHeight, setCustomHeight] = useState<number>(45);
  const [dpi, setDpi] = useState<number>(300);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);

  // Crop box state (% from 0 to 100)
  const [cropCenterY, setCropCenterY] = useState<number>(45); // center on head/face
  const [cropZoom, setCropZoom] = useState<number>(1.2); // zoom level

  // Single photo result
  const [singlePhotoBlob, setSinglePhotoBlob] = useState<Blob | null>(null);
  const [singlePhotoUrl, setSinglePhotoUrl] = useState<string | null>(null);
  const [isRenderingPhoto, setIsRenderingPhoto] = useState<boolean>(false);

  // Print sheet state
  const [sheetPageSize, setSheetPageSize] = useState<'a4' | 'letter'>('a4');
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState<string | null>(null);
  const [sheetTotalCount, setSheetTotalCount] = useState<number>(8);
  const [isGeneratingSheet, setIsGeneratingSheet] = useState<boolean>(false);

  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate target pixel dimensions based on preset or custom
  const getTargetDimensions = useCallback((): { widthMm: number; heightMm: number; widthPx: number; heightPx: number } => {
    let widthMm = selectedPreset.widthMm;
    let heightMm = selectedPreset.heightMm;

    if (selectedPreset.id === 'custom') {
      if (unit === 'mm') {
        widthMm = customWidth;
        heightMm = customHeight;
      } else if (unit === 'in') {
        widthMm = customWidth * 25.4;
        heightMm = customHeight * 25.4;
      } else {
        widthMm = (customWidth / dpi) * 25.4;
        heightMm = (customHeight / dpi) * 25.4;
      }
    }

    const widthPx = mmToPixels(widthMm, dpi);
    const heightPx = mmToPixels(heightMm, dpi);

    return { widthMm, heightMm, widthPx, heightPx };
  }, [selectedPreset, unit, customWidth, customHeight, dpi]);

  // Compute crop box in original image pixels
  const getCropBoxPixels = useCallback(() => {
    const { widthMm, heightMm } = getTargetDimensions();
    const targetAspect = widthMm / heightMm;
    const imgAspect = img.naturalWidth / img.naturalHeight;

    let cropW = img.naturalWidth;
    let cropH = img.naturalHeight;

    if (imgAspect > targetAspect) {
      // Image wider than target aspect
      cropH = img.naturalHeight / cropZoom;
      cropW = cropH * targetAspect;
    } else {
      // Image taller than target aspect
      cropW = img.naturalWidth / cropZoom;
      cropH = cropW / targetAspect;
    }

    cropW = Math.min(img.naturalWidth, cropW);
    cropH = Math.min(img.naturalHeight, cropH);

    // Center crop horizontally, adjust vertically with cropCenterY
    const x = Math.max(0, Math.min(img.naturalWidth - cropW, (img.naturalWidth - cropW) / 2));
    const targetCenterY = (cropCenterY / 100) * img.naturalHeight;
    const y = Math.max(0, Math.min(img.naturalHeight - cropH, targetCenterY - cropH / 2));

    return { x, y, width: cropW, height: cropH };
  }, [img, getTargetDimensions, cropZoom, cropCenterY]);

  // Generate single photo
  const generateSinglePhoto = useCallback(async () => {
    setIsRenderingPhoto(true);
    try {
      const { widthPx, heightPx } = getTargetDimensions();
      const cropArea = getCropBoxPixels();

      const blob = await renderPassportPhoto(img, cropArea, widthPx, heightPx, backgroundColor);
      setSinglePhotoBlob(blob);
      const url = URL.createObjectURL(blob);
      setSinglePhotoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRenderingPhoto(false);
    }
  }, [img, getTargetDimensions, getCropBoxPixels, backgroundColor]);

  // Generate print sheet preview
  const generateSheetPreview = useCallback(async () => {
    if (!singlePhotoUrl) return;
    setIsGeneratingSheet(true);
    try {
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      tempImg.src = singlePhotoUrl;
      await new Promise((res) => {
        tempImg.onload = res;
      });

      const { widthMm, heightMm } = getTargetDimensions();
      const { canvas, totalCount } = await renderPrintSheetCanvas(
        tempImg,
        widthMm,
        heightMm,
        sheetPageSize,
        150 // 150 DPI for rapid preview
      );

      setSheetTotalCount(totalCount);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setSheetPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      }, 'image/jpeg');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSheet(false);
    }
  }, [singlePhotoUrl, getTargetDimensions, sheetPageSize]);

  useEffect(() => {
    generateSinglePhoto();
  }, [generateSinglePhoto]);

  useEffect(() => {
    if (singlePhotoUrl) {
      generateSheetPreview();
    }
  }, [singlePhotoUrl, sheetPageSize, generateSheetPreview]);

  const handleDownloadSingle = () => {
    if (!singlePhotoBlob) return;
    const { widthMm, heightMm } = getTargetDimensions();
    const name = getSuggestedFilename(
      metadata.name,
      `passport-${Math.round(widthMm)}x${Math.round(heightMm)}`,
      'jpg'
    );
    downloadBlob(singlePhotoBlob, name);
  };

  const handleDownloadSheetPdf = async () => {
    if (!singlePhotoUrl) return;
    try {
      const tempImg = new Image();
      tempImg.src = singlePhotoUrl;
      await new Promise((res) => {
        tempImg.onload = res;
      });
      const { widthMm, heightMm } = getTargetDimensions();
      const pdfBlob = await generatePrintSheetPdf(tempImg, widthMm, heightMm, sheetPageSize);
      downloadBlob(pdfBlob, `passport-sheet-${sheetPageSize}.pdf`);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintSheet = () => {
    if (!sheetPreviewUrl) return;
    const printWindow = window.open(sheetPreviewUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const { widthMm, heightMm, widthPx, heightPx } = getTargetDimensions();

  return (
    <div id="passport-photo-tool" className="space-y-6">
      {/* Official requirements disclaimer */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <p className="text-[11px] leading-relaxed">
          Preset dimensions are provided for convenience. Verify the specific requirements of your institution, passport office, or application before final submission.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset & Framing Controls */}
        <div className="lg:col-span-6 space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <IdCard className="w-4 h-4 text-indigo-500" />
              Passport Preset &amp; Frame Setup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select standard specifications or configure custom photo dimensions.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Standard Presets
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PASSPORT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPreset(p)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPreset.id === p.id
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold">{p.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Size Form */}
          {selectedPreset.id === 'custom' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Custom Sizing
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  {(['mm', 'in', 'px'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        unit === u
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {u.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Width ({unit})
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 35)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Height ({unit})
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseFloat(e.target.value) || 45)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Positioning & Zoom Adjustments */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Vertical Framing (Head Position)</span>
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {cropCenterY}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                value={cropCenterY}
                onChange={(e) => setCropCenterY(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Higher (Chin Up)</span>
                <span>Centered</span>
                <span>Lower (More Hair)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Scale / Zoom In</span>
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {cropZoom.toFixed(1)}×
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={cropZoom}
                onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Face Biometric Oval Guide
              </span>
              <button
                type="button"
                onClick={() => setShowFaceGuide(!showFaceGuide)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                  showFaceGuide
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-700'
                }`}
              >
                {showFaceGuide ? 'Guide On' : 'Guide Off'}
              </button>
            </div>
          </div>

          {/* Background Selection */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-500" />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Passport Background
                </span>
                <p className="text-[10px] text-slate-500">
                  White is standard for most official passport applications.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5"
              />
              <span className="text-xs font-mono font-bold uppercase text-slate-600 dark:text-slate-300">
                {backgroundColor}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Single Photo & Sheet Generator */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card 1: Single Passport Photo Preview */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Passport Photo Preview
              </h3>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {Math.round(widthMm)} × {Math.round(heightMm)} mm ({widthPx} × {heightPx} px @ 300 DPI)
              </span>
            </div>

            {/* Photo preview with optional face guide */}
            <div className="relative w-full h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-3 overflow-hidden">
              {singlePhotoUrl ? (
                <div className="relative inline-block shadow-md rounded border border-slate-300 dark:border-slate-700">
                  <img
                    src={singlePhotoUrl}
                    alt="Passport photo result"
                    className="max-h-56 object-contain"
                  />
                  {showFaceGuide && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      {/* Biometric head outline */}
                      <div className="w-[60%] h-[70%] border-2 border-dashed border-indigo-500/80 rounded-[50%_50%_45%_45%] mb-2" />
                      <div className="absolute top-[42%] w-[75%] border-t border-indigo-400/50" />
                      <div className="absolute top-[58%] w-[40%] border-t border-indigo-400/50" />
                    </div>
                  )}
                </div>
              ) : (
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              )}
            </div>

            <button
              type="button"
              disabled={!singlePhotoBlob || isRenderingPhoto}
              onClick={handleDownloadSingle}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                Download Single Passport Photo (
                {singlePhotoBlob ? formatBytes(singlePhotoBlob.size) : '...'})
              </span>
            </button>
          </div>

          {/* Card 2: Printable Photo Sheet Generator */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-500" />
                  Printable Multi-Photo Sheet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Print ready-to-cut copies at home or at a pharmacy/copy center.
                </p>
              </div>

              {/* Sheet size selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSheetPageSize('a4')}
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    sheetPageSize === 'a4'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  A4 Paper
                </button>
                <button
                  type="button"
                  onClick={() => setSheetPageSize('letter')}
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    sheetPageSize === 'letter'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  US Letter
                </button>
              </div>
            </div>

            {/* Print Sheet Thumbnail Preview */}
            <div className="w-full h-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-2 overflow-hidden">
              {sheetPreviewUrl ? (
                <img
                  src={sheetPreviewUrl}
                  alt="Printable photo sheet preview"
                  className="max-h-full object-contain shadow-sm border border-slate-300 dark:border-slate-700"
                />
              ) : (
                <p className="text-xs text-slate-400">Generating sheet layout...</p>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Fitted: <strong>{sheetTotalCount} copies</strong> arranged with fine cutting marks on a standard {sheetPageSize.toUpperCase()} page. Print at 100% scale (no scaling).
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadSheetPdf}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-rose-500" />
                <span>Download Print PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePrintSheet}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-500" />
                <span>Print Direct</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
