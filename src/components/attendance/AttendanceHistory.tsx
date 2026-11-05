import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  HelpCircle,
  Ban,
  FileSpreadsheet,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../../types/attendance.ts';
import { StudySubject } from '../../types/index.ts';
import { AcademicPeriod } from '../../types/progress.ts';
import { deleteAttendanceRecord } from '../../services/attendanceService.ts';

interface AttendanceHistoryProps {
  userId: string;
  records: AttendanceRecord[];
  subjects: StudySubject[];
  periods: AcademicPeriod[];
  onEditRecord: (record: AttendanceRecord) => void;
  onOpenImport: () => void;
}

export function AttendanceHistory({
  userId,
  records,
  subjects,
  periods,
  onEditRecord,
  onOpenImport,
}: AttendanceHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'subject'>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter and sort
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.subjectName.toLowerCase().includes(q) ||
          r.date.includes(q) ||
          r.status.toLowerCase().includes(q) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      result = result.filter(
        (r) => r.subjectId === subjectFilter || r.subjectName === subjectFilter
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'newest') return b.date.localeCompare(a.date);
      if (sortOrder === 'oldest') return a.date.localeCompare(b.date);
      if (sortOrder === 'subject') return a.subjectName.localeCompare(b.subjectName);
      return 0;
    });

    return result;
  }, [records, searchQuery, statusFilter, subjectFilter, sortOrder]);

  const handleDelete = async (record: AttendanceRecord) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this record for ${record.subjectName} on ${record.date}?`
      )
    ) {
      return;
    }

    setDeletingId(record.id);
    try {
      await deleteAttendanceRecord(userId, record.id);
    } catch (err: any) {
      alert(`Failed to delete record: ${err?.message || err}`);
    } finally {
      setDeletingId(null);
    }
  };

  const STATUS_BADGE: Record<
    AttendanceStatus,
    { label: string; bg: string; text: string; icon: any }
  > = {
    present: {
      label: 'Present',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: CheckCircle2,
    },
    absent: {
      label: 'Absent',
      bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      text: 'text-rose-700 dark:text-rose-300',
      icon: XCircle,
    },
    late: {
      label: 'Late',
      bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      icon: Clock3,
    },
    excused: {
      label: 'Excused',
      bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      icon: HelpCircle,
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      icon: Ban,
    },
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Header controls & filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search subject, date, status, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Subject filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Sort order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="newest">Newest Date</option>
            <option value="oldest">Oldest Date</option>
            <option value="subject">Subject Name (A-Z)</option>
          </select>

          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* Records Count Badge */}
      <div className="text-xs text-slate-500 flex items-center justify-between">
        <span>
          Showing <strong>{filteredRecords.length}</strong> of {records.length} records
        </span>
      </div>

      {/* History Table (Desktop) / Cards (Mobile) */}
      {filteredRecords.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No attendance records match your filters.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 font-semibold">Subject</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Time</th>
                  <th className="px-4 py-2.5 font-semibold">Notes</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredRecords.map((r) => {
                  const badge = STATUS_BADGE[r.status];
                  const BadgeIcon = badge.icon;
                  const isDeleting = deletingId === r.id;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{r.subjectName}</span>
                          {r.isMakeup && (
                            <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                              Make-up
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span className="capitalize">{badge.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {r.startTime ? `${r.startTime} ${r.endTime ? `- ${r.endTime}` : ''}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {r.notes || '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditRecord(r)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(r)}
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-2.5">
            {filteredRecords.map((r) => {
              const badge = STATUS_BADGE[r.status];
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {r.subjectName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {r.date} {r.startTime ? `• ${r.startTime}` : ''}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span className="capitalize">{badge.label}</span>
                    </span>
                  </div>

                  {r.notes && (
                    <div className="text-[11px] text-slate-500 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      {r.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => onEditRecord(r)}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      className="inline-flex items-center gap-1 text-xs text-rose-600 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
