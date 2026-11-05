import { useState, useEffect, useRef } from 'react';
import {
  ImageMetadata,
  SupportedFormat,
  cropImageCanvas,
  downloadBlob,
  formatBytes,
  getSuggestedFilename,
} from '../../utils/imageUtils.ts';
import {
  Crop,
  Download,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Check,
} from 'lucide-react';

interface ImageCropTabProps {
  img: HTMLImageElement;
  metadata: ImageMetadata;
}

type AspectRatioPreset = 'free' | '1:1' | '4:3' | '16:9' | '3:2';

export function ImageCropTab({ img, metadata }: ImageCropTabProps) {
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>('free');

  // Crop area in original image pixels
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [cropW, setCropW] = useState<number>(metadata.width);
  const [cropH, setCropH] = useState<number>(metadata.height);

  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Maintain container ref to calculate mouse drag if needed
  const previewRef = useRef<HTMLDivElement>(null);

  // Set default initial crop
  const resetCrop = () => {
    setCropX(0);
    setCropY(0);
    setCropW(metadata.width);
    setCropH(metadata.height);
    setAspectPreset('free');
  };

  // When aspect ratio preset is selected, compute centered crop box matching the ratio
  const handleSelectAspect = (preset: AspectRatioPreset) => {
    setAspectPreset(preset);

    if (preset === 'free') {
      return;
    }

    let targetRatio = 1;
    if (preset === '1:1') targetRatio = 1;
    else if (preset === '4:3') targetRatio = 4 / 3;
    else if (preset === '16:9') targetRatio = 16 / 9;
    else if (preset === '3:2') targetRatio = 3 / 2;

    const imgRatio = metadata.width / metadata.height;
    let newW = metadata.width;
    let newH = metadata.height;

    if (imgRatio > targetRatio) {
      // Image is wider than target ratio: constrain height, compute width
      newH = metadata.height;
      newW = Math.round(newH * targetRatio);
    } else {
      // Image is taller than target ratio: constrain width, compute height
      newW = metadata.width;
      newH = Math.round(newW / targetRatio);
    }

    const newX = Math.round((metadata.width - newW) / 2);
    const newY = Math.round((metadata.height - newH) / 2);

    setCropW(newW);
    setCropH(newH);
    setCropX(newX);
    setCropY(newY);
  };

  // Re-run crop preview whenever crop coordinates change
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsProcessing(true);
      try {
        const format: SupportedFormat =
          metadata.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await cropImageCanvas(
          img,
          {
            x: Math.max(0, cropX),
            y: Math.max(0, cropY),
            width: Math.min(metadata.width - cropX, cropW),
            height: Math.min(metadata.height - cropY, cropH),
          },
          format
        );

        if (!active) return;
        setCroppedBlob(blob);
        const url = URL.createObjectURL(blob);
        setCroppedUrl((prev) => {
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
  }, [img, cropX, cropY, cropW, cropH, metadata.width, metadata.height, metadata.type]);

  useEffect(() => {
    return () => {
      if (croppedUrl) URL.revokeObjectURL(croppedUrl);
    };
  }, [croppedUrl]);

  const handleDownload = () => {
    if (!croppedBlob) return;
    const ext = metadata.type === 'image/png' ? 'png' : 'jpg';
    const outputFilename = getSuggestedFilename(
      metadata.name,
      'cropped',
      ext
    );
    downloadBlob(croppedBlob, outputFilename);
  };

  // Percentage positioning on preview overlay
  const leftPercent = (cropX / metadata.width) * 100;
  const topPercent = (cropY / metadata.height) * 100;
  const widthPercent = (cropW / metadata.width) * 100;
  const heightPercent = (cropH / metadata.height) * 100;

  return (
    <div id="image-crop-tab" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls Column */}
        <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Crop className="w-4 h-4 text-indigo-500" />
              Aspect Ratio &amp; Crop Area
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose an aspect ratio or adjust crop boundaries manually.
            </p>
          </div>

          {/* Aspect Ratio Buttons */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ratio Presets
            </span>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {[
                { id: 'free' as AspectRatioPreset, label: 'Free' },
                { id: '1:1' as AspectRatioPreset, label: '1:1 Square' },
                { id: '4:3' as AspectRatioPreset, label: '4:3' },
                { id: '16:9' as AspectRatioPreset, label: '16:9' },
                { id: '3:2' as AspectRatioPreset, label: '3:2' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectAspect(item.id)}
                  className={`py-2 px-1.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    aspectPreset === item.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate Sliders */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Crop Coordinates (Original Pixels)</span>
              </span>
              <button
                type="button"
                onClick={resetCrop}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label
                  htmlFor="crop-start-x-input"
                  className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1"
                >
                  Start X: {cropX} px
                </label>
                <input
                  id="crop-start-x-input"
                  type="range"
                  min="0"
                  max={Math.max(0, metadata.width - 20)}
                  value={cropX}
                  onChange={(e) => {
                    const newX = parseInt(e.target.value);
                    setCropX(newX);
                    if (newX + cropW > metadata.width) {
                      setCropW(metadata.width - newX);
                    }
                  }}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <label
                  htmlFor="crop-start-y-input"
                  className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1"
                >
                  Start Y: {cropY} px
                </label>
                <input
                  id="crop-start-y-input"
                  type="range"
                  min="0"
                  max={Math.max(0, metadata.height - 20)}
                  value={cropY}
                  onChange={(e) => {
                    const newY = parseInt(e.target.value);
                    setCropY(newY);
                    if (newY + cropH > metadata.height) {
                      setCropH(metadata.height - newY);
                    }
                  }}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <label
                  htmlFor="crop-width-input"
                  className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1"
                >
                  Width: {cropW} px
                </label>
                <input
                  id="crop-width-input"
                  type="range"
                  min="20"
                  max={metadata.width - cropX}
                  value={cropW}
                  onChange={(e) => setCropW(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <label
                  htmlFor="crop-height-input"
                  className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1"
                >
                  Height: {cropH} px
                </label>
                <input
                  id="crop-height-input"
                  type="range"
                  min="20"
                  max={metadata.height - cropY}
                  value={cropH}
                  onChange={(e) => setCropH(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Quick presets for common crop areas */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const size = Math.min(metadata.width, metadata.height);
                setCropW(size);
                setCropH(size);
                setCropX(Math.round((metadata.width - size) / 2));
                setCropY(Math.round((metadata.height - size) / 2));
                setAspectPreset('1:1');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 transition-colors cursor-pointer"
            >
              Center Square (Avatar)
            </button>

            <button
              type="button"
              onClick={resetCrop}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 transition-colors cursor-pointer"
            >
              Full Image
            </button>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Live Cropped Result
              </h3>

              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">
                {cropW} × {cropH} px
              </span>
            </div>

            {/* Preview Box */}
            <div
              ref={previewRef}
              className="relative w-full h-56 sm:h-64 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-2"
            >
              {croppedUrl ? (
                <img
                  src={croppedUrl}
                  alt="Cropped preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xs"
                />
              ) : (
                <div className="text-center text-xs text-slate-500">
                  Processing crop...
                </div>
              )}
            </div>

            {/* Crop Details */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Original Boundaries
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
                  Cropped Dimensions
                </span>
                <p className="mt-0.5 font-bold text-indigo-950 dark:text-indigo-200 font-mono">
                  {cropW} × {cropH} px
                </p>
                <p className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  {croppedBlob ? formatBytes(croppedBlob.size) : '...'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            id="download-cropped-image-btn"
            disabled={!croppedBlob || isProcessing}
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              Download Cropped Image ({cropW} × {cropH} px)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
