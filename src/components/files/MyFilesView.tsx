import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Folder,
  HardDrive,
  Star,
  Trash2,
  UploadCloud,
  FolderPlus,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowUpDown,
  FileCheck,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  UserFile,
  CloudFolder,
  FileUploadItem,
  FileSortOption,
  FileFilterCategory,
  FileViewMode,
} from '../../types/index.ts';
import {
  subscribeUserFiles,
  subscribeUserFolders,
  uploadUserFile,
  createFolder,
  renameFolder,
  renameFile,
  moveFile,
  moveFolder,
  toggleStarFile,
  toggleStarFolder,
  softDeleteFile,
  softDeleteFolder,
  restoreFile,
  restoreFolder,
  permanentDeleteFile,
  permanentDeleteFolder,
  duplicateUserFile,
  batchSoftDelete,
  batchMove,
  downloadFile,
  batchDownloadAsZip,
} from '../../services/fileManagerService.ts';
import {
  formatBytes,
  getFileCategory,
  resolveDuplicateName,
  generateSafeId,
} from '../../utils/fileTypeUtils.ts';
import { FolderBreadcrumbs } from './FolderBreadcrumbs.tsx';
import { FolderTreeSidebar } from './FolderTreeSidebar.tsx';
import { FileToolbar } from './FileToolbar.tsx';
import { FileList } from './FileList.tsx';
import { FileGrid } from './FileGrid.tsx';
import { UploadDropModal } from './UploadDropModal.tsx';
import { UploadQueueDrawer } from './UploadQueueDrawer.tsx';
import { FilePreviewModal } from './FilePreviewModal.tsx';
import { FileDetailsDrawer } from './FileDetailsDrawer.tsx';
import { FolderModal } from './FolderModal.tsx';
import { MoveModal } from './MoveModal.tsx';
import { DeleteConfirmModal, DeleteModalType } from './DeleteConfirmModal.tsx';

interface MyFilesViewProps {
  initialFolderId?: string | null;
  triggerUploadOnMount?: boolean;
}

export function MyFilesView({
  initialFolderId = null,
  triggerUploadOnMount = false,
}: MyFilesViewProps) {
  const { user } = useAuth();

  // Primary data states
  const [files, setFiles] = useState<UserFile[]>([]);
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Navigation & Filtering
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FileFilterCategory>('all');
  const [sortOption, setSortOption] = useState<FileSortOption>('newest');
  const [viewMode, setViewMode] = useState<FileViewMode>(() => {
    return (localStorage.getItem('studenthub_files_view') as FileViewMode) || 'list';
  });

  // Selections
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());

  // Upload Queue
  const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(triggerUploadOnMount);

  // Modals & Drawers
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
  const [detailsFile, setDetailsFile] = useState<UserFile | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<CloudFolder | null>(null);
  const [fileToRename, setFileToRename] = useState<UserFile | null>(null);
  const [renameInputOpen, setRenameInputOpen] = useState(false);
  const [renameInputValue, setRenameInputValue] = useState('');

  // Move Modal State
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [itemsToMove, setItemsToMove] = useState<{
    fileIds: string[];
    folderIds: string[];
    names: string[];
  }>({ fileIds: [], folderIds: [], names: [] });

  // Delete Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: DeleteModalType;
    targetFile?: UserFile;
    targetFolder?: CloudFolder;
    targetFiles?: UserFile[];
    targetFolders?: CloudFolder[];
  }>({
    isOpen: false,
    type: 'soft-file',
  });

  // Save viewMode preference
  useEffect(() => {
    localStorage.setItem('studenthub_files_view', viewMode);
  }, [viewMode]);

  // Subscribe to real Firebase data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let filesLoaded = false;
    let foldersLoaded = false;

    const unsubFiles = subscribeUserFiles(
      user.uid,
      (newFiles) => {
        setFiles(newFiles);
        filesLoaded = true;
        if (foldersLoaded) setLoading(false);
      },
      (err) => {
        setErrorBanner(err.message);
        setLoading(false);
      }
    );

    const unsubFolders = subscribeUserFolders(
      user.uid,
      (newFolders) => {
        setFolders(newFolders);
        foldersLoaded = true;
        if (filesLoaded) setLoading(false);
      },
      (err) => {
        setErrorBanner(err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubFiles();
      unsubFolders();
    };
  }, [user]);

  // Clear selections on folder or filter change
  useEffect(() => {
    setSelectedFileIds(new Set());
    setSelectedFolderIds(new Set());
  }, [currentFolderId, filterCategory]);

  // Statistics calculation (strictly real data)
  const stats = useMemo(() => {
    const nonDeletedFiles = files.filter((f) => !f.deleted);
    const nonDeletedFolders = folders.filter((f) => !f.deleted);
    const deletedFiles = files.filter((f) => f.deleted);
    const deletedFolders = folders.filter((f) => f.deleted);

    const totalBytesUsed = nonDeletedFiles.reduce((acc, curr) => acc + (curr.size || 0), 0);
    const trashBytes = deletedFiles.reduce((acc, curr) => acc + (curr.size || 0), 0);

    return {
      fileCount: nonDeletedFiles.length,
      folderCount: nonDeletedFolders.length,
      storageUsedFormatted: formatBytes(totalBytesUsed),
      trashCount: deletedFiles.length + deletedFolders.length,
      trashBytesFormatted: formatBytes(trashBytes),
    };
  }, [files, folders]);

  // Filtered and sorted files & folders
  const isTrashView = filterCategory === 'trash';
  const isStarredView = filterCategory === 'starred';

  const { visibleFolders, visibleFiles } = useMemo(() => {
    let rawFolders = isTrashView
      ? folders.filter((f) => f.deleted)
      : folders.filter((f) => !f.deleted);

    let rawFiles = isTrashView
      ? files.filter((f) => f.deleted)
      : files.filter((f) => !f.deleted);

    // If Starred view
    if (isStarredView) {
      rawFolders = rawFolders.filter((f) => f.starred);
      rawFiles = rawFiles.filter((f) => f.starred);
    }
    // If inside a specific folder (and not searching across all or in trash/starred)
    else if (!isTrashView && !searchQuery.trim() && filterCategory === 'all') {
      rawFolders = rawFolders.filter(
        (f) => (f.parentFolderId || null) === (currentFolderId || null)
      );
      rawFiles = rawFiles.filter(
        (f) => (f.folderId || null) === (currentFolderId || null)
      );
    }

    // Category filter for files
    if (
      filterCategory !== 'all' &&
      filterCategory !== 'starred' &&
      filterCategory !== 'trash'
    ) {
      rawFolders = []; // hide folders when filtering by specific file extension
      rawFiles = rawFiles.filter((f) => {
        const cat = getFileCategory(f.mimeType, f.name);
        return cat === filterCategory;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rawFolders = rawFolders.filter((f) => f.name.toLowerCase().includes(q));
      rawFiles = rawFiles.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.extension && f.extension.toLowerCase().includes(q))
      );
    }

    // Sorting folders (folders sorted alphabetically)
    const sortedFolders = [...rawFolders].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );

    // Sorting files
    const sortedFiles = [...rawFiles].sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        case 'name-desc':
          return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'largest':
          return (b.size || 0) - (a.size || 0);
        case 'smallest':
          return (a.size || 0) - (b.size || 0);
        case 'type':
          return (a.extension || '').localeCompare(b.extension || '');
        default:
          return 0;
      }
    });

    return { visibleFolders: sortedFolders, visibleFiles: sortedFiles };
  }, [
    files,
    folders,
    currentFolderId,
    searchQuery,
    filterCategory,
    sortOption,
    isTrashView,
    isStarredView,
  ]);

  // Selections logic
  const totalVisibleCount = visibleFolders.length + visibleFiles.length;
  const selectedCount = selectedFileIds.size + selectedFolderIds.size;
  const allVisibleSelected =
    totalVisibleCount > 0 && selectedCount === totalVisibleCount;

  const handleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
    } else {
      setSelectedFileIds(new Set(visibleFiles.map((f) => f.id)));
      setSelectedFolderIds(new Set(visibleFolders.map((f) => f.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedFileIds(new Set());
    setSelectedFolderIds(new Set());
  };

  const toggleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const toggleSelectFolder = (folderId: string) => {
    setSelectedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // Upload Management
  const handleStartUpload = (
    filesToUpload: { file: File; customName?: string; replaceExistingId?: string }[]
  ) => {
    if (!user) return;

    filesToUpload.forEach(({ file, customName, replaceExistingId }) => {
      const uploadId = generateSafeId('upload');
      const targetFolder = currentFolderId;

      // Duplicate resolution: if replacing existing file, remove it first
      if (replaceExistingId) {
        const match = files.find((f) => f.id === replaceExistingId);
        if (match) {
          permanentDeleteFile(user.uid, match).catch(console.error);
        }
      }

      // Existing names for auto-rename if needed
      const existingNamesInFolder = files
        .filter((f) => !f.deleted && (f.folderId || null) === (targetFolder || null))
        .map((f) => f.name);

      const finalFilename = resolveDuplicateName(
        existingNamesInFolder,
        customName || file.name
      );

      const taskItem: FileUploadItem = {
        id: uploadId,
        file,
        name: finalFilename,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        folderId: targetFolder,
        progress: 0,
        bytesTransferred: 0,
        totalBytes: file.size,
        status: 'uploading',
      };

      try {
        const { promise, cancel, pause, resume } = uploadUserFile(
          user.uid,
          file,
          file.name,
          {
            folderId: targetFolder,
            customFilename: finalFilename,
            onProgress: (progress, bytesTransferred, totalBytes) => {
              setUploadQueue((prev) =>
                prev.map((item) =>
                  item.id === uploadId
                    ? { ...item, progress, bytesTransferred, totalBytes }
                    : item
                )
              );
            },
            onStatusChange: (status) => {
              setUploadQueue((prev) =>
                prev.map((item) =>
                  item.id === uploadId
                    ? { ...item, status }
                    : item
                )
              );
            },
          }
        );

        taskItem.cancelFn = cancel;
        taskItem.pauseFn = pause;
        taskItem.resumeFn = resume;

        setUploadQueue((prev) => [taskItem, ...prev]);

        promise
          .then(() => {
            setUploadQueue((prev) =>
              prev.map((item) =>
                item.id === uploadId
                  ? { ...item, status: 'completed', progress: 100 }
                  : item
              )
            );
          })
          .catch((err) => {
            setUploadQueue((prev) =>
              prev.map((item) =>
                item.id === uploadId
                  ? { ...item, status: 'failed', error: err.message }
                  : item
              )
            );
          });
      } catch (err: any) {
        taskItem.status = 'failed';
        taskItem.error = err.message || 'Upload initialization error';
        setUploadQueue((prev) => [taskItem, ...prev]);
      }
    });
  };

  const handleCancelUpload = (id: string) => {
    const item = uploadQueue.find((u) => u.id === id);
    item?.cancelFn?.();
    setUploadQueue((prev) => prev.filter((u) => u.id !== id));
  };

  const handlePauseUpload = (id: string) => {
    const item = uploadQueue.find((u) => u.id === id);
    item?.pauseFn?.();
    setUploadQueue((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'paused' } : u))
    );
  };

  const handleResumeUpload = (id: string) => {
    const item = uploadQueue.find((u) => u.id === id);
    item?.resumeFn?.();
    setUploadQueue((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'uploading' } : u))
    );
  };

  const handleRetryUpload = (id: string) => {
    const item = uploadQueue.find((u) => u.id === id);
    if (!item) return;
    setUploadQueue((prev) => prev.filter((u) => u.id !== id));
    handleStartUpload([{ file: item.file, customName: item.name }]);
  };

  // Folder Actions
  const handleOpenFolder = (folderId: string) => {
    setSearchQuery('');
    setCurrentFolderId(folderId);
  };

  const handleCreateOrRenameFolder = async (
    name: string,
    parentFolderId?: string | null
  ) => {
    if (!user) return;
    if (folderToRename) {
      await renameFolder(user.uid, folderToRename.id, name);
    } else {
      await createFolder(user.uid, name, parentFolderId);
    }
  };

  // File & Folder Renaming
  const handleStartRenameFile = (file: UserFile) => {
    setFileToRename(file);
    setRenameInputValue(file.name);
    setRenameInputOpen(true);
  };

  const handleConfirmRenameFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fileToRename) return;
    const clean = renameInputValue.trim();
    if (clean && clean !== fileToRename.name) {
      await renameFile(user.uid, fileToRename, clean);
    }
    setRenameInputOpen(false);
    setFileToRename(null);
  };

  // Move Actions
  const handleOpenMoveSingleFile = (file: UserFile) => {
    setItemsToMove({
      fileIds: [file.id],
      folderIds: [],
      names: [file.name],
    });
    setMoveModalOpen(true);
  };

  const handleOpenMoveSingleFolder = (folder: CloudFolder) => {
    setItemsToMove({
      fileIds: [],
      folderIds: [folder.id],
      names: [folder.name],
    });
    setMoveModalOpen(true);
  };

  const handleOpenBatchMove = () => {
    const fileNames = files
      .filter((f) => selectedFileIds.has(f.id))
      .map((f) => f.name);
    const folderNames = folders
      .filter((f) => selectedFolderIds.has(f.id))
      .map((f) => f.name);

    setItemsToMove({
      fileIds: Array.from(selectedFileIds),
      folderIds: Array.from(selectedFolderIds),
      names: [...folderNames, ...fileNames],
    });
    setMoveModalOpen(true);
  };

  const handleConfirmMove = async (targetFolderId: string | null) => {
    if (!user) return;
    await batchMove(
      user.uid,
      itemsToMove.fileIds,
      itemsToMove.folderIds,
      targetFolderId
    );
    handleClearSelection();
  };

  // Duplicate / Make a Copy
  const handleDuplicateFile = async (file: UserFile) => {
    if (!user) return;
    const existingNames = files.map((f) => f.name);
    try {
      await duplicateUserFile(user.uid, file, existingNames);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to make a copy');
    }
  };

  // Download File & Batch Zip Download
  const handleDownloadFile = async (file: UserFile) => {
    try {
      await downloadFile(file);
    } catch (err: any) {
      setErrorBanner(err.message || 'Download failed');
    }
  };

  const handleBatchZipDownload = async () => {
    const selectedFiles = files.filter((f) => selectedFileIds.has(f.id));
    if (selectedFiles.length === 0) return;
    try {
      await batchDownloadAsZip(selectedFiles);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to generate ZIP download');
    }
  };

  // Delete & Trash Management
  const handleOpenDeleteFile = (file: UserFile) => {
    if (isTrashView) {
      setDeleteModalState({
        isOpen: true,
        type: 'permanent-file',
        targetFile: file,
      });
    } else {
      setDeleteModalState({
        isOpen: true,
        type: 'soft-file',
        targetFile: file,
      });
    }
  };

  const handleOpenDeleteFolder = (folder: CloudFolder) => {
    const containedFiles = files.filter(
      (f) => !f.deleted && f.folderId === folder.id
    );

    if (isTrashView) {
      setDeleteModalState({
        isOpen: true,
        type: 'permanent-folder',
        targetFolder: folder,
      });
    } else {
      setDeleteModalState({
        isOpen: true,
        type: 'soft-folder',
        targetFolder: folder,
      });
    }
  };

  const handleOpenBatchDelete = () => {
    const selFiles = files.filter((f) => selectedFileIds.has(f.id));
    const selFolders = folders.filter((f) => selectedFolderIds.has(f.id));

    setDeleteModalState({
      isOpen: true,
      type: isTrashView ? 'permanent-batch' : 'soft-batch',
      targetFiles: selFiles,
      targetFolders: selFolders,
    });
  };

  const handleOpenEmptyTrash = () => {
    setDeleteModalState({
      isOpen: true,
      type: 'empty-trash',
    });
  };

  const handleConfirmDelete = async (options?: { folderAction?: 'cascade' | 'reparent' }) => {
    if (!user) return;

    const { type, targetFile, targetFolder, targetFiles, targetFolders } = deleteModalState;

    if (type === 'soft-file' && targetFile) {
      await softDeleteFile(user.uid, targetFile);
    } else if (type === 'soft-folder' && targetFolder) {
      const contained = files.filter(
        (f) => !f.deleted && f.folderId === targetFolder.id
      );
      if (options?.folderAction === 'reparent') {
        // Move contained files to folder's parent
        const parentId = targetFolder.parentFolderId || null;
        await batchMove(user.uid, contained.map((f) => f.id), [], parentId);
        await softDeleteFolder(user.uid, targetFolder.id, []);
      } else {
        await softDeleteFolder(user.uid, targetFolder.id, contained);
      }
    } else if (type === 'soft-batch') {
      await batchSoftDelete(
        user.uid,
        targetFiles || [],
        targetFolders || []
      );
      handleClearSelection();
    } else if (type === 'permanent-file' && targetFile) {
      await permanentDeleteFile(user.uid, targetFile);
    } else if (type === 'permanent-folder' && targetFolder) {
      await permanentDeleteFolder(user.uid, targetFolder.id, files, folders);
    } else if (type === 'permanent-batch') {
      if (targetFiles) {
        for (const f of targetFiles) {
          await permanentDeleteFile(user.uid, f);
        }
      }
      if (targetFolders) {
        for (const fold of targetFolders) {
          await permanentDeleteFolder(user.uid, fold.id, files, folders);
        }
      }
      handleClearSelection();
    } else if (type === 'empty-trash') {
      const trashFiles = files.filter((f) => f.deleted);
      const trashFolders = folders.filter((f) => f.deleted);
      for (const f of trashFiles) {
        await permanentDeleteFile(user.uid, f);
      }
      for (const fold of trashFolders) {
        await permanentDeleteFolder(user.uid, fold.id, files, folders);
      }
    }
  };

  // Restore Actions
  const existingFolderIds = useMemo(() => {
    return new Set(folders.filter((f) => !f.deleted).map((f) => f.id));
  }, [folders]);

  const handleRestoreFile = async (file: UserFile) => {
    if (!user) return;
    const { restoredToRoot } = await restoreFile(user.uid, file, existingFolderIds);
    if (restoredToRoot) {
      setErrorBanner(`File restored to Root (original folder no longer exists).`);
    }
  };

  const handleRestoreFolder = async (folder: CloudFolder) => {
    if (!user) return;
    const containedFiles = files.filter((f) => f.deleted && f.previousFolderId === folder.id);
    const { restoredToRoot } = await restoreFolder(
      user.uid,
      folder,
      existingFolderIds,
      containedFiles
    );
    if (restoredToRoot) {
      setErrorBanner(`Folder restored to Root (original parent folder no longer exists).`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              My Files
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Phase 9 • Cloud Storage
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Securely store, organize and manage your student files.
          </p>
        </div>

        {/* Real Summary Stats Bar (No fake limits or quotas) */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-2xs text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-bold">{stats.storageUsedFormatted}</span>
            <span className="text-slate-600 dark:text-slate-400">used</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="font-bold">{stats.fileCount}</span>
            <span className="text-slate-600 dark:text-slate-400">files</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="font-bold">{stats.folderCount}</span>
            <span className="text-slate-600 dark:text-slate-400">folders</span>
          </div>
        </div>
      </div>

      {/* Error / Notification banner */}
      {errorBanner && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Toolbar: Search, Filters, Sort, View mode, Action buttons */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
        <FolderBreadcrumbs
          currentFolderId={currentFolderId}
          folders={folders.filter((f) => !f.deleted)}
          onNavigateToFolder={(fId) => {
            setSearchQuery('');
            setFilterCategory('all');
            setCurrentFolderId(fId);
          }}
          isTrashView={isTrashView}
        />

        <FileToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterCategory={filterCategory}
          onFilterChange={(cat) => {
            setFilterCategory(cat);
            if (cat === 'trash' || cat === 'starred') {
              setCurrentFolderId(null);
            }
          }}
          sortOption={sortOption}
          onSortChange={setSortOption}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onUploadClick={() => setIsUploadModalOpen(true)}
          onNewFolderClick={() => {
            setFolderToRename(null);
            setFolderModalOpen(true);
          }}
          selectedCount={selectedCount}
          totalVisibleCount={totalVisibleCount}
          onSelectAll={handleSelectAllVisible}
          onClearSelection={handleClearSelection}
          onBatchDelete={handleOpenBatchDelete}
          onBatchMove={handleOpenBatchMove}
          onBatchZipDownload={handleBatchZipDownload}
          onEmptyTrash={handleOpenEmptyTrash}
          isTrashView={isTrashView}
        />
      </div>

      {/* Main Content Area: Folder Tree Sidebar + File Display (List/Grid) */}
      <div className="flex gap-6 items-start">
        {/* Optional Collapsible Folder Sidebar */}
        <FolderTreeSidebar
          folders={folders}
          files={files}
          currentFolderId={currentFolderId}
          onSelectFolder={(fId) => {
            setSearchQuery('');
            setCurrentFolderId(fId);
          }}
          onOpenNewFolderModal={(parent) => {
            setFolderToRename(null);
            setCurrentFolderId(parent || null);
            setFolderModalOpen(true);
          }}
          filterCategory={filterCategory}
          onSelectFilter={setFilterCategory}
        />

        {/* File and Folder Listing View */}
        <div className="flex-1 min-w-0">
          {viewMode === 'list' ? (
            <FileList
              files={visibleFiles}
              folders={visibleFolders}
              selectedFileIds={selectedFileIds}
              selectedFolderIds={selectedFolderIds}
              onToggleSelectFile={toggleSelectFile}
              onToggleSelectFolder={toggleSelectFolder}
              onSelectAllVisible={handleSelectAllVisible}
              allVisibleSelected={allVisibleSelected}
              onOpenFolder={handleOpenFolder}
              onOpenFile={setPreviewFile}
              onPreviewFile={setPreviewFile}
              onDownloadFile={handleDownloadFile}
              onRenameFile={handleStartRenameFile}
              onRenameFolder={(folder) => {
                setFolderToRename(folder);
                setFolderModalOpen(true);
              }}
              onMoveFile={handleOpenMoveSingleFile}
              onMoveFolder={handleOpenMoveSingleFolder}
              onDuplicateFile={handleDuplicateFile}
              onViewDetails={setDetailsFile}
              onDeleteFile={handleOpenDeleteFile}
              onDeleteFolder={handleOpenDeleteFolder}
              onRestoreFile={handleRestoreFile}
              onRestoreFolder={handleRestoreFolder}
              onToggleStarFile={(f) => toggleStarFile(user!.uid, f.id, f.starred)}
              onToggleStarFolder={(fold) => toggleStarFolder(user!.uid, fold.id, fold.starred)}
              isTrashView={isTrashView}
            />
          ) : (
            <FileGrid
              files={visibleFiles}
              folders={visibleFolders}
              selectedFileIds={selectedFileIds}
              selectedFolderIds={selectedFolderIds}
              onToggleSelectFile={toggleSelectFile}
              onToggleSelectFolder={toggleSelectFolder}
              onOpenFolder={handleOpenFolder}
              onOpenFile={setPreviewFile}
              onPreviewFile={setPreviewFile}
              onDownloadFile={handleDownloadFile}
              onRenameFile={handleStartRenameFile}
              onRenameFolder={(folder) => {
                setFolderToRename(folder);
                setFolderModalOpen(true);
              }}
              onMoveFile={handleOpenMoveSingleFile}
              onMoveFolder={handleOpenMoveSingleFolder}
              onDuplicateFile={handleDuplicateFile}
              onViewDetails={setDetailsFile}
              onDeleteFile={handleOpenDeleteFile}
              onDeleteFolder={handleOpenDeleteFolder}
              onRestoreFile={handleRestoreFile}
              onRestoreFolder={handleRestoreFolder}
              onToggleStarFile={(f) => toggleStarFile(user!.uid, f.id, f.starred)}
              onToggleStarFolder={(fold) => toggleStarFolder(user!.uid, fold.id, fold.starred)}
              isTrashView={isTrashView}
            />
          )}
        </div>
      </div>

      {/* Upload Drop Modal */}
      <UploadDropModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        targetFolderId={currentFolderId}
        folders={folders}
        existingFiles={files}
        onStartUpload={handleStartUpload}
      />

      {/* Upload Queue Dock */}
      <UploadQueueDrawer
        uploadQueue={uploadQueue}
        onCancelUpload={handleCancelUpload}
        onPauseUpload={handlePauseUpload}
        onResumeUpload={handleResumeUpload}
        onRetryUpload={handleRetryUpload}
        onDismissCompleted={() => {
          setUploadQueue((prev) =>
            prev.filter((u) => u.status !== 'completed' && u.status !== 'canceled')
          );
        }}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        onDownload={handleDownloadFile}
      />

      {/* File Details Drawer */}
      <FileDetailsDrawer
        isOpen={!!detailsFile}
        onClose={() => setDetailsFile(null)}
        file={detailsFile}
        folders={folders}
        onPreview={(f) => {
          setDetailsFile(null);
          setPreviewFile(f);
        }}
        onDownload={handleDownloadFile}
        onRename={(f) => {
          setDetailsFile(null);
          handleStartRenameFile(f);
        }}
        onMove={(f) => {
          setDetailsFile(null);
          handleOpenMoveSingleFile(f);
        }}
        onDuplicate={(f) => {
          setDetailsFile(null);
          handleDuplicateFile(f);
        }}
        onToggleStar={(f) => toggleStarFile(user!.uid, f.id, f.starred)}
        onDelete={(f) => {
          setDetailsFile(null);
          handleOpenDeleteFile(f);
        }}
      />

      {/* Folder Create/Rename Modal */}
      <FolderModal
        isOpen={folderModalOpen}
        onClose={() => {
          setFolderModalOpen(false);
          setFolderToRename(null);
        }}
        folderToRename={folderToRename}
        parentFolderId={currentFolderId}
        folders={folders}
        onSubmit={handleCreateOrRenameFolder}
      />

      {/* Move Destination Modal */}
      <MoveModal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        folders={folders}
        itemNames={itemsToMove.names}
        movingFolderIds={itemsToMove.folderIds}
        onConfirmMove={handleConfirmMove}
      />

      {/* Delete / Trash Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() =>
          setDeleteModalState((prev) => ({ ...prev, isOpen: false }))
        }
        type={deleteModalState.type}
        itemCount={
          (deleteModalState.targetFiles?.length || 0) +
          (deleteModalState.targetFolders?.length || 0) || 1
        }
        itemNames={[
          deleteModalState.targetFile?.name ||
            deleteModalState.targetFolder?.name ||
            '',
        ]}
        containedFilesCount={
          deleteModalState.targetFolder
            ? files.filter(
                (f) =>
                  !f.deleted &&
                  f.folderId === deleteModalState.targetFolder!.id
              ).length
            : 0
        }
        onConfirm={handleConfirmDelete}
      />

      {/* Quick Rename File Dialog */}
      {renameInputOpen && fileToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Rename File
            </h3>
            <form onSubmit={handleConfirmRenameFile} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRenameInputOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
