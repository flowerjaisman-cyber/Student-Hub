import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  X,
  MessageSquare,
  HelpCircle,
  Layers,
  ArrowRight,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  runDocumentAIAction,
  askAIStudyQuestion,
  generateAIQuiz,
  generateAIFlashcards,
} from '../../services/aiStudyService.ts';

interface DocumentAIToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  docTitle: string;
  docContent: string;
  selectedText?: string;
  onInsertText: (text: string) => void;
  onReplaceSelectedText?: (text: string) => void;
  onOpenInAIStudy?: () => void;
}

export const DocumentAIToolsModal: React.FC<DocumentAIToolsModalProps> = ({
  isOpen,
  onClose,
  docTitle,
  docContent,
  selectedText,
  onInsertText,
  onReplaceSelectedText,
  onOpenInAIStudy,
}) => {
  const [activeTab, setActiveTab] = useState<'summarize' | 'explain' | 'rewrite' | 'ask' | 'quiz' | 'flashcards'>('summarize');
  const [subOption, setSubOption] = useState<string>('short');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Clean target text: prefer selected text if present, else full document clean content
  const cleanDoc = docContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const targetText = selectedText && selectedText.trim().length > 0 ? selectedText.trim() : cleanDoc;
  const isSelection = Boolean(selectedText && selectedText.trim().length > 0);

  const handleRunAction = async () => {
    if (!targetText) {
      setErrorMsg('No text available to process.');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    setGeneratedOutput(null);

    try {
      if (activeTab === 'ask') {
        if (!userQuestion.trim()) {
          setErrorMsg('Please enter a question about this document.');
          setIsProcessing(false);
          return;
        }
        const res = await askAIStudyQuestion({
          question: userQuestion.trim(),
          context: {
            title: docTitle,
            content: targetText,
            type: 'document',
          },
        });
        setGeneratedOutput(res.answer);
      } else if (activeTab === 'quiz') {
        const res = await generateAIQuiz({
          context: {
            title: docTitle,
            content: targetText,
            type: 'document',
          },
          questionCount: 3,
          difficulty: 'medium',
          questionType: 'multiple-choice',
        });
        const formatted = res.questions
          .map(
            (q, idx) =>
              `${idx + 1}. ${q.question}\nOptions:\n${(q.options || [])
                .map((o, i) => `  [${String.fromCharCode(65 + i)}] ${o}`)
                .join('\n')}\nAnswer: ${q.correctAnswer}\nExplanation: ${q.explanation}`
          )
          .join('\n\n');
        setGeneratedOutput(formatted);
      } else if (activeTab === 'flashcards') {
        const res = await generateAIFlashcards({
          context: {
            title: docTitle,
            content: targetText,
            type: 'document',
          },
          cardCount: 4,
          focusArea: 'Key concepts and definitions',
        });
        const formatted = res.cards
          .map((c, idx) => `Card ${idx + 1}:\nFront: ${c.front}\nBack: ${c.back}`)
          .join('\n\n');
        setGeneratedOutput(formatted);
      } else {
        const res = await runDocumentAIAction(
          activeTab as any,
          targetText,
          docTitle,
          subOption
        );
        setGeneratedOutput(res.content);
      }
    } catch (err: any) {
      console.error('Document AI action error:', err);
      setErrorMsg(err.message || 'Operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!generatedOutput) return;
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!generatedOutput) return;
    onInsertText(generatedOutput);
    onClose();
  };

  const handleReplace = () => {
    if (!generatedOutput || !onReplaceSelectedText) return;
    onReplaceSelectedText(generatedOutput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Document Intelligence Tools
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Phase 11
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {docTitle || 'Current Document'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Context Indicator */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Context Source:</span>
            {isSelection ? (
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                Selected Text ({targetText.length.toLocaleString()} chars)
              </span>
            ) : (
              <span>Entire Document ({cleanDoc.length.toLocaleString()} chars)</span>
            )}
          </div>
          {onOpenInAIStudy && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInAIStudy();
              }}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open in Full AI Study Suite</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Action Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            {[
              { id: 'summarize', label: 'Summarize', defaultSub: 'short' },
              { id: 'explain', label: 'Explain', defaultSub: 'simple' },
              { id: 'rewrite', label: 'Rewrite', defaultSub: 'clearer' },
              { id: 'ask', label: 'Ask Q&A' },
              { id: 'quiz', label: 'Create Quiz' },
              { id: 'flashcards', label: 'Flashcards' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if ((tab as any).defaultSub) setSubOption((tab as any).defaultSub);
                  setErrorMsg(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub-options based on active tab */}
          {activeTab === 'summarize' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { id: 'short', label: 'Short Summary' },
                { id: 'detailed', label: 'Detailed Summary' },
                { id: 'bullets', label: 'Key Takeaways' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSubOption(opt.id)}
                  className={`px-3 py-1 rounded-lg border text-xs font-medium cursor-pointer ${
                    subOption === opt.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'explain' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { id: 'simple', label: 'Explain Simply' },
                { id: 'step-by-step', label: 'Step-by-Step' },
                { id: 'beginner', label: 'Like a Beginner' },
                { id: 'example', label: 'Give an Example' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSubOption(opt.id)}
                  className={`px-3 py-1 rounded-lg border text-xs font-medium cursor-pointer ${
                    subOption === opt.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'rewrite' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { id: 'clearer', label: 'Make Clearer' },
                { id: 'concise', label: 'Make Concise' },
                { id: 'grammar', label: 'Improve Grammar' },
                { id: 'academic', label: 'Academic Tone' },
                { id: 'simplify', label: 'Simplify Language' },
                { id: 'bullets', label: 'Convert to Bullets' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSubOption(opt.id)}
                  className={`px-3 py-1 rounded-lg border text-xs font-medium cursor-pointer ${
                    subOption === opt.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Ask Q&A Input */}
          {activeTab === 'ask' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Ask about this document:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="e.g. What is the central thesis? Or explain the method section..."
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAction()}
                  className="flex-1 text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Run Action Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRunAction}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run {activeTab.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Review Panel */}
          {generatedOutput && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  AI Generated Output Review
                </span>
                <span className="text-[11px] text-slate-400">
                  Requires confirmation before insertion
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text max-h-60 overflow-y-auto">
                {generatedOutput}
              </div>

              {/* Review Panel Actions: Insert, Replace, Copy, Cancel */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGeneratedOutput(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {isSelection && onReplaceSelectedText && (
                    <button
                      type="button"
                      onClick={handleReplace}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Replace Selected Text
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleInsert}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Insert into Document
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
