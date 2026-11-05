import { useState, useMemo } from 'react';
import {
  StudyHabit,
  HabitCheck,
} from '../../types/index.ts';
import {
  saveStudyHabit,
  deleteStudyHabit,
  recordHabitCheck,
  removeHabitCheck,
} from '../../services/studyService.ts';
import {
  calculateHabitStreak,
  getLocalDateString,
} from '../../utils/studyUtils.ts';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Check,
  Trophy,
} from 'lucide-react';

interface HabitsTrackerTabProps {
  uid: string;
  habits: StudyHabit[];
  checks: HabitCheck[];
}

const PRESET_ICONS = ['📖', '⚡', '💻', '📝', '🧠', '🎯', '☕', '🏃'];

export function HabitsTrackerTab({
  uid,
  habits,
  checks,
}: HabitsTrackerTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<StudyHabit | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📖');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(7);
  const [isSaving, setIsSaving] = useState(false);

  const todayStr = getLocalDateString();

  // Last 7 days for the weekly matrix
  const past7Days = useMemo(() => {
    const list: { dateStr: string; label: string; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = getLocalDateString(d);
      list.push({
        dateStr: str,
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  const resetForm = () => {
    setEditingHabit(null);
    setTitle('');
    setDescription('');
    setIcon('📖');
    setTargetDaysPerWeek(7);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: StudyHabit) => {
    setEditingHabit(h);
    setTitle(h.name || h.title || '');
    setDescription(h.description || '');
    setIcon(h.icon || '📖');
    setTargetDaysPerWeek(h.targetDaysPerWeek || 7);
    setIsModalOpen(true);
  };

  const handleToggleCheck = async (habitId: string, dateStr: string) => {
    const existingCheck = checks.find(
      (c) => c.habitId === habitId && c.date === dateStr && c.completed
    );

    if (existingCheck) {
      await removeHabitCheck(uid, existingCheck.id);
    } else {
      await recordHabitCheck(uid, habitId, dateStr, true);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (confirm('Delete this habit and all its logged history?')) {
      await deleteStudyHabit(uid, habitId);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const payload: StudyHabit = {
        id: editingHabit ? editingHabit.id : `habit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: title.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        icon,
        targetDaysPerWeek,
        active: editingHabit ? editingHabit.active : true,
        createdAt: editingHabit ? editingHabit.createdAt : now,
        updatedAt: now,
      };

      await saveStudyHabit(uid, payload);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save habit:', err);
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
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Daily Study Habits &amp; Streaks
            </h4>
            <p className="text-xs text-slate-500">
              Build positive academic routines. Streaks calculated strictly from consecutive check-ins.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habits List */}
      {habits.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No daily habits tracked yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add daily habits like "30-min Flashcards", "Daily Math Drill", or "Review Lecture Slides".
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Habit</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const streak = calculateHabitStreak(habit.id, checks, todayStr);
            const isCheckedToday = checks.some(
              (c) => c.habitId === habit.id && c.date === todayStr && c.completed
            );

            return (
              <div
                key={habit.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-2xs transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
              >
                {/* Left: Check-in button & Title */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleCheck(habit.id, todayStr)}
                    className="p-2 rounded-xl border transition-all cursor-pointer shrink-0"
                    style={{
                      borderColor: isCheckedToday ? '#10b981' : '#cbd5e1',
                      backgroundColor: isCheckedToday ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    }}
                    title={isCheckedToday ? 'Click to uncheck today' : 'Click to complete for today'}
                  >
                    {isCheckedToday ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-400 hover:text-indigo-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{habit.icon || '📖'}</span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {habit.name || habit.title || 'Habit'}
                      </h4>
                    </div>

                    {habit.description && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {habit.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs font-semibold">
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        {streak.currentStreak} day streak
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 font-mono">
                        <Trophy className="w-3 h-3 text-slate-400" />
                        Best: {streak.longestStreak}d
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Total: {streak.totalCompletions} check-ins
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: 7-Day Matrix + Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    {past7Days.map((d) => {
                      const checked = checks.some(
                        (c) => c.habitId === habit.id && c.date === d.dateStr && c.completed
                      );

                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => handleToggleCheck(habit.id, d.dateStr)}
                          title={`${d.dateStr}: ${checked ? 'Completed' : 'Missed'} (click to toggle)`}
                          className="flex flex-col items-center gap-1 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          <span className="text-[10px] text-slate-400 font-medium">
                            {d.label}
                          </span>
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                              checked
                                ? 'bg-emerald-500 text-white'
                                : d.isToday
                                ? 'border border-dashed border-slate-400 dark:border-slate-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-300'
                            }`}
                          >
                            {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(habit)}
                      title="Edit Habit"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHabit(habit.id)}
                      title="Delete Habit"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Habit Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingHabit ? 'Edit Habit' : 'Create Study Habit'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Habit Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 25-minute Pomodoro, Review Flashcards..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Icon
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`text-xl p-2 rounded-xl transition-all ${
                        icon === emoji ? 'bg-indigo-100 dark:bg-indigo-950 scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Motivation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Keep active recall fresh every morning"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Frequency (Days / Week)
                </label>
                <select
                  value={targetDaysPerWeek}
                  onChange={(e) => setTargetDaysPerWeek(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value={7}>Every day (7 days)</option>
                  <option value={5}>Weekdays (5 days)</option>
                  <option value={3}>3 days / week</option>
                  <option value={1}>1 day / week</option>
                </select>
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
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
