import React, { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Sliders,
} from 'lucide-react';
import { AcademicResult, GradingScaleType, AcademicPeriod } from '../../types/progress.ts';
import { StudySubject } from '../../types/index.ts';
import { calculateAcademicMetrics } from '../../services/progressService.ts';
import { ProgressEmptyState } from './ProgressEmptyState.tsx';

interface ResultsGradebookProps {
  results: AcademicResult[];
  subjects: StudySubject[];
  periods: AcademicPeriod[];
  onOpenAddResult: () => void;
  onOpenEditResult: (result: AcademicResult) => void;
  onDeleteResult: (resultId: string) => void;
}

export function ResultsGradebook({
  results,
  subjects,
  periods,
  onOpenAddResult,
  onOpenEditResult,
  onDeleteResult,
}: ResultsGradebookProps) {
  const [scaleType, setScaleType] = useState<GradingScaleType>('percentage_unweighted');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'percentage' | 'subject' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filtered results
  const filteredResults = useMemo(() => {
    return results
      .filter((r) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = r.assessmentName.toLowerCase().includes(q);
          const matchSub = r.subjectName.toLowerCase().includes(q);
          const matchNotes = r.notes?.toLowerCase().includes(q);
          if (!matchName && !matchSub && !matchNotes) return false;
        }
        if (filterSubject !== 'all') {
          if (r.subjectId !== filterSubject && r.subjectName !== filterSubject) {
            return false;
          }
        }
        if (filterType !== 'all' && r.assessmentType !== filterType) {
          return false;
        }
        if (filterPeriod !== 'all' && r.periodId !== filterPeriod) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'date') diff = a.date.localeCompare(b.date);
        else if (sortBy === 'percentage') diff = a.percentage - b.percentage;
        else if (sortBy === 'subject') diff = a.subjectName.localeCompare(b.subjectName);
        else diff = a.assessmentName.localeCompare(b.assessmentName);

        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [results, searchQuery, filterSubject, filterType, filterPeriod, sortBy, sortOrder]);

  // Real calculation metrics
  const metrics = useMemo(() => {
    return calculateAcademicMetrics(filteredResults, scaleType);
  }, [filteredResults, scaleType]);

  return (
    <div className="space-y-5">
      {/* Top Academic Metric & Grading Scale Config Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Academic Performance Summary
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {metrics.count > 0 ? (
                <span>
                  {scaleType.startsWith('gpa_')
                    ? `GPA: ${metrics.gpa !== null ? metrics.gpa.toFixed(2) : 'Unavailable'}`
                    : scaleType === 'percentage_weighted'
                    ? `${metrics.weightedAverage}% Weighted`
                    : `${metrics.unweightedAverage}% Unweighted`}
                  {metrics.gradeEquivalent && (
                    <span className="ml-2 text-sm font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      Grade {metrics.gradeEquivalent}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  GPA unavailable — configure your grading scale or add sufficient results.
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Method: <span className="font-semibold text-slate-700 dark:text-slate-300">{metrics.methodLabel}</span>
            </p>
          </div>

          {/* Grading Scale Selector */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <select
              value={scaleType}
              onChange={(e) => setScaleType(e.target.value as GradingScaleType)}
              className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="percentage_unweighted">Percentage (Unweighted Average)</option>
              <option value="percentage_weighted">Weighted Percentage (Course Weights)</option>
              <option value="gpa_4_0">GPA 4.0 Standard Scale</option>
              <option value="gpa_4_3">GPA 4.3 Scale</option>
              <option value="gpa_5_0">GPA 5.0 Linear Scale</option>
              <option value="gpa_10_0">GPA 10.0 Linear Scale</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Bar / Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assessment or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Assessment Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Assessment Types</option>
            <option value="exam">Exam</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
            <option value="quiz">Quiz</option>
            <option value="assignment">Assignment</option>
            <option value="project">Project</option>
            <option value="practical">Practical / Lab</option>
          </select>

          {/* Period Filter */}
          {periods.length > 0 && (
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Periods</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="date">Sort by Date</option>
            <option value="percentage">Sort by Percentage</option>
            <option value="subject">Sort by Subject</option>
            <option value="name">Sort by Assessment Name</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenAddResult}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Result</span>
        </button>
      </div>

      {/* Results Table / Empty State */}
      {results.length === 0 ? (
        <ProgressEmptyState
          icon={<Award className="w-6 h-6 text-emerald-500" />}
          title="No academic results yet"
          description="Record your verified assignment, quiz, exam, or project scores. StudentHub calculates your true average and GPA without ever guessing or inventing grades."
          actionLabel="Record Your First Result"
          onAction={onOpenAddResult}
        />
      ) : filteredResults.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          No assessment results match your selected filter criteria.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Assessment</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Marks</th>
                  <th className="px-4 py-3 text-right">Percentage</th>
                  <th className="px-4 py-3 text-center">Grade</th>
                  <th className="px-4 py-3 text-right">Weight</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredResults.map((result) => (
                  <tr
                    key={result.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                      <div>{result.assessmentName}</div>
                      {result.notes && (
                        <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {result.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      {result.subjectName}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {result.assessmentType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                      {result.obtainedMarks} / {result.maxMarks}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {result.percentage}%
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {result.grade ? (
                        <span className="font-semibold text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {result.grade}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-500 dark:text-slate-400">
                      {result.weight !== undefined ? `${result.weight}%` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {result.date}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditResult(result)}
                          title="Edit Result"
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteResult(result.id)}
                          title="Delete Result"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
