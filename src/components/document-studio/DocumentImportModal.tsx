import { useState, useRef } from 'react';
import {
  Upload,
  FolderOpen,
  X,
  FileText,
  FileCode,
  FileType,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { UserFile, CloudFolder } from '../../types/index.ts';
import { MyFilesPickerModal } from '../files/MyFilesPickerModal.tsx';
import { importDocumentFromFile } from '../../services/documentService.ts';

interface DocumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  files: UserFile[];
  folders: CloudFolder[];
  onImportSuccess: (docId: string, title: string) => void;
}

export function DocumentImportModal({
  isOpen,
  onClose,
  userId,
  files,
  folders,
  onImportSuccess,
}: DocumentImportModalProps) {
  const [showMyFilesPicker, setShowMyFilesPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter My Files to supported text document types
  const supportedFiles = files.filter((f) => {
    if (f.deleted) return false;
    const ext = (f.extension || f.name.split('.').pop() || '').toLowerCase();
    return ['docx', 'txt', 'md', 'markdown', 'html', 'htm'].includes(ext);
  });

  const handleLocalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage('');
    try {
      const newDoc = await importDocumentFromFile(userId, file);
      onImportSuccess(newDoc.id, newDoc.title);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to import document. Please verify the file format.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectFromMyFiles = async (file: UserFile, blob: Blob) => {
    setShowMyFilesPicker(false);
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const localFile = new File([blob], file.name, {
        type: file.mimeType || 'application/octet-stream',
      });

      const newDoc = await importDocumentFromFile(userId, localFile, file.folderId);
      onImportSuccess(newDoc.id, newDoc.title);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to import document from My Files.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div
        id="document-import-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Import Document
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Convert an existing file into an editable StudentHub document
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Close dialog"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isProcessing && (
              <div className="p-6 text-center space-y-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Converting and loading document...
                </p>
              </div>
            )}

            {!isProcessing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Local Device Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-left transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                      <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                      From Device
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload from your laptop or phone
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                    Browse files &rarr;
                  </div>
                </button>

                {/* Option 2: Select from My Files */}
                <button
                  type="button"
                  onClick={() => setShowMyFilesPicker(true)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-left transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                      <FolderOpen className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                      From My Files
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Select a file already in your cloud storage
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    Open My Files ({supportedFiles.length}) &rarr;
                  </div>
                </button>
              </div>
            )}

            {/* Supported Formats Info */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Supported formats:</span>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
                  .docx
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  .txt
                </span>
                <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                  .md
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                  .html
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.txt,.md,.markdown,.html,.htm"
        onChange={handleLocalFileChange}
        className="hidden"
      />

      {/* My Files Picker Modal */}
      {showMyFilesPicker && (
        <MyFilesPickerModal
          isOpen={showMyFilesPicker}
          onClose={() => setShowMyFilesPicker(false)}
          onSelectFile={handleSelectFromMyFiles}
          allowedCategories={['documents', 'text']}
          title="Select Document from My Files"
        />
      )}
    </>
  );
}
