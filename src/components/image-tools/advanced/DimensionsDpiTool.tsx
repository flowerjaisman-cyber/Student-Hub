import { useState } from 'react';
import { ImageMetadata, formatBytes } from '../../../utils/imageUtils.ts';
import {
  Ruler,
  Printer,
  Info,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Monitor,
} from 'lucide-react';

interface DimensionsDpiToolProps {
  img: HTMLImageElement;
  metadata: ImageMetadata;
}

export function DimensionsDpiTool({ img, metadata }: DimensionsDpiToolProps) {
  // Print calculator state
  const [selectedDpi, setSelectedDpi] = useState<number>(300);
  const [customDpi, setCustomDpi] = useState<number>(300);
  const [calcUnit, setCalcUnit] = useState<'inches' | 'cm' | 'mm'>('inches');
  const [targetWidth, setTargetWidth] = useState<number>(8);
  const [targetHeight, setTargetHeight] = useState<number>(10);

  const activeDpi = selectedDpi === 0 ? customDpi : selectedDpi;

  // Real calculations
  const pxWidth = img.naturalWidth;
  const pxHeight = img.naturalHeight;

  // Print size of current image at activeDpi
  const printWidthInches = pxWidth / activeDpi;
  const printHeightInches = pxHeight / activeDpi;

  const printWidthCm = printWidthInches * 2.54;
  const printHeightCm = printHeightInches * 2.54;

  const printWidthMm = printWidthCm * 10;
  const printHeightMm = printHeightCm * 10;

  // Reverse calculation: pixels needed for target print dimensions
  let targetWidthInches = targetWidth;
  let targetHeightInches = targetHeight;
  if (calcUnit === 'cm') {
    targetWidthInches = targetWidth / 2.54;
    targetHeightInches = targetHeight / 2.54;
  } else if (calcUnit === 'mm') {
    targetWidthInches = targetWidth / 25.4;
    targetHeightInches = targetHeight / 25.4;
  }

  const requiredPxW = Math.round(targetWidthInches * activeDpi);
  const requiredPxH = Math.round(targetHeightInches * activeDpi);

  // Effective DPI of current image if printed at target dimensions
  const effectiveDpiW = pxWidth / targetWidthInches;
  const effectiveDpiH = pxHeight / targetHeightInches;
  const effectiveDpi = Math.min(effectiveDpiW, effectiveDpiH);

  // Quality rating
  let qualityStatus: { text: string; color: string; icon: typeof CheckCircle2 } = {
    text: 'Crisp Fine-Art Quality (300+ DPI)',
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  };

  if (effectiveDpi < 150) {
    qualityStatus = {
      text: 'Low Print Resolution (<150 DPI) — Pixelation visible up close',
      color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      icon: AlertTriangle,
    };
  } else if (effectiveDpi < 240) {
    qualityStatus = {
      text: 'Standard Quality (150–240 DPI) — Suitable for posters viewed from distance',
      color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
      icon: Info,
    };
  }

  return (
    <div id="dimensions-dpi-tool" className="space-y-6">
      {/* Educational Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-950 dark:text-indigo-200">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <p className="font-bold">
            Important Fact on DPI vs. Image Quality
          </p>
          <p className="text-indigo-800 dark:text-indigo-300">
            <strong>DPI (Dots Per Inch)</strong> is a print output metric determining physical reproduction size; changing a DPI metadata tag does not invent or create additional optical pixel detail. High quality prints require sufficient native pixel dimensions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Real Image Dimensions & Current Print Reproduction */}
        <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Real Image Dimensions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Exact native values directly extracted from the decoded file bitmap.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pixel Resolution
              </span>
              <p className="mt-1 text-sm font-bold font-mono text-slate-900 dark:text-white">
                {pxWidth} × {pxHeight} px
              </p>
              <p className="text-[11px] text-slate-500">
                {((pxWidth * pxHeight) / 1000000).toFixed(2)} Megapixels
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                File Container
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                {metadata.type.replace('image/', '').toUpperCase()}
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                {formatBytes(metadata.size)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Aspect Ratio
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                {(pxWidth / pxHeight).toFixed(2)} : 1
              </p>
              <p className="text-[11px] text-slate-500">
                {pxWidth > pxHeight ? 'Landscape' : pxWidth < pxHeight ? 'Portrait' : '1:1 Square'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Screen Display
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                <span>Standard (72–96 DPI)</span>
              </p>
              <p className="text-[11px] text-slate-500">Typical browser canvas</p>
            </div>
          </div>

          {/* Current print size at DPI */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-indigo-500" />
                <span>Physical Print Output at {activeDpi} DPI:</span>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400">Inches:</span>
                <span className="font-mono font-bold text-indigo-950 dark:text-indigo-200">
                  {printWidthInches.toFixed(2)}″ × {printHeightInches.toFixed(2)}″
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400">Centimeters:</span>
                <span className="font-mono font-bold text-indigo-950 dark:text-indigo-200">
                  {printWidthCm.toFixed(1)} cm × {printHeightCm.toFixed(1)} cm
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400">Millimeters:</span>
                <span className="font-mono font-bold text-indigo-950 dark:text-indigo-200">
                  {Math.round(printWidthMm)} mm × {Math.round(printHeightMm)} mm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Print Size & Pixel Requirement Calculator */}
        <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ruler className="w-4 h-4 text-indigo-500" />
              Target Print Size Calculator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Determine the exact pixels needed for specific physical print dimensions.
            </p>
          </div>

          {/* DPI Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Target Print Resolution (DPI)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { dpi: 72, label: '72 (Screen)' },
                { dpi: 150, label: '150 (Draft)' },
                { dpi: 300, label: '300 (Photo)' },
                { dpi: 0, label: 'Custom' },
              ].map((item) => (
                <button
                  key={item.dpi}
                  type="button"
                  onClick={() => setSelectedDpi(item.dpi)}
                  className={`py-2 px-1 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    selectedDpi === item.dpi
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {selectedDpi === 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Custom DPI:
                </span>
                <input
                  type="number"
                  min="50"
                  max="1200"
                  value={customDpi}
                  onChange={(e) => setCustomDpi(parseInt(e.target.value) || 300)}
                  className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                />
              </div>
            )}
          </div>

          {/* Physical Dimensions Inputs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Desired Physical Print Dimensions
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                {(['inches', 'cm', 'mm'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setCalcUnit(u)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      calcUnit === u
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
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
                  Width ({calcUnit})
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(parseFloat(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Height ({calcUnit})
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={targetHeight}
                  onChange={(e) => setTargetHeight(parseFloat(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Required Pixels Result */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Exact Pixels Required at {activeDpi} DPI
            </span>
            <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {requiredPxW} × {requiredPxH} px
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Formula: ({targetWidthInches.toFixed(2)}″ × {activeDpi} DPI) by ({targetHeightInches.toFixed(2)}″ × {activeDpi} DPI)
            </p>
          </div>

          {/* Feasibility Assessment for current image */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${qualityStatus.color}`}>
            <qualityStatus.icon className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{qualityStatus.text}</p>
              <p className="text-[11px] mt-0.5 opacity-90">
                Your uploaded image would yield <strong>{Math.round(effectiveDpi)} DPI</strong> at this target size.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
