import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Star,
  Download,
  FolderOpen,
  Edit2,
  FolderInput,
  Copy,
  Info,
  Trash2,
  RotateCcw,
  Eye,
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react';
import { UserFile, CloudFolder } from '../../types/index.ts';
import { formatBytes } from '../../utils/fileTypeUtils.ts';
import { FileIcon } from './FileIcon.tsx';

interface FileListProps {
  files: UserFile[];
  folders: CloudFolder[];
  selectedFileIds: Set<string>;
  selectedFolderIds: Set<string>;
  onToggleSelectFile: (fileId: string) => void;
  onToggleSelectFolder: (folderId: string) => void;
  onSelectAllVisible: () => void;
  allVisibleSelected: boolean;
  onOpenFolder: (folderId: string) => void;
  onOpenFile: (file: UserFile) => void;
  onPreviewFile: (file: UserFile) => void;
  onDownloadFile: (file: UserFile) => void;
  onRenameFile: (file: UserFile) => void;
  onRenameFolder: (folder: CloudFolder) => void;
  onMoveFile: (file: UserFile) => void;
  onMoveFolder: (folder: CloudFolder) => void;
  onDuplicateFile: (file: UserFile) => void;
  onViewDetails: (file: UserFile) => void;
  onDeleteFile: (file: UserFile) => void;
  onDeleteFolder: (folder: CloudFolder) => void;
  onRestoreFile?: (file: UserFile) => void;
  onRestoreFolder?: (folder: CloudFolder) => void;
  onToggleStarFile: (file: UserFile) => void;
  onToggleStarFolder: (folder: CloudFolder) => void;
  isTrashView?: boolean;
}

export function FileList({
  files,
  folders,
  selectedFileIds,
  selectedFolderIds,
  onToggleSelectFile,
  onToggleSelectFolder,
  onSelectAllVisible,
  allVisibleSelected,
  onOpenFolder,
  onOpenFile,
  onPreviewFile,
  onDownloadFile,
  onRenameFile,
  onRenameFolder,
  onMoveFile,
  onMoveFolder,
  onDuplicateFile,
  onViewDetails,
  onDeleteFile,
  onDeleteFolder,
  onRestoreFile,
  onRestoreFolder,
  onToggleStarFile,
  onToggleStarFolder,
  isTrashView = false,
}: FileListProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalItems = files.length + folders.length;

  if (totalItems === 0) {
    return (
      <div className="py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {isTrashView ? 'Trash is empty' : 'No files yet'}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          {isTrashView
            ? 'Deleted files and folders will appear here until permanently deleted.'
            : 'Upload your first file or create a folder to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold select-none">
            <th className="py-2.5 pl-3.5 pr-2 w-8">
              <button
                type="button"
                onClick={onSelectAllVisible}
                aria-label="Select all items"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {allVisibleSelected ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            </th>
            <th className="py-2.5 px-2">Name</th>
            <th className="py-2.5 px-2 hidden sm:table-cell">Type</th>
            <th className="py-2.5 px-2 hidden md:table-cell">Size</th>
            <th className="py-2.5 px-2 hidden lg:table-cell">
              {isTrashView ? 'Deleted Date' : 'Uploaded'}
            </th>
            <th className="py-2.5 pr-3.5 pl-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {/* Folders first */}
          {folders.map((folder) => {
            const isSelected = selectedFolderIds.has(folder.id);
            const isMenuOpen = activeMenuId === `folder_${folder.id}`;

            return (
              <tr
                key={folder.id}
                onDoubleClick={() => !isTrashView && onOpenFolder(folder.id)}
                className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                  isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/40' : ''
                }`}
              >
                <td className="py-2 pl-3.5 pr-2">
                  <button
                    type="button"
                    onClick={() => onToggleSelectFolder(folder.id)}
                    aria-label={`Select folder ${folder.name}`}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => !isTrashView && onOpenFolder(folder.id)}
                      className="cursor-pointer"
                    >
                      <FileIcon isFolder={true} className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => !isTrashView && onOpenFolder(folder.id)}
                      className="truncate font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-left cursor-pointer"
                      title={folder.name}
                    >
                      {folder.name}
                    </button>
                    {!isTrashView && (
                      <button
                        type="button"
                        onClick={() => onToggleStarFolder(folder)}
                        aria-label="Toggle star"
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-300 hover:text-amber-500 transition-opacity cursor-pointer"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            folder.starred
                              ? 'text-amber-500 fill-amber-500 opacity-100'
                              : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-2 px-2 text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                  Folder
                </td>
                <td className="py-2 px-2 text-slate-600 dark:text-slate-400 font-mono text-[11px] hidden md:table-cell">
                  —
                </td>
                <td className="py-2 px-2 text-slate-600 dark:text-slate-400 text-[11px] hidden lg:table-cell">
                  {new Date(
                    isTrashView && folder.deletedAt ? folder.deletedAt : folder.createdAt
                  ).toLocaleDateString()}
                </td>
                <td className="py-2 pr-3.5 pl-2 text-right relative">
                  <div className="inline-flex items-center gap-1">
                    {isTrashView ? (
                      <>
                        {onRestoreFolder && (
                          <button
                            type="button"
                            onClick={() => onRestoreFolder(folder)}
                            title="Restore folder"
                            className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteFolder(folder)}
                          title="Permanently delete folder"
                          className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenFolder(folder.id)}
                          title="Open folder"
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer hidden sm:inline-flex"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(isMenuOpen ? null : `folder_${folder.id}`)
                          }
                          aria-label="Folder actions"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Context Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-3 top-8 z-30 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-left animate-in fade-in duration-100"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onOpenFolder(folder.id);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                        <span>Open Folder</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onRenameFolder(folder);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Rename</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onMoveFolder(folder);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <FolderInput className="w-3.5 h-3.5 text-slate-400" />
                        <span>Move</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onToggleStarFolder(folder);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span>{folder.starred ? 'Unstar' : 'Star'}</span>
                      </button>
                      <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onDeleteFolder(folder);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Folder</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}

          {/* Files */}
          {files.map((file) => {
            const isSelected = selectedFileIds.has(file.id);
            const isMenuOpen = activeMenuId === `file_${file.id}`;

            return (
              <tr
                key={file.id}
                onDoubleClick={() => !isTrashView && onPreviewFile(file)}
                className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                  isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/40' : ''
                }`}
              >
                <td className="py-2 pl-3.5 pr-2">
                  <button
                    type="button"
                    onClick={() => onToggleSelectFile(file.id)}
                    aria-label={`Select file ${file.name}`}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => !isTrashView && onPreviewFile(file)}
                      className="cursor-pointer"
                    >
                      <FileIcon
                        mimeType={file.mimeType}
                        filename={file.name}
                        className="w-5 h-5 shrink-0"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => !isTrashView && onPreviewFile(file)}
                      className="truncate font-medium text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-left cursor-pointer"
                      title={file.name}
                    >
                      {file.name}
                    </button>
                    {!isTrashView && (
                      <button
                        type="button"
                        onClick={() => onToggleStarFile(file)}
                        aria-label="Toggle star"
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-300 hover:text-amber-500 transition-opacity cursor-pointer"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            file.starred
                              ? 'text-amber-500 fill-amber-500 opacity-100'
                              : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-2 px-2 text-slate-600 dark:text-slate-400 uppercase text-[11px] font-mono hidden sm:table-cell">
                  {file.extension || 'file'}
                </td>
                <td className="py-2 px-2 text-slate-600 dark:text-slate-400 font-mono text-[11px] hidden md:table-cell">
                  {formatBytes(file.size)}
                </td>
                <td className="py-2 px-2 text-slate-600 dark:text-slate-400 text-[11px] hidden lg:table-cell">
                  {new Date(
                    isTrashView && file.deletedAt ? file.deletedAt : file.createdAt
                  ).toLocaleDateString()}
                </td>
                <td className="py-2 pr-3.5 pl-2 text-right relative">
                  <div className="inline-flex items-center gap-1">
                    {isTrashView ? (
                      <>
                        {onRestoreFile && (
                          <button
                            type="button"
                            onClick={() => onRestoreFile(file)}
                            title="Restore file"
                            className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteFile(file)}
                          title="Permanently delete file"
                          className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onPreviewFile(file)}
                          title="Preview file"
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer hidden sm:inline-flex"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadFile(file)}
                          title="Download file"
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer hidden sm:inline-flex"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(isMenuOpen ? null : `file_${file.id}`)
                          }
                          aria-label="File actions"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Context Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-3 top-8 z-30 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-left animate-in fade-in duration-100"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onPreviewFile(file);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Preview / Open</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onDownloadFile(file);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onRenameFile(file);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Rename</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onMoveFile(file);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <FolderInput className="w-3.5 h-3.5 text-slate-400" />
                        <span>Move</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onDuplicateFile(file);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Make a Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onViewDetails(file);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        <span>File Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onToggleStarFile(file);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span>{file.starred ? 'Unstar' : 'Star'}</span>
                      </button>
                      <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onDeleteFile(file);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Move to Trash</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
