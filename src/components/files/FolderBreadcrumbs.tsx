import React from 'react';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { CloudFolder } from '../../types/index.ts';

interface FolderBreadcrumbsProps {
  currentFolderId: string | null;
  folders: CloudFolder[];
  onNavigateToFolder: (folderId: string | null) => void;
  isTrashView?: boolean;
}

export function FolderBreadcrumbs({
  currentFolderId,
  folders,
  onNavigateToFolder,
  isTrashView = false,
}: FolderBreadcrumbsProps) {
  if (isTrashView) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 py-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => onNavigateToFolder(null)}
          className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>My Files</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-rose-600 dark:text-rose-400 font-bold">Trash</span>
      </div>
    );
  }

  // Build ancestral chain from currentFolderId back to root
  const chain: CloudFolder[] = [];
  let curr = currentFolderId ? folders.find((f) => f.id === currentFolderId) : null;
  const visited = new Set<string>();

  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    chain.unshift(curr);
    curr = curr.parentFolderId ? folders.find((f) => f.id === curr!.parentFolderId) : null;
  }

  return (
    <nav aria-label="Folder Breadcrumb" className="flex items-center gap-1.5 text-xs py-1 overflow-x-auto no-scrollbar">
      <button
        type="button"
        onClick={() => onNavigateToFolder(null)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer font-medium ${
          currentFolderId === null
            ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
        }`}
      >
        <Home className="w-3.5 h-3.5" />
        <span>My Files</span>
      </button>

      {chain.map((folder, index) => {
        const isLast = index === chain.length - 1;
        return (
          <React.Fragment key={folder.id}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <button
              type="button"
              onClick={() => onNavigateToFolder(folder.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors truncate max-w-[140px] cursor-pointer ${
                isLast
                  ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium'
              }`}
              title={folder.name}
            >
              <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
