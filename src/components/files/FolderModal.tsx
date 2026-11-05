import React, { useState, useEffect } from 'react';
import { Folder, FolderPlus, Edit2, X } from 'lucide-react';
import { CloudFolder } from '../../types/index.ts';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderToRename?: CloudFolder | null;
  parentFolderId?: string | null;
  folders: CloudFolder[];
  onSubmit: (name: string, parentFolderId?: string | null) => Promise<void>;
}

export function FolderModal({
  isOpen,
  onClose,
  folderToRename,
  parentFolderId,
  folders,
  onSubmit,
}: FolderModalProps) {
  const [name, setName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRename = !!folderToRename;

  useEffect(() => {
    if (isOpen) {
      setName(folderToRename ? folderToRename.name : '');
      setSelectedParentId(folderToRename ? folderToRename.parentFolderId || null : parentFolderId || null);
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen, folderToRename, parentFolderId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError('Please enter a folder name.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(clean, selectedParentId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save folder');
    } finally {
      setSubmitting(false);
    }
  };

  const availableParents = folders.filter(
    (f) => !f.deleted && (!folderToRename || f.id !== folderToRename.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              {isRename ? <Edit2 className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isRename ? 'Rename Folder' : 'New Folder'}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Computer Science, Assignments, Lecture Notes"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {!isRename && availableParents.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Location
              </label>
              <select
                value={selectedParentId || ''}
                onChange={(e) => setSelectedParentId(e.target.value || null)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">My Files (Root)</option>
                {availableParents.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-500 font-medium">
              {error}
            </p>
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
              disabled={submitting}
              className="px-4 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer transition-colors"
            >
              {submitting ? 'Saving...' : isRename ? 'Rename' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
