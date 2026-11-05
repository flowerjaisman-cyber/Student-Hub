import React from 'react';
import {
  Search,
  X,
  UploadCloud,
  FolderPlus,
  LayoutList,
  LayoutGrid,
  ArrowUpDown,
  Filter,
  Trash2,
  Download,
  FolderInput,
  CheckSquare,
  Square,
  Archive,
} from 'lucide-react';
import {
  FileSortOption,
  FileFilterCategory,
  FileViewMode,
} from '../../types/index.ts';

interface FileToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterCategory: FileFilterCategory;
  onFilterChange: (cat: FileFilterCategory) => void;
  sortOption: FileSortOption;
  onSortChange: (sort: FileSortOption) => void;
  viewMode: FileViewMode;
  onViewModeChange: (mode: FileViewMode) => void;
  onUploadClick: () => void;
  onNewFolderClick: () => void;
  selectedCount: number;
  totalVisibleCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchDelete: () => void;
  onBatchMove: () => void;
  onBatchZipDownload: () => void;
  onEmptyTrash: () => void;
  isTrashView?: boolean;
}

export function FileToolbar({
  searchQuery,
  onSearchChange,
  filterCategory,
  onFilterChange,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  onUploadClick,
  onNewFolderClick,
  selectedCount,
  totalVisibleCount,
  onSelectAll,
  onClearSelection,
  onBatchDelete,
  onBatchMove,
  onBatchZipDownload,
  onEmptyTrash,
  isTrashView = false,
}: FileToolbarProps) {
  const filterPills: { id: FileFilterCategory; label: string }[] = [
    { id: 'all', label: 'All Files' },
    { id: 'documents', label: 'Documents' },
    { id: 'pdf', label: 'PDFs' },
    { id: 'images', label: 'Images' },
    { id: 'spreadsheets', label: 'Sheets' },
    { id: 'presentations', label: 'Slides' },
    { id: 'text', label: 'Text' },
    { id: 'archives', label: 'Archives' },
    { id: 'starred', label: 'Favorites' },
    { id: 'trash', label: 'Trash' },
  ];

  return (
    <div className="space-y-3">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search files by name, type, or extension..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isTrashView ? (
            <button
              type="button"
              onClick={onEmptyTrash}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onNewFolderClick}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>New Folder</span>
              </button>

              <button
                type="button"
                onClick={onUploadClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Files</span>
              </button>
            </>
          )}

          {/* Sort dropdown */}
          <div className="relative inline-flex items-center">
            <select
              aria-label="Sort Files By"
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as FileSortOption)}
              className="appearance-none pl-7 pr-7 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="largest">Largest first</option>
              <option value="smallest">Smallest first</option>
              <option value="type">File Type</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        {filterPills.map((pill) => {
          const isActive = filterCategory === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => onFilterChange(pill.id)}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer font-medium ${
                isActive
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Batch selection bar (appears when items are selected) */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-900 dark:text-indigo-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-bold">{selectedCount}</span>
            <span>selected</span>
            <span className="text-indigo-300 dark:text-indigo-700">•</span>
            {selectedCount < totalVisibleCount ? (
              <button
                type="button"
                onClick={onSelectAll}
                className="font-semibold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer"
              >
                Select all ({totalVisibleCount})
              </button>
            ) : (
              <button
                type="button"
                onClick={onClearSelection}
                className="font-semibold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isTrashView && (
              <>
                <button
                  type="button"
                  onClick={onBatchZipDownload}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Download selected files as a ZIP archive"
                >
                  <Archive className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Download ZIP</span>
                </button>
                <button
                  type="button"
                  onClick={onBatchMove}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <FolderInput className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Move</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onBatchDelete}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isTrashView ? 'Delete Permanently' : 'Delete'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
