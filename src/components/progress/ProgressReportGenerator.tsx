import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  Save,
  Printer,
  RotateCw,
  AlertCircle,
  FileCheck2,
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
  ProgressReportType,
  ProgressAnalysisData,
} from '../../types/progress.ts';
import {
  generateAcademicProgressReport,
  saveProgressReport,
} from '../../services/progressService.ts';
import { saveUserDocument } from '../../services/documentService.ts';

interface ProgressReportGeneratorProps {
  userId: string;
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

export function ProgressReportGenerator({
  userId,
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
}: ProgressReportGeneratorProps) {
  const [reportType, setReportType] = useState<ProgressReportType>('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedToDocs, setSavedToDocs] = useState(false);
  const [savedToReports, setSavedToReports] = useState(false);

  // Category selections
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeAssignments, setIncludeAssignments] = useState(true);
  const [includeExams, setIncludeExams] = useState(true);
  const [includeStudySessions, setIncludeStudySessions] = useState(true);
  const [includeHabits, setIncludeHabits] = useState(true);
  const [includeResults, setIncludeResults] = useState(true);

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    setSavedToDocs(false);
    setSavedToReports(false);

    try {
      const todayStr = new Date().toISOString().split('T')[0];

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

      const payload: ProgressAnalysisData = {
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
          : { totalSessions: 0, completedSessions: 0, totalCompletedMinutes: 0, averageMinutesPerSession: 0, bySubject: {} },
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
        documentsCount: {
          documents: documents.length,
          notes: notes.length,
          files: files.length,
          savedAIMaterials: aiMaterials.length,
        },
      };

      const includedCats: string[] = [];
      if (includeTasks) includedCats.push('Tasks');
      if (includeAssignments) includedCats.push('Assignments');
      if (includeExams) includedCats.push('Exams');
      if (includeStudySessions) includedCats.push('Study Sessions');
      if (includeHabits) includedCats.push('Habits');
      if (includeResults) includedCats.push('Academic Results');

      const markdownReport = await generateAcademicProgressReport({
        format: reportType,
        dateRangeLabel,
        data: payload,
        includedCategories: includedCats,
      });

      setReportContent(markdownReport);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate progress report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!reportContent) return;
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!reportContent) return;
    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Academic_Progress_Report_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    if (!reportContent) return;
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Academic_Progress_Report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintOrPdf = () => {
    if (!reportContent) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Academic Progress Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 40px; color: #1e293b; max-width: 800px; margin: auto; }
            h1, h2, h3 { color: #0f172a; margin-top: 24px; margin-bottom: 8px; }
            table { border-collapse: collapse; width: 100%; margin: 16px 0; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #f1f5f9; }
            code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div style="margin-bottom: 24px; border-bottom: 2px solid #6366f1; padding-bottom: 12px;">
            <h1 style="margin: 0; font-size: 24px;">StudentHub Academic Progress Report</h1>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div>${reportContent.replace(/\n/g, '<br/>')}</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleSaveToDocumentStudio = async () => {
    if (!reportContent) return;
    const confirmed = window.confirm(
      'Save this report to Document Studio? You will be able to edit, format, and export it as DOCX or PDF.'
    );
    if (!confirmed) return;

    try {
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const title = `Progress Report - ${dateRangeLabel} (${new Date().toISOString().split('T')[0]})`;
      await saveUserDocument(userId, {
        id: docId,
        userId,
        title,
        content: reportContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setSavedToDocs(true);
      setTimeout(() => setSavedToDocs(false), 3000);
    } catch (err: any) {
      alert(`Failed to save document: ${err?.message || err}`);
    }
  };

  const handleSaveProgressReport = async () => {
    if (!reportContent) return;
    const confirmed = window.confirm('Save this progress report to your saved reports archive?');
    if (!confirmed) return;

    try {
      const id = `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const title = `Academic Report (${reportType.toUpperCase()}) - ${dateRangeLabel}`;
      await saveProgressReport(userId, {
        id,
        userId,
        title,
        reportType,
        dateRange: {
          from: new Date().toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0],
          label: dateRangeLabel,
        },
        periodId: selectedPeriod?.id,
        includedCategories: ['Tasks', 'Assignments', 'Exams', 'StudySessions', 'Results'],
        content: reportContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setSavedToReports(true);
      setTimeout(() => setSavedToReports(false), 3000);
    } catch (err: any) {
      alert(`Failed to save report: ${err?.message || err}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Config Box */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Academic Progress Report Generator</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Compile your real academic records into a structured, shareable report
            </p>
          </div>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Report Format
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ProgressReportType)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="summary">Executive Summary (Key metrics &amp; status)</option>
              <option value="detailed">Comprehensive Detailed Audit</option>
              <option value="weekly">Weekly Academic Review</option>
              <option value="monthly">Monthly Academic Review</option>
              <option value="exam_readiness">Exam Readiness &amp; Revision Report</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Selected Period / Range
            </label>
            <div className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium">
              {selectedPeriod?.name ? `${selectedPeriod.name} • ` : ''}
              {dateRangeLabel}
            </div>
          </div>
        </div>

        {/* Categories Checkboxes */}
        <div>
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Categories to Include:
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTasks}
                onChange={(e) => setIncludeTasks(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Tasks</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAssignments}
                onChange={(e) => setIncludeAssignments(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Assignments</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeExams}
                onChange={(e) => setIncludeExams(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Exams</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeStudySessions}
                onChange={(e) => setIncludeStudySessions(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Study Sessions</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeHabits}
                onChange={(e) => setIncludeHabits(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Habits</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeResults}
                onChange={(e) => setIncludeResults(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Results &amp; Grades</span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Compiling Real Records...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Academic Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generated Report Preview & Action Toolbar */}
      {reportContent && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 animate-in fade-in duration-150">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Report Preview
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Markdown (.md)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Text (.txt)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintOrPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-500" />
                <span>Print / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToDocumentStudio}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer"
              >
                {savedToDocs ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savedToDocs ? 'Saved to Docs' : 'Save to Document Studio'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveProgressReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                {savedToReports ? <Check className="w-3.5 h-3.5" /> : <FileCheck2 className="w-3.5 h-3.5" />}
                <span>{savedToReports ? 'Saved' : 'Save Report'}</span>
              </button>
            </div>
          </div>

          {/* Markdown Content Display */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
            {reportContent}
          </div>
        </div>
      )}
    </div>
  );
}
