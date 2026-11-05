import { useState, useMemo } from 'react';
import {
  StudyTask,
  StudyAssignment,
  StudyExam,
  StudySession,
  StudyGoal,
  StudyHabit,
  HabitCheck,
  StudySubject,
} from '../../types/index.ts';
import {
  filterSessionsByRange,
  groupStudyMinutesBySubject,
  getLocalDateString,
} from '../../utils/studyUtils.ts';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  FileCheck2,
  Hourglass,
  BookOpen,
} from 'lucide-react';

interface ProductivityProgressTabProps {
  tasks: StudyTask[];
  assignments: StudyAssignment[];
  exams: StudyExam[];
  sessions: StudySession[];
  goals: StudyGoal[];
  habits: StudyHabit[];
  checks: HabitCheck[];
  subjects: StudySubject[];
}

type TimeRange = 'today' | 'week' | 'month' | 'all';

export function ProductivityProgressTab({
  tasks,
  assignments,
  exams,
  sessions,
  goals,
  habits,
  checks,
  subjects,
}: ProductivityProgressTabProps) {
  const [range, setRange] = useState<TimeRange>('week');
  const todayStr = getLocalDateString();

  // Filter study sessions by selected range
  const scopedSessions = useMemo(() => {
    return filterSessionsByRange(sessions, range);
  }, [sessions, range]);

  // Total study minutes in range
  const totalStudyMinutes = useMemo(() => {
    return scopedSessions.reduce((acc, s) => {
      const mins = s.durationMinutes ?? Math.round((s.duration || s.durationSeconds || 0) / 60);
      return acc + mins;
    }, 0);
  }, [scopedSessions]);

  // Breakdown by subject in range
  const subjectBreakdown = useMemo(() => {
    return groupStudyMinutesBySubject(scopedSessions, subjects);
  }, [scopedSessions, subjects]);

  // Task statistics
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const totalTasksCount = tasks.length;
  const taskCompletionRate = totalTasksCount > 0
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : null;

  // Assignment statistics
  const completedAssignmentsCount = assignments.filter((a) => a.status === 'completed').length;
  const submittedAssignmentsCount = assignments.filter((a) => a.status === 'submitted').length;
  const totalAssignmentsCount = assignments.length;

  // Goals reached
  const reachedGoalsCount = goals.filter((g) => g.currentValue >= g.targetValue).length;

  // Habits active
  const activeHabitsCount = habits.filter((h) => h.active).length;
  const todayHabitChecksCount = checks.filter(
    (c) => c.date === todayStr && c.completed
  ).length;

  // Study hours by day for the last 7 days
  const dailyBreakdown = useMemo(() => {
    const days: { dateStr: string; dayLabel: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = getLocalDateString(d);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      // sum sessions that start on this day
      const minutesOnDay = sessions
        .filter((s) => {
          const start = s.actualStart || s.startTime || s.createdAt || '';
          return start.startsWith(str);
        })
        .reduce((sum, s) => {
          const mins = s.durationMinutes ?? Math.round((s.duration || s.durationSeconds || 0) / 60);
          return sum + mins;
        }, 0);

      days.push({
        dateStr: str,
        dayLabel,
        minutes: minutesOnDay,
      });
    }
    return days;
  }, [sessions]);

  const maxDailyMinutes = Math.max(60, ...dailyBreakdown.map((d) => d.minutes));

  return (
    <div className="space-y-6">
      {/* Range selector bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Real Academic &amp; Productivity Metrics
            </h4>
            <p className="text-xs text-slate-500">
              Aggregated directly from your actual logged sessions, tasks, and habits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id as TimeRange)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                range === r.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Study Time */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Study Time
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {(totalStudyMinutes / 60).toFixed(1)} <span className="text-xs font-sans font-normal text-slate-500">hrs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            {scopedSessions.length} recorded session{scopedSessions.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Task Completion */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tasks Done
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {completedTasksCount} <span className="text-xs font-sans font-normal text-slate-500">/ {totalTasksCount}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            {taskCompletionRate !== null ? `${taskCompletionRate}% completed` : 'No tasks added'}
          </p>
        </div>

        {/* Assignments */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
            <FileCheck2 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Assignments
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {completedAssignmentsCount} <span className="text-xs font-sans font-normal text-slate-500">completed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            {submittedAssignmentsCount} submitted, {totalAssignmentsCount} total
          </p>
        </div>

        {/* Habits Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Habits Today
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {todayHabitChecksCount} <span className="text-xs font-sans font-normal text-slate-500">/ {activeHabitsCount}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            {goals.length} target goals ({reachedGoalsCount} reached)
          </p>
        </div>
      </div>

      {/* Visual Chart: 7-Day Study Time Activity */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Daily Study Time (Last 7 Days)
          </h4>
          <span className="text-xs text-slate-500 font-mono">
            Total:{' '}
            {(
              dailyBreakdown.reduce((sum, d) => sum + d.minutes, 0) / 60
            ).toFixed(1)}{' '}
            hrs
          </span>
        </div>

        {/* Bar visualization */}
        <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
          {dailyBreakdown.map((d) => {
            const heightPct = Math.round((d.minutes / maxDailyMinutes) * 100);
            const isToday = d.dateStr === todayStr;

            return (
              <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.minutes > 0 ? `${(d.minutes / 60).toFixed(1)}h` : '0'}
                </div>

                <div className="w-full max-w-[40px] bg-slate-100 dark:bg-slate-800 rounded-t-lg h-full flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isToday
                        ? 'bg-indigo-600'
                        : d.minutes > 0
                        ? 'bg-indigo-400/80 dark:bg-indigo-500/80'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>

                <span
                  className={`text-[11px] font-medium ${
                    isToday
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  {d.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Course / Subject Breakdown in Range */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Study Time by Course ({range.toUpperCase()})
        </h4>

        {subjectBreakdown.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No study sessions recorded for this time range.
          </div>
        ) : (
          <div className="space-y-3">
            {subjectBreakdown.map((sb) => {
              const pct = totalStudyMinutes > 0 ? Math.round((sb.minutes / totalStudyMinutes) * 100) : 0;

              return (
                <div key={sb.subjectId || 'general'} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {sb.subjectName}
                    </span>
                    <span className="font-mono text-slate-500">
                      {(sb.minutes / 60).toFixed(1)} hrs ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: sb.color || '#6366f1',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
