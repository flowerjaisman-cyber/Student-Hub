import { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Upload,
  Search,
  Download,
  Trash2,
  Folder,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  ChevronLeft,
  Pencil,
  MoreVertical,
  Loader2,
  AlertCircle,
  FileDown,
  Sparkles,
  Send,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { UserFile, CloudFolder } from '../../types/index.ts';
import { formatBytes } from '../../utils/fileTypeUtils.ts';
import { uploadUserFile, renameUserFile, moveUserFile, trashUserFile } from '../../services/fileManagerService.ts';
import { FilePreviewModal } from '../files/FilePreviewModal.tsx';
import { MoveModal } from '../files/MoveModal.tsx';
import { askAIStudyQuestion } from '../../services/aiStudyService.ts';

interface PdfWorkspaceProps {
  userId: string;
  files: UserFile[];
  folders: CloudFolder[];
  onRefreshFiles?: () => void;
}

export function PdfWorkspace({
  userId,
  files,
  folders,
  onRefreshFiles,
}: PdfWorkspaceProps) {
  const [activePdf, setActivePdf] = useState<UserFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modals
  const [previewModalFile, setPreviewModalFile] = useState<UserFile | null>(null);
  const [moveModalFile, setMoveModalFile] = useState<UserFile | null>(null);
  const [renameTarget, setRenameTarget] = useState<UserFile | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UserFile | null>(null);
  const [activeMenuFileId, setActiveMenuFileId] = useState<string | null>(null);

  // Ask about this document (AI Q&A - Phase 11)
  const [showPdfQAModal, setShowPdfQAModal] = useState(false);
  const [pdfQuestion, setPdfQuestion] = useState('');
  const [pdfAnswers, setPdfAnswers] = useState<Array<{ q: string; a: string; time: string }>>([]);
  const [isAskingPdf, setIsAskingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter only PDFs from the authenticated user's files
  const pdfFiles = useMemo(() => {
    return files.filter((f) => {
      if (f.deleted) return false;
      const ext = (f.extension || f.name.split('.').pop() || '').toLowerCase();
      return f.mimeType === 'application/pdf' || ext === 'pdf';
    });
  }, [files]);

  // Filtered by search and folder
  const filteredPdfs = useMemo(() => {
    return pdfFiles.filter((f) => {
      const matchesFolder =
        selectedFolderId === 'all' ||
        (selectedFolderId === 'root' ? !f.folderId : f.folderId === selectedFolderId);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || f.name.toLowerCase().includes(q);

      return matchesFolder && matchesSearch;
    });
  }, [pdfFiles, selectedFolderId, searchQuery]);

  // Upload a new PDF directly to My Files
  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    try {
      const targetFolder = selectedFolderId === 'all' || selectedFolderId === 'root' ? null : selectedFolderId;
      const { promise } = uploadUserFile(userId, file, file.name, {
        folderId: targetFolder,
        onProgress: (percent) => setUploadProgress(Math.round(percent)),
      });

      const uploaded = await promise;
      setActivePdf(uploaded);
      onRefreshFiles?.();
    } catch (err: any) {
      alert(err.message || 'Failed to upload PDF.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = (file: UserFile) => {
    if (!file.downloadUrl) return;
    const a = document.createElement('a');
    a.href = file.downloadUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    let newName = renameValue.trim();
    if (!newName.toLowerCase().endsWith('.pdf')) {
      newName = `${newName}.pdf`;
    }
    await renameUserFile(userId, renameTarget, newName);
    if (activePdf?.id === renameTarget.id) {
      setActivePdf({ ...activePdf, name: newName });
    }
    setRenameTarget(null);
    onRefreshFiles?.();
  };

  const handleConfirmTrash = async () => {
    if (!deleteTarget) return;
    await trashUserFile(userId, deleteTarget.id);
    if (activePdf?.id === deleteTarget.id) {
      setActivePdf(null);
    }
    setDeleteTarget(null);
    onRefreshFiles?.();
  };

  const handleAskPdf = async () => {
    if (!activePdf || !pdfQuestion.trim()) return;
    setIsAskingPdf(true);
    setPdfError(null);
    try {
      const promptContext = `PDF Document Name: ${activePdf.name}\nSize: ${formatBytes(activePdf.size)}\nType: ${activePdf.mimeType}\nURL: ${activePdf.downloadUrl || 'Stored in Firebase Storage'}`;
      const res = await askAIStudyQuestion({
        question: pdfQuestion.trim(),
        context: {
          title: activePdf.name,
          content: promptContext,
          type: 'file',
        },
      });
      setPdfAnswers((prev) => [
        {
          q: pdfQuestion.trim(),
          a: res.answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
      setPdfQuestion('');
    } catch (err: any) {
      setPdfError(err.message || 'Failed to get answer');
    } finally {
      setIsAskingPdf(false);
    }
  };

  // If a PDF is currently open in workspace
  if (activePdf) {
    return (
      <div id="pdf-workspace-active" className="space-y-3">
        {/* Workspace Toolbar */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          {/* Back button & Title */}
          <div className="flex items-center gap-3 min-w-[200px] flex-1">
            <button
              type="button"
              onClick={() => setActivePdf(null)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Back to PDF list"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {activePdf.name}
              </span>
              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                ({formatBytes(activePdf.size)})
              </span>
            </div>
          </div>

          {/* Controls: Zoom, Open in tab, Download, Trash */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(50, prev - 15))}
                className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(200, prev + 15))}
                className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer ml-1"
                title="Reset Zoom / Fit Width"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Open in new browser tab */}
            {activePdf.downloadUrl && (
              <a
                href={activePdf.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Open in new window"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Ask about this document (Phase 11) */}
            <button
              type="button"
              onClick={() => setShowPdfQAModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask about this document</span>
            </button>

            {/* Move to Folder */}
            <button
              type="button"
              onClick={() => setMoveModalFile(activePdf)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Move</span>
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={() => handleDownload(activePdf)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {/* Move to Trash */}
            <button
              type="button"
              onClick={() => setDeleteTarget(activePdf)}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              title="Move to Trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Frame */}
        <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 sm:p-4 min-h-[75vh] flex flex-col items-center justify-center overflow-auto">
          {activePdf.downloadUrl ? (
            <div
              className="w-full flex-1 flex flex-col rounded-xl overflow-hidden shadow-lg bg-white"
              style={{
                height: '75vh',
                transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
            >
              <iframe
                src={`${activePdf.downloadUrl}#toolbar=1&navpanes=0`}
                title={activePdf.name}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-xs font-semibold">Unable to load PDF preview.</p>
            </div>
          )}
        </div>

        {/* Move Modal */}
        {moveModalFile && (
          <MoveModal
            isOpen={!!moveModalFile}
            onClose={() => setMoveModalFile(null)}
            folders={folders}
            itemNames={[moveModalFile.name]}
            onConfirmMove={async (targetFolderId) => {
              await moveUserFile(userId, moveModalFile.id, targetFolderId);
              setMoveModalFile(null);
              onRefreshFiles?.();
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-5 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Move to Trash?
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                "{deleteTarget.name}" will be moved to Trash. You can restore it anytime from My Files.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTrash}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Move to Trash
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Q&A Modal (Phase 11) */}
        {showPdfQAModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="relative w-full max-w-xl max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Ask About This PDF
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {activePdf.name} ({formatBytes(activePdf.size)})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPdfQAModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* QA History and Conversation */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
                {pdfAnswers.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-indigo-400 opacity-60" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      Ask any study question about this PDF document.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                      Answers are grounded in this file. Uncertainty is explicitly flagged when evidence is insufficient.
                    </p>
                  </div>
                ) : (
                  pdfAnswers.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 select-text"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        <span>Q: {item.q}</span>
                        <span className="text-slate-400 font-normal">{item.time}</span>
                      </div>
                      <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {item.a}
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.a);
                            setCopiedIndex(idx);
                            setTimeout(() => setCopiedIndex(null), 2000);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedIndex === idx ? 'Copied' : 'Copy Answer'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {pdfError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pdfError}</span>
                  </div>
                )}
              </div>

              {/* Input Footer */}
              <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskPdf();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={pdfQuestion}
                    onChange={(e) => setPdfQuestion(e.target.value)}
                    placeholder="e.g. Summarize the conclusion, or explain the main formula..."
                    disabled={isAskingPdf}
                    className="flex-1 text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={isAskingPdf || !pdfQuestion.trim()}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    {isAskingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PDF Document Browser (When no PDF is actively open)
  return (
    <div id="pdf-workspace-browser" className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PDF documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Folder filter & Upload PDF Button */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="all">All Folders ({pdfFiles.length})</option>
            <option value="root">Root only</option>
            {folders
              .filter((f) => !f.deleted)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </select>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading {uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleUploadPdf}
        className="hidden"
      />

      {/* PDF List / Grid */}
      {filteredPdfs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No PDF documents found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Upload course syllabi, lecture slides, assignments, or research papers in PDF format to preview and manage them here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPdfs.map((file) => {
            const folderObj = folders.find((f) => f.id === file.folderId);
            return (
              <div
                key={file.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-150 flex flex-col justify-between group shadow-2xs relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      onClick={() => setActivePdf(file)}
                      className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center shrink-0 cursor-pointer group-hover:scale-105 transition-transform"
                    >
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuFileId(activeMenuFileId === file.id ? null : file.id)
                        }
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuFileId === file.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-20 py-1 text-xs animate-in fade-in"
                          onMouseLeave={() => setActiveMenuFileId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActivePdf(file);
                              setActiveMenuFileId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-500" />
                            <span>Open Workspace</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewModalFile(file);
                              setActiveMenuFileId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Quick Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRenameTarget(file);
                              setRenameValue(file.name.replace(/\.[^/.]+$/, ''));
                              setActiveMenuFileId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-500" />
                            <span>Rename</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMoveModalFile(file);
                              setActiveMenuFileId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                            <span>Move to Folder</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleDownload(file);
                              setActiveMenuFileId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Download</span>
                          </button>
                          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(file);
                              setActiveMenuFileId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Move to Trash</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h4
                    onClick={() => setActivePdf(file)}
                    className="text-xs font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {file.name}
                  </h4>

                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                    <span>{formatBytes(file.size)}</span>
                    <span>&bull;</span>
                    {folderObj ? (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 truncate">
                        <Folder className="w-3 h-3 shrink-0" />
                        <span className="truncate">{folderObj.name}</span>
                      </span>
                    ) : (
                      <span>Root</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setActivePdf(file)}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer"
                  >
                    Open PDF &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Preview Modal */}
      {previewModalFile && (
        <FilePreviewModal
          isOpen={!!previewModalFile}
          onClose={() => setPreviewModalFile(null)}
          file={previewModalFile}
          onDownload={handleDownload}
        />
      )}

      {/* Move File Modal */}
      {moveModalFile && (
        <MoveModal
          isOpen={!!moveModalFile}
          onClose={() => setMoveModalFile(null)}
          folders={folders}
          itemNames={[moveModalFile.name]}
          onConfirmMove={async (targetFolderId) => {
            await moveUserFile(userId, moveModalFile.id, targetFolderId);
            setMoveModalFile(null);
            onRefreshFiles?.();
          }}
        />
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleConfirmRename}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Rename PDF</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Move to Trash?
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              "{deleteTarget.name}" will be moved to Trash. You can restore it anytime from My Files.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTrash}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
