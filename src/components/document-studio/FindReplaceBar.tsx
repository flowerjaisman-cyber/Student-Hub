import { useState } from 'react';
import { Search, Replace, ChevronDown, ChevronUp, X, Check } from 'lucide-react';

interface FindReplaceBarProps {
  onFind: (query: string, matchCase: boolean) => void;
  onFindNext: () => void;
  onFindPrev: () => void;
  onReplace: (replacement: string) => void;
  onReplaceAll: (query: string, replacement: string, matchCase: boolean) => void;
  matchCount: number;
  currentMatchIndex: number;
  onClose: () => void;
}

export function FindReplaceBar({
  onFind,
  onFindNext,
  onFindPrev,
  onReplace,
  onReplaceAll,
  matchCount,
  currentMatchIndex,
  onClose,
}: FindReplaceBarProps) {
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);

  const handleQueryChange = (val: string) => {
    setFindQuery(val);
    onFind(val, matchCase);
  };

  const handleCaseToggle = () => {
    const next = !matchCase;
    setMatchCase(next);
    onFind(findQuery, next);
  };

  return (
    <div
      id="find-replace-bar"
      className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs animate-in slide-in-from-top-1 duration-150"
    >
      {/* Find field */}
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Find in document..."
            value={findQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) onFindPrev();
                else onFindNext();
              }
            }}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
          />
        </div>

        {/* Counter */}
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0 min-w-[60px]">
          {findQuery ? (
            matchCount > 0 ? (
              `${currentMatchIndex + 1} of ${matchCount}`
            ) : (
              '0 matches'
            )
          ) : (
            ''
          )}
        </span>

        {/* Prev / Next buttons */}
        <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={onFindPrev}
            disabled={matchCount === 0}
            title="Previous match (Shift+Enter)"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={onFindNext}
            disabled={matchCount === 0}
            title="Next match (Enter)"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Match case checkbox */}
        <button
          type="button"
          onClick={handleCaseToggle}
          title="Match Case"
          className={`px-2 py-1 rounded-md border text-[11px] font-semibold cursor-pointer transition-colors ${
            matchCase
              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
          }`}
        >
          Aa
        </button>
      </div>

      {/* Replace field */}
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <div className="relative flex-1">
          <Replace className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
          />
        </div>

        <button
          type="button"
          onClick={() => onReplace(replaceQuery)}
          disabled={matchCount === 0}
          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
        >
          Replace
        </button>

        <button
          type="button"
          onClick={() => onReplaceAll(findQuery, replaceQuery, matchCase)}
          disabled={!findQuery || matchCount === 0}
          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
        >
          Replace All
        </button>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close search bar"
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer ml-auto"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
