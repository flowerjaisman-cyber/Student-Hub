import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  FileText,
  HelpCircle,
  Layers,
  Calendar,
  CheckSquare,
  StickyNote,
  BookMarked,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import {
  UserDocument,
  UserNote,
  UserFile,
  StudyTask,
  StudyAssignment,
  StudyExam,
  StudyHabit,
  StudySubject,
  AIStudyMaterial,
} from '../../types/index.ts';
import { AIContextSelector, ActiveContext } from './AIContextSelector.tsx';
import { AIStudyChat } from './AIStudyChat.tsx';
import { AIDocumentTools } from './AIDocumentTools.tsx';
import { AIQuizGenerator } from './AIQuizGenerator.tsx';
import { AIFlashcardGenerator } from './AIFlashcardGenerator.tsx';
import { AIStudyPlanGenerator } from './AIStudyPlanGenerator.tsx';
import { AIAssignmentAssistant } from './AIAssignmentAssistant.tsx';
import { AINotesAssistant } from './AINotesAssistant.tsx';
import { AICitationHelper } from './AICitationHelper.tsx';
import { AISavedMaterials } from './AISavedMaterials.tsx';
import { getUserAIMaterials, checkAIServiceHealth } from '../../services/aiStudyService.ts';

interface AIStudyViewProps {
  userId: string;
  documents: UserDocument[];
  notes: UserNote[];
  files: UserFile[];
  tasks: StudyTask[];
  assignments: StudyAssignment[];
  exams: StudyExam[];
  habits: StudyHabit[];
  subjects: StudySubject[];
  initialContext?: {
    type: 'custom' | 'document' | 'file' | 'note' | 'subject' | 'assignment';
    id?: string;
    title: string;
    content: string;
  };
}

export const AIStudyView: React.FC<AIStudyViewProps> = ({
  userId,
  documents,
  notes,
  files,
  tasks,
  assignments,
  exams,
  habits,
  subjects,
  initialContext,
}) => {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    'chat' | 'doc-tools' | 'quiz' | 'flashcards' | 'study-plan' | 'assignment' | 'notes' | 'citation' | 'saved'
  >('chat');

  // Active Context
  const [activeContext, setActiveContext] = useState<ActiveContext>(() => {
    if (initialContext) {
      return {
        type: initialContext.type,
        id: initialContext.id,
        title: initialContext.title,
        content: initialContext.content,
        charCount: initialContext.content.length,
      };
    }
    // If user has documents, default to first document, otherwise direct prompt
    if (documents.length > 0) {
      const doc = documents[0];
      const clean = (doc.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      return {
        type: 'document',
        id: doc.id,
        title: doc.title || 'Untitled Document',
        content: clean,
        charCount: clean.length,
      };
    }
    return {
      type: 'custom',
      title: 'None (Direct Prompt)',
      content: '',
      charCount: 0,
    };
  });

  // Saved materials state
  const [savedMaterials, setSavedMaterials] = useState<AIStudyMaterial[]>([]);
  const [isServiceHealthy, setIsServiceHealthy] = useState<boolean | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchMaterials = async () => {
    if (!userId) return;
    try {
      const mats = await getUserAIMaterials(userId);
      setSavedMaterials(mats);
    } catch (err) {
      console.error('Failed to fetch AI materials:', err);
    }
  };

  useEffect(() => {
    fetchMaterials();
    checkAIServiceHealth().then((res) =>
      setIsServiceHealthy(res.status === 'ready' || res.status === 'configured' || res.configured)
    );
  }, [userId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const navTabs = [
    { id: 'chat', label: 'Ask AI', icon: Bot },
    { id: 'doc-tools', label: 'Summarize & Explain', icon: FileText },
    { id: 'quiz', label: 'Quiz Generator', icon: HelpCircle },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'study-plan', label: 'Study Plan', icon: Calendar },
    { id: 'assignment', label: 'Assignment Assistant', icon: CheckSquare },
    { id: 'notes', label: 'Notes Intelligence', icon: StickyNote },
    { id: 'citation', label: 'Citation Helper', icon: BookMarked },
    { id: 'saved', label: 'Saved Materials', icon: Bookmark, badge: savedMaterials.length },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Hero Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/20">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phase 11 • AI Study Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AI Study Assistant &amp; Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Understand, summarize, organize, and improve your study material. Grounded strictly in your authenticated coursework, notes, and documents.
            </p>
          </div>

          {/* AI Status Badge */}
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isServiceHealthy === false
                    ? 'bg-rose-500 animate-pulse'
                    : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span className="font-semibold text-slate-200">
                {isServiceHealthy === false ? 'Service Limited' : 'Gemini 3.8 Flash Online'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Strict UID Isolation • No Account Data Exposure
            </span>
          </div>
        </div>
      </div>

      {/* Context Selector Bar */}
      <AIContextSelector
        activeContext={activeContext}
        onContextChange={setActiveContext}
        documents={documents}
        notes={notes}
        files={files}
        assignments={assignments}
        subjects={subjects}
      />

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 overflow-x-auto scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof (tab as any).badge === 'number' && (tab as any).badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono">
                  {(tab as any).badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'chat' && (
          <AIStudyChat
            userId={userId}
            activeContext={activeContext}
            onSaveMaterialSuccess={showToast}
          />
        )}

        {activeTab === 'doc-tools' && (
          <AIDocumentTools
            userId={userId}
            activeContext={activeContext}
            onSuccessToast={showToast}
          />
        )}

        {activeTab === 'quiz' && (
          <AIQuizGenerator
            userId={userId}
            activeContext={activeContext}
            onSuccessToast={showToast}
          />
        )}

        {activeTab === 'flashcards' && (
          <AIFlashcardGenerator
            userId={userId}
            activeContext={activeContext}
            onSuccessToast={showToast}
          />
        )}

        {activeTab === 'study-plan' && (
          <AIStudyPlanGenerator
            userId={userId}
            subjects={subjects}
            tasks={tasks}
            assignments={assignments}
            exams={exams}
            habits={habits}
            onSuccessToast={showToast}
          />
        )}

        {activeTab === 'assignment' && (
          <AIAssignmentAssistant
            userId={userId}
            assignments={assignments}
            onSuccessToast={showToast}
          />
        )}

        {activeTab === 'notes' && (
          <AINotesAssistant
            userId={userId}
            notes={notes}
            onSuccessToast={showToast}
          />
        )}

        {activeTab === 'citation' && <AICitationHelper />}

        {activeTab === 'saved' && (
          <AISavedMaterials
            userId={userId}
            materials={savedMaterials}
            onRefreshMaterials={fetchMaterials}
            onSuccessToast={showToast}
          />
        )}
      </div>
    </div>
  );
};
