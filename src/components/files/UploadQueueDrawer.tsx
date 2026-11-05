import { useState } from 'react';
import {
  UploadCloud,
  ChevronDown,
  ChevronUp,
  X,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { FileUploadItem } from '../../types/index.ts';
import { formatBytes } from '../../utils/fileTypeUtils.ts';

interface UploadQueueDrawerProps {
  uploadQueue: FileUploadItem[];
  onCancelUpload: (id: string) => void;
  onPauseUpload: (id: string) => void;
  onResumeUpload: (id: string) => void;
  onRetryUpload: (id: string) => void;
  onDismissCompleted: () => void;
}

export function UploadQueueDrawer({
  uploadQueue,
  onCancelUpload,
  onPauseUpload,
  onResumeUpload,
  onRetryUpload,
  onDismissCompleted,
}: UploadQueueDrawerProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (uploadQueue.length === 0) return null;

  const activeCount = uploadQueue.filter(
    (item) => item.status === 'uploading' || item.status === 'saving' || item.status === 'queued'
  ).length;
  const completedCount = uploadQueue.filter((item) => item.status === 'completed').length;
  const failedCount = uploadQueue.filter((item) => item.status === 'failed').length;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
      {/* Drawer Header */}
      <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-xs font-bold">
            {activeCount > 0
              ? `Uploading ${activeCount} file${activeCount > 1 ? 's' : ''}...`
              : 'All uploads finished'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {activeCount === 0 && (
            <button
              type="button"
              onClick={onDismissCompleted}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Upload Items List */}
      {!isMinimized && (
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2">
          {uploadQueue.map((item) => {
            const isUploading = item.status === 'uploading';
            const isCompleted = item.status === 'completed';
            const isFailed = item.status === 'failed';
            const isPaused = item.status === 'paused';
            const isSaving = item.status === 'saving';

            return (
              <div key={item.id} className="py-2 px-2 text-xs flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 shrink-0 font-mono">
                      ({formatBytes(item.size)})
                    </span>
                  </div>

                  {/* Item controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isUploading && item.pauseFn && (
                      <button
                        type="button"
                        onClick={() => onPauseUpload(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        title="Pause"
                      >
                        <Pause className="w-3 h-3" />
                      </button>
                    )}
                    {isPaused && item.resumeFn && (
                      <button
                        type="button"
                        onClick={() => onResumeUpload(item.id)}
                        className="p-1 rounded text-indigo-600 hover:text-indigo-700 cursor-pointer"
                        title="Resume"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    )}
                    {isFailed && (
                      <button
                        type="button"
                        onClick={() => onRetryUpload(item.id)}
                        className="p-1 rounded text-amber-600 hover:text-amber-700 cursor-pointer"
                        title="Retry"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                    {!isCompleted && item.cancelFn && (
                      <button
                        type="button"
                        onClick={() => onCancelUpload(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Progress bar and details */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-150 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : isFailed
                          ? 'bg-rose-500'
                          : isPaused
                          ? 'bg-amber-400'
                          : 'bg-indigo-600'
                      }`}
                      style={{
                        width: isCompleted ? '100%' : `${Math.round(item.progress)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 shrink-0">
                    {isCompleted
                      ? '100%'
                      : isSaving
                      ? 'Saving...'
                      : isFailed
                      ? 'Failed'
                      : isPaused
                      ? 'Paused'
                      : `${Math.round(item.progress)}%`}
                  </span>
                </div>

                {item.error && (
                  <span className="text-[10px] text-rose-500 truncate" title={item.error}>
                    {item.error}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
