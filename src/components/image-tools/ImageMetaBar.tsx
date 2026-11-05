import { ImageMetadata, formatBytes } from '../../utils/imageUtils.ts';
import { FileImage, Trash2, Maximize2 } from 'lucide-react';

interface ImageMetaBarProps {
  metadata: ImageMetadata;
  onClear: () => void;
  extraBadge?: string;
}

export function ImageMetaBar({ metadata, onClear, extraBadge }: ImageMetaBarProps) {
  const formatLabel = metadata.type.replace('image/', '').toUpperCase();

  return (
    <div
      id="image-metadata-bar"
      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <FileImage className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[220px] sm:max-w-xs md:max-w-md">
              {metadata.name}
            </h4>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
              {formatLabel}
            </span>
            {extraBadge && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                {extraBadge}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Maximize2 className="w-3 h-3 text-slate-400" />
              {metadata.width} × {metadata.height} px
            </span>
            <span>•</span>
            <span className="font-mono">{formatBytes(metadata.size)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={onClear}
          title="Clear current image and return to upload"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/60 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Image</span>
        </button>
      </div>
    </div>
  );
}
