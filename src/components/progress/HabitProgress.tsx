import React, { useMemo } from 'react';
import { Flame, CheckCircle2, Calendar, Award } from 'lucide-react';
import { StudyHabit, HabitCheck } from '../../types/index.ts';
import { ProgressEmptyState } from './ProgressEmptyState.tsx';

interface HabitProgressProps {
  habits: StudyHabit[];
  habitChecks: HabitCheck[];
}

export function HabitProgress({ habits, habitChecks }: HabitProgressProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  if (habits.length === 0) {
    return (
      <ProgressEmptyState
        icon={<Flame className="w-6 h-6 text-orange-500" />}
        title="No habits tracked yet"
        description="Build and track your study routines in the Study Planner to record streaks and completion rates backed by actual daily check-ins."
      />
    );
  }

  // Calculate real streak from habit checks
  const habitStats = useMemo(() => {
    return habits.map((h) => {
      const checksForHabit = habitChecks
        .filter((c) => c.habitId === h.id && c.completed)
        .sort((a, b) => b.date.localeCompare(a.date));

      const isCompletedToday = checksForHabit.some((c) => c.date === todayStr);

      // Calculate current consecutive days streak strictly from real data
      let currentStreak = 0;
      const dateSet = new Set(checksForHabit.map((c) => c.date));

      const checkDate = new Date();
      // If not checked today, check starting from yesterday
      if (!isCompletedToday) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (dateSet.has(dStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate longest streak in recorded history
      let longestStreak = 0;
      let tempStreak = 0;
      const sortedAscDates = Array.from(dateSet).sort();

      for (let i = 0; i < sortedAscDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prev = new Date(sortedAscDates[i - 1]);
          const curr = new Date(sortedAscDates[i]);
          const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }

      return {
        habit: h,
        totalChecks: checksForHabit.length,
        isCompletedToday,
        currentStreak,
        longestStreak,
      };
    });
  }, [habits, habitChecks, todayStr]);

  const totalChecksCount = habitChecks.filter((c) => c.completed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Habit Consistency &amp; Streaks
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Calculated strictly from verified check-ins in your StudentHub history
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-mono font-semibold border border-orange-200 dark:border-orange-800">
          {totalChecksCount} total check-ins recorded
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habitStats.map(({ habit, totalChecks, isCompletedToday, currentStreak, longestStreak }) => (
          <div
            key={habit.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{habit.icon || '📖'}</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {habit.name || habit.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {habit.frequency || 'Daily'}
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isCompletedToday
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isCompletedToday ? 'Completed Today' : 'Pending Today'}
              </span>
            </div>

            {/* Streak Metrics */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Current Streak
                </span>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400 font-mono flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Best Streak
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono flex items-center justify-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Total Completed
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {totalChecks} check-ins
                </span>
              </div>
            </div>

            {habit.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                "{habit.description}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
