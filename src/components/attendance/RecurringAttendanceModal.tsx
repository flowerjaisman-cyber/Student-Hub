import React, { useState, useMemo } from 'react';
import { X, CalendarRange, Check, AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
} from '../../types/attendance.ts';
import { TimetableEntry, StudySubject } from '../../types/index.ts';
import { batchSaveAttendanceRecords } from '../../services/attendanceService.ts';

interface RecurringAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  timetable: TimetableEntry[];
  subjects: StudySubject[];
  existingRecords: AttendanceRecord[];
}

export function RecurringAttendanceModal({
  isOpen,
  onClose,
  userId,
  timetable,
  subjects,
  existingRecords,
}: RecurringAttendanceModalProps) {
  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    timetable.length > 0 ? timetable[0].id : ''
  );
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [exclusionDatesText, setExclusionDatesText] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEntry = timetable.find((t) => t.id === selectedEntryId);

  // Compute affected dates
  const affectedDates = useMemo(() => {
    if (!selectedEntry || !startDate || !endDate || startDate > endDate) return [];

    const DAY_MAP: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const targetDayNum = DAY_MAP[selectedEntry.dayOfWeek] ?? 1;

    // Parse exclusions
    const exclusions = new Set(
      exclusionDatesText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
    );

    const dates: string[] = [];
    const current = new Date(startDate + 'T00:00:00');
    const stop = new Date(endDate + 'T00:00:00');

    while (current <= stop) {
      if (current.getDay() === targetDayNum) {
        const dStr = current.toISOString().split('T')[0];
        if (!exclusions.has(dStr)) {
          dates.push(dStr);
        }
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [selectedEntry, startDate, endDate, exclusionDatesText]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedEntry) {
      setError('Please select a scheduled timetable class');
      return;
    }

    if (affectedDates.length === 0) {
      setError('No matching class dates found within this date range');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const recordsToSave: AttendanceRecord[] = affectedDates.map((dateStr) => {
        // Check if existing record
        const found = existingRecords.find(
          (r) =>
            r.date === dateStr &&
            (r.timetableEntryId === selectedEntry.id ||
              r.subjectName.toLowerCase().trim() ===
                (selectedEntry.subjectName || selectedEntry.title).toLowerCase().trim())
        );

        const id =
          found?.id ||
          `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        return {
          id,
          userId,
          subjectId: selectedEntry.subjectId,
          subjectName: selectedEntry.subjectName || selectedEntry.title,
          timetableEntryId: selectedEntry.id,
          date: dateStr,
          startTime: selectedEntry.startTime,
          endTime: selectedEntry.endTime,
          status,
          createdAt: found?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      await batchSaveAttendanceRecords(userId, recordsToSave);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save recurring attendance');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recurring Attendance Helper
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apply attendance across selected recurring class dates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Note:</strong> This is a convenience tool, not automatic institutional
              attendance. Review the generated list of affected dates before confirming.
            </span>
          </div>

          {/* 1. Timetable Entry Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Select Recurring Timetable Class *
            </label>
            <select
              value={selectedEntryId}
              onChange={(e) => setSelectedEntryId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {timetable.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.subjectName || t.title} — {t.dayOfWeek.toUpperCase()} ({t.startTime} -{' '}
                  {t.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                From Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                To Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* 3. Status to apply */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Attendance Status to Apply
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(
                [
                  { id: 'present', label: 'Present' },
                  { id: 'absent', label: 'Absent' },
                  { id: 'late', label: 'Late' },
                  { id: 'excused', label: 'Excused' },
                  { id: 'cancelled', label: 'Cancelled' },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setStatus(btn.id)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    status === btn.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Exclusion dates */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Exclusion Dates (Holidays / Breaks)
            </label>
            <textarea
              rows={2}
              placeholder="One YYYY-MM-DD per line (e.g. 2026-09-15)"
              value={exclusionDatesText}
              onChange={(e) => setExclusionDatesText(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          {/* 5. Date Preview */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span>Affected Class Dates ({affectedDates.length})</span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-normal">
                Applying &quot;{status}&quot;
              </span>
            </div>

            {affectedDates.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No class occurrences fall within the selected dates.
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700/60 text-xs">
                {affectedDates.map((d) => (
                  <div key={d} className="py-1 flex items-center justify-between">
                    <span className="font-mono text-slate-800 dark:text-slate-200">{d}</span>
                    <span className="text-slate-500 capitalize">
                      {new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || affectedDates.length === 0}
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm &amp; Apply {affectedDates.length} Records</span>
          </button>
        </div>
      </div>
    </div>
  );
}
