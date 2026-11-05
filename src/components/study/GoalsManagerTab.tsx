import { useState } from 'react';
import {
  StudyGoal,
  StudyGoalUnit,
  StudyGoalMilestone,
  StudySubject,
} from '../../types/index.ts';
import { saveStudyGoal, deleteStudyGoal } from '../../services/studyService.ts';
import {
  calculateProgressPercentage,
  getLocalDateString,
} from '../../utils/studyUtils.ts';
import {
  Target,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  CheckCircle2,
  Circle,
  PlusCircle,
  MinusCircle,
  Award,
} from 'lucide-react';

interface GoalsManagerTabProps {
  uid: string;
  goals: StudyGoal[];
  subjects: StudySubject[];
  onOpenSubjectsModal?: () => void;
}

export function GoalsManagerTab({
  uid,
  goals,
  subjects,
  onOpenSubjectsModal,
}: GoalsManagerTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<StudyGoal | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [targetValue, setTargetValue] = useState<number>(10);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [unit, setUnit] = useState<StudyGoalUnit>('hours');
  const [customUnit, setCustomUnit] = useState('');
  const [deadline, setDeadline] = useState(getLocalDateString());
  const [notes, setNotes] = useState('');
  const [milestonesText, setMilestonesText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setEditingGoal(null);
    setTitle('');
    setSubjectId('');
    setTargetValue(10);
    setCurrentValue(0);
    setUnit('hours');
    setCustomUnit('');
    setDeadline(getLocalDateString());
    setNotes('');
    setMilestonesText('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: StudyGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setSubjectId(goal.subjectId || '');
    setTargetValue(goal.targetValue);
    setCurrentValue(goal.currentValue);
    setUnit(goal.unit);
    setCustomUnit(goal.customUnit || '');
    setDeadline(goal.deadline || getLocalDateString());
    setNotes(goal.notes || '');
    setMilestonesText(goal.milestones ? goal.milestones.map((m) => m.title).join('\n') : '');
    setIsModalOpen(true);
  };

  const handleQuickAdjust = async (goal: StudyGoal, amount: number) => {
    const nextVal = Math.max(0, goal.currentValue + amount);
    await saveStudyGoal(uid, {
      ...goal,
      currentValue: nextVal,
      completed: nextVal >= goal.targetValue,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleMilestone = async (goal: StudyGoal, milestoneId: string) => {
    if (!goal.milestones) return;
    const updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    await saveStudyGoal(uid, {
      ...goal,
      milestones: updatedMilestones,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this study goal?')) {
      await deleteStudyGoal(uid, id);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetValue <= 0) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const selectedSub = subjects.find((s) => s.id === subjectId);

      // Parse milestones
      const milestones: StudyGoalMilestone[] = milestonesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, idx) => {
          const existing = editingGoal?.milestones?.[idx];
          return {
            id: existing ? existing.id : `m_${Date.now()}_${idx}`,
            title: line,
            completed: existing ? existing.completed : false,
          };
        });

      const payload: StudyGoal = {
        id: editingGoal ? editingGoal.id : `goal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        subjectId: subjectId || undefined,
        subjectName: selectedSub ? selectedSub.name : undefined,
        targetValue,
        currentValue,
        unit,
        customUnit: unit === 'custom' ? customUnit.trim() : undefined,
        deadline: deadline || undefined,
        milestones: milestones.length > 0 ? milestones : undefined,
        notes: notes.trim() || undefined,
        completed: currentValue >= targetValue,
        createdAt: editingGoal ? editingGoal.createdAt : now,
        updatedAt: now,
      };

      await saveStudyGoal(uid, payload);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save goal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Targeted Academic Goals
            </h4>
            <p className="text-xs text-slate-500">
              Measure hours, chapters, pages, or exercises with strict quantitative tracking.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No study goals defined yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Set goals like "Complete 50 practice problems", "Read 8 chapters of Biology", or "Log 20 study hours".
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const rawPct = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
            const displayPct = Math.min(100, Math.round(rawPct));
            const isCompleted = goal.currentValue >= goal.targetValue;
            const unitLabel = goal.unit === 'custom' && goal.customUnit ? goal.customUnit : goal.unit;

            return (
              <div
                key={goal.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-2xs transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {goal.subjectName && (
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {goal.subjectName}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Target Reached!
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {goal.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(goal)}
                        title="Edit Goal"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(goal.id)}
                        title="Delete Goal"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Numbers */}
                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                        {goal.currentValue}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / {goal.targetValue} {unitLabel}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {Math.round(rawPct)}%
                    </span>
                  </div>

                  {/* Visual Bar (Capped at 100% display, preserves true value) */}
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1.5">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${displayPct}%` }}
                    />
                  </div>

                  {/* Milestone checklist */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Milestones:
                      </p>
                      {goal.milestones.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleToggleMilestone(goal, m.id)}
                          className="flex items-center gap-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors w-full cursor-pointer"
                        >
                          {m.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className={m.completed ? 'line-through text-slate-400' : ''}>
                            {m.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {goal.deadline && (
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Target Date: {goal.deadline}</span>
                    </div>
                  )}
                </div>

                {/* Quick Increment Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Quick progress:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(goal, -1)}
                      className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(goal, 1)}
                      className="px-2 py-1 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-mono font-bold"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(goal, 5)}
                      className="px-2 py-1 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-mono font-bold"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingGoal ? 'Edit Study Goal' : 'Create Study Goal'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Linear Algebra chapter questions, Read 10 papers..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as StudyGoalUnit)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white capitalize"
                  >
                    <option value="hours">Hours</option>
                    <option value="chapters">Chapters</option>
                    <option value="pages">Pages</option>
                    <option value="assignments">Assignments</option>
                    <option value="exercises">Exercises</option>
                    <option value="custom">Custom Unit</option>
                  </select>
                </div>

                {unit === 'custom' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Custom Unit Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Videos, Flashcard decks"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subject (Optional)
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">General</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Value *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Value
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Milestones / Sub-goals (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder={'Read sections 1-3\nSolve end-of-chapter quiz\nDraft summary notes'}
                  value={milestonesText}
                  onChange={(e) => setMilestonesText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !title.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
