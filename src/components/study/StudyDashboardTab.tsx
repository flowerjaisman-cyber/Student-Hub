import {
  StudyTask,
  StudyAssignment,
  StudyExam,
  TimetableEntry,
  StudySession,
  StudyGoal,
  StudyHabit,
  HabitCheck,
  StudySubject,
} from '../../types/index.ts';
import {
  getLocalDateString,
  getDayOfWeekFromDate,
  formatDurationSeconds,
  getCountdownParts,
} from '../../utils/studyUtils.ts';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Hourglass,
  Plus,
  Play,
  Brain,
  Target,
  Flame,
  FileCheck2,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface StudyDashboardTabProps {
  tasks: StudyTask[];
  assignments: StudyAssignment[];
  exams: StudyExam[];
  timetable: TimetableEntry[];
  sessions: StudySession[];
  goals: StudyGoal[];
  habits: StudyHabit[];
  checks: HabitCheck[];
  subjects: StudySubject[];
  onNavigateTab: (tab: any) => void;
  onToggleTaskComplete: (task: StudyTask) => void;
  onToggleHabitCheck: (habitId: string, dateStr: string) => void;
  onOpenAddTask: () => void;
  onOpenAddAssignment: () => void;
  onOpenAddExam: () => void;
}

export function StudyDashboardTab({
  tasks,
  assignments,
  exams,
  timetable,
  sessions,
  goals,
  habits,
  checks,
  subjects,
  onNavigateTab,
  onToggleTaskComplete,
  onToggleHabitCheck,
  onOpenAddTask,
  onOpenAddAssignment,
  onOpenAddExam,
}: StudyDashboardTabProps) {
  const todayStr = getLocalDateString();
  const todayDayOfWeek = getDayOfWeekFromDate(new Date());

  // Tasks due today
  const tasksDueToday = tasks.filter((t) => t.dueDate === todayStr);

  // Assignments due today
  const assignmentsDueToday = assignments.filter(
    (a) => a.dueDate === todayStr && a.status !== 'completed'
  );

  // Classes today
  const timetableToday = timetable
    .filter((t) => t.dayOfWeek === todayDayOfWeek && t.active)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Exams / Deadlines today
  const examsToday = exams.filter((e) => e.date === todayStr);

  // Upcoming exams in the next 14 days
  const upcomingExams = exams
    .filter((e) => !e.completed && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  // Upcoming assignments in the next 14 days
  const upcomingAssignments = assignments
    .filter((a) => a.status !== 'completed' && a.dueDate >= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  // Study time today
  const studyMinutesToday = sessions
    .filter((s) => {
      const start = s.actualStart || s.startTime || s.createdAt || '';
      return start.startsWith(todayStr);
    })
    .reduce((acc, s) => {
      const mins = s.durationMinutes ?? Math.round((s.duration || s.durationSeconds || 0) / 60);
      return acc + mins;
    }, 0);

  // Tasks completed today
  const tasksCompletedToday = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt?.startsWith(todayStr)
  ).length;

  return (
    <div className="space-y-6">
      {/* 1. Quick Launch Action Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Quick Actions:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenAddTask}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddAssignment}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assignment</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddExam}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Exam</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('sessions')}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Start Stopwatch</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('pomodoro')}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Start Pomodoro</span>
          </button>
        </div>
      </div>

      {/* 2. Today's Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Today's Schedule & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Today's Tasks ({tasksDueToday.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('tasks')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View all tasks</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {tasksDueToday.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No tasks due today. Everything on schedule!
              </div>
            ) : (
              <div className="space-y-2">
                {tasksDueToday.map((task) => {
                  const isDone = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onToggleTaskComplete(task)}
                          className="text-slate-400 hover:text-indigo-600 shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.subjectName && (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                              {task.subjectName}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {task.dueTime || 'Today'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Today's Timetable / Classes */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Today's Classes &amp; Routine ({todayDayOfWeek.toUpperCase()})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('timetable')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Full timetable</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {timetableToday.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No classes or timetable blocks scheduled for {todayDayOfWeek}.
              </div>
            ) : (
              <div className="space-y-2">
                {timetableToday.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                        {entry.title}
                      </h5>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {entry.subjectName && (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {entry.subjectName}
                          </span>
                        )}
                        {entry.location && <span>• {entry.location}</span>}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {entry.startTime} – {entry.endTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Habits Check-in Strip */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Today's Habits
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('habits')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Track habits</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No habits created yet. Define positive academic habits to track streaks!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {habits.map((habit) => {
                  const isChecked = checks.some(
                    (c) => c.habitId === habit.id && c.date === todayStr && c.completed
                  );

                  return (
                    <button
                      key={habit.id}
                      type="button"
                      onClick={() => onToggleHabitCheck(habit.id, todayStr)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{habit.icon || '📖'}</span>
                        <span className="text-xs font-bold truncate">{habit.name || habit.title || 'Habit'}</span>
                      </div>
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Stats & Upcoming Deadlines */}
        <div className="space-y-6">
          {/* Today's Productivity Snapshot */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              Today's Real Stats
            </span>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-xs text-indigo-200/80 block">Study Time</span>
                <span className="text-2xl font-extrabold font-mono text-white">
                  {(studyMinutesToday / 60).toFixed(1)} <span className="text-xs font-sans text-indigo-200">hrs</span>
                </span>
              </div>

              <div>
                <span className="text-xs text-indigo-200/80 block">Completed</span>
                <span className="text-2xl font-extrabold font-mono text-white">
                  {tasksCompletedToday} <span className="text-xs font-sans text-indigo-200">tasks</span>
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-indigo-200">
              <span>Active Goals: {goals.filter((g) => g.currentValue < g.targetValue).length}</span>
              <button
                type="button"
                onClick={() => onNavigateTab('progress')}
                className="font-bold hover:underline text-white flex items-center gap-1"
              >
                <span>Full report</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Upcoming Major Deadlines & Exams */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Upcoming Deadlines
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('exams')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingExams.length === 0 && upcomingAssignments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No upcoming exams or deadlines logged.
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingExams.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        {ex.type}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {ex.date}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {ex.title}
                    </h5>
                    {ex.subjectName && (
                      <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                        {ex.subjectName}
                      </span>
                    )}
                  </div>
                ))}

                {upcomingAssignments.map((asgn) => (
                  <div
                    key={asgn.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Assignment
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        Due: {asgn.dueDate}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {asgn.title}
                    </h5>
                    {asgn.subjectName && (
                      <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                        {asgn.subjectName}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
