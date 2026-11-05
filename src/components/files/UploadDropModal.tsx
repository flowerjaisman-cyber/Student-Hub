import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  X,
  AlertCircle,
  FileText,
  Check,
  AlertTriangle,
  Folder,
} from 'lucide-react';
import { UserFile, CloudFolder } from '../../types/index.ts';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_DISPLAY,
  formatBytes,
} from '../../utils/fileTypeUtils.ts';

interface UploadDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFolderId: string | null;
  folders: CloudFolder[];
  existingFiles: UserFile[];
  onStartUpload: (filesToUpload: { file: File; customName?: string; replaceExistingId?: string }[]) => void;
}

interface StagedFile {
  file: File;
  name: string;
  size: number;
  isDuplicate: boolean;
  duplicateConflictId?: string;
  resolution: 'keep-both' | 'replace' | 'skip';
  sizeError?: string;
}

export function UploadDropModal({
  isOpen,
  onClose,
  targetFolderId,
  folders,
  existingFiles,
  onStartUpload,
}: UploadDropModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentFolder = targetFolderId
    ? folders.find((f) => f.id === targetFolderId)
    : null;
  const folderName = currentFolder ? currentFolder.name : 'My Files (Root)';

  // Existing file names in target folder
  const activeFilesInFolder = existingFiles.filter(
    (f) => !f.deleted && (f.folderId || null) === (targetFolderId || null)
  );

  const processSelectedFiles = (rawFiles: File[]) => {
    if (rawFiles.length === 0) return;

    const newStaged: StagedFile[] = rawFiles.map((file) => {
      let sizeError: string | undefined;
      if (file.size > MAX_FILE_SIZE_BYTES) {
        sizeError = `This file is too large to upload. Maximum allowed size is ${MAX_FILE_SIZE_DISPLAY}.`;
      }

      const existingMatch = activeFilesInFolder.find(
        (f) => f.name.toLowerCase() === file.name.toLowerCase()
      );

      return {
        file,
        name: file.name,
        size: file.size,
        isDuplicate: !!existingMatch,
        duplicateConflictId: existingMatch?.id,
        resolution: existingMatch ? 'keep-both' : 'keep-both',
        sizeError,
      };
    });

    setStagedFiles((prev) => [...prev, ...newStaged]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processSelectedFiles(files);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      processSelectedFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveStaged = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetResolution = (index: number, resolution: 'keep-both' | 'replace' | 'skip') => {
    setStagedFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, resolution } : item))
    );
  };

  const handleConfirmUpload = () => {
    const valid = stagedFiles.filter((item) => !item.sizeError && item.resolution !== 'skip');
    if (valid.length === 0) return;

    const payload = valid.map((item) => ({
      file: item.file,
      replaceExistingId: item.resolution === 'replace' ? item.duplicateConflictId : undefined,
    }));

    onStartUpload(payload);
    setStagedFiles([]);
    onClose();
  };

  const hasSizeErrors = stagedFiles.some((f) => !!f.sizeError);
  const validCount = stagedFiles.filter((f) => !f.sizeError && f.resolution !== 'skip').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Upload Files
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>Destination:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {folderName}
                </span>
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Drop area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer select-none ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-2.5">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Drag & drop files here, or click to browse
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              Supports documents, PDFs, images, spreadsheets, archives, and code up to{' '}
              {MAX_FILE_SIZE_DISPLAY} each.
            </p>
          </div>

          {/* Staged files list & duplicate resolution */}
          {stagedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
                <span>Selected Files ({stagedFiles.length})</span>
                <button
                  type="button"
                  onClick={() => setStagedFiles([])}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
                {stagedFiles.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex flex-col gap-1.5 bg-white dark:bg-slate-900 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono shrink-0">
                          ({formatBytes(item.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStaged(idx)}
                        className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Error message if file size exceeded */}
                    {item.sizeError && (
                      <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.sizeError}</span>
                      </div>
                    )}

                    {/* Duplicate conflict banner and choices */}
                    {!item.sizeError && item.isDuplicate && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>A file with this name already exists in this folder.</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSetResolution(idx, 'keep-both')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              item.resolution === 'keep-both'
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                            }`}
                          >
                            Keep both
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetResolution(idx, 'replace')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              item.resolution === 'replace'
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                            }`}
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetResolution(idx, 'skip')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              item.resolution === 'skip'
                                ? 'bg-slate-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {stagedFiles.length > 0
              ? `${validCount} ready to upload`
              : 'Select files to proceed'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={validCount === 0}
              onClick={handleConfirmUpload}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              Upload {validCount > 0 ? `(${validCount})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
