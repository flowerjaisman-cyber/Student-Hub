import { useState, useMemo } from 'react';
import { compareTexts, DiffPart } from '../../utils/textUtils.ts';
import {
  GitCompare,
  CheckCircle,
  AlertCircle,
  Layers,
  FileCode2,
  Trash2,
} from 'lucide-react';

export function TextCompareTool() {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [diffMode, setDiffMode] = useState<'lines' | 'words'>('words');

  const diffResult = useMemo(() => {
    return compareTexts(originalText, modifiedText);
  }, [originalText, modifiedText]);

  return (
    <div className="space-y-4">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Text Compare
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Academic Utility
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare two versions of an essay, literature excerpt, or assignment draft to visualize edits and additions.
          </p>
        </div>

        {/* Diff Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setDiffMode('words')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                diffMode === 'words'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              Word-by-Word
            </button>
            <button
              type="button"
              onClick={() => setDiffMode('lines')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                diffMode === 'lines'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCode2 className="w-3 h-3" />
              Line-by-Line
            </button>
          </div>
        </div>
      </div>

      {/* Input Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Original Text */}
        <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Original Text (Draft A)
            </span>
            <button
              type="button"
              onClick={() => setOriginalText('')}
              disabled={!originalText}
              className="text-[11px] text-slate-500 hover:text-rose-500 disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Paste original text here..."
            className="w-full min-h-[160px] p-3 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 bg-transparent resize-y focus:outline-hidden"
          />
        </div>

        {/* Modified Text */}
        <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Modified Text (Draft B)
            </span>
            <button
              type="button"
              onClick={() => setModifiedText('')}
              disabled={!modifiedText}
              className="text-[11px] text-slate-500 hover:text-rose-500 disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
          <textarea
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            placeholder="Paste revised or edited text here..."
            className="w-full min-h-[160px] p-3 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 bg-transparent resize-y focus:outline-hidden"
          />
        </div>
      </div>

      {/* Difference Visualization Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Comparison Result ({diffMode === 'words' ? 'Word Diff' : 'Line Diff'})
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            {originalText === modifiedText && originalText ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                Both texts are completely identical
              </span>
            ) : (
              <>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  +{diffResult.linesAdded} added
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  -{diffResult.linesRemoved} removed
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 min-h-[160px] max-h-[420px] overflow-y-auto font-mono text-xs leading-relaxed bg-slate-50/40 dark:bg-slate-950/40">
          {!originalText && !modifiedText ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-600">
              Paste or type text into Draft A and Draft B above to generate a visual diff.
            </div>
          ) : diffResult.isIdentical ? (
            <div className="py-8 text-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-sm">No differences detected.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Both drafts match character for character.
              </p>
            </div>
          ) : diffMode === 'words' ? (
            /* Word Diff */
            <div className="whitespace-pre-wrap break-words">
              {diffResult.wordDiffs.map((part, idx) => {
                if (part.type === 'added') {
                  return (
                    <span
                      key={idx}
                      className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 px-0.5 rounded underline decoration-emerald-500 font-semibold"
                    >
                      {part.value}
                    </span>
                  );
                }
                if (part.type === 'removed') {
                  return (
                    <span
                      key={idx}
                      className="bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 px-0.5 rounded line-through decoration-rose-500"
                    >
                      {part.value}
                    </span>
                  );
                }
                return <span key={idx}>{part.value}</span>;
              })}
            </div>
          ) : (
            /* Line Diff */
            <div className="space-y-1">
              {diffResult.lineDiffs.map((part, idx) => {
                if (part.type === 'added') {
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-l-2 border-emerald-500"
                    >
                      <span className="font-bold select-none text-emerald-600">+</span>
                      <span className="break-all">{part.value || ' '}</span>
                    </div>
                  );
                }
                if (part.type === 'removed') {
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-1 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-l-2 border-rose-500"
                    >
                      <span className="font-bold select-none text-rose-600">-</span>
                      <span className="break-all line-through opacity-80">{part.value || ' '}</span>
                    </div>
                  );
                }
                return (
                  <div key={idx} className="flex items-start gap-2 p-1 text-slate-700 dark:text-slate-300">
                    <span className="select-none text-slate-400">&nbsp;</span>
                    <span className="break-all">{part.value || ' '}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-100/60 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          Note: This visual diff is designed for student writing comparisons and draft review.
        </div>
      </div>
    </div>
  );
}
