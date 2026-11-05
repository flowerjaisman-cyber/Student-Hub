import React from 'react';
import {
  BookOpen,
  FileCheck2,
  Hourglass,
  CheckSquare,
  Clock,
  Flame,
  FileText,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  StudyTask,
  StudyAssignment,
  StudyExam,
  StudySession,
  StudyHabit,
  StudySubject,
  UserDocument,
  UserNote,
  UserFile,
} from '../../types/index.ts';
import { AcademicResult, AcademicPeriod } from '../../types/progress.ts';

interface ProgressOverviewProps {
  tasks: StudyTask[];
  assignments: StudyAssignment[];
  exams: StudyExam[];
  studySessions: StudySession[];
  habits: StudyHabit[];
  subjects: StudySubject[];
  results: AcademicResult[];
  documents: UserDocument[];
  notes: UserNote[];
  files: UserFile[];
  selectedPeriod?: AcademicPeriod | null;
  onNavigateTab: (tab: string) => void;
  onOpenNewResult: () => void;
  onOpenPeriodsModal: () => void;
}

export function ProgressOverview({
  tasks,
  assignments,
  exams,
  studySessions,
  habits,
  subjects,
  results,
  documents,
  notes,
  files,
  selectedPeriod,
  onNavigateTab,
  onOpenNewResult,
  onOpenPeriodsModal,
}: ProgressOverviewProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  // REAL DATA CALCULATIONS ONLY (NO FAKE METRICS)
  const activeSubjectsCount = subjects.length;

  const pendingAssignments = assignments.filter(
    (a) => a.status !== 'submitted' && a.status !== 'completed'
  );
  const pendingAssignmentsCount = pendingAssignments.length;

  const upcomingExams = exams.filter((e) => e.date >= todayStr);
  const upcomingExamsCount = upcomingExams.length;

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const completedTasksCount = completedTasks.length;

  // Only completed sessions contribute to study time
  const completedSessions = studySessions.filter((s) => s.status === 'completed');
  const completedSessionsCount = completedSessions.length;
  const totalCompletedMinutes = completedSessions.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0
  );

  const hours = Math.floor(totalCompletedMinutes / 60);
  const minutes = totalCompletedMinutes % 60;
  const studyTimeFormatted =
    completedSessionsCount > 0
      ? hours > 0
        ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
        : `${minutes}m`
      : 'No data';

  const activeHabitsCount = habits.filter((h) => h.active !== false).length;
  const totalDocsCount = documents.length + notes.length + files.length;

  // Deadline Health calculations
  const next7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const dueTodayTasks = tasks.filter(
    (t) => t.dueDate === todayStr && t.status !== 'completed'
  ).length;
  const dueTodayAssignments = assignments.filter(
    (a) => a.dueDate === todayStr && a.status !== 'submitted' && a.status !== 'completed'
  ).length;
  const totalDueToday = dueTodayTasks + dueTodayAssignments;

  const dueThisWeekTasks = tasks.filter(
    (t) => t.dueDate > todayStr && t.dueDate <= next7DaysStr && t.status !== 'completed'
  ).length;
  const dueThisWeekAssignments = assignments.filter(
    (a) =>
      a.dueDate > todayStr &&
      a.dueDate <= next7DaysStr &&
      a.status !== 'submitted' &&
      a.status !== 'completed'
  ).length;
  const totalDueThisWeek = dueThisWeekTasks + dueThisWeekAssignments;

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'completed'
  ).length;
  const overdueAssignments = assignments.filter(
    (a) =>
      a.dueDate &&
      a.dueDate < todayStr &&
      a.status !== 'submitted' &&
      a.status !== 'completed'
  ).length;
  const totalOverdue = overdueTasks + overdueAssignments;

  // Most Studied Subject
  const subjectTimeMap: Record<string, number> = {};
  completedSessions.forEach((s) => {
    const key = s.subjectName || 'Unassigned';
    subjectTimeMap[key] = (subjectTimeMap[key] || 0) + (s.durationMinutes || 0);
  });
  let mostStudiedSubject: string | null = null;
  let mostStudiedMinutes = 0;
  Object.entries(subjectTimeMap).forEach(([sub, mins]) => {
    if (mins > mostStudiedMinutes) {
      mostStudiedMinutes = mins;
      mostStudiedSubject = sub;
    }
  });

  // Earliest Upcoming Deadline
  const upcomingCoursework = [
    ...tasks
      .filter((t) => t.dueDate && t.dueDate >= todayStr && t.status !== 'completed')
      .map((t) => ({ title: t.title, date: t.dueDate!, type: 'Task' })),
    ...assignments
      .filter(
        (a) =>
          a.dueDate &&
          a.dueDate >= todayStr &&
          a.status !== 'submitted' &&
          a.status !== 'completed'
      )
      .map((a) => ({ title: a.title, date: a.dueDate!, type: 'Assignment' })),
    ...exams
      .filter((e) => e.date >= todayStr)
      .map((e) => ({ title: e.title, date: e.date, type: 'Exam' })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const nextDeadline = upcomingCoursework[0] || null;

  return (
    <div className="space-y-6">
      {/* 1. Real Data Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Active Subjects */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Subjects</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {activeSubjectsCount > 0 ? activeSubjectsCount : 'No data'}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
            {activeSubjectsCount > 0
              ? `Enrolled course courses`
              : 'Add subjects to track'}
          </p>
        </div>

        {/* Pending Assignments */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending Assignments</span>
            <FileCheck2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {assignments.length > 0 ? pendingAssignmentsCount : 'No data'}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
            {assignments.length > 0
              ? `${assignments.length - pendingAssignmentsCount} submitted`
              : 'No assignments recorded'}
          </p>
        </div>

        {/* Upcoming Exams */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Upcoming Exams</span>
            <Hourglass className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {exams.length > 0 ? upcomingExamsCount : 'No data'}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
            {exams.length > 0 ? `${exams.length} total scheduled` : 'No exams scheduled'}
          </p>
        </div>

        {/* Completed Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Completed Tasks</span>
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {tasks.length > 0 ? completedTasksCount : 'No data'}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
            {tasks.length > 0 ? `Out of ${tasks.length} tasks` : 'No tasks created yet'}
          </p>
        </div>

        {/* Completed Study Sessions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Study Sessions</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {completedSessionsCount > 0 ? completedSessionsCount : 'No data'}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
            {completedSessionsCount > 0
              ? `Completed focus blocks`
              : 'Record study sessions'}
          </p>
        </div>

        {/* Total Completed Study Time */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Study Time</span>
            <TrendingUp className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {studyTimeFormatted}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
            {completedSessionsCount > 0
              ? `Across ${completedSessionsCount} sessions`
              : 'No sessions completed'}
          </p>
        </div>

        {/* Active Habits */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Habits</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {habits.length > 0 ? activeHabitsCount : 'No data'}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
            {habits.length > 0 ? `${habits.length} habits configured` : 'No habits tracked'}
          </p>
        </div>

        {/* Documents & Materials */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Documents &amp; Files</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalDocsCount > 0 ? totalDocsCount : 'No data'}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
            {documents.length} docs • {notes.length} notes • {files.length} files
          </p>
        </div>
      </div>

      {/* 2. Neutral Insight Cards (Strictly factual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Most Studied Subject */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Most Studied Subject
          </div>
          {mostStudiedSubject ? (
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-white truncate">
                {mostStudiedSubject}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {Math.floor(mostStudiedMinutes / 60)}h {mostStudiedMinutes % 60}m recorded
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              No completed study sessions recorded yet.
            </p>
          )}
        </div>

        {/* Next Upcoming Deadline */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Earliest Upcoming Due Date
          </div>
          {nextDeadline ? (
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-white truncate">
                {nextDeadline.title}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {nextDeadline.type} • Due {nextDeadline.date}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              No upcoming deadlines on record.
            </p>
          )}
        </div>

        {/* Unfinished Coursework */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Unfinished Coursework
          </div>
          {tasks.length > 0 || assignments.length > 0 ? (
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {(tasks.length - completedTasksCount) + pendingAssignmentsCount} items
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {tasks.length - completedTasksCount} pending tasks • {pendingAssignmentsCount} assignments
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              No coursework items recorded yet.
            </p>
          )}
        </div>

        {/* Results Recorded */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Recorded Results
          </div>
          {results.length > 0 ? (
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {results.length} assessment{results.length === 1 ? '' : 's'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Avg:{' '}
                {(
                  results.reduce((s, r) => s + r.percentage, 0) / results.length
                ).toFixed(1)}
                % across recorded assessments
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              No assessment marks recorded yet.
            </p>
          )}
        </div>
      </div>

      {/* 3. Deadline Health Overview (Strictly neutral terminology) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Deadline Health
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Factual distribution of upcoming tasks and assignment deadlines
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('coursework')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Coursework</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Due Today */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Due Today
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {totalDueToday}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              {dueTodayTasks} tasks • {dueTodayAssignments} assignments
            </p>
          </div>

          {/* Due This Week */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              Due in Next 7 Days
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {totalDueThisWeek}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              {dueThisWeekTasks} tasks • {dueThisWeekAssignments} assignments
            </p>
          </div>

          {/* Overdue */}
          <div className="p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20">
            <span className="text-xs text-rose-600 dark:text-rose-400 block mb-1 font-medium">
              Overdue Items
            </span>
            <div className="text-xl font-bold text-rose-700 dark:text-rose-300">
              {totalOverdue}
            </div>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
              {overdueTasks} tasks • {overdueAssignments} assignments
            </p>
          </div>
        </div>
      </div>

      {/* 4. Quick Action Shortcuts */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Academic Progress Quick Actions</span>
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Record actual assessment scores, manage academic periods, or run an AI factual audit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewResult}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Result</span>
          </button>
          <button
            type="button"
            onClick={onOpenPeriodsModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Manage Periods</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('ai-insights')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze My Progress</span>
          </button>
        </div>
      </div>
    </div>
  );
}
