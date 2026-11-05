import { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Star,
  Trash2,
  HardDrive,
  FolderPlus,
} from 'lucide-react';
import { CloudFolder, UserFile } from '../../types/index.ts';

interface FolderTreeSidebarProps {
  folders: CloudFolder[];
  files: UserFile[];
  currentFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onOpenNewFolderModal: (parentFolderId?: string | null) => void;
  filterCategory: string;
  onSelectFilter: (cat: any) => void;
}

export function FolderTreeSidebar({
  folders,
  files,
  currentFolderId,
  onSelectFolder,
  onOpenNewFolderModal,
  filterCategory,
  onSelectFilter,
}: FolderTreeSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Only active (non-deleted) folders
  const activeFolders = folders.filter((f) => !f.deleted);
  const activeFiles = files.filter((f) => !f.deleted);

  // Group folders by parentFolderId
  const getSubfolders = (parentId: string | null) => {
    return activeFolders.filter((f) => (f.parentFolderId || null) === parentId);
  };

  // File count in a specific folder
  const getFileCount = (folderId: string | null) => {
    return activeFiles.filter((f) => (f.folderId || null) === folderId).length;
  };

  const renderFolderItem = (folder: CloudFolder, depth = 0) => {
    const subfolders = getSubfolders(folder.id);
    const hasChildren = subfolders.length > 0;
    const isExpanded = expandedIds.has(folder.id);
    const isSelected = currentFolderId === folder.id && filterCategory !== 'trash' && filterCategory !== 'starred';
    const count = getFileCount(folder.id);

    return (
      <div key={folder.id} className="select-none">
        <div
          onClick={() => {
            onSelectFilter('all');
            onSelectFolder(folder.id);
          }}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-colors ${
            isSelected
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(folder.id, e)}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}

            {isSelected || isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}

            <span className="truncate">{folder.name}</span>
          </div>

          <span className="text-[10px] text-slate-400 opacity-70 group-hover:opacity-100 font-mono">
            {count}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {subfolders.map((sub) => renderFolderItem(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootSubfolders = getSubfolders(null);
  const rootFilesCount = getFileCount(null);
  const starredCount = activeFiles.filter((f) => f.starred).length;
  const trashCount = files.filter((f) => f.deleted).length + folders.filter((f) => f.deleted).length;

  return (
    <div className="w-56 shrink-0 flex flex-col space-y-4 pr-3 border-r border-slate-200 dark:border-slate-800 hidden md:flex">
      {/* Action to create new folder */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Folders
        </span>
        <button
          type="button"
          onClick={() => onOpenNewFolderModal(currentFolderId)}
          className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Create New Folder"
        >
          <FolderPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Primary root navigation */}
      <div className="space-y-0.5">
        <div
          onClick={() => {
            onSelectFilter('all');
            onSelectFolder(null);
          }}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
            currentFolderId === null && filterCategory === 'all'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
            <span>Root (All Files)</span>
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            {rootFilesCount}
          </span>
        </div>

        {/* Tree of user created folders */}
        <div className="pt-1 space-y-0.5">
          {rootSubfolders.map((folder) => renderFolderItem(folder, 0))}
        </div>
      </div>

      {/* Quick Filters: Starred & Trash */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-2.5 block mb-1">
          Views
        </span>

        <button
          type="button"
          onClick={() => onSelectFilter('starred')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            filterCategory === 'starred'
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            <span>Favorites</span>
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            {starredCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter('trash')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            filterCategory === 'trash'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Trash</span>
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            {trashCount}
          </span>
        </button>
      </div>
    </div>
  );
}
