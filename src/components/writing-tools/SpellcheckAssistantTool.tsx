import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Info,
  SpellCheck,
  RotateCcw,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

const COMMON_FILLER_WORDS = [
  { word: 'very', suggestion: 'Use a more descriptive adjective (e.g. profound, crucial)' },
  { word: 'really', suggestion: 'Consider removing or using precise wording' },
  { word: 'basically', suggestion: 'Informal in academic tone; consider omitting' },
  { word: 'in order to', suggestion: 'Shorten to "to"' },
  { word: 'utilize', suggestion: 'Consider simpler verb "use"' },
  { word: 'due to the fact that', suggestion: 'Shorten to "because" or "since"' },
  { word: 'at this point in time', suggestion: 'Shorten to "currently" or "now"' },
  { word: 'a large number of', suggestion: 'Shorten to "many"' },
  { word: 'for the purpose of', suggestion: 'Shorten to "for" or "to"' },
  { word: 'needless to say', suggestion: 'Omit if it is indeed self-evident' },
];

export function SpellcheckAssistantTool() {
  const [text, setText] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Scan text for common fillers deterministically
  const foundFillers = useMemo(() => {
    if (!text.trim()) return [];
    const results: Array<{ word: string; suggestion: string; count: number }> = [];

    COMMON_FILLER_WORDS.forEach((item) => {
      const regex = new RegExp(`\\b${item.word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        results.push({
          word: item.word,
          suggestion: item.suggestion,
          count: matches.length,
        });
      }
    });

    return results;
  }, [text]);

  const removeFillerWord = (targetWord: string, replacement = '') => {
    const regex = new RegExp(`\\b${targetWord}\\b`, 'gi');
    setText((prev) => prev.replace(regex, replacement).replace(/\s{2,}/g, ' '));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <SpellCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Browser Spellcheck & Academic Writing Assistant
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Native Spellcheck & Conciseness
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Uses your browser&apos;s native multi-language spellcheck dictionary alongside deterministic word-redundancy heuristics.
          </p>
        </div>

        {text && (
          <button
            type="button"
            onClick={() => setText('')}
            className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-rose-500 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor Area */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Interactive Spellcheck Canvas
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Native Browser Spellcheck Active
            </span>
          </div>

          <textarea
            id="spellcheck-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={true}
            placeholder="Type or paste academic prose here. Misspelled words will be underlined in red by your browser dictionary (right-click for corrections)..."
            className="w-full flex-1 min-h-[300px] p-4 text-xs sm:text-sm font-sans leading-relaxed text-slate-800 dark:text-slate-200 bg-transparent resize-y focus:outline-hidden"
          />

          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Right-click red wavy lines to choose spellcheck suggestions.</span>
            <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
          </div>
        </div>

        {/* Heuristics & Conciseness Panel */}
        <div className="space-y-4">
          {/* Wordy Phrases / Filler Alerts */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Conciseness & Wordiness
              </h3>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                {foundFillers.length} identified
              </span>
            </div>

            {foundFillers.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No common redundant filler phrases detected in the current text.
              </p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {foundFillers.map((item) => (
                  <div
                    key={item.word}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                        &quot;{item.word}&quot; ({item.count}&times;)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Academic Proofreading Checklist */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Academic Proofreading Checklist
            </h3>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500" />
                <span>Verify citation format consistency (APA, MLA, etc.)</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500" />
                <span>Check for consistent person (avoid sudden &quot;I&quot; vs &quot;we&quot; shifts)</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500" />
                <span>Ensure acronyms are spelled out on first mention</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500" />
                <span>Review paragraph transition phrases between sections</span>
              </label>
            </div>
          </div>

          {/* Honest Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              This assistant utilizes native browser dictionaries for spellcheck and deterministic keyword heuristics for conciseness; it does not claim to replace a human academic editor.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
