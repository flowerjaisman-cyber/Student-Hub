import { useState, useEffect } from 'react';
import {
  ImageMetadata,
  SupportedFormat,
  convertImageCanvas,
  downloadBlob,
  formatBytes,
  getSuggestedFilename,
} from '../../utils/imageUtils.ts';
import {
  Lock,
  Unlock,
  Download,
  RefreshCw,
  Sliders,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface ImageResizerTabProps {
  img: HTMLImageElement;
  metadata: ImageMetadata;
}

export function ImageResizerTab({ img, metadata }: ImageResizerTabProps) {
  const [width, setWidth] = useState<number>(metadata.width);
  const [height, setHeight] = useState<number>(metadata.height);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<number | null>(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const aspectRatio = metadata.width / metadata.height;

  // Handle Width change
  const handleWidthChange = (val: number) => {
    const newW = Math.max(1, Math.round(val));
    setWidth(newW);
    setActivePreset(null);
    if (maintainAspectRatio) {
      setHeight(Math.max(1, Math.round(newW / aspectRatio)));
    }
  };

  // Handle Height change
  const handleHeightChange = (val: number) => {
    const newH = Math.max(1, Math.round(val));
    setHeight(newH);
    setActivePreset(null);
    if (maintainAspectRatio) {
      setWidth(Math.max(1, Math.round(newH * aspectRatio)));
    }
  };

  // Handle Percentage Presets
  const applyPreset = (percentage: number) => {
    const factor = percentage / 100;
    const newW = Math.max(1, Math.round(metadata.width * factor));
    const newH = Math.max(1, Math.round(metadata.height * factor));
    setWidth(newW);
    setHeight(newH);
    setActivePreset(percentage);
  };

  // Re-run resizing whenever width/height changes
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsProcessing(true);
      try {
        const format: SupportedFormat =
          metadata.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await convertImageCanvas(img, {
          targetFormat: format,
          width,
          height,
        });

        if (!active) return;
        setResultBlob(blob);
        const url = URL.createObjectURL(blob);
        setResultUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setIsProcessing(false);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [img, width, height, metadata.type]);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleDownload = () => {
    if (!resultBlob) return;
    const ext = metadata.type === 'image/png' ? 'png' : 'jpg';
    const outputFilename = getSuggestedFilename(
      metadata.name,
      'resized',
      ext
    );
    downloadBlob(resultBlob, outputFilename);
  };

  const isUpscaling = width > metadata.width || height > metadata.height;

  return (
    <div id="image-resizer-tab" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls Column */}
        <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              Resize Dimensions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set target pixel dimensions or select a scaling preset.
            </p>
          </div>

          {/* Presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick Scale Presets
            </span>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[25, 50, 75, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    activePreset === preset
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Width & Height Inputs */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Custom Dimensions (Pixels)
              </span>
              <button
                type="button"
                onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  maintainAspectRatio
                    ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500'
                }`}
                title={
                  maintainAspectRatio
                    ? 'Aspect ratio locked'
                    : 'Aspect ratio unlocked'
                }
              >
                {maintainAspectRatio ? (
                  <>
                    <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Ratio Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span>Unlocked</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="resize-width-input"
                  className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1"
                >
                  Width (px)
                </label>
                <input
                  id="resize-width-input"
                  type="number"
                  min="1"
                  max="16000"
                  value={width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="resize-height-input"
                  className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1"
                >
                  Height (px)
                </label>
                <input
                  id="resize-height-input"
                  type="number"
                  min="1"
                  max="16000"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Upscaling Notice */}
          {isUpscaling && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                Upscaling above original dimensions ({metadata.width} × {metadata.height} px) may cause pixelation or slight blurring.
              </span>
            </div>
          )}
        </div>

        {/* Preview & Result Column */}
        <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Resized Image Preview
              </h3>

              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Resizing...</span>
                </span>
              )}
            </div>

            {/* Preview Box */}
            <div className="relative w-full h-56 sm:h-64 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-2">
              {resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Resized preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xs"
                />
              ) : (
                <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  <span>Rendering preview...</span>
                </div>
              )}
            </div>

            {/* Before / After Comparison */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Original
                </span>
                <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {metadata.width} × {metadata.height} px
                </p>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {formatBytes(metadata.size)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Resized Result
                </span>
                <p className="mt-0.5 font-bold text-indigo-950 dark:text-indigo-200 font-mono">
                  {width} × {height} px
                </p>
                <p className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  {resultBlob ? formatBytes(resultBlob.size) : '...'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            id="download-resized-image-btn"
            disabled={!resultBlob || isProcessing}
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              Download Resized Image ({width} × {height} px)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
