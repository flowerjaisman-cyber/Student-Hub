import { useState, useRef, useEffect } from 'react';
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
  Folder,
} from 'lucide-react';
import { UserFile, CloudFolder } from '../../types/index.ts';
import { formatBytes, getFileCategory } from '../../utils/fileTypeUtils.ts';
import { FileIcon } from './FileIcon.tsx';

interface FileGridProps {
  files: UserFile[];
  folders: CloudFolder[];
  selectedFileIds: Set<string>;
  selectedFolderIds: Set<string>;
  onToggleSelectFile: (fileId: string) => void;
  onToggleSelectFolder: (folderId: string) => void;
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

export function FileGrid({
  files,
  folders,
  selectedFileIds,
  selectedFolderIds,
  onToggleSelectFile,
  onToggleSelectFolder,
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
}: FileGridProps) {
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
    <div className="space-y-6">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Folders ({folders.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {folders.map((folder) => {
              const isSelected = selectedFolderIds.has(folder.id);
              const isMenuOpen = activeMenuId === `folder_${folder.id}`;

              return (
                <div
                  key={folder.id}
                  onDoubleClick={() => !isTrashView && onOpenFolder(folder.id)}
                  className={`group relative p-3 rounded-2xl border transition-all duration-150 select-none cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  {/* Top: checkbox & actions */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectFolder(folder.id);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      {!isTrashView && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStarFolder(folder);
                          }}
                          className={`p-1 rounded-md text-slate-300 hover:text-amber-500 transition-colors cursor-pointer ${
                            folder.starred
                              ? 'text-amber-500 fill-amber-500 opacity-100'
                              : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : `folder_${folder.id}`);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Body: Folder icon and name */}
                  <div
                    onClick={() => !isTrashView && onOpenFolder(folder.id)}
                    className="flex items-center gap-2.5 my-1"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
                      <Folder className="w-5 h-5 fill-amber-500/20" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                        title={folder.name}
                      >
                        {folder.name}
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400">
                        Folder
                      </span>
                    </div>
                  </div>

                  {/* Popover Menu */}
                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-2 top-8 z-30 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-left animate-in fade-in duration-100"
                    >
                      {isTrashView ? (
                        <>
                          {onRestoreFolder && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onRestoreFolder(folder);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Restore Folder</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onDeleteFolder(folder);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Permanently</span>
                          </button>
                        </>
                      ) : (
                        <>
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
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div>
          {folders.length > 0 && (
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Files ({files.length})
            </h4>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {files.map((file) => {
              const isSelected = selectedFileIds.has(file.id);
              const isMenuOpen = activeMenuId === `file_${file.id}`;
              const isImage = getFileCategory(file.mimeType, file.name) === 'images';

              return (
                <div
                  key={file.id}
                  onDoubleClick={() => !isTrashView && onPreviewFile(file)}
                  className={`group relative rounded-2xl border transition-all duration-150 select-none cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  {/* Top Bar inside card */}
                  <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectFile(file.id);
                      }}
                      className="pointer-events-auto p-1 rounded-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shadow-xs"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>

                    <div className="flex items-center gap-1 pointer-events-auto">
                      {!isTrashView && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStarFile(file);
                          }}
                          className={`p-1 rounded-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs text-slate-300 hover:text-amber-500 transition-colors cursor-pointer shadow-xs ${
                            file.starred
                              ? 'text-amber-500 fill-amber-500 opacity-100'
                              : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : `file_${file.id}`);
                        }}
                        className="p-1 rounded-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shadow-xs"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail / Visual Area */}
                  <div
                    onClick={() => !isTrashView && onPreviewFile(file)}
                    className="h-28 w-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800/80"
                  >
                    {isImage && file.downloadUrl ? (
                      <img
                        src={file.downloadUrl}
                        alt={file.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          // Fallback to icon on image error
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <FileIcon
                          mimeType={file.mimeType}
                          filename={file.name}
                          className="w-10 h-10"
                        />
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-600 dark:text-slate-400">
                          {file.extension || 'file'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata footer */}
                  <div className="p-3">
                    <span
                      className="block text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                      title={file.name}
                    >
                      {file.name}
                    </span>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      <span>{formatBytes(file.size)}</span>
                      <span>
                        {new Date(
                          isTrashView && file.deletedAt ? file.deletedAt : file.createdAt
                        ).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Popover Menu */}
                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-2 top-8 z-30 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-left animate-in fade-in duration-100"
                    >
                      {isTrashView ? (
                        <>
                          {onRestoreFile && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onRestoreFile(file);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Restore File</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onDeleteFile(file);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Permanently</span>
                          </button>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
