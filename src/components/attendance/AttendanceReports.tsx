import React, { useState } from 'react';
import { FileText, Printer, Download, Calendar, BookOpen, Layers } from 'lucide-react';
import { AttendanceRecord, AttendanceSettings } from '../../types/attendance.ts';
import { StudySubject } from '../../types/index.ts';
import { AcademicPeriod } from '../../types/progress.ts';
import { calculateAttendanceStats } from '../../services/attendanceService.ts';

interface AttendanceReportsProps {
  records: AttendanceRecord[];
  subjects: StudySubject[];
  periods: AcademicPeriod[];
  settings?: AttendanceSettings;
}

export function AttendanceReports({
  records,
  subjects,
  periods,
  settings,
}: AttendanceReportsProps) {
  const [reportType, setReportType] = useState<'subject' | 'period' | 'monthly'>('subject');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects.length > 0 ? subjects[0].id : 'all'
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('all');

  // Filter records based on report type
  const reportRecords = React.useMemo(() => {
    let result = [...records];
    if (reportType === 'subject' && selectedSubjectId !== 'all') {
      result = result.filter(
        (r) => r.subjectId === selectedSubjectId || r.subjectName === selectedSubjectId
      );
    } else if (reportType === 'period' && selectedPeriodId !== 'all') {
      result = result.filter((r) => r.periodId === selectedPeriodId);
    }
    return result;
  }, [records, reportType, selectedSubjectId, selectedPeriodId]);

  const reportStats = calculateAttendanceStats(reportRecords, settings);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Formal Attendance Reports &amp; Summaries
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate printable structured reports based purely on recorded data
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setReportType('subject')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              reportType === 'subject'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Subject Report
          </button>
          <button
            type="button"
            onClick={() => setReportType('period')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              reportType === 'period'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Period Report
          </button>
        </div>

        {reportType === 'subject' && (
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Subjects Aggregate</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {reportType === 'period' && (
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Periods Aggregate</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Printable Sheet View */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-5 print:border-none print:p-0">
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              StudentHub Academic Attendance Report
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {reportType === 'subject'
                ? selectedSubject
                  ? `${selectedSubject.name} Attendance Sheet`
                  : 'All Subjects Aggregate Attendance Sheet'
                : selectedPeriod
                ? `${selectedPeriod.name} Attendance Summary`
                : 'All Periods Aggregate Attendance Summary'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Generated on {new Date().toLocaleDateString()} • {reportRecords.length} recorded class session{reportRecords.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {reportStats.percentage !== null ? `${reportStats.percentage}%` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500">Attendance Rate</div>
          </div>
        </div>

        {/* Top metrics summary grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {reportStats.totalRecorded}
            </div>
            <div className="text-[10px] text-slate-400 uppercase">Total Logged</div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {reportStats.present}
            </div>
            <div className="text-[10px] text-slate-400 uppercase">Present</div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {reportStats.absent}
            </div>
            <div className="text-[10px] text-slate-400 uppercase">Absent</div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {reportStats.late}
            </div>
            <div className="text-[10px] text-slate-400 uppercase">Late</div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {reportStats.excused}
            </div>
            <div className="text-[10px] text-slate-400 uppercase">Excused</div>
          </div>
        </div>

        {/* Detailed Session Table */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Session Records Breakdown
          </div>
          {reportRecords.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 italic">
              No attendance records recorded for this selection.
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportRecords.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 font-mono text-slate-500">{r.date}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-200">
                        {r.subjectName}
                      </td>
                      <td className="px-3 py-2 capitalize font-semibold">
                        <span
                          className={
                            r.status === 'present'
                              ? 'text-emerald-600'
                              : r.status === 'absent'
                              ? 'text-rose-600'
                              : r.status === 'late'
                              ? 'text-amber-600'
                              : 'text-blue-600'
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {r.startTime ? `${r.startTime} ${r.endTime ? `- ${r.endTime}` : ''}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800 italic">
          Disclaimer: StudentHub attendance records are entered or generated through explicit user actions and do not represent official institutional attendance records.
        </div>
      </div>
    </div>
  );
}
