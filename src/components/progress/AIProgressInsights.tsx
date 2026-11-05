import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
  Lightbulb,
  Search,
  BookOpen,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import {
  StudyTask,
  StudyAssignment,
  StudyExam,
  StudySession,
  StudyHabit,
  HabitCheck,
  UserDocument,
  UserNote,
  UserFile,
  AIStudyMaterial,
} from '../../types/index.ts';
import {
  AcademicResult,
  AcademicPeriod,
  ProgressAnalysisData,
  ProgressInsightsResponse,
} from '../../types/progress.ts';
import { generateProgressInsights } from '../../services/progressService.ts';

interface AIProgressInsightsProps {
  tasks: StudyTask[];
  assignments: StudyAssignment[];
  exams: StudyExam[];
  studySessions: StudySession[];
  habits: StudyHabit[];
  habitChecks: HabitCheck[];
  results: AcademicResult[];
  documents: UserDocument[];
  notes: UserNote[];
  files: UserFile[];
  aiMaterials: AIStudyMaterial[];
  selectedPeriod?: AcademicPeriod | null;
  dateRangeLabel: string;
}

export function AIProgressInsights({
  tasks,
  assignments,
  exams,
  studySessions,
  habits,
  habitChecks,
  results,
  documents,
  notes,
  files,
  aiMaterials,
  selectedPeriod,
  dateRangeLabel,
}: AIProgressInsightsProps) {
  // Category inclusions chosen by student
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeAssignments, setIncludeAssignments] = useState(true);
  const [includeExams, setIncludeExams] = useState(true);
  const [includeStudySessions, setIncludeStudySessions] = useState(true);
  const [includeHabits, setIncludeHabits] = useState(true);
  const [includeResults, setIncludeResults] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(true);

  const [userFocus, setUserFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<ProgressInsightsResponse | null>(null);

  const handleAnalyze = async () => {
    setError(null);
    setLoading(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Prepare strictly verified real numbers
      const completedTasks = tasks.filter((t) => t.status === 'completed').length;
      const pendingTasks = tasks.filter((t) => t.status !== 'completed').length;
      const overdueTasks = tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'completed').length;

      const completedAssignments = assignments.filter((a) => a.status === 'submitted' || a.status === 'completed').length;
      const pendingAssignments = assignments.filter((a) => a.status !== 'submitted' && a.status !== 'completed').length;
      const overdueAssignments = assignments.filter((a) => a.dueDate && a.dueDate < todayStr && a.status !== 'submitted' && a.status !== 'completed').length;

      const completedSessions = studySessions.filter((s) => s.status === 'completed');
      const totalCompletedMinutes = completedSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const averageMins = completedSessions.length > 0 ? Math.round(totalCompletedMinutes / completedSessions.length) : 0;

      const subjectTimeMap: Record<string, number> = {};
      completedSessions.forEach((s) => {
        const k = s.subjectName || 'Unassigned';
        subjectTimeMap[k] = (subjectTimeMap[k] || 0) + (s.durationMinutes || 0);
      });

      const avgPercentage =
        results.length > 0
          ? Number((results.reduce((s, r) => s + r.percentage, 0) / results.length).toFixed(1))
          : undefined;

      const analysisPayload: ProgressAnalysisData = {
        periodName: selectedPeriod?.name,
        dateRangeLabel,
        tasksCount: includeTasks
          ? { total: tasks.length, completed: completedTasks, pending: pendingTasks, overdue: overdueTasks }
          : { total: 0, completed: 0, pending: 0, overdue: 0 },
        assignmentsCount: includeAssignments
          ? { total: assignments.length, completed: completedAssignments, pending: pendingAssignments, overdue: overdueAssignments }
          : { total: 0, completed: 0, pending: 0, overdue: 0 },
        examsCount: includeExams
          ? {
              total: exams.length,
              upcoming: exams.filter((e) => e.date >= todayStr).length,
              completed: exams.filter((e) => e.date < todayStr).length,
            }
          : { total: 0, upcoming: 0, completed: 0 },
        studyTime: includeStudySessions
          ? {
              totalSessions: studySessions.length,
              completedSessions: completedSessions.length,
              totalCompletedMinutes,
              averageMinutesPerSession: averageMins,
              bySubject: subjectTimeMap,
            }
          : {
              totalSessions: 0,
              completedSessions: 0,
              totalCompletedMinutes: 0,
              averageMinutesPerSession: 0,
              bySubject: {},
            },
        habits: includeHabits
          ? {
              totalHabits: habits.length,
              activeHabits: habits.filter((h) => h.active !== false).length,
              completedChecksInRange: habitChecks.filter((c) => c.completed).length,
            }
          : { total: 0, active: 0, completedChecksInRange: 0 } as any,
        results: includeResults
          ? {
              count: results.length,
              averagePercentage: avgPercentage,
            }
          : { count: 0 },
        documentsCount: includeDocuments
          ? {
              documents: documents.length,
              notes: notes.length,
              files: files.length,
              savedAIMaterials: aiMaterials.length,
            }
          : { documents: 0, notes: 0, files: 0, savedAIMaterials: 0 },
      };

      const response = await generateProgressInsights({
        data: analysisPayload,
        userFocus: userFocus.trim() || undefined,
      });

      setInsights(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate progress insights.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer and Grounding Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              AI Progress Intelligence
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Analyze your verified StudentHub records with strict factual grounding. The AI operates
              only on the data categories you select, strictly separating verified observations, observable patterns,
              and optional suggestions.
            </p>
          </div>
        </div>

        {/* Data Selection Checkboxes */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Select Data Categories to Include in Audit:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={includeTasks}
                onChange={(e) => setIncludeTasks(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Tasks ({tasks.length})</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={includeAssignments}
                onChange={(e) => setIncludeAssignments(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Assignments ({assignments.length})</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={includeExams}
                onChange={(e) => setIncludeExams(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Exams ({exams.length})</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={includeStudySessions}
                onChange={(e) => setIncludeStudySessions(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Study Sessions ({studySessions.length})</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={includeHabits}
                onChange={(e) => setIncludeHabits(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Habit Checks ({habitChecks.length})</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={includeResults}
                onChange={(e) => setIncludeResults(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Results ({results.length})</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={includeDocuments}
                onChange={(e) => setIncludeDocuments(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Documents ({documents.length + notes.length})</span>
            </label>
          </div>

          {/* Optional Focus Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Optional Question or Focus Area
            </label>
            <input
              type="text"
              placeholder="e.g. How is my exam readiness looking for finals? Where did most study hours go?"
              value={userFocus}
              onChange={(e) => setUserFocus(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Zero-hallucination policy: Strictly derives observations from stored records.</span>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze My Progress</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Structured Output Display */}
      {insights && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* 1. Observations (Verified Facts) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Verified Observations (Factual Data)
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Objective metrics directly derived from your selected StudentHub records.
            </p>

            <ul className="space-y-2 pt-1">
              {insights.observations.map((obs, i) => (
                <li
                  key={`obs_${i}`}
                  className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. Patterns (Identified Trends) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Detected Activity Patterns
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distributions and timing patterns observed in the numbers.
            </p>

            <ul className="space-y-2 pt-1">
              {insights.patterns.map((pat, i) => (
                <li
                  key={`pat_${i}`}
                  className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <Search className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{pat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Suggestions (Constructive Recommendations) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Practical Suggestions (Optional)
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Constructive workflow recommendations. Never presented as facts or grade predictions.
            </p>

            <ul className="space-y-2 pt-1">
              {insights.suggestions.map((sug, i) => (
                <li
                  key={`sug_${i}`}
                  className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 bg-purple-50/30 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/40"
                >
                  <Lightbulb className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
