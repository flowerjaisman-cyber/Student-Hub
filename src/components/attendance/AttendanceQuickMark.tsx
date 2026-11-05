import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock3,
  HelpCircle,
  Ban,
  Plus,
  CalendarCheck,
  Edit2,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
} from '../../types/attendance.ts';
import { TimetableEntry, StudySubject } from '../../types/index.ts';
import { saveAttendanceRecord } from '../../services/attendanceService.ts';

interface AttendanceQuickMarkProps {
  userId: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
  timetable: TimetableEntry[];
  attendanceRecords: AttendanceRecord[];
  subjects: StudySubject[];
  onOpenManualModal: (defaultSubjectId?: string, defaultDate?: string) => void;
  onEditRecord: (record: AttendanceRecord) => void;
}

export function AttendanceQuickMark({
  userId,
  selectedDate,
  onDateChange,
  timetable,
  attendanceRecords,
  subjects,
  onOpenManualModal,
  onEditRecord,
}: AttendanceQuickMarkProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Compute day of week for selectedDate
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const dayIndex = dateObj.getDay();
  const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const currentDayKey = DAY_KEYS[dayIndex];

  const formattedDate = dateObj.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Filter timetable for this day of week
  const dayClasses = timetable
    .filter((entry) => entry.active !== false && entry.dayOfWeek === currentDayKey)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  // Step dates
  const handlePrevDay = () => {
    const prev = new Date(dateObj);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const next = new Date(dateObj);
    next.setDate(next.getDate() + 1);
    onDateChange(next.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  // Find attendance record for a timetable class
  const getRecordForEntry = (entry: TimetableEntry): AttendanceRecord | undefined => {
    return attendanceRecords.find((r) => {
      if (r.date !== selectedDate) return false;
      if (r.timetableEntryId && r.timetableEntryId === entry.id) return true;
      const entrySubjectName = entry.subjectName || entry.title;
      return (
        r.subjectName.toLowerCase().trim() === entrySubjectName.toLowerCase().trim() &&
        (!entry.startTime || !r.startTime || r.startTime === entry.startTime)
      );
    });
  };

  // Additional records on this day not tied to a scheduled timetable entry (manual classes / extra classes)
  const additionalDayRecords = attendanceRecords.filter((r) => {
    if (r.date !== selectedDate) return false;
    return !dayClasses.some((entry) => getRecordForEntry(entry)?.id === r.id);
  });

  // Count recorded for today
  const recordedCount = dayClasses.filter((entry) => !!getRecordForEntry(entry)).length;

  const handleMarkStatus = async (
    entry: TimetableEntry,
    newStatus: AttendanceStatus,
    existingRec?: AttendanceRecord
  ) => {
    setUpdatingId(entry.id);
    try {
      const subjectName = entry.subjectName || entry.title;
      const recId =
        existingRec?.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const record: AttendanceRecord = {
        id: recId,
        userId,
        subjectId: entry.subjectId,
        subjectName,
        timetableEntryId: entry.id,
        date: selectedDate,
        startTime: entry.startTime,
        endTime: entry.endTime,
        status: newStatus,
        notes: existingRec?.notes,
        isMakeup: existingRec?.isMakeup || false,
        createdAt: existingRec?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveAttendanceRecord(userId, record);
    } catch (err: any) {
      alert(`Failed to save attendance: ${err?.message || err}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const STATUS_CONFIG: Record<
    AttendanceStatus,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    present: {
      label: 'Present',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2,
    },
    absent: {
      label: 'Absent',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: XCircle,
    },
    late: {
      label: 'Late',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: Clock3,
    },
    excused: {
      label: 'Excused',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      icon: HelpCircle,
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
      icon: Ban,
    },
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Date Navigation Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <span className="hidden md:inline-block text-xs font-medium text-slate-500 dark:text-slate-400">
            {formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {dayClasses.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {recordedCount} / {dayClasses.length} Recorded
            </span>
          )}
          <button
            type="button"
            onClick={() => onOpenManualModal(undefined, selectedDate)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Extra Class</span>
          </button>
        </div>
      </div>

      {/* Classes List */}
      <div className="p-4 sm:p-5 space-y-3">
        {dayClasses.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <CalendarCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No timetable classes scheduled for {formattedDate}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Add recurring classes in Study Planner Timetable or log a manual attendance session below.
            </p>
            <button
              type="button"
              onClick={() => onOpenManualModal(undefined, selectedDate)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Manual Class</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dayClasses.map((entry) => {
              const record = getRecordForEntry(entry);
              const subjectName = entry.subjectName || entry.title;
              const isUpdating = updatingId === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    record
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Class info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {subjectName}
                        </h4>
                        {record ? (
                          (() => {
                            const badge = STATUS_CONFIG[record.status];
                            const BadgeIcon = badge.icon;
                            return (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                              >
                                <BadgeIcon className="w-3 h-3" />
                                <span className="capitalize">{badge.label}</span>
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            Not recorded
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {(entry.startTime || entry.endTime) && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {entry.startTime} {entry.endTime ? `- ${entry.endTime}` : ''}
                            </span>
                          </span>
                        )}
                        {entry.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{entry.location}</span>
                          </span>
                        )}
                        {entry.instructor && <span>• Prof. {entry.instructor}</span>}
                      </div>

                      {record?.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                          Note: {record.notes}
                        </p>
                      )}
                    </div>

                    {/* Quick status buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(
                        [
                          { id: 'present', label: 'Present', color: 'emerald' },
                          { id: 'absent', label: 'Absent', color: 'rose' },
                          { id: 'late', label: 'Late', color: 'amber' },
                          { id: 'excused', label: 'Excused', color: 'blue' },
                          { id: 'cancelled', label: 'Cancelled', color: 'slate' },
                        ] as const
                      ).map((btn) => {
                        const isCurrent = record?.status === btn.id;
                        return (
                          <button
                            key={btn.id}
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleMarkStatus(entry, btn.id, record)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                              isCurrent
                                ? btn.color === 'emerald'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : btn.color === 'rose'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                  : btn.color === 'amber'
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                  : btn.color === 'blue'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-slate-600 text-white border-slate-600 shadow-xs'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {btn.label}
                          </button>
                        );
                      })}

                      {record && (
                        <button
                          type="button"
                          onClick={() => onEditRecord(record)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Details / Add Note"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Additional / Manual entries on this day */}
        {additionalDayRecords.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Additional / Make-up Classes on this Date ({additionalDayRecords.length})
            </h5>
            <div className="space-y-2">
              {additionalDayRecords.map((rec) => {
                const badge = STATUS_CONFIG[rec.status];
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {rec.subjectName}
                        </span>
                        {rec.isMakeup && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                            Make-up Class
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span className="capitalize">{badge.label}</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {rec.startTime ? `${rec.startTime} ${rec.endTime ? `- ${rec.endTime}` : ''}` : 'Untimed'}
                        {rec.notes ? ` • ${rec.notes}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditRecord(rec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
