import { useState } from 'react';
import {
  FileText,
  FileCode,
  FileType,
  FileDown,
  CloudUpload,
  Folder,
  FolderRoot,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { UserDocument, CloudFolder } from '../../types/index.ts';
import { exportDocumentToMyFiles } from '../../services/documentService.ts';
import {
  exportToPdf,
  exportToDocx,
  exportToTxt,
  exportToHtml,
  exportToMarkdown,
} from '../../utils/documentUtils.ts';

interface DocumentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: UserDocument | null;
  folders: CloudFolder[];
  userId: string;
  onExportSuccess?: (message: string) => void;
  onNavigateToMyFiles?: () => void;
}

type ExportFormat = 'pdf' | 'docx' | 'txt' | 'html' | 'md';
type ExportTarget = 'my-files' | 'download';

export function DocumentExportModal({
  isOpen,
  onClose,
  document: userDoc,
  folders,
  userId,
  onExportSuccess,
  onNavigateToMyFiles,
}: DocumentExportModalProps) {
  const [target, setTarget] = useState<ExportTarget>('my-files');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    userDoc?.folderId || null
  );
  const [customFilename, setCustomFilename] = useState(userDoc?.title || '');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'generating' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !userDoc) return null;

  const activeFolders = folders.filter((f) => !f.deleted);

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage('');
    setExportProgress(10);
    setExportStatus('generating');

    try {
      if (target === 'download') {
        // Direct local device download
        const filename = customFilename.trim() || userDoc.title;
        setExportProgress(60);

        if (format === 'pdf') {
          await exportToPdf({ ...userDoc, title: filename });
        } else if (format === 'docx') {
          await exportToDocx(filename, userDoc.content || '');
        } else if (format === 'txt') {
          exportToTxt(filename, userDoc.content || '');
        } else if (format === 'html') {
          exportToHtml(filename, userDoc.content || '', {
            fontFamily: userDoc.fontFamily,
            fontSize: userDoc.fontSize,
            pageSize: userDoc.pageSize,
          });
        } else if (format === 'md') {
          exportToMarkdown(filename, userDoc.content || '');
        }

        setExportProgress(100);
        setExportStatus('success');
        onExportSuccess?.(`Downloaded "${filename}.${format}" successfully.`);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        // Save to My Files via Firebase Storage and Firestore
        setExportStatus('uploading');
        setExportProgress(30);

        await exportDocumentToMyFiles(
          userId,
          userDoc,
          format,
          selectedFolderId,
          {
            customFilename: customFilename.trim() || userDoc.title,
            onProgress: (percent) => {
              setExportProgress(Math.max(30, Math.round(percent)));
            },
          }
        );

        setExportProgress(100);
        setExportStatus('success');
        onExportSuccess?.(`Document saved to My Files as ${format.toUpperCase()}!`);
      }
    } catch (err: any) {
      setExportStatus('error');
      setErrorMessage(err.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      id="document-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Export Document
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                {userDoc.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Success banner */}
          {exportStatus === 'success' && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold">
                  {target === 'my-files'
                    ? 'Exported directly to My Files!'
                    : 'Download completed!'}
                </span>
              </div>
              {target === 'my-files' && onNavigateToMyFiles && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToMyFiles();
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                >
                  View in My Files
                </button>
              )}
            </div>
          )}

          {/* Error banner */}
          {exportStatus === 'error' && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Target Selection: My Files vs Download */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Destination
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTarget('my-files')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  target === 'my-files'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <CloudUpload className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Save to My Files</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Cloud storage in your student account
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTarget('download')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  target === 'download'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FileDown className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Download File</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Save directly to your local computer
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'pdf', label: 'PDF Document', ext: '.pdf', icon: FileText, color: 'text-rose-500' },
                { id: 'docx', label: 'Word Document', ext: '.docx', icon: FileType, color: 'text-blue-500' },
                { id: 'txt', label: 'Plain Text', ext: '.txt', icon: FileText, color: 'text-slate-500' },
                { id: 'html', label: 'Web Page', ext: '.html', icon: FileCode, color: 'text-amber-500' },
                { id: 'md', label: 'Markdown', ext: '.md', icon: FileCode, color: 'text-purple-500' },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id as ExportFormat)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${fmt.color}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-slate-900 dark:text-white">
                        {fmt.label}
                      </p>
                      <p className="text-[10px] text-slate-400">{fmt.ext}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filename Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              File Name
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder="Enter filename"
                className="flex-1 px-3 py-2 rounded-l-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <span className="px-3 py-2 rounded-r-xl bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 border-y border-r border-slate-200 dark:border-slate-700">
                .{format}
              </span>
            </div>
          </div>

          {/* Destination Folder (Only for My Files) */}
          {target === 'my-files' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                My Files Folder
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(null)}
                  className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between cursor-pointer ${
                    selectedFolderId === null
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderRoot className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Root (My Files)</span>
                  </div>
                </button>

                {activeFolders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFolderId(f.id)}
                    className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between cursor-pointer ${
                      selectedFolderId === f.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-700 dark:text-indigo-300'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-amber-500" />
                      <span className="truncate">{f.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {isExporting && (
            <div className="space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>
                    {exportStatus === 'generating'
                      ? 'Generating file...'
                      : 'Saving to My Files cloud...'}
                  </span>
                </span>
                <span className="font-semibold">{exportProgress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <span>{target === 'my-files' ? 'Save to My Files' : 'Download Now'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
