import React, { useState, useEffect } from 'react';
import {
  X,
  UploadCloud,
  Folder,
  CheckCircle2,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { CloudFolder, UserFile } from '../../types/index.ts';
import { subscribeUserFolders, uploadUserFile } from '../../services/fileManagerService.ts';
import { formatBytes, sanitizeFilename } from '../../utils/fileTypeUtils.ts';

interface SaveToMyFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  blobOrFile: Blob | File | null;
  defaultFilename: string;
  onSaved?: (savedFile: UserFile) => void;
  onNavigateToMyFiles?: () => void;
}

export function SaveToMyFilesModal({
  isOpen,
  onClose,
  blobOrFile,
  defaultFilename,
  onSaved,
  onNavigateToMyFiles,
}: SaveToMyFilesModalProps) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [filename, setFilename] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<UserFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFilename(defaultFilename);
      setSavedSuccess(null);
      setError(null);
      setSaving(false);
    }
  }, [isOpen, defaultFilename]);

  useEffect(() => {
    if (!isOpen || !user) return;
    const unsub = subscribeUserFolders(user.uid, setFolders);
    return () => unsub();
  }, [isOpen, user]);

  if (!isOpen || !blobOrFile) return null;

  const activeFolders = folders.filter((f) => !f.deleted);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to save files.');
      return;
    }

    const clean = sanitizeFilename(filename.trim());
    if (!clean) {
      setError('Please provide a valid file name.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { promise } = uploadUserFile(user.uid, blobOrFile, clean, {
        folderId: selectedFolderId,
        customFilename: clean,
      });

      const fileRecord = await promise;
      setSavedSuccess(fileRecord);
      onSaved?.(fileRecord);
    } catch (err: any) {
      setError(err.message || 'Failed to save file to My Files.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Save to My Files
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

        {savedSuccess ? (
          /* Success state */
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Saved Successfully!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                <strong>{savedSuccess.name}</strong> ({formatBytes(savedSuccess.size)}) is now stored safely in your cloud workspace.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
              {onNavigateToMyFiles && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToMyFiles();
                  }}
                  className="px-4 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Open My Files
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                File Name
              </label>
              <input
                type="text"
                required
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-1 block">
                Size: {formatBytes(blobOrFile.size)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Save In Folder
              </label>
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">My Files (Root)</option>
                {activeFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    📁 {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="text-xs text-rose-500 font-medium">
                {error}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save to My Files</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
