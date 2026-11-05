import React, { useMemo } from 'react';
import {
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  CheckCircle2,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { StudySession, StudySubject } from '../../types/index.ts';
import { ProgressEmptyState } from './ProgressEmptyState.tsx';

interface StudyAnalyticsProps {
  studySessions: StudySession[];
  subjects: StudySubject[];
  dateRangeLabel?: string;
}

export function StudyAnalytics({
  studySessions,
  subjects,
  dateRangeLabel = 'All Time',
}: StudyAnalyticsProps) {
  // CRITICAL REQUIREMENT: Do NOT count planned sessions as completed study time.
  // Only completed sessions contribute to completed study-duration metrics.
  const completedSessions = useMemo(
    () => studySessions.filter((s) => s.status === 'completed'),
    [studySessions]
  );
  const plannedSessions = useMemo(
    () => studySessions.filter((s) => s.status !== 'completed'),
    [studySessions]
  );

  const totalSessionsCount = studySessions.length;
  const completedSessionsCount = completedSessions.length;
  const totalCompletedMinutes = completedSessions.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0
  );

  const averageSessionMinutes =
    completedSessionsCount > 0
      ? Math.round(totalCompletedMinutes / completedSessionsCount)
      : null;

  // Study time by subject
  const subjectDistribution = useMemo(() => {
    const map: Record<string, { minutes: number; count: number; color?: string }> = {};
    completedSessions.forEach((s) => {
      const name = s.subjectName || 'Unassigned Subject';
      if (!map[name]) {
        const foundSub = subjects.find((sub) => sub.name === name || sub.id === s.subjectId);
        map[name] = { minutes: 0, count: 0, color: foundSub?.color };
      }
      map[name].minutes += s.durationMinutes || 0;
      map[name].count += 1;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      minutes: data.minutes,
      count: data.count,
      color: data.color || '#6366f1',
      percentage:
        totalCompletedMinutes > 0
          ? Math.round((data.minutes / totalCompletedMinutes) * 100)
          : 0,
    }));
  }, [completedSessions, subjects, totalCompletedMinutes]);

  // Study time by day of week
  const dayOfWeekStats = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    completedSessions.forEach((s) => {
      const dateStr = s.actualStart?.split('T')[0] || s.plannedStart?.split('T')[0] || s.startTime?.split('T')[0];
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          counts[d.getDay()] += s.durationMinutes || 0;
        }
      }
    });

    const max = Math.max(...counts, 1);
    return days.map((day, idx) => ({
      day,
      minutes: counts[idx],
      barPercent: Math.round((counts[idx] / max) * 100),
    }));
  }, [completedSessions]);

  // Study consistency: number of distinct days with >= 1 completed session
  const distinctDaysWithStudy = useMemo(() => {
    const uniqueDays = new Set<string>();
    completedSessions.forEach((s) => {
      const dateStr = s.actualStart?.split('T')[0] || s.plannedStart?.split('T')[0] || s.startTime?.split('T')[0];
      if (dateStr) uniqueDays.add(dateStr);
    });
    return uniqueDays.size;
  }, [completedSessions]);

  if (studySessions.length === 0) {
    return (
      <ProgressEmptyState
        icon={<Clock className="w-6 h-6 text-amber-500" />}
        title="No study sessions recorded"
        description="Log actual study sessions or use the Focus Stopwatch in the Study Planner to generate real study analytics and time distributions."
      />
    );
  }

  const hours = Math.floor(totalCompletedMinutes / 60);
  const mins = totalCompletedMinutes % 60;

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
            Total Study Time
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {completedSessionsCount > 0
              ? hours > 0
                ? `${hours}h ${mins}m`
                : `${mins}m`
              : '0m'}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Across {completedSessionsCount} completed sessions
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
            Completed Sessions
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {completedSessionsCount}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            {plannedSessions.length > 0
              ? `${plannedSessions.length} planned (not counted)`
              : 'All sessions completed'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
            Average Session Duration
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {averageSessionMinutes !== null ? `${averageSessionMinutes}m` : 'No data'}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            {averageSessionMinutes !== null ? 'Per focus block' : 'Record completed sessions'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
            Study Consistency
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {distinctDaysWithStudy} days
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Distinct days with completed study
          </p>
        </div>
      </div>

      {/* Grid: Day of Week Distribution & Subject Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Day of Week Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span>Study Time by Day of Week</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Actual completed minutes logged on each day
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {dayOfWeekStats.map((item) => (
              <div key={item.day} className="flex items-center gap-3 text-xs">
                <span className="w-9 font-semibold text-slate-600 dark:text-slate-400">
                  {item.day}
                </span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.barPercent}%` }}
                  />
                </div>
                <span className="w-14 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                  {item.minutes > 0 ? `${item.minutes}m` : '0m'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-500" />
              <span>Study Time by Subject</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Factual distribution across enrolled courses
            </p>
          </div>

          {subjectDistribution.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No completed sessions associated with subjects.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {subjectDistribution.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {item.name}
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      {item.minutes}m ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
