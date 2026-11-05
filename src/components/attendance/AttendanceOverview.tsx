import React, { useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock3,
  HelpCircle,
  Percent,
  BookOpen,
  Info,
  Target,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { AttendanceStats, AttendanceSettings } from '../../types/attendance.ts';

interface AttendanceOverviewProps {
  stats: AttendanceStats;
  subjectsCount: number;
  settings?: AttendanceSettings;
  onOpenSettings: () => void;
}

export function AttendanceOverview({
  stats,
  subjectsCount,
  settings,
  onOpenSettings,
}: AttendanceOverviewProps) {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  const hasData = stats.totalRecorded > 0;

  return (
    <div className="space-y-4">
      {/* Target Status Banner (if configured) */}
      {settings?.targetPercentage && hasData && stats.percentage !== null && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            stats.percentage >= settings.targetPercentage
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/60'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/60'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  stats.percentage >= settings.targetPercentage
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                }`}
              >
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Personal Attendance Target: {settings.targetPercentage}%
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      stats.percentage >= settings.targetPercentage
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                        : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    Current: {stats.percentage}%
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {stats.percentage >= settings.targetPercentage ? (
                    <>
                      Current attendance is{' '}
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {stats.differenceFromTarget! > 0 ? `+${stats.differenceFromTarget}%` : 'equal to'}
                      </span>{' '}
                      your target.{' '}
                      {typeof stats.classesCanMissToMaintainTarget === 'number' &&
                        stats.classesCanMissToMaintainTarget > 0 && (
                          <span>
                            You could miss up to{' '}
                            <strong>{stats.classesCanMissToMaintainTarget}</strong> consecutive
                            class{stats.classesCanMissToMaintainTarget === 1 ? '' : 'es'} while
                            remaining at or above {settings.targetPercentage}%.
                          </span>
                        )}
                    </>
                  ) : (
                    <>
                      Current attendance is{' '}
                      <span className="font-semibold text-amber-700 dark:text-amber-300">
                        {stats.percentage}%
                      </span>
                      , which is {Math.abs(stats.differenceFromTarget || 0)}% below your configured{' '}
                      {settings.targetPercentage}% target.{' '}
                      {typeof stats.consecutivePresentsNeededForTarget === 'number' && (
                        <span>
                          <strong>{stats.consecutivePresentsNeededForTarget}</strong> additional
                          consecutive present class
                          {stats.consecutivePresentsNeededForTarget === 1 ? '' : 'es'} needed to
                          reach your target.
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenSettings}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
            >
              Adjust Target
            </button>
          </div>
        </div>
      )}

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Overall Attendance % */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overall Rate
            </span>
            <button
              type="button"
              onClick={() => setShowFormulaDetails(true)}
              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5"
              title="View Calculation Formula"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.percentage !== null ? `${stats.percentage}%` : 'No data'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            {stats.countedClasses > 0
              ? `${stats.presentEquivalent} / ${stats.countedClasses} counted`
              : 'No recorded classes'}
          </div>
        </div>

        {/* 2. Total Recorded */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Classes Logged
            </span>
            <CalendarCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalRecorded > 0 ? stats.totalRecorded : 'No data'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            {subjectsCount} subject{subjectsCount === 1 ? '' : 's'} with records
          </div>
        </div>

        {/* 3. Attended (Present) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Attended
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {hasData ? stats.present : 'No data'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Full presence logged</div>
        </div>

        {/* 4. Missed (Absent) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Missed
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {hasData ? stats.absent : 'No data'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Unexcused absences</div>
        </div>

        {/* 5. Marked Late */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Late
            </span>
            <Clock3 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {hasData ? stats.late : 'No data'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Tardy arrivals</div>
        </div>

        {/* 6. Excused & Cancelled */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Excused / Canc.
            </span>
            <HelpCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {hasData ? `${stats.excused} / ${stats.cancelled}` : 'No data'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Exempt / cancelled</div>
        </div>
      </div>

      {/* Formula Transparency Modal */}
      {showFormulaDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>Attendance Calculation Transparency</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFormulaDetails(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px] space-y-1">
                <div>Formula: (Present Equivalent / Counted Classes) × 100</div>
                <div>Numerator (Present Equivalent): {stats.presentEquivalent}</div>
                <div>Denominator (Counted Classes): {stats.countedClasses}</div>
                <div className="font-bold text-indigo-600 dark:text-indigo-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                  Calculated Rate: {stats.percentage !== null ? `${stats.percentage}%` : 'N/A'}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-white">Active Rule Settings:</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {stats.calculationRuleSummary}
                </p>
              </div>

              <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                <div>• Present: {stats.present}</div>
                <div>• Late: {stats.late}</div>
                <div>• Absent: {stats.absent}</div>
                <div>• Excused: {stats.excused}</div>
                <div>• Cancelled: {stats.cancelled}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowFormulaDetails(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
