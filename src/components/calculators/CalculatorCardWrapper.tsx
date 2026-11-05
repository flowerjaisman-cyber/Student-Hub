import { useState } from 'react';
import {
  RotateCcw,
  Copy,
  Check,
  Bookmark,
  Info,
  HelpCircle,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CalculatorCardWrapperProps {
  title: string;
  description: string;
  categoryBadge: string;
  formula?: string;
  formulaExplanation?: string;
  onReset: () => void;
  resultSnippet?: string;
  onSave?: () => void;
  isSaving?: boolean;
  children: React.ReactNode;
}

export function CalculatorCardWrapper({
  title,
  description,
  categoryBadge,
  formula,
  formulaExplanation,
  onReset,
  resultSnippet,
  onSave,
  isSaving = false,
  children,
}: CalculatorCardWrapperProps) {
  const [showFormula, setShowFormula] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!resultSnippet) return;
    try {
      await navigator.clipboard.writeText(resultSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {categoryBadge}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          {formula && (
            <button
              type="button"
              onClick={() => setShowFormula((prev) => !prev)}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Show mathematical formula and logic"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Formula</span>
              {showFormula ? (
                <ChevronUp className="w-3 h-3 ml-0.5" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-0.5" />
              )}
            </button>
          )}

          {resultSnippet && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Copy calculation result"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              title="Save calculation to your cloud workspace"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset calculator inputs to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Formula & Educational Help Drawer */}
      {showFormula && formula && (
        <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs space-y-1.5 animate-fade-in">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Mathematical Formula &amp; Logic</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 font-mono text-xs text-indigo-950 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900">
            {formula}
          </div>
          {formulaExplanation && (
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              {formulaExplanation}
            </p>
          )}
        </div>
      )}

      {/* Calculator Body */}
      {children}
    </div>
  );
}
