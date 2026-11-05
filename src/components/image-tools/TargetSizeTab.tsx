import { useState } from 'react';
import {
  ImageMetadata,
  SupportedFormat,
  compressTowardTargetSize,
  downloadBlob,
  formatBytes,
  getSuggestedFilename,
} from '../../utils/imageUtils.ts';
import {
  Target,
  Download,
  RefreshCw,
  CheckCircle2,
  Info,
  Sparkles,
} from 'lucide-react';

interface TargetSizeTabProps {
  img: HTMLImageElement;
  metadata: ImageMetadata;
}

const TARGET_PRESETS = [
  { label: '100 KB', bytes: 100 * 1024 },
  { label: '200 KB', bytes: 200 * 1024 },
  { label: '500 KB', bytes: 500 * 1024 },
  { label: '1 MB', bytes: 1024 * 1024 },
];

export function TargetSizeTab({ img, metadata }: TargetSizeTabProps) {
  const [targetBytes, setTargetBytes] = useState<number>(200 * 1024); // default 200KB
  const [customKb, setCustomKb] = useState<string>('200');
  const [format, setFormat] = useState<SupportedFormat>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    achievedBytes: number;
    qualityUsed: number;
    scaleUsed: number;
    iterations: number;
  } | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectPreset = (bytes: number) => {
    setTargetBytes(bytes);
    setCustomKb(Math.round(bytes / 1024).toString());
  };

  const handleCustomKbChange = (val: string) => {
    setCustomKb(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed > 0) {
      setTargetBytes(parsed * 1024);
    }
  };

  const handleRunTargetCompression = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const compressionResult = await compressTowardTargetSize(
        img,
        targetBytes,
        format,
        '#ffffff'
      );

      setResult(compressionResult);
      const url = URL.createObjectURL(compressionResult.blob);
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to achieve target size with current constraints.';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const ext = format === 'image/webp' ? 'webp' : 'jpg';
    const targetKb = Math.round(targetBytes / 1024);
    const outputFilename = getSuggestedFilename(
      metadata.name,
      `target-${targetKb}kb`,
      ext
    );
    downloadBlob(result.blob, outputFilename);
  };

  return (
    <div id="target-size-tab" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Target Controls */}
        <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              Target File Size Mode
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify your target file size (e.g. for course submission portals with strict upload limits).
            </p>
          </div>

          {/* Presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick Target Presets
            </span>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {TARGET_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset.bytes)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    targetBytes === preset.bytes
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Size Input */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
            <label
              htmlFor="custom-target-kb-input"
              className="text-xs font-bold text-slate-800 dark:text-slate-200 block"
            >
              Custom Target Size (in KB)
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  id="custom-target-kb-input"
                  type="number"
                  min="10"
                  max="50000"
                  value={customKb}
                  onChange={(e) => handleCustomKbChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 350"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  KB
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ≈ {formatBytes(targetBytes)}
              </span>
            </div>
          </div>

          {/* Output Format */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Output Encoding Format
            </span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setFormat('image/jpeg')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  format === 'image/jpeg'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                JPEG / JPG (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setFormat('image/webp')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  format === 'image/webp'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                WebP Format
              </button>
            </div>
          </div>

          {/* Real Process Notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="text-[11px] leading-relaxed">
              Browser encoders compress in discrete quantization steps. The engine will iteratively tune quality and scale to reach closest to your target size without producing invalid images.
            </p>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleRunTargetCompression}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Iterating compression algorithm...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Compress to Target Size</span>
              </>
            )}
          </button>

          {errorMsg && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Target Compression Output
              </h3>

              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Processing...</span>
                </span>
              )}
            </div>

            {/* Preview Box */}
            <div className="relative w-full h-52 sm:h-56 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-2">
              {resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Target compression preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xs"
                />
              ) : (
                <div className="text-center p-6 text-slate-500 dark:text-slate-400">
                  <Target className="w-8 h-8 mx-auto mb-2 text-indigo-400 opacity-60" />
                  <p className="text-xs font-semibold">
                    Set a target and click &quot;Compress to Target Size&quot;
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Current original: {formatBytes(metadata.size)}
                  </p>
                </div>
              )}
            </div>

            {/* Metrics */}
            {result && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Target Requested</span>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                      {formatBytes(targetBytes)}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Actual Achieved Size</span>
                    <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                      {formatBytes(result.achievedBytes)}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500">Quality</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{result.qualityUsed}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500">Scale</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{result.scaleUsed}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500">Passes</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{result.iterations} iters</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            id="download-target-size-btn"
            disabled={!result || isProcessing}
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              Download Target Size Image ({result ? formatBytes(result.achievedBytes) : '...'})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
