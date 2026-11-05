import React, { useState, useEffect } from 'react';
import { X, Award, AlertCircle, Trash2 } from 'lucide-react';
import { AcademicResult, AssessmentType, AcademicPeriod } from '../../types/progress.ts';
import { StudySubject } from '../../types/index.ts';
import { saveAcademicResult, deleteAcademicResult } from '../../services/progressService.ts';

interface ResultsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  existingResult?: AcademicResult | null;
  subjects: StudySubject[];
  periods: AcademicPeriod[];
  onSaved?: () => void;
}

const ASSESSMENT_TYPES: { id: AssessmentType; label: string }[] = [
  { id: 'assignment', label: 'Assignment' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'midterm', label: 'Midterm Exam' },
  { id: 'final', label: 'Final Exam' },
  { id: 'project', label: 'Project / Paper' },
  { id: 'practical', label: 'Practical / Lab' },
  { id: 'homework', label: 'Homework' },
  { id: 'presentation', label: 'Presentation' },
  { id: 'other', label: 'Other Assessment' },
];

export function ResultsManagerModal({
  isOpen,
  onClose,
  userId,
  existingResult,
  subjects,
  periods,
  onSaved,
}: ResultsManagerModalProps) {
  const [subjectId, setSubjectId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [assessmentName, setAssessmentName] = useState('');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('assignment');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxMarks, setMaxMarks] = useState<string>('100');
  const [obtainedMarks, setObtainedMarks] = useState<string>('');
  const [grade, setGrade] = useState('');
  const [weight, setWeight] = useState<string>('');
  const [periodId, setPeriodId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingResult) {
      setSubjectId(existingResult.subjectId || '');
      setSubjectName(existingResult.subjectName || '');
      setAssessmentName(existingResult.assessmentName || '');
      setAssessmentType(existingResult.assessmentType || 'assignment');
      setDate(existingResult.date || new Date().toISOString().split('T')[0]);
      setMaxMarks(String(existingResult.maxMarks));
      setObtainedMarks(String(existingResult.obtainedMarks));
      setGrade(existingResult.grade || '');
      setWeight(existingResult.weight !== undefined ? String(existingResult.weight) : '');
      setPeriodId(existingResult.periodId || '');
      setNotes(existingResult.notes || '');
    } else {
      setSubjectId(subjects[0]?.id || '');
      setSubjectName(subjects[0]?.name || '');
      setAssessmentName('');
      setAssessmentType('assignment');
      setDate(new Date().toISOString().split('T')[0]);
      setMaxMarks('100');
      setObtainedMarks('');
      setGrade('');
      setWeight('');
      const activeP = periods.find((p) => p.isActive);
      setPeriodId(activeP?.id || '');
      setNotes('');
    }
    setError(null);
  }, [existingResult, isOpen, subjects, periods]);

  if (!isOpen) return null;

  // Live calculated percentage
  const numMax = parseFloat(maxMarks);
  const numObtained = parseFloat(obtainedMarks);
  const calculatedPercentage =
    !isNaN(numMax) && !isNaN(numObtained) && numMax > 0 && numObtained >= 0 && numObtained <= numMax
      ? Number(((numObtained / numMax) * 100).toFixed(2))
      : null;

  const handleSubjectChange = (id: string) => {
    setSubjectId(id);
    const s = subjects.find((sub) => sub.id === id);
    if (s) {
      setSubjectName(s.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentName.trim()) {
      setError('Assessment name is required (e.g. Midterm 1, Essay #2)');
      return;
    }
    if (!subjectName.trim()) {
      setError('Course or subject name is required');
      return;
    }
    if (isNaN(numMax) || numMax <= 0) {
      setError('Maximum marks must be greater than 0');
      return;
    }
    if (isNaN(numObtained) || numObtained < 0) {
      setError('Obtained marks must be 0 or greater');
      return;
    }
    if (numObtained > numMax) {
      setError(`Obtained marks (${numObtained}) cannot be greater than maximum marks (${numMax})`);
      return;
    }

    const numWeight = weight.trim() ? parseFloat(weight) : undefined;
    if (numWeight !== undefined && (isNaN(numWeight) || numWeight < 0 || numWeight > 100)) {
      setError('Weight must be between 0% and 100%');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const id = existingResult?.id || `result_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const resultPayload: AcademicResult = {
        id,
        userId,
        subjectId: subjectId || undefined,
        subjectName: subjectName.trim(),
        assessmentName: assessmentName.trim(),
        assessmentType,
        date,
        maxMarks: numMax,
        obtainedMarks: numObtained,
        percentage: Number(((numObtained / numMax) * 100).toFixed(2)),
        grade: grade.trim() || undefined,
        weight: numWeight,
        periodId: periodId || undefined,
        notes: notes.trim() || undefined,
        createdAt: existingResult?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveAcademicResult(userId, resultPayload);
      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save academic result');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingResult) return;
    if (!window.confirm(`Delete record for "${existingResult.assessmentName}"?`)) return;

    try {
      await deleteAcademicResult(userId, existingResult.id);
      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete result');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {existingResult ? 'Edit Academic Result' : 'Record Academic Result'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track verified assessment marks and calculate accurate performance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Assessment Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assessment Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Midterm Examination, Research Paper #1, Quiz 3"
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Subject & Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject / Course *
              </label>
              {subjects.length > 0 ? (
                <select
                  value={subjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} {sub.code ? `(${sub.code})` : ''}
                    </option>
                  ))}
                  <option value="">Other / Custom Subject</option>
                </select>
              ) : null}
              {(!subjectId || subjects.length === 0) && (
                <input
                  type="text"
                  placeholder="Enter Course or Subject Name"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="mt-1.5 w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assessment Type
              </label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {ASSESSMENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Marks Input Grid with Live Percentage */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Obtained Marks *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 85"
                  value={obtainedMarks}
                  onChange={(e) => setObtainedMarks(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Maximum Marks *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder="e.g. 100"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Live Percentage Banner */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Calculated Percentage:</span>
              <span className="font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400">
                {calculatedPercentage !== null ? `${calculatedPercentage}%` : '—'}
              </span>
            </div>
          </div>

          {/* Optional: Date, Grade & Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Letter Grade (Opt.)
              </label>
              <input
                type="text"
                placeholder="e.g. A, B+, 90"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Weight % (Opt.)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                placeholder="e.g. 25"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Academic Period Selector */}
          {periods.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Period (Optional)
              </label>
              <select
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">None / General</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.startDate.substring(0, 4)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Feedback / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Lost 2 marks on question 4 due to formatting..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {existingResult ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : existingResult ? 'Update Result' : 'Save Result'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
