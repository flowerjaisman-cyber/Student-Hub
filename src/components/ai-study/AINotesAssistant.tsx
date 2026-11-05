import React, { useState } from 'react';
import {
  StickyNote,
  Sparkles,
  ListOrdered,
  Layers,
  HelpCircle,
  FileText,
  Copy,
  Check,
  Bookmark,
  AlertTriangle,
} from 'lucide-react';
import { UserNote } from '../../types/index.ts';
import {
  runNotesAssistant,
  NotesIntelligenceResponse,
  saveUserAIMaterial,
} from '../../services/aiStudyService.ts';

interface AINotesAssistantProps {
  userId: string;
  notes: UserNote[];
  onSuccessToast?: (msg: string) => void;
}

export const AINotesAssistant: React.FC<AINotesAssistantProps> = ({
  userId,
  notes,
  onSuccessToast,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [actionType, setActionType] = useState<
    'summarize' | 'key-points' | 'revision-questions' | 'flashcards' | 'organize-headings' | 'repeated-concepts' | 'study-outline'
  >('summarize');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<NotesIntelligenceResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const handleRun = async () => {
    if (!selectedNote) {
      setErrorMsg('Please select a student note.');
      return;
    }
    if (!selectedNote.content || selectedNote.content.trim().length === 0) {
      setErrorMsg('Selected note is empty. Please choose a note with content.');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const res = await runNotesAssistant(
        { title: selectedNote.title, content: selectedNote.content },
        actionType
      );
      setResult(res);
    } catch (err: any) {
      console.error('Notes intelligence failed:', err);
      setErrorMsg(err.message || 'Failed to process note.');
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
    if (!result || !selectedNote) return;
    try {
      await saveUserAIMaterial(userId, {
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        title: `${actionType.toUpperCase()}: ${selectedNote.title}`,
        category: 'notes-summary',
        content: result.summary,
        data: result,
        sourceContext: {
          type: 'note',
          sourceId: selectedNote.id,
          sourceTitle: selectedNote.title,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onSuccessToast?.('Saved notes analysis to My Study Materials!');
    } catch (err: any) {
      console.error('Failed to save to materials:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Selector & Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Notes Intelligence
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transform rough lecture notes into revision materials, flashcards, and outlines
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRun}
            disabled={isProcessing || notes.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs shadow-amber-600/30 transition-all cursor-pointer disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing Notes...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Process Note</span>
              </>
            )}
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No notes found. Create notes in Document Studio or Notes to use this tool.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Note
              </label>
              <select
                value={selectedNoteId}
                onChange={(e) => setSelectedNoteId(e.target.value)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
              >
                {notes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title || 'Untitled Note'} ({(n.content || '').length} chars)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Operation
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as any)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
              >
                <option value="summarize">Comprehensive Summary</option>
                <option value="key-points">Extract High-Yield Key Points</option>
                <option value="revision-questions">Generate Revision Questions</option>
                <option value="flashcards">Generate Flashcard Pairs</option>
                <option value="organize-headings">Organize Headings &amp; Hierarchy</option>
                <option value="repeated-concepts">Identify Repeated Core Concepts</option>
                <option value="study-outline">Convert to Formal Study Outline</option>
              </select>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Results Section */}
      {result && selectedNote && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {result.noteTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {result.summary}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(result.summary + '\n\n' + (result.organizedOutline || ''))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToMaterials}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                <Bookmark className="w-4 h-4" />
                <span>Save to Materials</span>
              </button>
            </div>
          </div>

          {/* Key Points */}
          {result.keyPoints && result.keyPoints.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                High-Yield Key Points
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                {result.keyPoints.map((pt, idx) => (
                  <li key={idx} className="leading-relaxed">{pt}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Revision Questions */}
          {result.revisionQuestions && result.revisionQuestions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-purple-500" />
                <span>Self-Test Revision Questions</span>
              </h4>
              <div className="space-y-2.5">
                {result.revisionQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">
                      {idx + 1}. {q.question}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">Hint / Answer: </span>
                      {q.answerHint}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flashcard Suggestions */}
          {result.flashcardSuggestions && result.flashcardSuggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-500" />
                <span>Suggested Flashcards</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.flashcardSuggestions.map((fc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs space-y-1"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">
                      Q: {fc.front}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-700">
                      A: {fc.back}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organized Outline */}
          {result.organizedOutline && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Organized Study Outline</span>
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {result.organizedOutline}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
