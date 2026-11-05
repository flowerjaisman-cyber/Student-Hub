import { useState } from 'react';
import { Folder, FolderOpen, FolderRoot, X, Check } from 'lucide-react';
import { CloudFolder, UserDocument } from '../../types/index.ts';

interface MoveDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: UserDocument | null;
  folders: CloudFolder[];
  onConfirmMove: (docId: string, folderId: string | null) => Promise<void>;
}

export function MoveDocumentModal({
  isOpen,
  onClose,
  document,
  folders,
  onConfirmMove,
}: MoveDocumentModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    document?.folderId || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !document) return null;

  const activeFolders = folders.filter((f) => !f.deleted);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmMove(document.id, selectedFolderId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="move-document-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Move Document
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                {document.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Folder Picker */}
        <div className="p-5 max-h-72 overflow-y-auto space-y-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Select Destination Folder
          </p>

          {/* Root Directory */}
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
              selectedFolderId === null
                ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-semibold'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FolderRoot className="w-4 h-4 text-indigo-500" />
              <span className="text-xs">Root (My Files)</span>
            </div>
            {selectedFolderId === null && <Check className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Folders List */}
          {activeFolders.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedFolderId(folder.id)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-amber-500" />
                  <span className="text-xs truncate">{folder.name}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
              </button>
            );
          })}

          {activeFolders.length === 0 && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-2 text-center">
              No additional folders created yet. You can place documents in Root or create folders in My Files.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Moving...' : 'Move Here'}
          </button>
        </div>
      </div>
    </div>
  );
}
