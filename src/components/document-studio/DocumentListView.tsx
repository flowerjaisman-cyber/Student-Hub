import { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Plus,
  Upload,
  Search,
  ArrowUpDown,
  MoreVertical,
  Calendar,
  Download,
  Copy,
  Pencil,
  Trash2,
  Folder,
  FolderOpen,
  FolderRoot,
  Star,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  FileCode,
  FileType,
  Clock,
  Sparkles,
  Layers,
  BookOpen,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { UserDocument, CloudFolder } from '../../types/index.ts';

interface DocumentListViewProps {
  documents: UserDocument[];
  folders: CloudFolder[];
  isLoading: boolean;
  onOpenDocument: (doc: UserDocument) => void;
  onNewDocument: () => void;
  onImportClick: () => void;
  onRenameDocument: (doc: UserDocument, newTitle: string) => Promise<void>;
  onDuplicateDocument: (doc: UserDocument) => Promise<void>;
  onToggleStarDocument: (doc: UserDocument) => Promise<void>;
  onMoveDocumentClick: (doc: UserDocument) => void;
  onExportDocumentClick: (doc: UserDocument) => void;
  onTrashDocument: (docId: string) => Promise<void>;
  onRestoreDocument: (docId: string) => Promise<void>;
  onPermanentDeleteDocument: (docId: string) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
}

const CATEGORIES = [
  'All',
  'Study Notes',
  'Assignment',
  'Project Report',
  'Class Summary',
  'Meeting Notes',
  'Personal Notes',
  'Starred',
  'Trash',
];

export function DocumentListView({
  documents,
  folders,
  isLoading,
  onOpenDocument,
  onNewDocument,
  onImportClick,
  onRenameDocument,
  onDuplicateDocument,
  onToggleStarDocument,
  onMoveDocumentClick,
  onExportDocumentClick,
  onTrashDocument,
  onRestoreDocument,
  onPermanentDeleteDocument,
  onEmptyTrash,
}: DocumentListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title-asc' | 'title-desc' | 'words'>('updated');

  // View mode preference stored in localStorage
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('studenthub_docs_view_mode') as 'grid' | 'list') || 'grid';
  });

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('studenthub_docs_view_mode', mode);
  };

  // Menu states
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState<UserDocument | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<UserDocument | null>(null);
  const [deleteMode, setDeleteMode] = useState<'trash' | 'permanent'>('trash');
  const [isDeleting, setIsDeleting] = useState(false);

  // Empty trash modal
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);

  // Split documents into active vs trashed
  const activeDocs = useMemo(() => {
    return documents.filter((d) => !d.deleted && !d.isTrashed);
  }, [documents]);

  const trashedDocs = useMemo(() => {
    return documents.filter((d) => d.deleted || d.isTrashed);
  }, [documents]);

  // Aggregate user statistics
  const stats = useMemo(() => {
    let totalWords = 0;
    let totalReadingTime = 0;
    let starredCount = 0;

    activeDocs.forEach((d) => {
      totalWords += d.wordCount || 0;
      totalReadingTime += d.readingTimeMinutes || 0;
      if (d.starred || d.isStarred) starredCount++;
    });

    return {
      activeCount: activeDocs.length,
      trashCount: trashedDocs.length,
      starredCount,
      totalWords,
      totalReadingTime,
    };
  }, [activeDocs, trashedDocs]);

  // Filter & Sort
  const filteredDocs = useMemo(() => {
    const isTrashTab = selectedCategory === 'Trash';
    let baseList = isTrashTab ? trashedDocs : activeDocs;

    if (selectedCategory === 'Starred') {
      baseList = baseList.filter((d) => d.starred || d.isStarred);
    } else if (selectedCategory !== 'All' && selectedCategory !== 'Trash') {
      baseList = baseList.filter((d) => {
        const cat = (d.category || '').toLowerCase();
        const sel = selectedCategory.toLowerCase();
        return cat.includes(sel) || sel.includes(cat);
      });
    }

    // Folder filter
    if (selectedFolderId !== 'all') {
      if (selectedFolderId === 'root') {
        baseList = baseList.filter((d) => !d.folderId);
      } else {
        baseList = baseList.filter((d) => d.folderId === selectedFolderId);
      }
    }

    // Search query across title and stripped content
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      baseList = baseList.filter((d) => {
        return (
          d.title.toLowerCase().includes(q) ||
          (d.content && d.content.toLowerCase().includes(q))
        );
      });
    }

    // Sorting
    return [...baseList].sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      if (sortBy === 'words') {
        return (b.wordCount || 0) - (a.wordCount || 0);
      }
      return 0;
    });
  }, [activeDocs, trashedDocs, selectedCategory, selectedFolderId, searchQuery, sortBy]);

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameTitle.trim()) return;

    setIsRenaming(true);
    try {
      await onRenameDocument(renameTarget, renameTitle.trim());
      setRenameTarget(null);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      if (deleteMode === 'trash') {
        await onTrashDocument(deleteTarget.id);
      } else {
        await onPermanentDeleteDocument(deleteTarget.id);
      }
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmEmptyTrash = async () => {
    setIsEmptyingTrash(true);
    try {
      await onEmptyTrash();
      setShowEmptyTrashModal(false);
    } finally {
      setIsEmptyingTrash(false);
    }
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div id="document-studio-list" className="space-y-6">
      {/* 1. Header & Live Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Documents</span>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {stats.activeCount}
          </p>
          <p className="text-[10px] text-slate-400">Total active files</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Star className="w-4 h-4 fill-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Starred</span>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {stats.starredCount}
          </p>
          <p className="text-[10px] text-slate-400">Favorited notes</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Words</span>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {stats.totalWords.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400">Written content</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Reading Time</span>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            ~{stats.totalReadingTime} min
          </p>
          <p className="text-[10px] text-slate-400">Estimated reading</p>
        </div>
      </div>

      {/* 2. Top Controls & Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Folder Filter, Sort, View Mode, New, Import */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Folder filter */}
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="all">All Folders</option>
            <option value="root">Root only</option>
            {folders
              .filter((f) => !f.deleted)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="updated">Recently Modified</option>
            <option value="created">Recently Created</option>
            <option value="title-asc">Title (A &rarr; Z)</option>
            <option value="title-desc">Title (Z &rarr; A)</option>
            <option value="words">Word Count</option>
          </select>

          {/* View Mode (Grid vs List) */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => handleSetViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('list')}
              title="List View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Import Button */}
          <button
            type="button"
            onClick={onImportClick}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* New Document Button */}
          <button
            type="button"
            onClick={onNewDocument}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* 3. Category Tabs + Empty Trash button */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto gap-2">
        <div className="flex items-center gap-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === 'All'
                ? stats.activeCount
                : cat === 'Starred'
                ? stats.starredCount
                : cat === 'Trash'
                ? stats.trashCount
                : activeDocs.filter((d) => (d.category || '').toLowerCase().includes(cat.toLowerCase())).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? cat === 'Trash'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      : 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {selectedCategory === 'Trash' && trashedDocs.length > 0 && (
          <button
            type="button"
            onClick={() => setShowEmptyTrashModal(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      {/* 4. Document Grid / List */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          Loading documents...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto">
            {selectedCategory === 'Trash' ? (
              <Trash2 className="w-6 h-6 text-slate-400" />
            ) : selectedCategory === 'Starred' ? (
              <Star className="w-6 h-6 text-amber-500" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {selectedCategory === 'Trash'
                ? 'Trash is empty'
                : selectedCategory === 'Starred'
                ? 'No starred documents'
                : searchQuery
                ? 'No documents match your search'
                : 'No documents yet.'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {selectedCategory === 'Trash'
                ? 'Documents deleted from your studio will appear here before permanent removal.'
                : selectedCategory === 'Starred'
                ? 'Star important notes, study sheets, and coursework to access them quickly.'
                : searchQuery
                ? 'Try a different search keyword or clear the search filter.'
                : 'Create your first academic notes, assignment draft, or project report.'}
            </p>
          </div>
          {selectedCategory !== 'Trash' && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={onNewDocument}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Document</span>
              </button>
              <button
                type="button"
                onClick={onImportClick}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-500" />
                <span>Import File</span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocs.map((docItem) => {
            const folderObj = folders.find((f) => f.id === docItem.folderId);
            const isTrashed = docItem.deleted || docItem.isTrashed;
            const isStarred = docItem.starred || docItem.isStarred;

            return (
              <div
                key={docItem.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-150 flex flex-col justify-between group shadow-2xs relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div
                      onClick={() => !isTrashed && onOpenDocument(docItem)}
                      className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 cursor-pointer group-hover:scale-105 transition-transform"
                    >
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Star button */}
                      {!isTrashed && (
                        <button
                          type="button"
                          onClick={() => onToggleStarDocument(docItem)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                          title={isStarred ? 'Unstar document' : 'Star document'}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isStarred ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                      )}

                      {/* Dropdown Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuDocId(
                              activeMenuDocId === docItem.id ? null : docItem.id
                            )
                          }
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuDocId === docItem.id && (
                          <div
                            className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-20 py-1 text-xs animate-in fade-in"
                            onMouseLeave={() => setActiveMenuDocId(null)}
                          >
                            {!isTrashed ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onOpenDocument(docItem);
                                    setActiveMenuDocId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Open Editor</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRenameTarget(docItem);
                                    setRenameTitle(docItem.title);
                                    setActiveMenuDocId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDuplicateDocument(docItem);
                                    setActiveMenuDocId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Duplicate</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onMoveDocumentClick(docItem);
                                    setActiveMenuDocId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Move to Folder</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onExportDocumentClick(docItem);
                                    setActiveMenuDocId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Export / Download</span>
                                </button>
                                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteTarget(docItem);
                                    setDeleteMode('trash');
                                    setActiveMenuDocId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Move to Trash</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRestoreDocument(docItem.id);
                                    setActiveMenuDocId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2 cursor-pointer font-semibold"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Restore Document</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteTarget(docItem);
                                    setDeleteMode('permanent');
                                    setActiveMenuDocId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer font-semibold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Forever</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h4
                    onClick={() => !isTrashed && onOpenDocument(docItem)}
                    className="text-xs font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {docItem.title}
                  </h4>

                  {/* Metadata tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      {docItem.category || 'Study Notes'}
                    </span>
                    {folderObj ? (
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 truncate max-w-[120px]">
                        <Folder className="w-3 h-3 shrink-0" />
                        <span className="truncate">{folderObj.name}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Root</span>
                    )}
                  </div>
                </div>

                {/* Footer stats & Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>{docItem.wordCount || 0} words</span>
                    <span>&bull;</span>
                    <span>{formatDate(docItem.updatedAt)}</span>
                  </div>

                  {!isTrashed ? (
                    <button
                      type="button"
                      onClick={() => onOpenDocument(docItem)}
                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-xs cursor-pointer"
                    >
                      Open &rarr;
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRestoreDocument(docItem.id)}
                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-xs cursor-pointer"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs divide-y divide-slate-100 dark:divide-slate-800">
          {filteredDocs.map((docItem) => {
            const folderObj = folders.find((f) => f.id === docItem.folderId);
            const isTrashed = docItem.deleted || docItem.isTrashed;
            const isStarred = docItem.starred || docItem.isStarred;

            return (
              <div
                key={docItem.id}
                className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-3 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {!isTrashed && (
                    <button
                      type="button"
                      onClick={() => onToggleStarDocument(docItem)}
                      className="text-slate-300 hover:text-amber-400 cursor-pointer shrink-0"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isStarred ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                  )}

                  <div
                    onClick={() => !isTrashed && onOpenDocument(docItem)}
                    className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4
                      onClick={() => !isTrashed && onOpenDocument(docItem)}
                      className="text-xs font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {docItem.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-semibold text-slate-500">
                        {docItem.category || 'Study Notes'}
                      </span>
                      <span>&bull;</span>
                      <span>{docItem.wordCount || 0} words</span>
                      <span>&bull;</span>
                      {folderObj ? (
                        <span className="text-amber-600 dark:text-amber-400">{folderObj.name}</span>
                      ) : (
                        <span>Root</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {formatDate(docItem.updatedAt)}
                  </span>

                  {!isTrashed ? (
                    <button
                      type="button"
                      onClick={() => onOpenDocument(docItem)}
                      className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 cursor-pointer"
                    >
                      Open
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRestoreDocument(docItem.id)}
                      className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 cursor-pointer"
                    >
                      Restore
                    </button>
                  )}

                  {/* More options button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isTrashed) {
                        setDeleteTarget(docItem);
                        setDeleteMode('permanent');
                      } else {
                        onExportDocumentClick(docItem);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={isTrashed ? 'Delete Forever' : 'Export'}
                  >
                    {isTrashed ? <Trash2 className="w-4 h-4 text-rose-500" /> : <Download className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleConfirmRename}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Rename Document</h3>
            <input
              type="text"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                disabled={isRenaming}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRenaming}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isRenaming ? 'Renaming...' : 'Rename'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete / Trash Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {deleteMode === 'trash' ? 'Move to Trash?' : 'Delete Permanently?'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {deleteMode === 'trash'
                ? `"${deleteTarget.title}" will be moved to Trash. You can restore it anytime.`
                : `Are you sure you want to permanently delete "${deleteTarget.title}"? This cannot be undone.`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isDeleting
                  ? 'Deleting...'
                  : deleteMode === 'trash'
                  ? 'Move to Trash'
                  : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {showEmptyTrashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Empty Trash?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This will permanently delete all {trashedDocs.length} document{trashedDocs.length === 1 ? '' : 's'} in your Trash. This action cannot be reversed.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEmptyTrashModal(false)}
                disabled={isEmptyingTrash}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEmptyTrash}
                disabled={isEmptyingTrash}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isEmptyingTrash ? 'Emptying...' : 'Empty Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
