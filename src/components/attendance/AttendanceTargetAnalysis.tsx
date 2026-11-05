import React from 'react';
import { Target, CheckCircle2, AlertTriangle, ArrowRight, Sliders, Info } from 'lucide-react';
import { AttendanceStats, AttendanceSettings } from '../../types/attendance.ts';

interface AttendanceTargetAnalysisProps {
  stats: AttendanceStats;
  settings?: AttendanceSettings;
  onOpenSettings: () => void;
}

export function AttendanceTargetAnalysis({
  stats,
  settings,
  onOpenSettings,
}: AttendanceTargetAnalysisProps) {
  const target = settings?.targetPercentage;
  const current = stats.percentage;

  if (!target) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No Attendance Target Configured
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
              Set a personal attendance target (e.g. 75% or 80%) to calculate how many classes you can
              safely miss or how many consecutive classes you need to attend.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Configure Target</span>
        </button>
      </div>
    );
  }

  if (current === null) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Target className="w-4 h-4 text-indigo-500" />
          <span>Configured Personal Target: {target}%</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Not enough attendance data yet to evaluate against your target.
        </p>
      </div>
    );
  }

  const isAtOrAbove = current >= target;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Attendance Target Analysis
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic calculations based on current counted classes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>Settings</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Configured vs Current */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Target vs Current
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {current}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / {target}% target
            </span>
          </div>
          <div className="mt-2 text-xs">
            <span
              className={`font-semibold ${
                isAtOrAbove
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {isAtOrAbove
                ? `Current attendance is at or above target (+${stats.differenceFromTarget}%)`
                : `Current attendance is ${Math.abs(stats.differenceFromTarget!)}% below target`}
            </span>
          </div>
        </div>

        {/* Metric 2: Classes That Can Be Missed */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Buffer Capacity
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.classesCanMissToMaintainTarget !== null
              ? stats.classesCanMissToMaintainTarget
              : 0}
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            {isAtOrAbove ? (
              <span>
                Consecutive missed classes allowed before dropping below {target}%.
              </span>
            ) : (
              <span>No buffer capacity while below target.</span>
            )}
          </div>
        </div>

        {/* Metric 3: Consecutive Presents Needed */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recovery Requirement
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.consecutivePresentsNeededForTarget !== null
              ? stats.consecutivePresentsNeededForTarget
              : 0}
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            {!isAtOrAbove ? (
              <span>
                Consecutive attended classes required to reach {target}%.
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Target is currently met!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Assumptions and Institutional Notice */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
        <div>
          <strong>Calculation basis:</strong> Derived from {stats.presentEquivalent} present-equivalent
          classes out of {stats.countedClasses} counted classes. Attendance target is a personal
          setting configured by the student and does not represent official institutional policy.
        </div>
      </div>
    </div>
  );
}
