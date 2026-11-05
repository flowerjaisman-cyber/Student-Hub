import {
  StudyTask,
  StudyAssignment,
  AssignmentStatus,
  StudySession,
  TimetableEntry,
  HabitCheck,
  DayOfWeek,
  StudySubject,
} from '../types/index.ts';

/**
 * Reusable countdown parts calculator from target ISO string and current timestamp.
 * Adheres strictly to real-time client-side calculation without polling or fake data.
 */
export function getCountdownParts(targetIsoStr: string, now: Date = new Date()) {
  const target = new Date(targetIsoStr);
  const diff = target.getTime() - now.getTime();

  if (isNaN(target.getTime()) || diff <= 0) {
    return { isPast: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    isPast: false,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds: Math.floor(diff / 1000),
  };
}

/**
 * Format countdown parts into readable string e.g. "2 days 7 hours 35 minutes remaining"
 */
export function formatCountdownString(parts: ReturnType<typeof getCountdownParts>): string {
  if (parts.isPast) return 'Passed / Due';
  if (parts.days > 0) {
    return `${parts.days}d ${parts.hours}h ${parts.minutes}m ${parts.seconds}s remaining`;
  }
  if (parts.hours > 0) {
    return `${parts.hours}h ${parts.minutes}m ${parts.seconds}s remaining`;
  }
  return `${parts.minutes}m ${parts.seconds}s remaining`;
}

/**
 * Get honest local YYYY-MM-DD from a Date object
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate deterministic assignment deadline states from actual dates
 */
export type DeadlineStatus =
  | 'overdue'
  | 'due_today'
  | 'due_tomorrow'
  | 'upcoming'
  | 'submitted'
  | 'completed';

export function getAssignmentDeadlineState(
  dueDate: string,
  dueTime?: string,
  status: AssignmentStatus = 'not_started',
  now: Date = new Date()
): { status: DeadlineStatus; label: string; colorClass: string } {
  if (status === 'completed') {
    return { status: 'completed', label: 'Completed', colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' };
  }
  if (status === 'submitted') {
    return { status: 'submitted', label: 'Submitted', colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800' };
  }

  const todayStr = getLocalDateString(now);

  // Tomorrow string
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);

  if (dueDate === todayStr) {
    // If due time is passed today
    if (dueTime) {
      const dueDateTime = new Date(`${dueDate}T${dueTime}:00`);
      if (now.getTime() > dueDateTime.getTime()) {
        return { status: 'overdue', label: 'Overdue (Today)', colorClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800' };
      }
    }
    return { status: 'due_today', label: 'Due Today', colorClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800' };
  }

  if (dueDate === tomorrowStr) {
    return { status: 'due_tomorrow', label: 'Due Tomorrow', colorClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800' };
  }

  if (dueDate < todayStr) {
    return { status: 'overdue', label: 'Overdue', colorClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800' };
  }

  return { status: 'upcoming', label: 'Upcoming', colorClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700' };
}

/**
 * Habit streak calculator:
 * Given actual check-in records for a habit, calculate current streak and longest streak.
 * No guessing, no fake seeds.
 */
export function calculateHabitStreaks(checks: HabitCheck[], today: Date = new Date()): {
  currentStreak: number;
  longestStreak: number;
  totalChecks: number;
  completedToday: boolean;
} {
  const completedChecks = checks.filter((c) => c.completed);
  const totalChecks = completedChecks.length;
  if (totalChecks === 0) {
    return { currentStreak: 0, longestStreak: 0, totalChecks: 0, completedToday: false };
  }

  const todayStr = getLocalDateString(today);
  const completedToday = completedChecks.some((c) => c.date === todayStr);

  // Set of sorted unique dates (YYYY-MM-DD)
  const dateSet = new Set(completedChecks.map((c) => c.date));
  const sortedDates = Array.from(dateSet).sort();

  // Calculate longest streak
  let longestStreak = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const curDate = new Date(dateStr + 'T12:00:00Z');
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun += 1;
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
    prevDate = curDate;
  }

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(today);
  // If not completed today, start checking from yesterday
  if (!completedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const checkStr = getLocalDateString(checkDate);
    if (dateSet.has(checkStr)) {
      currentStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak, totalChecks, completedToday };
}

/**
 * Format seconds into readable duration e.g. "1h 45m" or "25m 00s"
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Formats stopwatch seconds into MM:SS or HH:MM:SS
 */
export function formatStopwatchTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Check if two timetable entries on the same day overlap in time
 */
export function checkTimetableOverlap(
  entryA: { startTime: string; endTime: string; dayOfWeek: DayOfWeek; id: string },
  entryB: { startTime: string; endTime: string; dayOfWeek: DayOfWeek; id: string }
): boolean {
  if (entryA.id === entryB.id || entryA.dayOfWeek !== entryB.dayOfWeek) return false;
  // Format is HH:mm
  return entryA.startTime < entryB.endTime && entryB.startTime < entryA.endTime;
}

/**
 * Get weekday name from Date
 */
export function getDayOfWeekFromDate(d: Date): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[d.getDay()];
}

/**
 * Get date range for the week containing `refDate` (Monday to Sunday)
 */
export function getWeekDates(refDate: Date = new Date()): { day: DayOfWeek; dateStr: string; date: Date }[] {
  const current = new Date(refDate);
  const dayIndex = current.getDay(); // 0 is Sunday, 1 is Monday
  // Calculate distance to Monday
  const distanceToMonday = (dayIndex + 6) % 7;
  const monday = new Date(current);
  monday.setDate(current.getDate() - distanceToMonday);

  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return days.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      day,
      dateStr: getLocalDateString(d),
      date: d,
    };
  });
}

/**
 * Format seconds for stopwatch and pomodoro countdown display: MM:SS or HH:MM:SS
 */
export function formatDurationSeconds(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  return formatStopwatchTime(totalSeconds);
}

/**
 * Calculate progress percentage capped between 0 and 100
 */
export function calculateProgressPercentage(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  const pct = (current / target) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

/**
 * Calculate habit streak for a single habit from the check list
 */
export function calculateHabitStreak(
  habitId: string,
  checks: HabitCheck[],
  todayStr?: string
): { currentStreak: number; longestStreak: number; totalCompletions: number } {
  const habitChecks = checks.filter((c) => c.habitId === habitId);
  const refDate = todayStr ? new Date(`${todayStr}T12:00:00Z`) : new Date();
  const res = calculateHabitStreaks(habitChecks, refDate);
  return {
    currentStreak: res.currentStreak,
    longestStreak: res.longestStreak,
    totalCompletions: res.totalChecks,
  };
}

/**
 * Filter sessions by selected time range
 */
export function filterSessionsByRange(
  sessions: StudySession[],
  range: 'today' | 'week' | 'month' | 'all',
  refDate: Date = new Date()
): StudySession[] {
  if (range === 'all') return sessions;

  const todayStr = getLocalDateString(refDate);

  if (range === 'today') {
    return sessions.filter((s) => {
      const sessionDate = (s.actualStart || s.startTime || s.createdAt || '').slice(0, 10);
      return sessionDate === todayStr;
    });
  }

  if (range === 'week') {
    const weekStart = new Date(refDate);
    const day = weekStart.getDay();
    const diff = (day + 6) % 7; // Monday start
    weekStart.setDate(weekStart.getDate() - diff);
    const weekStartStr = getLocalDateString(weekStart);

    return sessions.filter((s) => {
      const sessionDate = (s.actualStart || s.startTime || s.createdAt || '').slice(0, 10);
      return sessionDate >= weekStartStr && sessionDate <= todayStr;
    });
  }

  if (range === 'month') {
    const monthPrefix = todayStr.slice(0, 7); // YYYY-MM
    return sessions.filter((s) => {
      const sessionDate = (s.actualStart || s.startTime || s.createdAt || '').slice(0, 7);
      return sessionDate === monthPrefix;
    });
  }

  return sessions;
}

/**
 * Group study minutes by subject
 */
export function groupStudyMinutesBySubject(
  sessions: StudySession[],
  subjects: StudySubject[]
): { subjectId: string; subjectName: string; minutes: number; color?: string }[] {
  const map = new Map<string, { subjectName: string; minutes: number; color?: string }>();

  for (const s of sessions) {
    const subId = s.subjectId || 'general';
    const sub = subjects.find((subj) => subj.id === subId);
    const name = sub?.name || s.subjectName || (subId === 'general' ? 'General' : 'Uncategorized');
    const color = sub?.color;
    const mins = s.durationMinutes ?? Math.round((s.duration || s.durationSeconds || 0) / 60);

    const existing = map.get(subId);
    if (existing) {
      existing.minutes += mins;
    } else {
      map.set(subId, { subjectName: name, minutes: mins, color });
    }
  }

  return Array.from(map.entries())
    .map(([subjectId, val]) => ({
      subjectId,
      subjectName: val.subjectName,
      minutes: val.minutes,
      color: val.color,
    }))
    .sort((a, b) => b.minutes - a.minutes);
}
