import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck2,
  Hourglass,
  FileText,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  StudySubject,
  StudyTask,
  StudyAssignment,
  StudyExam,
  StudySession,
  UserDocument,
  UserNote,
} from '../../types/index.ts';
import { AcademicResult } from '../../types/progress.ts';
import { ProgressEmptyState } from './ProgressEmptyState.tsx';

interface SubjectProgressProps {
  subjects: StudySubject[];
  tasks: StudyTask[];
  assignments: StudyAssignment[];
  exams: StudyExam[];
  studySessions: StudySession[];
  results: AcademicResult[];
  documents: UserDocument[];
  notes: UserNote[];
  onNavigateToStudyPlanner?: () => void;
}

export function SubjectProgress({
  subjects,
  tasks,
  assignments,
  exams,
  studySessions,
  results,
  documents,
  notes,
  onNavigateToStudyPlanner,
}: SubjectProgressProps) {
  if (subjects.length === 0) {
    return (
      <ProgressEmptyState
        icon={<BookOpen className="w-6 h-6 text-indigo-500" />}
        title="No academic subjects yet"
        description="Add your enrolled courses and subjects in the Study Planner to view real-time subject-by-subject coursework completion rates and analytics."
        actionLabel={onNavigateToStudyPlanner ? 'Go to Study Planner' : undefined}
        onAction={onNavigateToStudyPlanner}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Subject Progress &amp; Coursework Analytics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real task, assignment, exam, and study logs per enrolled course
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((subject) => {
          // Filter real records linked to this subject
          const subjectTasks = tasks.filter(
            (t) => t.subjectId === subject.id || t.subjectName === subject.name
          );
          const completedTasks = subjectTasks.filter((t) => t.status === 'completed');

          const subjectAssignments = assignments.filter(
            (a) => a.subjectId === subject.id || a.subjectName === subject.name
          );
          const completedAssignments = subjectAssignments.filter(
            (a) => a.status === 'submitted' || a.status === 'completed'
          );

          const subjectExams = exams.filter(
            (e) => e.subjectId === subject.id || e.subjectName === subject.name
          );

          const completedSessions = studySessions.filter(
            (s) =>
              s.status === 'completed' &&
              (s.subjectId === subject.id || s.subjectName === subject.name)
          );
          const subjectStudyMinutes = completedSessions.reduce(
            (acc, s) => acc + (s.durationMinutes || 0),
            0
          );

          const subjectResults = results.filter(
            (r) => r.subjectId === subject.id || r.subjectName === subject.name
          );

          // Calculate task completion rate
          const taskRate =
            subjectTasks.length > 0
              ? Math.round((completedTasks.length / subjectTasks.length) * 100)
              : null;

          // Calculate assignment completion rate
          const assignmentRate =
            subjectAssignments.length > 0
              ? Math.round(
                  (completedAssignments.length / subjectAssignments.length) * 100
                )
              : null;

          const hours = Math.floor(subjectStudyMinutes / 60);
          const mins = subjectStudyMinutes % 60;

          return (
            <div
              key={subject.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: subject.color || '#6366f1' }}
                    />
                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {subject.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {subject.code && (
                      <span className="font-mono font-medium">{subject.code}</span>
                    )}
                    {subject.instructor && <span>• Prof. {subject.instructor}</span>}
                  </div>
                </div>

                {subjectResults.length > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">
                      Avg Score
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {(
                        subjectResults.reduce((sum, r) => sum + r.percentage, 0) /
                        subjectResults.length
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Rates: Task & Assignment */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Task Completion Rate */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                    Task Completion
                  </span>
                  {taskRate !== null ? (
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                          {taskRate}%
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {completedTasks.length}/{subjectTasks.length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${taskRate}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400 italic py-1">
                      Not enough data
                    </div>
                  )}
                </div>

                {/* Assignment Completion Rate */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                    Assignment Completion
                  </span>
                  {assignmentRate !== null ? (
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                          {assignmentRate}%
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {completedAssignments.length}/{subjectAssignments.length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${assignmentRate}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400 italic py-1">
                      Not enough data
                    </div>
                  )}
                </div>
              </div>

              {/* Factual Record Counters */}
              <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Exams</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {subjectExams.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Study Time</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {subjectStudyMinutes > 0 ? (hours > 0 ? `${hours}h ${mins}m` : `${mins}m`) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Sessions</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {completedSessions.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Results</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {subjectResults.length}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
