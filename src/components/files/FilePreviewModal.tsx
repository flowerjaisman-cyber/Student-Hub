import { useState, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  Check,
  FileText,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { UserFile } from '../../types/index.ts';
import {
  isPreviewable,
  formatBytes,
  MAX_TEXT_PREVIEW_BYTES,
} from '../../utils/fileTypeUtils.ts';
import { FileIcon } from './FileIcon.tsx';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: UserFile | null;
  onDownload: (file: UserFile) => void;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  file,
  onDownload,
}: FilePreviewModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !file) {
      setZoomLevel(1);
      setRotation(0);
      setTextContent(null);
      setTextError(null);
      return;
    }

    const previewInfo = isPreviewable(file.mimeType, file.name, file.size);

    if (previewInfo.type === 'text') {
      if (file.size > MAX_TEXT_PREVIEW_BYTES) {
        setTextError('File exceeds 5 MB text preview limit. Please download to view.');
        return;
      }

      if (file.downloadUrl) {
        setTextLoading(true);
        fetch(file.downloadUrl)
          .then((res) => {
            if (!res.ok) throw new Error('Failed to load file contents');
            return res.text();
          })
          .then((text) => {
            setTextContent(text);
            setTextLoading(false);
          })
          .catch((err) => {
            setTextError(err.message || 'Could not load text content');
            setTextLoading(false);
          });
      }
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const previewInfo = isPreviewable(file.mimeType, file.name, file.size);

  const handleCopyText = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = textContent ? textContent.split('\n') : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[88vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileIcon
              mimeType={file.mimeType}
              filename={file.name}
              className="w-5 h-5 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                {file.name}
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                {formatBytes(file.size)} • {file.mimeType || 'unknown'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Image zoom controls */}
            {previewInfo.type === 'image' && (
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.25, z - 0.25))}
                  className="p-1 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono px-1 min-w-[36px] text-center text-slate-600 dark:text-slate-300">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(4, z + 0.25))}
                  className="p-1 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Text copy control */}
            {previewInfo.type === 'text' && textContent && (
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            {/* Download button */}
            <button
              type="button"
              onClick={() => onDownload(file)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview viewport */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-auto flex items-center justify-center relative p-4">
          {/* IMAGE PREVIEW */}
          {previewInfo.type === 'image' && file.downloadUrl && (
            <div className="w-full h-full flex items-center justify-center overflow-auto">
              <img
                src={file.downloadUrl}
                alt={file.name}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-h-[75vh] max-w-[90%] object-contain select-none shadow-lg rounded-lg"
              />
            </div>
          )}

          {/* PDF PREVIEW */}
          {previewInfo.type === 'pdf' && file.downloadUrl && (
            <div className="w-full h-full flex flex-col">
              <iframe
                src={`${file.downloadUrl}#toolbar=1&navpanes=0`}
                title={file.name}
                className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
              />
            </div>
          )}

          {/* TEXT / CODE PREVIEW */}
          {previewInfo.type === 'text' && (
            <div className="w-full h-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xs">
              {textLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-xs">Loading text content...</span>
                </div>
              ) : textError ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center text-rose-500">
                  <AlertCircle className="w-8 h-8" />
                  <span className="text-xs font-semibold">{textError}</span>
                </div>
              ) : (
                <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 select-text">
                  <table className="w-full border-collapse">
                    <tbody>
                      {lines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="pr-4 py-0.5 text-right select-none text-slate-600 dark:text-slate-400 text-[11px] w-12 border-r border-slate-100 dark:border-slate-800">
                            {idx + 1}
                          </td>
                          <td className="pl-4 py-0.5 whitespace-pre-wrap break-all font-mono">
                            {line || ' '}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* UNSUPPORTED FILE TYPE */}
          {previewInfo.type === 'unsupported' && (
            <div className="max-w-md p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
                <FileIcon
                  mimeType={file.mimeType}
                  filename={file.name}
                  className="w-8 h-8"
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Preview not available
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {previewInfo.reason ||
                    'In-browser preview is not supported for this file format. You can safely download and open it using your device’s native applications.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {file.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Size:</span>
                  <span className="text-slate-800 dark:text-slate-200">{formatBytes(file.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Format:</span>
                  <span className="text-slate-800 dark:text-slate-200 uppercase">{file.extension || 'file'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDownload(file)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
