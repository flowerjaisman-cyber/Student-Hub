import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, AlertCircle, Calendar, Clock, BookOpen, AlertTriangle } from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
} from '../../types/attendance.ts';
import { StudySubject } from '../../types/index.ts';
import { saveSubject } from '../../services/studyService.ts';
import { saveAcademicPeriod } from '../../services/progressService.ts';
import { AcademicPeriod } from '../../types/progress.ts';
import {
  saveAttendanceRecord,
  deleteAttendanceRecord,
  findExistingAttendanceRecord,
} from '../../services/attendanceService.ts';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  existingRecord?: AttendanceRecord | null;
  existingRecords: AttendanceRecord[];
  subjects: StudySubject[];
  periods: AcademicPeriod[];
  defaultDate?: string;
  defaultSubjectId?: string;
}

export function ManualAttendanceModal({
  isOpen,
  onClose,
  userId,
  existingRecord,
  existingRecords,
  subjects,
  periods,
  defaultDate,
  defaultSubjectId,
}: ManualAttendanceModalProps) {
  const [subjectId, setSubjectId] = useState<string>('');
  const [customSubjectName, setCustomSubjectName] = useState<string>('');
  const [periodId, setPeriodId] = useState<string>('');
  const [date, setDate] = useState<string>(
    defaultDate || new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [notes, setNotes] = useState<string>('');
  const [isMakeup, setIsMakeup] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [isAddingPeriod, setIsAddingPeriod] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newPeriodStart, setNewPeriodStart] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [newPeriodEnd, setNewPeriodEnd] = useState('');

  useEffect(() => {
    if (existingRecord) {
      setSubjectId(existingRecord.subjectId || '');
      setCustomSubjectName(existingRecord.subjectName || '');
      setPeriodId(existingRecord.periodId || '');
      setDate(existingRecord.date);
      setStartTime(existingRecord.startTime || '');
      setEndTime(existingRecord.endTime || '');
      setStatus(existingRecord.status);
      setNotes(existingRecord.notes || '');
      setIsMakeup(existingRecord.isMakeup || false);
    } else {
      setSubjectId(defaultSubjectId || (subjects.length > 0 ? subjects[0].id : 'custom'));
      setCustomSubjectName(subjects.length > 0 ? subjects[0].name : '');
      const activePeriod = periods.find((p) => p.isActive);
      setPeriodId(activePeriod ? activePeriod.id : '');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStartTime('');
      setEndTime('');
      setStatus('present');
      setNotes('');
      setIsMakeup(false);
    }
    setError(null);
  }, [existingRecord, isOpen, defaultDate, defaultSubjectId]);

  // Subscriptions may load after the modal opens. Apply defaults without resetting
  // anything the user has already entered.
  useEffect(() => {
    if (!isOpen || existingRecord) return;
    if (!subjectId && subjects.length > 0) {
      setSubjectId(defaultSubjectId || subjects[0].id);
      setCustomSubjectName(subjects.find((s) => s.id === (defaultSubjectId || subjects[0].id))?.name || '');
    }
    if (!periodId) {
      const activePeriod = periods.find((p) => p.isActive);
      if (activePeriod) setPeriodId(activePeriod.id);
    }
  }, [isOpen, existingRecord, subjectId, periodId, subjects, periods, defaultSubjectId]);

  if (!isOpen) return null;

  const resolvedSubjectName =
    subjectId && subjectId !== 'custom'
      ? subjects.find((s) => s.id === subjectId)?.name || customSubjectName
      : customSubjectName;

  // Duplicate warning check
  const duplicate =
    !existingRecord && resolvedSubjectName.trim().length > 0
      ? findExistingAttendanceRecord(
          existingRecords,
          date,
          resolvedSubjectName,
          undefined,
          startTime || undefined
        )
      : undefined;

  const handleAddSubject = async () => {
    const name = newSubjectName.trim();
    if (!name) {
      setError('Please enter a subject name.');
      return;
    }
    if (subjects.some((s) => s.name.trim().toLowerCase() === name.toLowerCase())) {
      setError('This subject already exists. Select it from the list.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const subject: StudySubject = {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        code: newSubjectCode.trim() || undefined,
        color: '#6366f1',
        active: true,
        createdAt: now,
        updatedAt: now,
      };
      await saveSubject(userId, subject);
      setSubjectId(subject.id);
      setCustomSubjectName(subject.name);
      setNewSubjectName('');
      setNewSubjectCode('');
      setIsAddingSubject(false);
    } catch (err: any) {
      setError(err?.message || 'Could not add subject.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPeriod = async () => {
    const name = newPeriodName.trim();
    if (!name || !newPeriodStart || !newPeriodEnd) {
      setError('Please enter the period name, start date and end date.');
      return;
    }
    if (newPeriodEnd < newPeriodStart) {
      setError('Period end date must be on or after its start date.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const period: AcademicPeriod = {
        id: `period_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        name,
        startDate: newPeriodStart,
        endDate: newPeriodEnd,
        isActive: periods.length === 0,
        createdAt: now,
        updatedAt: now,
      };
      await saveAcademicPeriod(userId, period);
      setPeriodId(period.id);
      setNewPeriodName('');
      setNewPeriodEnd('');
      setIsAddingPeriod(false);
    } catch (err: any) {
      setError(err?.message || 'Could not add academic period.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalSubjectName = resolvedSubjectName.trim();
    if (!finalSubjectName) {
      setError('Please select or enter a subject name');
      return;
    }

    if (!date) {
      setError('Please choose a valid date');
      return;
    }

    setIsSaving(true);
    try {
      const recordId =
        existingRecord?.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newRecord: AttendanceRecord = {
        id: recordId,
        userId,
        subjectId: subjectId !== 'custom' ? subjectId : undefined,
        subjectName: finalSubjectName,
        periodId: periodId || undefined,
        timetableEntryId: existingRecord?.timetableEntryId,
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        status,
        notes: notes.trim() || undefined,
        isMakeup,
        createdAt: existingRecord?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveAttendanceRecord(userId, newRecord);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save attendance record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRecord) return;
    if (
      !window.confirm(
        `Are you sure you want to delete this attendance record for ${existingRecord.subjectName} on ${existingRecord.date}?`
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      await deleteAttendanceRecord(userId, existingRecord.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete attendance record');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {existingRecord ? 'Edit Attendance Record' : 'Record Class Attendance'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only manually confirmed records are stored
            </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {duplicate && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong>Notice:</strong> An attendance record already exists for this subject on {date} (marked as{' '}
                <span className="capitalize font-semibold">{duplicate.status}</span>). Saving will create another session.
              </div>
            </div>
          )}

          {/* 1. Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Subject / Course *
            </label>
            <div className="space-y-2">
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  const found = subjects.find((s) => s.id === e.target.value);
                  if (found) setCustomSubjectName(found.name);
                }}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">Choose a subject</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} {sub.code ? `(${sub.code})` : ''}
                  </option>
                ))}
                <option value="custom">+ Custom Subject Name</option>
              </select>

              {subjectId === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter subject name (e.g. Organic Chemistry)"
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              )}
              <button type="button" onClick={() => { setIsAddingSubject((v) => !v); setError(null); }} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                {isAddingSubject ? 'Cancel adding subject' : '+ Add a new subject'}
              </button>
              {isAddingSubject && (
                <div className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/20 p-3 space-y-2">
                  <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Subject name (required)" className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                  <input type="text" value={newSubjectCode} onChange={(e) => setNewSubjectCode(e.target.value)} placeholder="Subject code (optional)" className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                  <button type="button" disabled={isSaving} onClick={handleAddSubject} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50">Save subject</button>
                </div>
              )}
            </div>
          </div>

          {/* 2. Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Academic Period
              </label>
              <select
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">None / Unassigned</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isActive ? '★' : ''}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => { setIsAddingPeriod((v) => !v); setError(null); }} className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                {isAddingPeriod ? 'Cancel adding period' : '+ Add a new academic period'}
              </button>
              {isAddingPeriod && (
                <div className="mt-2 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/20 p-3 space-y-2">
                  <input type="text" value={newPeriodName} onChange={(e) => setNewPeriodName(e.target.value)} placeholder="Period name (e.g. Fall Semester 2026)" className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-[11px] mb-1 text-slate-600 dark:text-slate-300">Start date</label><input type="date" value={newPeriodStart} onChange={(e) => setNewPeriodStart(e.target.value)} className="w-full text-xs px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" /></div>
                    <div><label className="block text-[11px] mb-1 text-slate-600 dark:text-slate-300">End date</label><input type="date" min={newPeriodStart} value={newPeriodEnd} onChange={(e) => setNewPeriodEnd(e.target.value)} className="w-full text-xs px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" /></div>
                  </div>
                  <button type="button" disabled={isSaving} onClick={handleAddPeriod} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50">Save period</button>
                </div>
              )}
            </div>
          </div>

          {/* Time Optional */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Start Time (Optional)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                End Time (Optional)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 3. Status Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Attendance Status *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(
                [
                  { id: 'present', label: 'Present', color: 'emerald' },
                  { id: 'absent', label: 'Absent', color: 'rose' },
                  { id: 'late', label: 'Late', color: 'amber' },
                  { id: 'excused', label: 'Excused', color: 'blue' },
                  { id: 'cancelled', label: 'Cancelled', color: 'slate' },
                ] as const
              ).map((item) => {
                const isSelected = status === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatus(item.id)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? item.color === 'emerald'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : item.color === 'rose'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : item.color === 'amber'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : item.color === 'blue'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-600 text-white border-slate-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Make-up class flag */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isMakeupCheck"
              checked={isMakeup}
              onChange={(e) => setIsMakeup(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="isMakeupCheck"
              className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              This is a Make-up or Extra Class
            </label>
          </div>

          {/* 4. Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Class Notes / Reason (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Reason for absence, substitute teacher, lab experiment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            {existingRecord ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{existingRecord ? 'Update Record' : 'Save Record'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
