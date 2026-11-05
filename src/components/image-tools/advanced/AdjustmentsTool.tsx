import { useState, useEffect, useCallback } from 'react';
import {
  ImageMetadata,
  downloadBlob,
  formatBytes,
  getSuggestedFilename,
} from '../../../utils/imageUtils.ts';
import {
  applyImageAdjustments,
  DEFAULT_ADJUSTMENTS,
  ImageAdjustmentSettings,
} from '../../../utils/imageAdjustmentUtils.ts';
import {
  SlidersHorizontal,
  RotateCcw,
  Download,
  Sun,
  Contrast,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface AdjustmentsToolProps {
  img: HTMLImageElement;
  metadata: ImageMetadata;
}

export function AdjustmentsTool({ img, metadata }: AdjustmentsToolProps) {
  const [adjustments, setAdjustments] = useState<ImageAdjustmentSettings>({ ...DEFAULT_ADJUSTMENTS });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const updateField = (field: keyof ImageAdjustmentSettings, val: number) => {
    setAdjustments((prev) => ({ ...prev, [field]: val }));
  };

  const handleApply = useCallback(async () => {
    setIsProcessing(true);
    try {
      const blob = await applyImageAdjustments(img, adjustments, 'image/jpeg');
      setResultBlob(blob);
      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [img, adjustments]);

  // Debounced live update
  useEffect(() => {
    const timer = setTimeout(() => {
      handleApply();
    }, 150);
    return () => clearTimeout(timer);
  }, [handleApply]);

  const handleResetAll = () => {
    setAdjustments({ ...DEFAULT_ADJUSTMENTS });
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const outputName = getSuggestedFilename(metadata.name, 'adjusted', 'jpg');
    downloadBlob(resultBlob, outputName);
  };

  return (
    <div id="image-adjustments-tool" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sliders */}
        <div className="lg:col-span-6 space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              Visual Enhancements
            </h3>

            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Brightness */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Brightness</span>
                </span>
                <span className="font-mono text-indigo-600">{adjustments.brightness}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="180"
                value={adjustments.brightness}
                onChange={(e) => updateField('brightness', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                <span className="flex items-center gap-1.5">
                  <Contrast className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Contrast</span>
                </span>
                <span className="font-mono text-indigo-600">{adjustments.contrast}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="180"
                value={adjustments.contrast}
                onChange={(e) => updateField('contrast', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                <span>Color Saturation</span>
                <span className="font-mono text-indigo-600">{adjustments.saturate}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={adjustments.saturate}
                onChange={(e) => updateField('saturate', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Sharpening */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Sharpen Filter</span>
                </span>
                <span className="font-mono text-indigo-600">
                  {adjustments.sharpen === 0 ? 'Off' : `Level ${adjustments.sharpen}`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={adjustments.sharpen}
                onChange={(e) => updateField('sharpen', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Quick Filter Presets */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Quick Tone Filters
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setAdjustments((p) => ({
                      ...p,
                      grayscale: p.grayscale === 100 ? 0 : 100,
                    }))
                  }
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-colors cursor-pointer text-center ${
                    adjustments.grayscale === 100
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Grayscale (B&amp;W)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAdjustments((p) => ({
                      ...p,
                      sepia: p.sepia === 80 ? 0 : 80,
                    }))
                  }
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-colors cursor-pointer text-center ${
                    adjustments.sepia === 80
                      ? 'bg-amber-800 text-white border-amber-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Vintage Sepia
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAdjustments((p) => ({
                      ...p,
                      invert: p.invert === 100 ? 0 : 100,
                    }))
                  }
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-colors cursor-pointer text-center ${
                    adjustments.invert === 100
                      ? 'bg-purple-800 text-white border-purple-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Invert Colors
                </button>
              </div>
            </div>

            {/* Blur slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                <span>Soften / Blur</span>
                <span className="font-mono text-indigo-600">{adjustments.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={adjustments.blur}
                onChange={(e) => updateField('blur', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Output Preview */}
        <div className="lg:col-span-6 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Live Filtered Output
              </h3>

              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Updating...</span>
                </span>
              )}
            </div>

            <div className="w-full h-72 sm:h-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-2 overflow-hidden">
              {resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Adjusted preview"
                  className="max-h-full max-w-full object-contain rounded shadow-2xs"
                />
              ) : (
                <p className="text-xs text-slate-400">Rendering preview...</p>
              )}
            </div>

            {resultBlob && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">Output Size:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatBytes(resultBlob.size)}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            id="download-adjusted-image-btn"
            disabled={!resultBlob || isProcessing}
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              Download Adjusted Image ({resultBlob ? formatBytes(resultBlob.size) : '...'})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
