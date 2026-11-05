import { useState } from 'react';
import { ImageMetadata, downloadBlob, formatBytes, getSuggestedFilename } from '../../../utils/imageUtils.ts';
import { removeBackground, BackgroundRemovalOptions } from '../../../utils/backgroundRemovalUtils.ts';
import {
  Sparkles,
  Download,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Info,
  Palette,
  Eye,
} from 'lucide-react';

interface BackgroundRemoverToolProps {
  img: HTMLImageElement;
  metadata: ImageMetadata;
}

export function BackgroundRemoverTool({ img, metadata }: BackgroundRemoverToolProps) {
  const [sensitivity, setSensitivity] = useState<number>(30); // 1 to 100
  const [edgeSmoothing, setEdgeSmoothing] = useState<number>(2); // 0 to 8
  const [contiguousOnly, setContiguousOnly] = useState<boolean>(true);
  const [replacementBg, setReplacementBg] = useState<'transparent' | 'white' | 'black' | 'custom'>('transparent');
  const [customColor, setCustomColor] = useState<string>('#ffffff');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProcess = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const opts: BackgroundRemovalOptions = {
        sensitivity,
        edgeSmoothing,
        contiguousOnly,
        replacementBg,
        customColorHex: customColor,
      };

      const blob = await removeBackground(img, opts);
      setResultBlob(blob);
      const url = URL.createObjectURL(blob);
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Background removal failed.';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const outputName = getSuggestedFilename(
      metadata.name,
      'background-removed',
      replacementBg === 'transparent' ? 'png' : 'png'
    );
    downloadBlob(resultBlob, outputName);
  };

  return (
    <div id="background-remover-tool" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls Column */}
        <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Background Removal Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Processes the image directly in your browser without uploading to external servers.
            </p>
          </div>

          {/* Replacement Background Selection */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Output Background Mode
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'transparent' as const, label: 'Transparent' },
                { id: 'white' as const, label: 'Solid White' },
                { id: 'black' as const, label: 'Solid Black' },
                { id: 'custom' as const, label: 'Custom Color' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReplacementBg(item.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    replacementBg === item.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {replacementBg === 'custom' && (
              <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <Palette className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Custom Color:
                </span>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5"
                />
                <span className="text-xs font-mono font-bold uppercase text-slate-600 dark:text-slate-300">
                  {customColor}
                </span>
              </div>
            )}
          </div>

          {/* Tolerance & Sensitivity Sliders */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="remover-sensitivity-slider"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Color Detection Sensitivity</span>
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {sensitivity}%
                </span>
              </div>
              <input
                id="remover-sensitivity-slider"
                type="range"
                min="5"
                max="85"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Low (Strict)</span>
                <span>Medium</span>
                <span>High (Aggressive)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="remover-feather-slider"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  Edge Feathering &amp; Softness
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {edgeSmoothing} px
                </span>
              </div>
              <input
                id="remover-feather-slider"
                type="range"
                min="0"
                max="6"
                value={edgeSmoothing}
                onChange={(e) => setEdgeSmoothing(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Outer Perimeter Isolation
              </span>
              <button
                type="button"
                onClick={() => setContiguousOnly(!contiguousOnly)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                  contiguousOnly
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-700'
                }`}
              >
                {contiguousOnly ? 'Active (Recommended)' : 'Global Match'}
              </button>
            </div>
          </div>

          {/* Quality Disclaimer Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="text-[11px] leading-relaxed">
              Client-side removal performs best with studio portraits, solid backgrounds, or high contrast subjects. Images with fine hair, fur, or low contrast may require adjusting the sensitivity slider.
            </p>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleProcess}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing image...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Remove Background Now</span>
              </>
            )}
          </button>

          {errorMsg && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Live Preview Column */}
        <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Processed Result Preview
              </h3>

              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Processing...</span>
                </span>
              )}
            </div>

            {/* Checkerboard container for transparency preview */}
            <div
              className="relative w-full h-64 sm:h-72 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-2"
              style={{
                backgroundImage:
                  replacementBg === 'transparent'
                    ? 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 16px 16px'
                    : undefined,
                backgroundColor:
                  replacementBg === 'white'
                    ? '#ffffff'
                    : replacementBg === 'black'
                    ? '#000000'
                    : replacementBg === 'custom'
                    ? customColor
                    : undefined,
              }}
            >
              {resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Background removed preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xs"
                />
              ) : (
                <div className="text-center p-6 text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xs">
                  <Eye className="w-8 h-8 mx-auto mb-2 text-indigo-400 opacity-60" />
                  <p className="text-xs font-semibold">
                    Click &quot;Remove Background Now&quot; to generate output
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Original dimensions: {metadata.width} × {metadata.height} px
                  </p>
                </div>
              )}
            </div>

            {/* Stats */}
            {resultBlob && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Original File
                  </span>
                  <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">
                    {metadata.type.replace('image/', '').toUpperCase()}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {formatBytes(metadata.size)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Clean Output
                  </span>
                  <p className="mt-0.5 font-bold text-indigo-950 dark:text-indigo-200">
                    PNG (Transparent Alpha)
                  </p>
                  <p className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                    {formatBytes(resultBlob.size)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            id="download-bg-removed-btn"
            disabled={!resultBlob || isProcessing}
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              Download PNG ({resultBlob ? formatBytes(resultBlob.size) : '...'})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
