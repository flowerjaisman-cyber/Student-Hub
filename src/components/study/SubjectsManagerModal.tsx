import { useState } from 'react';
import { StudySubject } from '../../types/index.ts';
import { saveSubject, deleteSubject } from '../../services/studyService.ts';
import { X, Plus, Edit2, Trash2, CheckCircle2, BookOpen } from 'lucide-react';

interface SubjectsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  subjects: StudySubject[];
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#64748b', // Slate
];

export function SubjectsManagerModal({
  isOpen,
  onClose,
  uid,
  subjects,
}: SubjectsManagerModalProps) {
  const [editingSubject, setEditingSubject] = useState<StudySubject | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setInstructor('');
    setColor(PRESET_COLORS[0]);
    setNotes('');
  };

  const handleStartEdit = (sub: StudySubject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code || '');
    setInstructor(sub.instructor || '');
    setColor(sub.color || PRESET_COLORS[0]);
    setNotes(sub.notes || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const subjectToSave: StudySubject = {
        id: editingSubject ? editingSubject.id : `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: name.trim(),
        code: code.trim() || undefined,
        instructor: instructor.trim() || undefined,
        color,
        active: editingSubject ? editingSubject.active : true,
        notes: notes.trim() || undefined,
        createdAt: editingSubject ? editingSubject.createdAt : now,
        updatedAt: now,
      };

      await saveSubject(uid, subjectToSave);
      resetForm();
    } catch (err) {
      console.error('Failed to save subject:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (sub: StudySubject) => {
    await saveSubject(uid, {
      ...sub,
      active: !sub.active,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = async (subId: string) => {
    if (confirm('Delete this subject? Note: associated tasks and study logs will be preserved with their stored subject reference.')) {
      await deleteSubject(uid, subId);
      if (editingSubject?.id === subId) {
        resetForm();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Course &amp; Subject Catalog
              </h2>
              <p className="text-xs text-slate-500">
                Shared courses used across tasks, timetable, exams, and study logs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Course Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calculus II, Microeconomics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Course Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MATH 201, CS 105"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instructor / Professor (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Alan Turing"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Badge Color
                </label>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={`Color ${c}`}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingSubject && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl flex items-center gap-1.5"
              >
                {editingSubject ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Update Subject</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Subject</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Subjects List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Your Enrolled Subjects ({subjects.length})
            </h3>

            {subjects.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                No subjects added yet. Add your courses above to organize tasks and schedules.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      sub.active
                        ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs'
                        : 'bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {sub.name}
                          </p>
                          {sub.code && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {sub.code}
                            </span>
                          )}
                        </div>
                        {sub.instructor && (
                          <p className="text-[11px] text-slate-500 truncate">
                            {sub.instructor}
                          </p>
                        )}
                        {!sub.active && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                            (Archived)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(sub)}
                        title={sub.active ? 'Archive Subject' : 'Restore Subject'}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px]"
                      >
                        {sub.active ? 'Archive' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(sub)}
                        aria-label="Edit subject"
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sub.id)}
                        aria-label="Delete subject"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
