import React, { useState, useEffect } from 'react';
import { X, CheckCheck, AlertCircle, Calendar, Clock, Check } from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
} from '../../types/attendance.ts';
import { TimetableEntry, StudySubject } from '../../types/index.ts';
import { batchSaveAttendanceRecords } from '../../services/attendanceService.ts';

interface BulkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  timetable: TimetableEntry[];
  existingRecords: AttendanceRecord[];
  subjects: StudySubject[];
  initialDate?: string;
}

interface BulkRowState {
  entryId: string;
  subjectName: string;
  subjectId?: string;
  startTime?: string;
  endTime?: string;
  status: AttendanceStatus;
  existingRecordId?: string;
}

export function BulkAttendanceModal({
  isOpen,
  onClose,
  userId,
  timetable,
  existingRecords,
  subjects,
  initialDate,
}: BulkAttendanceModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [rows, setRows] = useState<BulkRowState[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update rows whenever selectedDate or timetable changes
  useEffect(() => {
    if (!isOpen) return;

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayIndex = dateObj.getDay();
    const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const currentDayKey = DAY_KEYS[dayIndex];

    const scheduled = timetable
      .filter((e) => e.active !== false && e.dayOfWeek === currentDayKey)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    const initialRows: BulkRowState[] = scheduled.map((entry) => {
      const entrySubjectName = entry.subjectName || entry.title;
      // Find if already recorded
      const found = existingRecords.find(
        (r) =>
          r.date === selectedDate &&
          (r.timetableEntryId === entry.id ||
            r.subjectName.toLowerCase().trim() === entrySubjectName.toLowerCase().trim())
      );

      return {
        entryId: entry.id,
        subjectName: entrySubjectName,
        subjectId: entry.subjectId,
        startTime: entry.startTime,
        endTime: entry.endTime,
        status: found ? found.status : 'present',
        existingRecordId: found?.id,
      };
    });

    setRows(initialRows);
    setError(null);
  }, [selectedDate, timetable, existingRecords, isOpen]);

  if (!isOpen) return null;

  const handleSetAll = (status: AttendanceStatus) => {
    setRows((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleRowStatusChange = (entryId: string, status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((r) => (r.entryId === entryId ? { ...r, status } : r))
    );
  };

  const handleSaveAll = async () => {
    if (rows.length === 0) {
      setError('No classes available to record for this date');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const recordsToSave: AttendanceRecord[] = rows.map((r) => {
        const id =
          r.existingRecordId ||
          `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        return {
          id,
          userId,
          subjectId: r.subjectId,
          subjectName: r.subjectName,
          timetableEntryId: r.entryId,
          date: selectedDate,
          startTime: r.startTime,
          endTime: r.endTime,
          status: r.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      await batchSaveAttendanceRecords(userId, recordsToSave);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save batch attendance');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CheckCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Bulk Attendance Marking
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quickly record attendance for all scheduled classes on a selected date
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

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Picker & Quick presets */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Date:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Set all:
              </span>
              <button
                type="button"
                onClick={() => handleSetAll('present')}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 transition-colors"
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => handleSetAll('absent')}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-200 transition-colors"
              >
                Absent
              </button>
              <button
                type="button"
                onClick={() => handleSetAll('late')}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 transition-colors"
              >
                Late
              </button>
            </div>
          </div>

          {/* Classes Table */}
          {rows.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No scheduled classes found in timetable for this day.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Scheduled Classes ({rows.length})
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {rows.map((row) => (
                  <div
                    key={row.entryId}
                    className="p-3 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {row.subjectName}
                        {row.existingRecordId && (
                          <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                            (Updating existing)
                          </span>
                        )}
                      </div>
                      {row.startTime && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {row.startTime} {row.endTime ? `- ${row.endTime}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status Options */}
                    <div className="flex items-center gap-1">
                      {(
                        [
                          { id: 'present', label: 'Present' },
                          { id: 'absent', label: 'Absent' },
                          { id: 'late', label: 'Late' },
                          { id: 'excused', label: 'Excused' },
                          { id: 'cancelled', label: 'Cancelled' },
                        ] as const
                      ).map((btn) => {
                        const active = row.status === btn.id;
                        return (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => handleRowStatusChange(row.entryId, btn.id)}
                            className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            Review your selections. Clicking &quot;Confirm &amp; Save Batch&quot; will write {rows.length}{' '}
            verified records to your private account.
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
            disabled={isSaving || rows.length === 0}
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm &amp; Save {rows.length} Records</span>
          </button>
        </div>
      </div>
    </div>
  );
}
