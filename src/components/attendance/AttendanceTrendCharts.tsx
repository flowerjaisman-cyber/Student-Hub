import React from 'react';
import { BarChart3, PieChart, TrendingUp, BookOpen } from 'lucide-react';
import { AttendanceRecord, AttendanceStats, AttendanceSettings } from '../../types/attendance.ts';
import { calculateAttendanceStats } from '../../services/attendanceService.ts';

interface AttendanceTrendChartsProps {
  records: AttendanceRecord[];
  stats: AttendanceStats;
  settings?: AttendanceSettings;
}

export function AttendanceTrendCharts({
  records,
  stats,
  settings,
}: AttendanceTrendChartsProps) {
  if (records.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          No attendance records yet
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Record attendance to view subject breakdowns and distribution patterns.
        </p>
      </div>
    );
  }

  // 1. Subject breakdown data
  const subjectMap = new Map<string, AttendanceRecord[]>();
  records.forEach((r) => {
    const arr = subjectMap.get(r.subjectName) || [];
    arr.push(r);
    subjectMap.set(r.subjectName, arr);
  });

  const subjectStatsList = Array.from(subjectMap.entries()).map(([name, recs]) => ({
    name,
    stats: calculateAttendanceStats(recs, settings),
    count: recs.length,
  }));

  // 2. Monthly count breakdown
  const monthMap = new Map<string, { present: number; absent: number; late: number; excused: number; total: number }>();
  records.forEach((r) => {
    const monthKey = r.date.substring(0, 7); // YYYY-MM
    const current = monthMap.get(monthKey) || { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    current.total += 1;
    if (r.status === 'present') current.present += 1;
    else if (r.status === 'absent') current.absent += 1;
    else if (r.status === 'late') current.late += 1;
    else if (r.status === 'excused') current.excused += 1;
    monthMap.set(monthKey, current);
  });

  const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Subject Performance Comparison */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Subject Attendance Rates
            </h4>
            <p className="text-[11px] text-slate-500">
              Comparative percentage per course
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {subjectStatsList.map((item) => {
            const pct = item.stats.percentage;
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {item.name}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {pct !== null ? `${pct}%` : 'N/A'}
                  </span>
                </div>

                {/* Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  {pct !== null && (
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        settings?.targetPercentage && pct < settings.targetPercentage
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  )}
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>{item.stats.countedClasses} counted classes</span>
                  <span>
                    {item.stats.present} P • {item.stats.absent} A • {item.stats.late} L
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Monthly Attendance Activity Trend */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Monthly Attendance Activity
            </h4>
            <p className="text-[11px] text-slate-500">
              Classes recorded per calendar month
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {sortedMonths.map(([mKey, data]) => {
            const [y, m] = mKey.split('-');
            const d = new Date(Number(y), Number(m) - 1, 1);
            const label = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

            return (
              <div key={mKey} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {label}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {data.total} recorded session{data.total === 1 ? '' : 's'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                    {data.present} Attended
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-semibold">
                    {data.absent} Missed
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold">
                    {data.late} Late
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
