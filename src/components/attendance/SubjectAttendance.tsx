import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Info,
  CheckCircle2,
  XCircle,
  Clock3,
  HelpCircle,
  Ban,
  Target,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceSettings,
  SubjectAttendanceSummary,
} from '../../types/attendance.ts';
import { StudySubject } from '../../types/index.ts';
import { calculateAttendanceStats } from '../../services/attendanceService.ts';

interface SubjectAttendanceProps {
  subjects: StudySubject[];
  attendanceRecords: AttendanceRecord[];
  settings?: AttendanceSettings;
  onOpenManualModal: (subjectId?: string) => void;
  onSelectSubjectFilter: (subjectId: string) => void;
}

export function SubjectAttendance({
  subjects,
  attendanceRecords,
  settings,
  onOpenManualModal,
  onSelectSubjectFilter,
}: SubjectAttendanceProps) {
  const [inspectingSubject, setInspectingSubject] = useState<SubjectAttendanceSummary | null>(null);

  // Group records by subject
  const subjectSummaries: SubjectAttendanceSummary[] = React.useMemo(() => {
    // 1. Gather all unique subject identifiers (from defined subjects + attendance records)
    const subMap = new Map<string, { id?: string; name: string; code?: string; color?: string }>();

    subjects.forEach((s) => {
      subMap.set(s.name.toLowerCase().trim(), {
        id: s.id,
        name: s.name,
        code: s.code,
        color: s.color,
      });
    });

    attendanceRecords.forEach((r) => {
      const key = r.subjectName.toLowerCase().trim();
      if (!subMap.has(key)) {
        subMap.set(key, {
          id: r.subjectId,
          name: r.subjectName,
        });
      }
    });

    return Array.from(subMap.values()).map((sub) => {
      const records = attendanceRecords.filter(
        (r) =>
          (sub.id && r.subjectId === sub.id) ||
          r.subjectName.toLowerCase().trim() === sub.name.toLowerCase().trim()
      );
      const stats = calculateAttendanceStats(records, settings);

      return {
        subjectId: sub.id,
        subjectName: sub.name,
        code: sub.code,
        color: sub.color,
        stats,
        records,
      };
    });
  }, [subjects, attendanceRecords, settings]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Subject-Wise Attendance Breakdown
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Factual attendance rates calculated per enrolled course
          </p>
        </div>
      </div>

      {subjectSummaries.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No subjects or attendance records yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {subjectSummaries.map((summary) => {
            const { stats, subjectName, code, records } = summary;
            const hasData = stats.totalRecorded > 0;
            const target = settings?.targetPercentage;

            return (
              <div
                key={subjectName}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {subjectName}
                      </h4>
                      {code && (
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {code}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectingSubject(summary)}
                      className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
                      title="View calculation details"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Percentage & Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {stats.percentage !== null ? `${stats.percentage}%` : 'No data'}
                      </span>
                      {hasData && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {stats.presentEquivalent} / {stats.countedClasses} counted
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1.5">
                      {stats.percentage !== null && (
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            target && stats.percentage < target
                              ? 'bg-amber-500'
                              : 'bg-indigo-600 dark:bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, stats.percentage))}%` }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Target indication */}
                  {target && hasData && stats.percentage !== null && (
                    <div className="mt-2 text-[11px] flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Target: {target}%</span>
                      <span
                        className={
                          stats.percentage >= target
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-amber-600 dark:text-amber-400 font-semibold'
                        }
                      >
                        {stats.percentage >= target
                          ? `At/Above Target (+${stats.differenceFromTarget}%)`
                          : `Below Target (${stats.differenceFromTarget}%)`}
                      </span>
                    </div>
                  )}

                  {/* Attendance counts pills */}
                  <div className="grid grid-cols-4 gap-1.5 mt-3 text-center text-[10px]">
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold">
                      <div>{stats.present}</div>
                      <div className="text-[9px] text-emerald-600/80">Present</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-semibold">
                      <div>{stats.absent}</div>
                      <div className="text-[9px] text-rose-600/80">Absent</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold">
                      <div>{stats.late}</div>
                      <div className="text-[9px] text-amber-600/80">Late</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-semibold">
                      <div>{stats.excused}</div>
                      <div className="text-[9px] text-blue-600/80">Excused</div>
                    </div>
                  </div>
                </div>

                {/* Card actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      summary.subjectId
                        ? onSelectSubjectFilter(summary.subjectId)
                        : onSelectSubjectFilter(summary.subjectName)
                    }
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                  >
                    View History ({records.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenManualModal(summary.subjectId)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Record</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subject Inspect Details Modal */}
      {inspectingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {inspectingSubject.subjectName}
                </h3>
                <p className="text-xs text-slate-500">Attendance Calculation Details</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSubject(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px] space-y-1">
              <div>Formula: (Present Equivalent / Counted Classes) × 100</div>
              <div>Numerator: {inspectingSubject.stats.presentEquivalent}</div>
              <div>Denominator: {inspectingSubject.stats.countedClasses}</div>
              <div className="font-bold text-indigo-600 dark:text-indigo-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                Rate: {inspectingSubject.stats.percentage !== null ? `${inspectingSubject.stats.percentage}%` : 'N/A'}
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-800 dark:text-slate-200">Rule:</div>
              <p className="text-[11px]">{inspectingSubject.stats.calculationRuleSummary}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingSubject(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
