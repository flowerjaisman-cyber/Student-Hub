import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock3,
  HelpCircle,
  Ban,
  Plus,
  Edit2,
  Clock,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../../types/attendance.ts';

interface AttendanceCalendarProps {
  attendanceRecords: AttendanceRecord[];
  onOpenManualModal: (subjectId?: string, date?: string) => void;
  onEditRecord: (record: AttendanceRecord) => void;
}

export function AttendanceCalendar({
  attendanceRecords,
  onOpenManualModal,
  onEditRecord,
}: AttendanceCalendarProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const monthLabel = currentMonthDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  // Map attendance records by date
  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    attendanceRecords.forEach((r) => {
      const arr = map.get(r.date) || [];
      arr.push(r);
      map.set(r.date, arr);
    });
    return map;
  }, [attendanceRecords]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      records: AttendanceRecord[];
    }> = [];

    // Prev month padding
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const d = new Date(year, month - 1, dayNum);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        records: recordsByDate.get(dateStr) || [],
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        records: recordsByDate.get(dateStr) || [],
      });
    }

    // Next month padding to fill grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        records: recordsByDate.get(dateStr) || [],
      });
    }

    return days;
  }, [year, month, recordsByDate]);

  // Selected date records
  const selectedRecords = recordsByDate.get(selectedDayStr) || [];
  const selectedDayFormatted = new Date(selectedDayStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const STATUS_DOT: Record<AttendanceStatus, string> = {
    present: 'bg-emerald-500',
    absent: 'bg-rose-500',
    late: 'bg-amber-500',
    excused: 'bg-blue-500',
    cancelled: 'bg-slate-400',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Calendar Grid (2 Cols) */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {monthLabel}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonthDate(new Date())}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell) => {
            const isSelected = cell.dateStr === selectedDayStr;
            const hasRecords = cell.records.length > 0;

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => setSelectedDayStr(cell.dateStr)}
                className={`min-h-[58px] sm:min-h-[64px] p-1.5 rounded-xl text-left border flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                    : cell.isCurrentMonth
                    ? 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    : 'border-transparent text-slate-300 dark:text-slate-600 opacity-60'
                }`}
              >
                <span
                  className={`text-xs font-bold ${
                    isSelected
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : cell.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* Status dots */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {cell.records.slice(0, 4).map((r) => (
                    <span
                      key={r.id}
                      className={`w-2 h-2 rounded-full ${STATUS_DOT[r.status]}`}
                      title={`${r.subjectName}: ${r.status}`}
                    />
                  ))}
                  {cell.records.length > 4 && (
                    <span className="text-[9px] font-bold text-slate-400">
                      +{cell.records.length - 4}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Present</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Absent</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Late</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Excused</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Cancelled</span>
          </span>
        </div>
      </div>

      {/* Selected Day Details Panel (1 Col) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {selectedDayFormatted}
              </h4>
              <p className="text-[11px] text-slate-500">
                {selectedRecords.length} class{selectedRecords.length === 1 ? '' : 'es'} recorded
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenManualModal(undefined, selectedDayStr)}
              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
              title="Add Attendance Record for this Date"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto">
            {selectedRecords.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 italic">
                No attendance recorded for this date.
                <button
                  type="button"
                  onClick={() => onOpenManualModal(undefined, selectedDayStr)}
                  className="block mx-auto mt-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  + Record Class
                </button>
              </div>
            ) : (
              selectedRecords.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {r.subjectName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        r.status === 'present'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : r.status === 'absent'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          : r.status === 'late'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : r.status === 'excused'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  {r.startTime && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {r.startTime} {r.endTime ? `- ${r.endTime}` : ''}
                      </span>
                    </div>
                  )}

                  {r.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Note: {r.notes}
                    </p>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => onEditRecord(r)}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenManualModal(undefined, selectedDayStr)}
          className="mt-4 w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
        >
          + Record Class on {selectedDayStr}
        </button>
      </div>
    </div>
  );
}
