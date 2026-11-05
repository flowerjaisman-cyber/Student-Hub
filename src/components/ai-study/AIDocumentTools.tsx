import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  AlignLeft,
  List,
  Check,
  Copy,
  Bookmark,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { runDocumentAIAction, DocumentAIActionResponse, saveUserAIMaterial } from '../../services/aiStudyService.ts';
import { ActiveContext } from './AIContextSelector.tsx';

interface AIDocumentToolsProps {
  userId: string;
  activeContext: ActiveContext;
  onSuccessToast?: (msg: string) => void;
  onApplyToDocument?: (text: string, mode: 'insert' | 'replace') => void;
}

export const AIDocumentTools: React.FC<AIDocumentToolsProps> = ({
  userId,
  activeContext,
  onSuccessToast,
  onApplyToDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'summarize' | 'explain' | 'rewrite' | 'analyze'>('summarize');
  const [subOption, setSubOption] = useState<string>('short');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DocumentAIActionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    if (!activeContext.content || activeContext.content.trim().length === 0) {
      setErrorMsg('Please select or paste study material context before running document tools.');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const res = await runDocumentAIAction(
        activeTab,
        activeContext.content,
        activeContext.title,
        subOption
      );
      setResult(res);
    } catch (err: any) {
      console.error('Document AI action failed:', err);
      setErrorMsg(err.message || 'Operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToMaterials = async () => {
    if (!result) return;
    try {
      await saveUserAIMaterial(userId, {
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        title: `${activeTab.toUpperCase()}: ${activeContext.title}`,
        category: activeTab === 'summarize' ? 'summary' : activeTab === 'explain' ? 'explanation' : 'writing-suggestion',
        content: result.content,
        sourceContext: {
          type: activeContext.type as any,
          sourceTitle: activeContext.title,
          sourceId: activeContext.id,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onSuccessToast?.('Saved to My Study Materials!');
    } catch (err: any) {
      console.error('Failed to save to materials:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Tool Selection Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Document &amp; Text Intelligence
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Summarize, explain difficult concepts, rewrite, or analyze study texts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRun}
            disabled={isProcessing || !activeContext.content}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Process Selection</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'summarize', label: 'Summarize', defaultSub: 'short' },
              { id: 'explain', label: 'Explain Concept', defaultSub: 'simple' },
              { id: 'rewrite', label: 'Improve & Rewrite', defaultSub: 'clearer' },
              { id: 'analyze', label: 'Analyze Document', defaultSub: 'standard' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSubOption(tab.defaultSub);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-options based on active tab */}
        <div className="pt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400 mr-2">Mode:</span>

          {activeTab === 'summarize' && (
            <>
              {[
                { id: 'short', label: 'Short Summary' },
                { id: 'detailed', label: 'Detailed Summary' },
                { id: 'bullets', label: 'Key Takeaways / Bullets' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSubOption(opt.id)}
                  className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                    subOption === opt.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </>
          )}

          {activeTab === 'explain' && (
            <>
              {[
                { id: 'simple', label: 'Explain Simply' },
                { id: 'step-by-step', label: 'Explain Step-by-Step' },
                { id: 'beginner', label: 'Like I am 12' },
                { id: 'example', label: 'With Real-World Example' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSubOption(opt.id)}
                  className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                    subOption === opt.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </>
          )}

          {activeTab === 'rewrite' && (
            <>
              {[
                { id: 'clearer', label: 'Make Clearer' },
                { id: 'concise', label: 'Make Concise' },
                { id: 'academic', label: 'Academic Tone' },
                { id: 'grammar', label: 'Fix Grammar' },
                { id: 'bullets', label: 'Convert to Bullets' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSubOption(opt.id)}
                  className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                    subOption === opt.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </>
          )}

          {activeTab === 'analyze' && (
            <span className="text-slate-400 text-xs italic">
              Extracts core thesis, key supporting evidence, readability, and critique points.
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Review Panel */}
      {result && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                AI Output Review
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {activeTab.toUpperCase()} • {activeContext.title}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(result.content)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToMaterials}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save to Materials</span>
              </button>

              {onApplyToDocument && (
                <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                  <button
                    type="button"
                    onClick={() => onApplyToDocument(result.content, 'replace')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Replace Selection
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyToDocument(result.content, 'insert')}
                    className="px-3 py-1.5 rounded-xl border border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Insert Below
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Result Content Body */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text font-sans">
            {result.content}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Explicit user action required: This text is not added to your document or notes until you click Replace, Insert, or Save.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
