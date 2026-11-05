import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CheckSquare,
  Clock,
  Sparkles,
  Bookmark,
  X,
} from 'lucide-react';
import { AIProposedAction } from '../../types/index.ts';

interface AIActionConfirmationModalProps {
  isOpen: boolean;
  action: AIProposedAction | null;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

export const AIActionConfirmationModal: React.FC<AIActionConfirmationModalProps> = ({
  isOpen,
  action,
  onConfirm,
  onCancel,
  isExecuting = false,
}) => {
  if (!isOpen || !action) return null;

  const getActionIcon = () => {
    switch (action.type) {
      case 'create_task':
        return <CheckSquare className="w-6 h-6 text-indigo-500" />;
      case 'create_study_session':
        return <Clock className="w-6 h-6 text-blue-500" />;
      case 'save_flashcards':
      case 'save_quiz_result':
        return <Bookmark className="w-6 h-6 text-emerald-500" />;
      default:
        return <Sparkles className="w-6 h-6 text-indigo-500" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">
        {/* Top decorative stripe */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
                {getActionIcon()}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  AI Action Verification
                </span>
                <h3 id="ai-confirm-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  {action.title}
                </h3>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isExecuting}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {action.description}
          </p>

          {/* Action details card */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Proposed Changes to StudentHub:</span>
            </div>

            {action.payload && (
              <div className="space-y-1.5 pt-1 pl-5 border-l-2 border-indigo-200 dark:border-indigo-800">
                {action.payload.title && (
                  <div>
                    <span className="font-medium text-slate-500 dark:text-slate-400">Title: </span>
                    <span className="font-semibold">{action.payload.title}</span>
                  </div>
                )}
                {action.payload.subjectName && (
                  <div>
                    <span className="font-medium text-slate-500 dark:text-slate-400">Subject: </span>
                    <span>{action.payload.subjectName}</span>
                  </div>
                )}
                {action.payload.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-500 dark:text-slate-400">Due Date: </span>
                    <span>{action.payload.dueDate}</span>
                  </div>
                )}
                {action.payload.estimatedMinutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-500 dark:text-slate-400">Est. Time: </span>
                    <span>{action.payload.estimatedMinutes} mins</span>
                  </div>
                )}
                {action.payload.priority && (
                  <div>
                    <span className="font-medium text-slate-500 dark:text-slate-400">Priority: </span>
                    <span className="capitalize font-semibold">{action.payload.priority}</span>
                  </div>
                )}
                {action.payload.cards && (
                  <div>
                    <span className="font-medium text-slate-500 dark:text-slate-400">Flashcards: </span>
                    <span className="font-semibold">{action.payload.cards.length} cards</span>
                  </div>
                )}
                {action.payload.totalQuestions && (
                  <div>
                    <span className="font-medium text-slate-500 dark:text-slate-400">Quiz Questions: </span>
                    <span className="font-semibold">{action.payload.totalQuestions} questions</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 pt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>AI never writes without your explicit approval.</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isExecuting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isExecuting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm &amp; Apply</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
