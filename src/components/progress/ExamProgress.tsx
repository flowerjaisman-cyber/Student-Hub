import React from 'react';
import {
  Hourglass,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  CheckSquare,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import {
  StudyExam,
  StudyTask,
  StudySession,
  StudySubject,
} from '../../types/index.ts';
import { ProgressEmptyState } from './ProgressEmptyState.tsx';

interface ExamProgressProps {
  exams: StudyExam[];
  tasks: StudyTask[];
  studySessions: StudySession[];
  subjects: StudySubject[];
  onNavigateToStudyItem?: (tab: string, itemId: string) => void;
}

export function ExamProgress({
  exams,
  tasks,
  studySessions,
  subjects,
  onNavigateToStudyItem,
}: ExamProgressProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  if (exams.length === 0) {
    return (
      <ProgressEmptyState
        icon={<Hourglass className="w-6 h-6 text-rose-500" />}
        title="No scheduled exams"
        description="Schedule upcoming exams and tests in Study Tools to track your preparation tasks, review sessions, and factual exam readiness indicators."
      />
    );
  }

  // Split into upcoming and past
  const upcomingExams = exams
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const pastExams = exams
    .filter((e) => e.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Exam Readiness Notice Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
          <span className="font-bold block mb-0.5">
            Objective Exam Readiness Indicators
          </span>
          Exam readiness calculations are indicators of completed preparation activity
          (preparation tasks and completed revision sessions) logged in StudentHub. They do
          not guarantee exam grades or predict test results.
        </div>
      </div>

      {/* Upcoming Exams with Readiness breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Upcoming Exams &amp; Readiness</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
            {upcomingExams.length}
          </span>
        </h3>

        {upcomingExams.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            No upcoming exams scheduled.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingExams.map((exam) => {
              // Related tasks for this exam or subject
              const relatedTasks = tasks.filter(
                (t) =>
                  (exam.subjectId && t.subjectId === exam.subjectId) ||
                  (exam.subjectName && t.subjectName === exam.subjectName)
              );
              const completedTasks = relatedTasks.filter((t) => t.status === 'completed');

              // Related completed study sessions
              const relatedSessions = studySessions.filter(
                (s) =>
                  s.status === 'completed' &&
                  ((exam.subjectId && s.subjectId === exam.subjectId) ||
                    (exam.subjectName && s.subjectName === exam.subjectName))
              );
              const totalStudyMins = relatedSessions.reduce(
                (sum, s) => sum + (s.durationMinutes || 0),
                0
              );

              // Factual preparation rate
              const hasTaskData = relatedTasks.length > 0;
              const taskPrepPercentage = hasTaskData
                ? Math.round((completedTasks.length / relatedTasks.length) * 100)
                : null;

              // Days until exam
              const diffMs = new Date(exam.date).getTime() - new Date(todayStr).getTime();
              const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={exam.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {exam.type || 'Exam'}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {exam.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {exam.subjectName || 'General Subject'} • {exam.date}
                        {exam.time ? ` at ${exam.time}` : ''}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
                      </span>
                    </div>
                  </div>

                  {/* Readiness Indicator based on real data */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Preparation Progress
                      </span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {taskPrepPercentage !== null ? `${taskPrepPercentage}%` : 'Not enough data'}
                      </span>
                    </div>

                    {taskPrepPercentage !== null ? (
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${taskPrepPercentage}%` }}
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        No linked preparation tasks found for this exam.
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>
                        {completedTasks.length} of {relatedTasks.length} tasks completed
                      </span>
                      <span>
                        {totalStudyMins > 0
                          ? `${Math.floor(totalStudyMins / 60)}h ${totalStudyMins % 60}m studied`
                          : 'No study logged'}
                      </span>
                    </div>
                  </div>

                  {/* Location & Notes */}
                  {(exam.location || exam.notes) && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1">
                      {exam.location && <p>Location: {exam.location}</p>}
                      {exam.notes && <p className="truncate">Notes: {exam.notes}</p>}
                    </div>
                  )}

                  {onNavigateToStudyItem && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => onNavigateToStudyItem('exams', exam.id)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Exam Details</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past / Concluded Exams */}
      {pastExams.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Past Exams ({pastExams.length})
          </h4>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            {pastExams.map((exam) => (
              <div
                key={exam.id}
                className="p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {exam.title}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {exam.subjectName || 'General'} • Date: {exam.date}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
                  Concluded
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
