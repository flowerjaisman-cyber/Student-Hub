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
  Sliders,
  Download,
  RefreshCw,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  Info,
} from 'lucide-react';

interface ImageCompressorTabProps {
  img: HTMLImageElement;
  metadata: ImageMetadata;
}

export function ImageCompressorTab({ img, metadata }: ImageCompressorTabProps) {
  // If original is PNG, offer WebP or JPEG for efficient student compression
  const initialFormat: SupportedFormat =
    metadata.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';

  const [targetFormat, setTargetFormat] = useState<SupportedFormat>(initialFormat);
  const [quality, setQuality] = useState<number>(0.75); // 75%
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsProcessing(true);
      try {
        const blob = await convertImageCanvas(img, {
          targetFormat,
          quality,
          backgroundColor: '#ffffff',
        });

        if (!active) return;
        setCompressedBlob(blob);
        const url = URL.createObjectURL(blob);
        setCompressedUrl((prev) => {
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
  }, [img, quality, targetFormat]);

  useEffect(() => {
    return () => {
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    };
  }, [compressedUrl]);

  // Calculate real reduction percentage
  const originalSize = metadata.size;
  const compressedSize = compressedBlob?.size ?? 0;
  const sizeDiff = originalSize - compressedSize;
  const reductionPercentage =
    compressedBlob && originalSize > 0
      ? Math.max(0, ((sizeDiff / originalSize) * 100)).toFixed(1)
      : '0.0';

  const isSmaller = compressedSize < originalSize;

  const handleDownload = () => {
    if (!compressedBlob) return;
    const ext = targetFormat === 'image/webp' ? 'webp' : 'jpg';
    const outputFilename = getSuggestedFilename(
      metadata.name,
      'compressed',
      ext
    );
    downloadBlob(compressedBlob, outputFilename);
  };

  return (
    <div id="image-compressor-tab" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings Column */}
        <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              Compression Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tune quality to achieve the ideal balance between visual clarity and smaller file size.
            </p>
          </div>

          {/* Format selection for compression */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Output Encoding Format
            </span>
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setTargetFormat('image/jpeg')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  targetFormat === 'image/jpeg'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20 text-indigo-950 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <p className="text-xs font-bold">JPEG / JPG</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Standard compatibility for school portals
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTargetFormat('image/webp')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  targetFormat === 'image/webp'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20 text-indigo-950 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <span>WebP</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">
                    Optimal
                  </span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Up to 30% smaller than JPEG at same visual quality
                </p>
              </button>
            </div>
          </div>

          {/* Quality Slider */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="compression-quality-slider"
                className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Compression Quality</span>
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {Math.round(quality * 100)}%
              </span>
            </div>

            <input
              id="compression-quality-slider"
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: 'Low Quality (40%)', val: 0.4, desc: 'Smallest file' },
                { label: 'Medium (70%)', val: 0.7, desc: 'Recommended' },
                { label: 'High (85%)', val: 0.85, desc: 'Crisp detail' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setQuality(preset.val)}
                  className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    Math.abs(quality - preset.val) < 0.05
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <p className="text-[11px] font-bold">{preset.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
            <Info className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Compression operates locally in your browser memory. Real pixel data is encoded and measured directly from the generated image Blob.
            </p>
          </div>
        </div>

        {/* Real Stats & Live Preview Column */}
        <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Compression Result
              </h3>

              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Compressing...</span>
                </span>
              )}
            </div>

            {/* Preview image */}
            <div className="relative w-full h-52 sm:h-56 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-2">
              {compressedUrl ? (
                <img
                  src={compressedUrl}
                  alt="Compressed preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xs"
                />
              ) : (
                <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  <span>Compressing image...</span>
                </div>
              )}
            </div>

            {/* Real Calculated Compression Metrics */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Real Calculated Metrics
                </span>
                {isSmaller && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{reductionPercentage}% reduction</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Original File Size</span>
                  <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                    {formatBytes(originalSize)}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Compressed Output</span>
                  <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                    {compressedBlob ? formatBytes(compressedSize) : 'Calculating...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            id="download-compressed-image-btn"
            disabled={!compressedBlob || isProcessing}
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              Download Compressed Image ({compressedBlob ? formatBytes(compressedSize) : '...'})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
