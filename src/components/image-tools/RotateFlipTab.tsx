import { useState, useEffect } from 'react';
import {
  ImageMetadata,
  SupportedFormat,
  transformImageCanvas,
  downloadBlob,
  formatBytes,
  getSuggestedFilename,
} from '../../utils/imageUtils.ts';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Download,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface RotateFlipTabProps {
  img: HTMLImageElement;
  metadata: ImageMetadata;
}

export function RotateFlipTab({ img, metadata }: RotateFlipTabProps) {
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Rotate helpers
  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotate180 = () => {
    setRotation((prev) => (prev + 180) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  useEffect(() => {
    let active = true;
    setIsProcessing(true);

    async function runTransform() {
      try {
        const format: SupportedFormat =
          metadata.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await transformImageCanvas(
          img,
          rotation,
          flipH,
          flipV,
          format,
          0.92,
          '#ffffff'
        );

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
    }

    runTransform();

    return () => {
      active = false;
    };
  }, [img, rotation, flipH, flipV, metadata.type]);

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
      'transformed',
      ext
    );
    downloadBlob(resultBlob, outputFilename);
  };

  const isQuarterTurn = rotation === 90 || rotation === 270;
  const currentWidth = isQuarterTurn ? metadata.height : metadata.width;
  const currentHeight = isQuarterTurn ? metadata.width : metadata.height;

  return (
    <div id="rotate-flip-tab" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls Column */}
        <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Rotation &amp; Orientation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rotate lecture slide photos, upright phone document scans, or flip diagrams.
            </p>
          </div>

          {/* Rotate Actions */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Rotate Controls
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={handleRotateLeft}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-bold">90° Left</span>
              </button>

              <button
                type="button"
                onClick={handleRotateRight}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCw className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-bold">90° Right</span>
              </button>

              <button
                type="button"
                onClick={handleRotate180}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCw className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-bold">180° Half Turn</span>
              </button>
            </div>
          </div>

          {/* Flip Actions */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Mirror / Flip Controls
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFlipH(!flipH)}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  flipH
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                <FlipHorizontal className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold">Flip Horizontal</span>
              </button>

              <button
                type="button"
                onClick={() => setFlipV(!flipV)}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  flipV
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                <FlipVertical className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold">Flip Vertical</span>
              </button>
            </div>
          </div>

          {/* Status summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Current state:</span>{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {rotation}° rotation
                {flipH ? ', mirrored H' : ''}
                {flipV ? ', mirrored V' : ''}
              </span>
            </div>
            {(rotation !== 0 || flipH || flipV) && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Reset to Original
              </button>
            )}
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Transformed Output
              </h3>

              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Transforming...</span>
                </span>
              )}
            </div>

            {/* Preview Box */}
            <div className="relative w-full h-56 sm:h-64 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-2">
              {resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Transformed preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xs"
                />
              ) : (
                <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  <span>Rendering orientation...</span>
                </div>
              )}
            </div>

            {/* Metrics */}
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
                  Output Dimensions
                </span>
                <p className="mt-0.5 font-bold text-indigo-950 dark:text-indigo-200 font-mono">
                  {currentWidth} × {currentHeight} px
                </p>
                <p className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  {resultBlob ? formatBytes(resultBlob.size) : '...'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            id="download-transformed-image-btn"
            disabled={!resultBlob || isProcessing}
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              Download Transformed Image ({currentWidth} × {currentHeight} px)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
