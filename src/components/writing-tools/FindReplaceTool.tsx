import { useState, useMemo } from 'react';
import { TwoPanelWorkspace } from './TwoPanelWorkspace.tsx';
import { countMatches, performReplace } from '../../utils/textUtils.ts';
import { Search, Replace, CheckCircle2 } from 'lucide-react';

export function FindReplaceTool() {
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const matchCount = useMemo(() => {
    return countMatches(inputText, searchTerm, { caseSensitive, wholeWord });
  }, [inputText, searchTerm, caseSensitive, wholeWord]);

  const handleReplaceFirst = () => {
    if (!searchTerm || !inputText) return;
    const { result, replacedCount } = performReplace(
      inputText,
      searchTerm,
      replaceTerm,
      { caseSensitive, wholeWord },
      false
    );
    setInputText(result);
    setFeedback(`Replaced 1 match`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleReplaceAll = () => {
    if (!searchTerm || !inputText) return;
    const { result, replacedCount } = performReplace(
      inputText,
      searchTerm,
      replaceTerm,
      { caseSensitive, wholeWord },
      true
    );
    setInputText(result);
    setFeedback(`Replaced ${replacedCount} match${replacedCount === 1 ? '' : 'es'}`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Live preview of replacement
  const previewText = useMemo(() => {
    if (!searchTerm || !inputText) return inputText;
    const { result } = performReplace(
      inputText,
      searchTerm,
      replaceTerm,
      { caseSensitive, wholeWord },
      true
    );
    return result;
  }, [inputText, searchTerm, replaceTerm, caseSensitive, wholeWord]);

  return (
    <TwoPanelWorkspace
      title="Find & Replace"
      description="Search academic manuscripts and terminology, match whole words, and apply targeted or global replacements."
      badge="Academic Utility"
      inputText={inputText}
      outputText={previewText}
      onInputChange={setInputText}
      onApplyChanges={handleReplaceAll}
      downloadFilename="find-replaced.txt"
      outputPlaceholder="Preview of replaced text will show here in real time..."
      stats={
        feedback && (
          <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )
      }
      controls={
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Find Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-500" />
                  Search Term
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {matchCount > 0 ? (
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {matchCount} match{matchCount === 1 ? '' : 'es'} found
                    </span>
                  ) : searchTerm ? (
                    <span className="text-slate-400">0 matches</span>
                  ) : null}
                </span>
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Word or phrase to find..."
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Replace Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Replace className="w-3.5 h-3.5 text-indigo-500" />
                Replacement
              </label>
              <input
                type="text"
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                placeholder="Replace with..."
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Options & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Case Sensitive</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Match Whole Word Only</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReplaceFirst}
                disabled={matchCount === 0}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Replace First
              </button>

              <button
                type="button"
                onClick={handleReplaceAll}
                disabled={matchCount === 0}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
              >
                Replace All ({matchCount})
              </button>
            </div>
          </div>
        </div>
      }
    />
  );
}
