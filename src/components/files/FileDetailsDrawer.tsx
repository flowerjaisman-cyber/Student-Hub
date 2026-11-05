import React from 'react';
import {
  X,
  Download,
  Eye,
  Star,
  Edit2,
  FolderInput,
  Trash2,
  Calendar,
  HardDrive,
  FileType,
  Folder,
  Layers,
  Copy,
  Info,
} from 'lucide-react';
import { UserFile, CloudFolder } from '../../types/index.ts';
import { formatBytes, getFileCategory } from '../../utils/fileTypeUtils.ts';
import { FileIcon } from './FileIcon.tsx';

interface FileDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  file: UserFile | null;
  folders: CloudFolder[];
  onPreview: (file: UserFile) => void;
  onDownload: (file: UserFile) => void;
  onRename: (file: UserFile) => void;
  onMove: (file: UserFile) => void;
  onDuplicate: (file: UserFile) => void;
  onToggleStar: (file: UserFile) => void;
  onDelete: (file: UserFile) => void;
}

export function FileDetailsDrawer({
  isOpen,
  onClose,
  file,
  folders,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onDuplicate,
  onToggleStar,
  onDelete,
}: FileDetailsDrawerProps) {
  if (!isOpen || !file) return null;

  const currentFolder = file.folderId
    ? folders.find((f) => f.id === file.folderId)
    : null;
  const folderName = currentFolder ? currentFolder.name : 'My Files (Root)';
  const category = getFileCategory(file.mimeType, file.name);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              File Details
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

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* File Icon & Name hero */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center mb-3">
              <FileIcon
                mimeType={file.mimeType}
                filename={file.name}
                className="w-7 h-7"
              />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white break-all">
              {file.name}
            </h4>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-0.5 uppercase">
              {file.extension || 'file'} • {formatBytes(file.size)}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onPreview(file)}
              className="py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => onDownload(file)}
              className="py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleStar(file)}
              className="py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <Star
                className={`w-4 h-4 ${
                  file.starred ? 'text-amber-500 fill-amber-500' : ''
                }`}
              />
              <span>{file.starred ? 'Favorited' : 'Favorite'}</span>
            </button>
          </div>

          {/* Metadata properties */}
          <div className="space-y-3 text-xs">
            <h5 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
              Information
            </h5>

            <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pb-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>Folder</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                  {folderName}
                </span>
              </div>

              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                  <span>Size</span>
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {formatBytes(file.size)} ({file.size.toLocaleString()} bytes)
                </span>
              </div>

              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <FileType className="w-3.5 h-3.5 text-slate-400" />
                  <span>MIME Type</span>
                </span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  {file.mimeType || 'unknown'}
                </span>
              </div>

              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Uploaded</span>
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {new Date(file.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              {file.updatedAt && file.updatedAt !== file.createdAt && (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Modified</span>
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(file.updatedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Management Actions */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onRename(file)}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Rename file</span>
            </button>
            <button
              type="button"
              onClick={() => onMove(file)}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <FolderInput className="w-3.5 h-3.5 text-slate-400" />
              <span>Move to another folder</span>
            </button>
            <button
              type="button"
              onClick={() => onDuplicate(file)}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Make a copy</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(file)}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Move to Trash</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
