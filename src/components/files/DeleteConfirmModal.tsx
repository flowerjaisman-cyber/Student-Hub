import { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export type DeleteModalType =
  | 'soft-file'
  | 'soft-folder'
  | 'soft-batch'
  | 'permanent-file'
  | 'permanent-folder'
  | 'permanent-batch'
  | 'empty-trash';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: DeleteModalType;
  title?: string;
  itemCount?: number;
  itemNames?: string[];
  containedFilesCount?: number;
  onConfirm: (options?: { folderAction?: 'cascade' | 'reparent' }) => Promise<void>;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  type,
  title,
  itemCount = 1,
  itemNames = [],
  containedFilesCount = 0,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [folderAction, setFolderAction] = useState<'cascade' | 'reparent'>('cascade');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isPermanent = type.startsWith('permanent') || type === 'empty-trash';

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({ folderAction });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getHeading = () => {
    if (title) return title;
    if (type === 'empty-trash') return 'Empty Trash';
    if (isPermanent) return 'Permanently Delete';
    return 'Move to Trash';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isPermanent
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isPermanent ? <Trash2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {getHeading()}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {type === 'empty-trash' && (
              <>
                Are you sure you want to permanently delete all items in Trash? Files will be
                completely removed from cloud storage. <strong>This action cannot be undone.</strong>
              </>
            )}

            {type === 'permanent-file' && (
              <>
                Permanently delete <strong>"{itemNames[0] || 'this file'}"</strong>? The physical
                file will be removed from cloud storage. This action cannot be undone.
              </>
            )}

            {type === 'permanent-folder' && (
              <>
                Permanently delete folder <strong>"{itemNames[0] || 'this folder'}"</strong> and all
                contained files from cloud storage? This action cannot be undone.
              </>
            )}

            {type === 'permanent-batch' && (
              <>
                Permanently delete these <strong>{itemCount} items</strong>? They will be removed
                from cloud storage permanently.
              </>
            )}

            {type === 'soft-file' && (
              <>
                Move <strong>"{itemNames[0] || 'this file'}"</strong> to Trash? You can restore it
                later from the Trash view.
              </>
            )}

            {type === 'soft-folder' && containedFilesCount === 0 && (
              <>
                Move folder <strong>"{itemNames[0] || 'this folder'}"</strong> to Trash?
              </>
            )}

            {type === 'soft-folder' && containedFilesCount > 0 && (
              <>
                Folder <strong>"{itemNames[0]}"</strong> contains{' '}
                <strong>{containedFilesCount} file{containedFilesCount > 1 ? 's' : ''}</strong>. How would
                you like to proceed?
              </>
            )}

            {type === 'soft-batch' && (
              <>
                Move <strong>{itemCount} selected item{itemCount > 1 ? 's' : ''}</strong> to Trash?
                You can restore them anytime.
              </>
            )}
          </p>

          {/* Options for non-empty folder delete */}
          {type === 'soft-folder' && containedFilesCount > 0 && (
            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="radio"
                  name="folderAction"
                  checked={folderAction === 'cascade'}
                  onChange={() => setFolderAction('cascade')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Move folder and all {containedFilesCount} item(s) to Trash
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Entire folder contents will be moved to Trash together.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="radio"
                  name="folderAction"
                  checked={folderAction === 'reparent'}
                  onChange={() => setFolderAction('reparent')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Keep files and move them to parent folder
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Only the folder itself will be moved to Trash.
                  </span>
                </div>
              </label>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirm}
            className={`px-4 py-2 text-xs rounded-xl font-bold shadow-xs cursor-pointer transition-colors text-white ${
              isPermanent
                ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
                : 'bg-amber-600 hover:bg-amber-700 disabled:opacity-50'
            }`}
          >
            {submitting
              ? 'Processing...'
              : isPermanent
              ? type === 'empty-trash'
                ? 'Empty Trash'
                : 'Permanently Delete'
              : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  );
}
