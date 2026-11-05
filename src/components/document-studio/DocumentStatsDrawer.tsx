import {
  FileText,
  Clock,
  AlignLeft,
  Hash,
  X,
} from 'lucide-react';
import { DocumentStats } from '../../utils/documentUtils.ts';

interface DocumentStatsDrawerProps {
  stats: DocumentStats;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentStatsDrawer({ stats, isOpen, onClose }: DocumentStatsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      id="document-stats-panel"
      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-150 mb-4"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Document Statistics
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Real-time document calculations
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close statistics"
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
        {/* Words */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Words
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
            {stats.words.toLocaleString()}
          </span>
        </div>

        {/* Characters (with spaces) */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
            Chars (w/ spaces)
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
            {stats.charactersWithSpaces.toLocaleString()}
          </span>
        </div>

        {/* Characters (no spaces) */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
            Chars (no spaces)
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
            {stats.charactersWithoutSpaces.toLocaleString()}
          </span>
        </div>

        {/* Paragraphs */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <AlignLeft className="w-3 h-3 text-slate-400" />
            Paragraphs
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
            {stats.paragraphs.toLocaleString()}
          </span>
        </div>

        {/* Sentences */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Hash className="w-3 h-3 text-slate-400" />
            Sentences
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
            {stats.sentences.toLocaleString()}
          </span>
        </div>

        {/* Reading Time */}
        <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Reading Time
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">
            {stats.readingTimeString}
          </span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            ~200 words/min
          </span>
        </div>
      </div>
    </div>
  );
}
