import { useState, useMemo } from 'react';
import { TwoPanelWorkspace } from './TwoPanelWorkspace.tsx';
import { removeDuplicateLines, DuplicateLineOptions } from '../../utils/textUtils.ts';
import { CopySlash, Filter, ListOrdered } from 'lucide-react';

export function DuplicateLineRemoverTool() {
  const [inputText, setInputText] = useState('');
  const [options, setOptions] = useState<DuplicateLineOptions>({
    caseInsensitive: false,
    trimWhitespace: true,
    preserveLast: false,
  });

  const { output, originalLinesCount, duplicatesRemovedCount, finalLinesCount } = useMemo(() => {
    return removeDuplicateLines(inputText, options);
  }, [inputText, options]);

  const handleApply = () => {
    if (output) {
      setInputText(output);
    }
  };

  return (
    <TwoPanelWorkspace
      title="Duplicate Line Remover"
      description="Scan, identify, and deduplicate lines of bibliography citations, data rows, reference lists, and notes."
      badge="Academic Utility"
      inputText={inputText}
      outputText={output}
      onInputChange={setInputText}
      onApplyChanges={handleApply}
      downloadFilename="deduplicated-lines.txt"
      stats={
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <ListOrdered className="w-4 h-4 text-indigo-500" />
            <span>Line Statistics:</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
              Original: <strong className="text-slate-900 dark:text-white">{originalLinesCount}</strong> lines
            </span>

            <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
              Duplicates Removed: <strong>{duplicatesRemovedCount}</strong>
            </span>

            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Final Output: <strong>{finalLinesCount}</strong> lines
            </span>
          </div>
        </div>
      }
      controls={
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Comparison Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={options.caseInsensitive}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, caseInsensitive: e.target.checked }))
                }
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 dark:text-slate-200">
                Case-insensitive matching (A == a)
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={options.trimWhitespace}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, trimWhitespace: e.target.checked }))
                }
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-800 dark:text-slate-200">
                Trim spaces before comparison
              </span>
            </label>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="text-slate-700 dark:text-slate-300">Keep occurrence:</span>
              <select
                value={options.preserveLast ? 'last' : 'first'}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    preserveLast: e.target.value === 'last',
                  }))
                }
                className="text-xs bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="first">Keep First Occurrence</option>
                <option value="last">Keep Last Occurrence</option>
              </select>
            </div>
          </div>
        </div>
      }
    />
  );
}
