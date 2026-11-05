import React, { useMemo } from 'react';
import {
  FileText,
  StickyNote,
  FolderClosed,
  Sparkles,
  HelpCircle,
  Layers,
  FileCheck,
} from 'lucide-react';
import {
  UserDocument,
  UserNote,
  UserFile,
  AIStudyMaterial,
} from '../../types/index.ts';

interface DocumentAnalyticsProps {
  documents: UserDocument[];
  notes: UserNote[];
  files: UserFile[];
  aiMaterials: AIStudyMaterial[];
}

export function DocumentAnalytics({
  documents,
  notes,
  files,
  aiMaterials,
}: DocumentAnalyticsProps) {
  const activeDocs = useMemo(
    () => documents.filter((d) => !d.deleted && !d.isTrashed),
    [documents]
  );
  const pdfFiles = useMemo(
    () =>
      files.filter(
        (f) =>
          f.mimeType?.includes('pdf') ||
          f.extension === 'pdf' ||
          f.name?.toLowerCase().endsWith('.pdf')
      ),
    [files]
  );

  const flashcardDecks = useMemo(
    () => aiMaterials.filter((m) => m.category === 'flashcards'),
    [aiMaterials]
  );

  const quizzes = useMemo(
    () => aiMaterials.filter((m) => m.category === 'quiz'),
    [aiMaterials]
  );

  const studyPlans = useMemo(
    () => aiMaterials.filter((m) => m.category === 'study-plan'),
    [aiMaterials]
  );

  const summaries = useMemo(
    () => aiMaterials.filter((m) => m.category === 'summary'),
    [aiMaterials]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Documents &amp; Study Materials Inventory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Factual counts of student-created assets and saved materials
          </p>
        </div>
      </div>

      {/* Grid of real counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Document Studio Docs</span>
            <FileText className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {activeDocs.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Created in Document Studio
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Quick Notes</span>
            <StickyNote className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {notes.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Student notes &amp; drafts
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Cloud Files</span>
            <FolderClosed className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {files.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {pdfFiles.length} PDFs stored in My Files
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Saved Study Materials</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {aiMaterials.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Saved AI revision resources
          </p>
        </div>
      </div>

      {/* Breakdown of AI Study Materials */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Study Materials Breakdown
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Content generated and explicitly saved to your StudentHub account
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-1">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Flashcard Sets</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {flashcardDecks.length}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Revision Quizzes</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {quizzes.length}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-1">
              <FileCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Study Plans</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {studyPlans.length}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-1">
              <FileText className="w-3.5 h-3.5 text-purple-500" />
              <span>Summaries</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {summaries.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
