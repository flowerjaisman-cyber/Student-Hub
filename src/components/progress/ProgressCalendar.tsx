import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Clock,
  Flame,
  Hourglass,
  FileText,
  FileCheck2,
} from 'lucide-react';
import {
  StudyTask,
  StudyAssignment,
  StudyExam,
  StudySession,
  HabitCheck,
  UserDocument,
} from '../../types/index.ts';

interface ProgressCalendarProps {
  tasks: StudyTask[];
  assignments: StudyAssignment[];
  exams: StudyExam[];
  studySessions: StudySession[];
  habitChecks: HabitCheck[];
  documents: UserDocument[];
}

export function ProgressCalendar({
  tasks,
  assignments,
  exams,
  studySessions,
  habitChecks,
  documents,
}: ProgressCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(
    new Date().toISOString().split('T')[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Aggregate actual activity by date (YYYY-MM-DD)
  const activityMap = useMemo(() => {
    const map: Record<
      string,
      {
        tasksCompleted: StudyTask[];
        assignmentsCompleted: StudyAssignment[];
        exams: StudyExam[];
        studySessions: StudySession[];
        habitChecks: HabitCheck[];
        docsCreated: UserDocument[];
        totalCount: number;
      }
    > = {};

    const getEntry = (dStr: string) => {
      if (!map[dStr]) {
        map[dStr] = {
          tasksCompleted: [],
          assignmentsCompleted: [],
          exams: [],
          studySessions: [],
          habitChecks: [],
          docsCreated: [],
          totalCount: 0,
        };
      }
      return map[dStr];
    };

    // Tasks completed
    tasks.forEach((t) => {
      if (t.status === 'completed' && t.updatedAt) {
        const d = t.updatedAt.split('T')[0];
        const entry = getEntry(d);
        entry.tasksCompleted.push(t);
        entry.totalCount++;
      }
    });

    // Assignments completed
    assignments.forEach((a) => {
      if ((a.status === 'submitted' || a.status === 'completed') && a.updatedAt) {
        const d = a.updatedAt.split('T')[0];
        const entry = getEntry(d);
        entry.assignmentsCompleted.push(a);
        entry.totalCount++;
      }
    });

    // Exams
    exams.forEach((e) => {
      if (e.date) {
        const entry = getEntry(e.date);
        entry.exams.push(e);
        entry.totalCount++;
      }
    });

    // Completed study sessions
    studySessions.forEach((s) => {
      if (s.status === 'completed') {
        const d = s.actualStart?.split('T')[0] || s.plannedStart?.split('T')[0] || s.startTime?.split('T')[0];
        if (d) {
          const entry = getEntry(d);
          entry.studySessions.push(s);
          entry.totalCount++;
        }
      }
    });

    // Habit checks
    habitChecks.forEach((hc) => {
      if (hc.completed && hc.date) {
        const entry = getEntry(hc.date);
        entry.habitChecks.push(hc);
        entry.totalCount++;
      }
    });

    // Documents created
    documents.forEach((doc) => {
      if (doc.createdAt) {
        const d = doc.createdAt.split('T')[0];
        const entry = getEntry(d);
        entry.docsCreated.push(doc);
        entry.totalCount++;
      }
    });

    return map;
  }, [tasks, assignments, exams, studySessions, habitChecks, documents]);

  const monthLabel = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Selected day items
  const selectedDayActivity = selectedDayStr ? activityMap[selectedDayStr] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            <span>Academic Activity Calendar</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any day to reveal actual recorded tasks, study sessions, and check-ins
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[120px] text-center">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: Calendar on Left, Selected Day Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank offset days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank_${i}`} className="h-16 rounded-xl bg-slate-50/40 dark:bg-slate-850/20" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const dayActivity = activityMap[dateStr];
              const isSelected = selectedDayStr === dateStr;
              const count = dayActivity?.totalCount || 0;

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => setSelectedDayStr(dateStr)}
                  className={`h-16 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : count > 0
                      ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
                      : 'border-transparent bg-slate-50/60 dark:bg-slate-850/40 text-slate-400 dark:text-slate-600 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-xs font-semibold leading-none">{dayNum}</span>

                  {count > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                        {count} item{count > 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <span />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector (1 col) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Selected Day Details
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedDayStr || 'Select a date'}
            </h4>
          </div>

          {!selectedDayActivity || selectedDayActivity.totalCount === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No recorded study activity or events on this date.
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {/* Study Sessions */}
              {selectedDayActivity.studySessions.map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex items-center gap-2.5"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Study Session ({s.durationMinutes}m)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {s.subjectName || 'Unassigned'}
                    </p>
                  </div>
                </div>
              ))}

              {/* Tasks Completed */}
              {selectedDayActivity.tasksCompleted.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex items-center gap-2.5"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Task Completed • {t.subjectName || 'General'}
                    </p>
                  </div>
                </div>
              ))}

              {/* Assignments Completed */}
              {selectedDayActivity.assignmentsCompleted.map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex items-center gap-2.5"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {a.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Assignment Submitted • {a.subjectName || ''}
                    </p>
                  </div>
                </div>
              ))}

              {/* Exams */}
              {selectedDayActivity.exams.map((e) => (
                <div
                  key={e.id}
                  className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-xs flex items-center gap-2.5"
                >
                  <Hourglass className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-rose-900 dark:text-rose-200 truncate">
                      {e.title}
                    </p>
                    <p className="text-[11px] text-rose-700/80 dark:text-rose-400">
                      Exam Day • {e.subjectName || ''}
                    </p>
                  </div>
                </div>
              ))}

              {/* Habit Checks */}
              {selectedDayActivity.habitChecks.map((hc) => (
                <div
                  key={hc.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex items-center gap-2.5"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Daily Habit Check-in
                    </p>
                  </div>
                </div>
              ))}

              {/* Documents Created */}
              {selectedDayActivity.docsCreated.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex items-center gap-2.5"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {d.title || 'Untitled Document'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Document created
                    </p>
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
