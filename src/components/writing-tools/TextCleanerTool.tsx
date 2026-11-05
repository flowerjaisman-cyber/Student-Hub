import { useState, useMemo } from 'react';
import { TwoPanelWorkspace } from './TwoPanelWorkspace.tsx';
import { cleanText, TextCleanerOptions } from '../../utils/textUtils.ts';
import { Sparkles, CheckCheck, Sliders, Shield } from 'lucide-react';

export function TextCleanerTool() {
  const [inputText, setInputText] = useState('');
  const [options, setOptions] = useState<TextCleanerOptions>({
    removeExtraSpaces: true,
    removeTrailingSpaces: true,
    normalizeQuotes: true,
    normalizeApostrophes: true,
    normalizeDashes: true,
    normalizeLineEndings: true,
    removeDuplicateBlankLines: true,
    removeControlChars: true,
    normalizeUnicodeWhitespace: true,
  });

  const { cleaned, stats } = useMemo(() => {
    return cleanText(inputText, options);
  }, [inputText, options]);

  const toggleOption = (key: keyof TextCleanerOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleApply = () => {
    if (cleaned) {
      setInputText(cleaned);
    }
  };

  const selectAll = () => {
    setOptions({
      removeExtraSpaces: true,
      removeTrailingSpaces: true,
      normalizeQuotes: true,
      normalizeApostrophes: true,
      normalizeDashes: true,
      normalizeLineEndings: true,
      removeDuplicateBlankLines: true,
      removeControlChars: true,
      normalizeUnicodeWhitespace: true,
    });
  };

  return (
    <TwoPanelWorkspace
      title="Text Cleaner"
      description="One-click academic text cleaner to eliminate smart quotes, zero-width characters, irregular spaces, and broken line endings."
      badge="Academic Utility"
      inputText={inputText}
      outputText={cleaned}
      onInputChange={setInputText}
      onApplyChanges={handleApply}
      downloadFilename="cleaned-text.txt"
      stats={
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 pr-2 border-r border-slate-200 dark:border-slate-700">
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            <span>Changes Preview:</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
              {stats.totalChanges} fixed
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            {stats.quotesCleaned > 0 && (
              <span className="bg-white dark:bg-slate-700/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                {stats.quotesCleaned} smart quotes
              </span>
            )}
            {stats.apostrophesCleaned > 0 && (
              <span className="bg-white dark:bg-slate-700/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                {stats.apostrophesCleaned} apostrophes
              </span>
            )}
            {stats.extraSpacesCleaned > 0 && (
              <span className="bg-white dark:bg-slate-700/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                {stats.extraSpacesCleaned} irregular spaces
              </span>
            )}
            {stats.trailingSpacesCleaned > 0 && (
              <span className="bg-white dark:bg-slate-700/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                {stats.trailingSpacesCleaned} trailing spaces
              </span>
            )}
            {stats.controlCharsCleaned > 0 && (
              <span className="bg-white dark:bg-slate-700/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                {stats.controlCharsCleaned} zero-width / control chars
              </span>
            )}
            {stats.dashesCleaned > 0 && (
              <span className="bg-white dark:bg-slate-700/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                {stats.dashesCleaned} dashes
              </span>
            )}
            {stats.blankLinesReduced > 0 && (
              <span className="bg-white dark:bg-slate-700/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                {stats.blankLinesReduced} duplicate lines
              </span>
            )}
            {stats.unicodeSpacesCleaned > 0 && (
              <span className="bg-white dark:bg-slate-700/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                {stats.unicodeSpacesCleaned} Unicode spaces
              </span>
            )}
            {stats.totalChanges === 0 && (
              <span className="italic">Text is already clean and normalized.</span>
            )}
          </div>
        </div>
      }
      controls={
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Independent Cleaning Toggles</span>
            </div>

            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Reset to Recommended
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={options.removeControlChars}
                onChange={() => toggleOption('removeControlChars')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 dark:text-slate-200">
                Remove invisible control & zero-width characters
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={options.normalizeQuotes}
                onChange={() => toggleOption('normalizeQuotes')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 dark:text-slate-200">
                Convert smart quotes (“ ” « ») to standard (")
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={options.normalizeApostrophes}
                onChange={() => toggleOption('normalizeApostrophes')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 dark:text-slate-200">
                Convert smart apostrophes (‘ ’ `) to standard (')
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={options.removeExtraSpaces}
                onChange={() => toggleOption('removeExtraSpaces')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 dark:text-slate-200">
                Remove extra spaces between words
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={options.removeTrailingSpaces}
                onChange={() => toggleOption('removeTrailingSpaces')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 dark:text-slate-200">
                Remove trailing whitespace from line ends
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={options.normalizeUnicodeWhitespace}
                onChange={() => toggleOption('normalizeUnicodeWhitespace')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 dark:text-slate-200">
                Normalize non-breaking spaces (\u00A0 &rarr; ' ')
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={options.normalizeDashes}
                onChange={() => toggleOption('normalizeDashes')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 dark:text-slate-200">
                Normalize em-dash & en-dash (— – &rarr; -)
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={options.removeDuplicateBlankLines}
                onChange={() => toggleOption('removeDuplicateBlankLines')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 dark:text-slate-200">
                Reduce 2+ consecutive blank lines to one
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={options.normalizeLineEndings}
                onChange={() => toggleOption('normalizeLineEndings')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 dark:text-slate-200">
                Standardize line breaks (\r\n &rarr; \n)
              </span>
            </label>
          </div>
        </div>
      }
    />
  );
}
