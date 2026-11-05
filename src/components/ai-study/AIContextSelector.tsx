import React, { useState, useEffect } from 'react';
import {
  FileText,
  File,
  StickyNote,
  GraduationCap,
  CheckSquare,
  Type,
  ShieldCheck,
  ChevronDown,
  X,
  Info,
} from 'lucide-react';
import {
  UserDocument,
  UserNote,
  UserFile,
  StudyAssignment,
  StudySubject,
} from '../../types/index.ts';

export type ContextType = 'custom' | 'document' | 'file' | 'note' | 'subject' | 'assignment';

export interface ActiveContext {
  type: ContextType;
  id?: string;
  title: string;
  content: string;
  charCount: number;
}

interface AIContextSelectorProps {
  activeContext: ActiveContext;
  onContextChange: (ctx: ActiveContext) => void;
  documents: UserDocument[];
  notes: UserNote[];
  files: UserFile[];
  assignments: StudyAssignment[];
  subjects: StudySubject[];
  compact?: boolean;
}

export const AIContextSelector: React.FC<AIContextSelectorProps> = ({
  activeContext,
  onContextChange,
  documents,
  notes,
  files,
  assignments,
  subjects,
  compact = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customText, setCustomText] = useState(activeContext.type === 'custom' ? activeContext.content : '');

  useEffect(() => {
    if (activeContext.type === 'custom') {
      setCustomText(activeContext.content);
    }
  }, [activeContext]);

  const handleSelectCustom = () => {
    onContextChange({
      type: 'custom',
      title: 'Custom Study Material',
      content: customText,
      charCount: customText.length,
    });
    setDropdownOpen(false);
  };

  const handleSelectDocument = (doc: UserDocument) => {
    // Strip HTML tags for clean AI processing
    const cleanText = (doc.content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    onContextChange({
      type: 'document',
      id: doc.id,
      title: doc.title || 'Untitled Document',
      content: cleanText,
      charCount: cleanText.length,
    });
    setDropdownOpen(false);
  };

  const handleSelectNote = (note: UserNote) => {
    onContextChange({
      type: 'note',
      id: note.id,
      title: note.title || 'Untitled Note',
      content: note.content || '',
      charCount: (note.content || '').length,
    });
    setDropdownOpen(false);
  };

  const handleSelectAssignment = (assign: StudyAssignment) => {
    const text = `Assignment: ${assign.title}\nSubject: ${assign.subjectName || 'None'}\nDue Date: ${assign.dueDate || 'None'}\nStatus: ${assign.status || 'not_started'}\nPriority: ${assign.priority || 'medium'}\nNotes/Instructions: ${assign.notes || assign.description || 'None'}`;
    onContextChange({
      type: 'assignment',
      id: assign.id,
      title: assign.title,
      content: text,
      charCount: text.length,
    });
    setDropdownOpen(false);
  };

  const handleSelectSubject = (subj: StudySubject) => {
    const text = `Subject/Course: ${subj.name} (${subj.code || ''})\nInstructor: ${subj.instructor || 'None'}\nNotes: ${subj.notes || 'None'}`;
    onContextChange({
      type: 'subject',
      id: subj.id,
      title: subj.name,
      content: text,
      charCount: text.length,
    });
    setDropdownOpen(false);
  };

  const handleSelectFile = (file: UserFile) => {
    // In browser, if plain text or notes
    const text = `File: ${file.name} (${Math.round(file.size / 1024)} KB)\nMIME: ${file.mimeType}`;
    onContextChange({
      type: 'file',
      id: file.id,
      title: file.name,
      content: text,
      charCount: text.length,
    });
    setDropdownOpen(false);
  };

  const handleClearContext = () => {
    onContextChange({
      type: 'custom',
      title: 'None (Direct Prompt)',
      content: '',
      charCount: 0,
    });
  };

  const formatSize = (chars: number) => {
    if (chars < 1000) return `${chars} chars`;
    const kb = (chars / 1024).toFixed(1);
    return `${kb} KB (${chars.toLocaleString()} chars)`;
  };

  return (
    <div className="relative">
      {/* Context Badge / Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            {activeContext.type === 'document' && <FileText className="w-3.5 h-3.5" />}
            {activeContext.type === 'note' && <StickyNote className="w-3.5 h-3.5" />}
            {activeContext.type === 'assignment' && <CheckSquare className="w-3.5 h-3.5" />}
            {activeContext.type === 'subject' && <GraduationCap className="w-3.5 h-3.5" />}
            {activeContext.type === 'file' && <File className="w-3.5 h-3.5" />}
            {activeContext.type === 'custom' && <Type className="w-3.5 h-3.5" />}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              AI Context:
            </span>
            <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {activeContext.title}
            </span>
            {activeContext.charCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-600 shrink-0">
                {formatSize(activeContext.charCount)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeContext.charCount > 0 && (
            <button
              type="button"
              onClick={handleClearContext}
              title="Clear context"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            <span>Change Context</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Privacy note */}
      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 px-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Data minimization active: Only the selected context is provided to the AI. Account-wide data is never exposed.</span>
      </div>

      {/* Context Selection Dropdown */}
      {dropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-40 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-96 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              Select AI Context Source
            </span>
            <button
              onClick={() => setDropdownOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Custom Text Option */}
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-indigo-500" />
              <span>Paste Custom Study Text</span>
            </div>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste article, textbook excerpt, study notes, or problem statement..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <div className="mt-1.5 flex justify-end">
              <button
                type="button"
                onClick={handleSelectCustom}
                disabled={!customText.trim()}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors disabled:opacity-40 cursor-pointer"
              >
                Use Custom Text ({customText.length} chars)
              </button>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>Document Studio Documents ({documents.length})</span>
            </div>
            {documents.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No documents saved in Document Studio yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documents.slice(0, 6).map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleSelectDocument(doc)}
                    className={`text-left p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      activeContext.id === doc.id
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {doc.title || 'Untitled Document'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{doc.category || 'General'}</span>
                      <span>•</span>
                      <span>{doc.wordCount || 0} words</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-amber-500" />
              <span>Student Notes ({notes.length})</span>
            </div>
            {notes.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No notes created yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notes.slice(0, 6).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleSelectNote(n)}
                    className={`text-left p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      activeContext.id === n.id
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {n.title || 'Untitled Note'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {(n.content || '').length} characters
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assignments Section */}
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>Assignments ({assignments.length})</span>
            </div>
            {assignments.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No assignments saved in Study Planner.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {assignments.slice(0, 4).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleSelectAssignment(a)}
                    className={`text-left p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      activeContext.id === a.id
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {a.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Due: {a.dueDate || 'No date'} • {a.subjectName || 'No subject'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subjects Section */}
          {subjects.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                <span>Enrolled Subjects ({subjects.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSubject(s)}
                    className="text-left p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs"
                  >
                    <div className="font-semibold truncate">{s.name}</div>
                    <div className="text-[10px] text-slate-400">{s.code || 'Course'}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
