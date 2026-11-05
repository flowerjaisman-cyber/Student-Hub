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
  ArrowRight,
  Download,
  CheckCircle2,
  RefreshCw,
  Palette,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface FormatConverterTabProps {
  img: HTMLImageElement;
  metadata: ImageMetadata;
}

const PRESET_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Light Gray', value: '#f1f5f9' },
  { name: 'Black', value: '#000000' },
  { name: 'Navy', value: '#0f172a' },
];

export function FormatConverterTab({ img, metadata }: FormatConverterTabProps) {
  // Determine sensible default target format based on input
  const defaultTarget: SupportedFormat =
    metadata.type === 'image/png' ? 'image/jpeg' : 'image/png';

  const [targetFormat, setTargetFormat] = useState<SupportedFormat>(defaultTarget);
  const [quality, setQuality] = useState<number>(0.9); // 90%
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Re-run conversion when target settings change
  useEffect(() => {
    let active = true;

    async function runConversion() {
      setIsProcessing(true);
      setErrorMsg(null);
      try {
        const blob = await convertImageCanvas(img, {
          targetFormat,
          quality,
          backgroundColor,
        });

        if (!active) return;
        setResultBlob(blob);
        const url = URL.createObjectURL(blob);
        setResultUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err: unknown) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Conversion failed.';
        setErrorMsg(msg);
      } finally {
        if (active) setIsProcessing(false);
      }
    }

    runConversion();

    return () => {
      active = false;
    };
  }, [img, targetFormat, quality, backgroundColor]);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleDownload = () => {
    if (!resultBlob) return;
    const outputFilename = getSuggestedFilename(
      metadata.name,
      '',
      targetFormat
    );
    downloadBlob(resultBlob, outputFilename);
  };

  const isLossy = targetFormat === 'image/jpeg' || targetFormat === 'image/webp';
  const isTargetJpg = targetFormat === 'image/jpeg';
  const isSourcePng = metadata.type === 'image/png';

  return (
    <div id="format-converter-tab" className="space-y-6">
      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Format selection & options */}
        <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Target Format Selection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select the desired output format for your image.
            </p>
          </div>

          {/* Format selector buttons */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { format: 'image/png' as SupportedFormat, label: 'PNG', note: 'Lossless & Transparency' },
              { format: 'image/jpeg' as SupportedFormat, label: 'JPG / JPEG', note: 'Universal Standard' },
              { format: 'image/webp' as SupportedFormat, label: 'WebP', note: 'High Compression' },
            ].map((item) => {
              const active = targetFormat === item.format;
              return (
                <button
                  key={item.format}
                  type="button"
                  onClick={() => setTargetFormat(item.format)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20 text-indigo-950 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold">{item.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    {item.note}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Quality Slider (for JPG & WebP) */}
          {isLossy ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="quality-slider"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Output Quality</span>
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  {Math.round(quality * 100)}%
                </span>
              </div>

              <input
                id="quality-slider"
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                {[
                  { label: 'Low (50%)', val: 0.5 },
                  { label: 'Medium (75%)', val: 0.75 },
                  { label: 'High (90%)', val: 0.9 },
                  { label: 'Maximum (100%)', val: 1.0 },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setQuality(chip.val)}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition-colors cursor-pointer ${
                      Math.abs(quality - chip.val) < 0.01
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Lossless PNG Compression:
              </span>{' '}
              PNG uses pixel-exact lossless compression. Transparent alpha channels will be preserved cleanly.
            </div>
          )}

          {/* Background color picker for PNG -> JPG */}
          {isTargetJpg && isSourcePng && (
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>JPG Background Fill for Transparent Areas</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  JPG files do not support transparency. Transparent pixels will be filled with this color.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => {
                      setBackgroundColor(col.value);
                      setCustomBgColor(col.value);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      backgroundColor.toLowerCase() === col.value.toLowerCase()
                        ? 'border-indigo-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600"
                      style={{ backgroundColor: col.value }}
                    />
                    <span>{col.name}</span>
                  </button>
                ))}

                {/* Custom Color Input */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => {
                      setCustomBgColor(e.target.value);
                      setBackgroundColor(e.target.value);
                    }}
                    className="w-7 h-7 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5"
                    title="Choose custom background color"
                  />
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                    {backgroundColor}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Result & Download */}
        <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Converted Output Preview
              </h3>

              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Converting...</span>
                </span>
              )}
            </div>

            {/* Preview image */}
            <div className="relative w-full h-56 sm:h-64 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-2">
              {resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Converted preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xs"
                />
              ) : (
                <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  <span>Generating output...</span>
                </div>
              )}
            </div>

            {/* Comparison Stats */}
            {resultBlob && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Original File
                  </span>
                  <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">
                    {metadata.type.replace('image/', '').toUpperCase()}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {formatBytes(metadata.size)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Converted Result
                  </span>
                  <p className="mt-0.5 font-bold text-indigo-950 dark:text-indigo-200">
                    {targetFormat.replace('image/', '').toUpperCase()}
                  </p>
                  <p className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                    {formatBytes(resultBlob.size)}
                  </p>
                </div>
              </div>
            )}

            {errorMsg && (
              <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Action button */}
          <button
            type="button"
            id="download-converted-image-btn"
            disabled={!resultBlob || isProcessing}
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              Download as {targetFormat.replace('image/', '').toUpperCase()} ({resultBlob ? formatBytes(resultBlob.size) : '...'})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
