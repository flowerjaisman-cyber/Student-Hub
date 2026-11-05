import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ImageMetadata,
  downloadBlob,
  formatBytes,
  getSuggestedFilename,
} from '../../../utils/imageUtils.ts';
import {
  applyTextWatermark,
  applyImageWatermark,
  TextWatermarkConfig,
  ImageWatermarkConfig,
  WatermarkPosition,
} from '../../../utils/watermarkUtils.ts';
import {
  Stamp,
  Type,
  Image as ImageIcon,
  Download,
  RotateCcw,
  Sliders,
  Palette,
  CheckCircle2,
  RefreshCw,
  Upload,
} from 'lucide-react';

interface WatermarkToolProps {
  img: HTMLImageElement;
  metadata: ImageMetadata;
}

export function WatermarkTool({ img, metadata }: WatermarkToolProps) {
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');

  // Text watermark state
  const [text, setText] = useState<string>('STUDENT COPY — DO NOT REDISTRIBUTE');
  const [fontSize, setFontSize] = useState<number>(Math.round(img.naturalWidth * 0.04));
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [opacity, setOpacity] = useState<number>(0.5);
  const [position, setPosition] = useState<WatermarkPosition>('center');
  const [rotationDeg, setRotationDeg] = useState<number>(-25);

  // Image watermark state
  const [watermarkImg, setWatermarkImg] = useState<HTMLImageElement | null>(null);
  const [scalePercent, setScalePercent] = useState<number>(25);

  // Result state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleWatermarkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploaded = new Image();
    uploaded.src = URL.createObjectURL(file);
    uploaded.onload = () => {
      setWatermarkImg(uploaded);
    };
  };

  const handleApplyWatermark = useCallback(async () => {
    setIsProcessing(true);
    try {
      let blob: Blob;

      if (watermarkType === 'text') {
        const config: TextWatermarkConfig = {
          text,
          fontSize,
          color: textColor,
          opacity,
          position,
          rotationDeg,
        };
        blob = await applyTextWatermark(img, config, 'image/png');
      } else {
        if (!watermarkImg) {
          setIsProcessing(false);
          return;
        }
        const config: ImageWatermarkConfig = {
          watermarkImg,
          scalePercent,
          opacity,
          position,
          rotationDeg,
        };
        blob = await applyImageWatermark(img, config, 'image/png');
      }

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
  }, [
    watermarkType,
    text,
    fontSize,
    textColor,
    opacity,
    position,
    rotationDeg,
    watermarkImg,
    scalePercent,
    img,
  ]);

  // Reset controls
  const handleReset = () => {
    setText('STUDENT COPY — DO NOT REDISTRIBUTE');
    setFontSize(Math.round(img.naturalWidth * 0.04));
    setTextColor('#ffffff');
    setOpacity(0.5);
    setPosition('center');
    setRotationDeg(-25);
    setScalePercent(25);
    setWatermarkImg(null);
    setResultBlob(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  };

  // Live apply
  useEffect(() => {
    handleApplyWatermark();
  }, [handleApplyWatermark]);

  const handleDownload = () => {
    if (!resultBlob) return;
    const outputName = getSuggestedFilename(metadata.name, 'watermarked', 'png');
    downloadBlob(resultBlob, outputName);
  };

  return (
    <div id="watermark-tool" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Watermark Controls */}
        <div className="lg:col-span-6 space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Stamp className="w-4 h-4 text-indigo-500" />
              Watermark Customizer
            </h3>

            {/* Type selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setWatermarkType('text')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                  watermarkType === 'text'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Type className="w-3 h-3" />
                <span>Text</span>
              </button>
              <button
                type="button"
                onClick={() => setWatermarkType('image')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                  watermarkType === 'image'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Image / Logo</span>
              </button>
            </div>
          </div>

          {/* Text Watermark Controls */}
          {watermarkType === 'text' ? (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. DRAFT, CONFIDENTIAL, NAME"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    <span>Font Size</span>
                    <span className="font-mono text-indigo-600">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max={Math.round(img.naturalWidth * 0.15)}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Text Color
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-mono font-bold uppercase text-slate-600 dark:text-slate-300">
                      {textColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Image Watermark Controls */
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Watermark Logo / Stamp Image
                </span>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {watermarkImg ? 'Replace Stamp Image' : 'Select Watermark Image / Logo'}
                  </span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleWatermarkImageUpload}
                  className="hidden"
                />
              </div>

              {watermarkImg && (
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    <span>Logo Scale</span>
                    <span className="font-mono text-indigo-600">{scalePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={scalePercent}
                    onChange={(e) => setScalePercent(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              )}
            </div>
          )}

          {/* Position & Placement Controls */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Placement Position
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'top-left' as const, label: 'Top Left' },
                  { id: 'top-center' as const, label: 'Top Center' },
                  { id: 'top-right' as const, label: 'Top Right' },
                  { id: 'center' as const, label: 'Center' },
                  { id: 'bottom-left' as const, label: 'Bottom Left' },
                  { id: 'bottom-center' as const, label: 'Bottom Mid' },
                  { id: 'bottom-right' as const, label: 'Bottom Right' },
                  { id: 'diagonal-tile' as const, label: 'Diagonal Tile' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setPosition(pos.id)}
                    className={`p-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer text-center ${
                      position === pos.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <span>Opacity</span>
                  <span className="font-mono text-indigo-600">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <span>Rotation</span>
                  <span className="font-mono text-indigo-600">{rotationDeg}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  step="5"
                  value={rotationDeg}
                  onChange={(e) => setRotationDeg(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Watermark Preview & Download */}
        <div className="lg:col-span-6 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Live Watermarked Preview
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
                  alt="Watermarked preview"
                  className="max-h-full max-w-full object-contain rounded shadow-2xs"
                />
              ) : (
                <p className="text-xs text-slate-400">Rendering preview...</p>
              )}
            </div>

            {resultBlob && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">Output PNG Size:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatBytes(resultBlob.size)}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            id="download-watermarked-btn"
            disabled={!resultBlob || isProcessing}
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              Download Watermarked Image ({resultBlob ? formatBytes(resultBlob.size) : '...'})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
