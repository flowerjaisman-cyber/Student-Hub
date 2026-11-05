import { useState } from 'react';
import { FolderInput, Folder, X, HardDrive, Check } from 'lucide-react';
import { CloudFolder, UserFile } from '../../types/index.ts';

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: CloudFolder[];
  itemNames: string[];
  movingFolderIds?: string[];
  onConfirmMove: (targetFolderId: string | null) => Promise<void>;
}

export function MoveModal({
  isOpen,
  onClose,
  folders,
  itemNames,
  movingFolderIds = [],
  onConfirmMove,
}: MoveModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter out any folders that are being moved or descendants of folders being moved
  const forbiddenFolderIds = new Set<string>(movingFolderIds);
  let added = true;
  while (added) {
    added = false;
    folders.forEach((f) => {
      if (f.parentFolderId && forbiddenFolderIds.has(f.parentFolderId) && !forbiddenFolderIds.has(f.id)) {
        forbiddenFolderIds.add(f.id);
        added = true;
      }
    });
  }

  const validFolders = folders.filter((f) => !f.deleted && !forbiddenFolderIds.has(f.id));

  // Build tree
  const getSubfolders = (parentId: string | null): CloudFolder[] => {
    return validFolders.filter((f) => (f.parentFolderId || null) === parentId);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirmMove(selectedFolderId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to move items');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFolderOption = (folder: CloudFolder, depth = 0) => {
    const isSelected = selectedFolderId === folder.id;
    const sub = getSubfolders(folder.id);

    return (
      <div key={folder.id}>
        <button
          type="button"
          onClick={() => setSelectedFolderId(folder.id)}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          className={`w-full py-2 pr-3 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
            isSelected
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">{folder.name}</span>
          </div>
          {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
        </button>
        {sub.map((s) => renderFolderOption(s, depth + 1))}
      </div>
    );
  };

  const rootSub = getSubfolders(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderInput className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Move {itemNames.length === 1 ? `"${itemNames[0]}"` : `${itemNames.length} items`}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose a destination folder
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Folder Picker list */}
        <div className="p-4 overflow-y-auto space-y-1 flex-1">
          {/* Root option */}
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={`w-full py-2 px-3 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
              selectedFolderId === null
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>My Files (Root)</span>
            </div>
            {selectedFolderId === null && (
              <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            )}
          </button>

          {/* Nested folders */}
          <div className="pt-1 space-y-0.5">
            {rootSub.map((f) => renderFolderOption(f, 0))}
          </div>
        </div>

        {error && (
          <div className="px-5 py-2 text-xs text-rose-500 font-medium">
            {error}
          </div>
        )}

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
            className="px-4 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer transition-colors"
          >
            {submitting ? 'Moving...' : 'Move Here'}
          </button>
        </div>
      </div>
    </div>
  );
}
