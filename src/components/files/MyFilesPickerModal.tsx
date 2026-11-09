import { useState, useEffect } from 'react';
import {
  X,
  Folder,
  Search,
  Check,
  Loader2,
  HardDrive,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserFile, CloudFolder } from '../../types/index.ts';
import {
  subscribeUserFiles,
  subscribeUserFolders,
  getFileBlob,
} from '../../services/fileManagerService.ts';
import { formatBytes, getFileCategory, FileCategory } from '../../utils/fileTypeUtils.ts';
import { FileIcon } from './FileIcon.tsx';
import { FolderBreadcrumbs } from './FolderBreadcrumbs.tsx';

interface MyFilesPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allowedCategories?: FileCategory[];
  title?: string;
  onSelectFile: (file: UserFile, blob: Blob) => void;
}

export function MyFilesPickerModal({
  isOpen,
  onClose,
  allowedCategories,
  title = 'Select a File from My Files',
  onSelectFile,
}: MyFilesPickerModalProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    const unsubFiles = subscribeUserFiles(user.uid, setFiles);
    const unsubFolders = subscribeUserFolders(user.uid, setFolders);
    return () => {
      unsubFiles();
      unsubFolders();
    };
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Active (non-deleted) items
  const activeFolders = folders.filter((f) => !f.deleted);
  const activeFiles = files.filter((f) => !f.deleted);

  // Subfolders in current view
  const visibleFolders = activeFolders.filter(
    (f) => (f.parentFolderId || null) === (currentFolderId || null)
  );

  // Files in current view or matching search
  let visibleFiles = activeFiles;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    visibleFiles = visibleFiles.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.extension && f.extension.toLowerCase().includes(q))
    );
  } else {
    visibleFiles = visibleFiles.filter(
      (f) => (f.folderId || null) === (currentFolderId || null)
    );
  }

  // Filter by allowed categories if provided
  if (allowedCategories && allowedCategories.length > 0) {
    visibleFiles = visibleFiles.filter((f) => {
      const cat = getFileCategory(f.mimeType, f.name);
      return allowedCategories.includes(cat);
    });
  }

  const handleConfirmSelect = async () => {
    if (!selectedFile) return;

    setLoadingFile(true);
    setError(null);
    try {
      const blob = await getFileBlob(user.uid, selectedFile);
      onSelectFile(selectedFile, blob);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to download selected file.');
    } finally {
      setLoadingFile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[75vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {title}
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

        {/* Toolbar & Search */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <FolderBreadcrumbs
            currentFolderId={currentFolderId}
            folders={activeFolders}
            onNavigateToFolder={(fId) => {
              setSearchQuery('');
              setCurrentFolderId(fId);
            }}
          />

          <div className="relative w-48 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* File and Folder list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {visibleFolders.length === 0 && visibleFiles.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching files or folders found here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Folders */}
              {!searchQuery &&
                visibleFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                  >
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {folder.name}
                    </span>
                  </button>
                ))}

              {/* Files */}
              {visibleFiles.map((file) => {
                const isSelected = selectedFile?.id === file.id;

                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedFile(file)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileIcon
                        mimeType={file.mimeType}
                        filename={file.name}
                        className="w-4 h-4 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="px-5 py-2 text-xs text-rose-500 font-medium">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
            {selectedFile ? `Selected: ${selectedFile.name}` : 'Select a file to proceed'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedFile || loadingFile}
              onClick={handleConfirmSelect}
              className="px-4 py-1.5 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
            >
              {loadingFile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Open File</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
