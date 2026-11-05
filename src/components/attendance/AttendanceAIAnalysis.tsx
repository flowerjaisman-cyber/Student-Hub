import React, { useState } from 'react';
import { Sparkles, CheckCircle, Lightbulb, TrendingUp, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStats,
  AttendanceSettings,
  AIAttendanceAnalysisResult,
} from '../../types/attendance.ts';
import { analyzeAttendanceWithAI, calculateAttendanceStats } from '../../services/attendanceService.ts';

interface AttendanceAIAnalysisProps {
  records: AttendanceRecord[];
  stats: AttendanceStats;
  settings?: AttendanceSettings;
  periodName?: string;
  dateRangeLabel: string;
}

export function AttendanceAIAnalysis({
  records,
  stats,
  settings,
  periodName,
  dateRangeLabel,
}: AttendanceAIAnalysisProps) {
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AIAttendanceAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    if (records.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      // Group by subject for context
      const subMap = new Map<string, AttendanceRecord[]>();
      records.forEach((r) => {
        const arr = subMap.get(r.subjectName) || [];
        arr.push(r);
        subMap.set(r.subjectName, arr);
      });

      const bySubject = Array.from(subMap.entries()).map(([name, recs]) => {
        const subStat = calculateAttendanceStats(recs, settings);
        return {
          subjectName: name,
          total: subStat.totalRecorded,
          present: subStat.present,
          absent: subStat.absent,
          late: subStat.late,
          excused: subStat.excused,
          percentage: subStat.percentage,
        };
      });

      const res = await analyzeAttendanceWithAI({
        recordsCount: records.length,
        overallStats: stats,
        bySubject,
        targetPercentage: settings?.targetPercentage,
        dateRangeLabel,
        periodName,
      });

      setAnalysis(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete attendance AI analysis.');
    } finally {
      setLoading(false);
    }
  };

  if (records.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
          No Attendance Records to Analyze
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Record your class attendance to generate factual insights and study schedule suggestions.
        </p>
      </div>
    );
  }

  if (!hasConsented && !analysis) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Attendance Insights &amp; Study Routine Intelligence
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              StudentHub AI analyzes your verified attendance records to extract empirical observations,
              detect schedule patterns, and offer practical study routine suggestions.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Strict Privacy &amp; Accuracy Guarantees</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <li>Only your real, stored attendance counts are processed.</li>
            <li>No fake statistics, simulated attendance, or speculative conclusions.</li>
            <li>AI suggestions are never presented as academic facts or institutional mandates.</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => {
            setHasConsented(true);
            handleRunAnalysis();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Analyze {records.length} Verified Records</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            AI Attendance Intelligence Review
          </h3>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleRunAnalysis}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Analyze</span>
        </button>
      </div>

      {loading && (
        <div className="py-12 text-center text-xs text-slate-500 space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Analyzing verified attendance data with Gemini AI...</p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-4">
          {/* Target Note if any */}
          {analysis.targetAnalysisNote && (
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
              <span className="font-bold">Target Comparison Note: </span>
              {analysis.targetAnalysisNote}
            </div>
          )}

          {/* 1. Observations */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Factual Observations</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {analysis.observations.map((obs: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. Patterns */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              <span>Schedule &amp; Distribution Patterns</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {analysis.patterns.map((pat: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{pat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Suggestions */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Study Routine Suggestions</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {analysis.suggestions.map((sug: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-[11px] text-slate-400 italic">
            Suggestions are provided for personal planning only and are never institutional facts or guarantees.
          </div>
        </div>
      )}
    </div>
  );
}
