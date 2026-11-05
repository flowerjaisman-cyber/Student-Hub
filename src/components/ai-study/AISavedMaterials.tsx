import React, { useState } from 'react';
import {
  Bookmark,
  Search,
  Star,
  Trash2,
  Edit2,
  Eye,
  Copy,
  Check,
  Layers,
  HelpCircle,
  Calendar,
  FileText,
  StickyNote,
  Sparkles,
  X,
} from 'lucide-react';
import { AIStudyMaterial, FlashcardCard, QuizQuestion } from '../../types/index.ts';
import {
  toggleStarUserAIMaterial,
  renameUserAIMaterial,
  deleteUserAIMaterial,
} from '../../services/aiStudyService.ts';

interface AISavedMaterialsProps {
  userId: string;
  materials: AIStudyMaterial[];
  onRefreshMaterials?: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const AISavedMaterials: React.FC<AISavedMaterialsProps> = ({
  userId,
  materials,
  onRefreshMaterials,
  onSuccessToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item for detail view modal
  const [detailItem, setDetailItem] = useState<AIStudyMaterial | null>(null);

  // Rename modal state
  const [renameItem, setRenameItem] = useState<AIStudyMaterial | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Delete modal state
  const [deleteItem, setDeleteItem] = useState<AIStudyMaterial | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStar = async (item: AIStudyMaterial) => {
    try {
      await toggleStarUserAIMaterial(userId, item.id, !item.isStarred);
      onRefreshMaterials?.();
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleRename = async () => {
    if (!renameItem || !newTitle.trim()) return;
    try {
      await renameUserAIMaterial(userId, renameItem.id, newTitle.trim());
      setRenameItem(null);
      onRefreshMaterials?.();
      onSuccessToast?.('Renamed study material.');
    } catch (err) {
      console.error('Failed to rename:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteUserAIMaterial(userId, deleteItem.id);
      setDeleteItem(null);
      if (detailItem?.id === deleteItem.id) setDetailItem(null);
      onRefreshMaterials?.();
      onSuccessToast?.('Removed from My Study Materials.');
    } catch (err) {
      console.error('Failed to delete material:', err);
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesCategory =
      activeCategory === 'all' ||
      m.category === activeCategory ||
      (activeCategory === 'starred' && m.isStarred);
    const matchesSearch =
      !searchQuery.trim() ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flashcards':
        return <Layers className="w-4 h-4 text-teal-500" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-purple-500" />;
      case 'study-plan':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'notes-summary':
        return <StickyNote className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved flashcards, quizzes, study plans..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {filteredMaterials.length} Saved {filteredMaterials.length === 1 ? 'Item' : 'Items'}
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          {[
            { id: 'all', label: 'All Materials' },
            { id: 'starred', label: 'Starred' },
            { id: 'flashcards', label: 'Flashcard Decks' },
            { id: 'quiz', label: 'Quiz Results' },
            { id: 'study-plan', label: 'Study Plans' },
            { id: 'summary', label: 'Summaries' },
            { id: 'explanation', label: 'Explanations' },
            { id: 'notes-summary', label: 'Notes Guides' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Saved Materials */}
      {filteredMaterials.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            No Saved Materials Found
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Save flashcard decks, quiz results, explanations, and study plans to access them anytime.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 capitalize">
                      {item.category.replace('-', ' ')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStar(item)}
                    className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        item.isStarred
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                </div>

                {/* Title */}
                <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                  {item.title}
                </h4>

                {/* Content snippet */}
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {item.content || (item.data?.overview ? item.data.overview : 'Detailed study material record.')}
                </p>

                {/* Source Context tag */}
                {item.sourceContext && (
                  <div className="mt-3 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                    Source: {item.sourceContext.sourceTitle}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDetailItem(item)}
                    title="View details"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.content || '', item.id)}
                    title="Copy content"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRenameItem(item);
                      setNewTitle(item.title);
                    }}
                    title="Rename"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteItem(item)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  {getCategoryIcon(detailItem.category)}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {detailItem.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {detailItem.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setDetailItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs select-text">
              {/* If flashcards deck */}
              {detailItem.category === 'flashcards' && detailItem.data?.cards && (
                <div className="space-y-3">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    Cards in Deck ({detailItem.data.cards.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detailItem.data.cards.map((c: FlashcardCard, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-1.5"
                      >
                        <div className="font-bold text-slate-900 dark:text-white">
                          Q: {c.front}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                          A: {c.back}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* If quiz result */}
              {detailItem.category === 'quiz' && detailItem.data && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                    <span className="font-bold text-purple-700 dark:text-purple-300">
                      Score: {detailItem.data.scorePercentage}%
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {detailItem.data.correctAnswers} of {detailItem.data.totalQuestions} correct
                    </span>
                  </div>

                  {detailItem.data.answers && (
                    <div className="space-y-2">
                      {detailItem.data.answers.map((ans: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-1"
                        >
                          <div className="font-bold text-slate-900 dark:text-white">
                            {idx + 1}. {ans.questionText}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Your answer: <span className="font-semibold">{ans.userAnswer}</span> | Correct: <span className="font-semibold text-emerald-600">{ans.correctAnswer}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Standard text content */}
              {detailItem.content && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
                  {detailItem.content}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Rename Study Material
            </h4>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRename}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Saved Material
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to remove &quot;{deleteItem.title}&quot; from My Study Materials? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
