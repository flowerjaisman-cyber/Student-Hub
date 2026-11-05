import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
} from '../../types/attendance.ts';
import { StudySubject } from '../../types/index.ts';
import { batchSaveAttendanceRecords } from '../../services/attendanceService.ts';

interface AttendanceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  subjects: StudySubject[];
  existingRecords: AttendanceRecord[];
}

interface ParsedRow {
  rowNum: number;
  rawDate: string;
  rawSubject: string;
  rawStatus: string;
  rawTime?: string;
  rawNotes?: string;
  valid: boolean;
  error?: string;
  normalizedRecord?: AttendanceRecord;
}

export function AttendanceImportModal({
  isOpen,
  onClose,
  userId,
  subjects,
  existingRecords,
}: AttendanceImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvText, setCsvText] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);

  // Mapping state
  const [dateCol, setDateCol] = useState<number>(0);
  const [subjectCol, setSubjectCol] = useState<number>(1);
  const [statusCol, setStatusCol] = useState<number>(2);
  const [timeCol, setTimeCol] = useState<number>(-1);
  const [notesCol, setNotesCol] = useState<number>(-1);

  // Validation results
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      parseCSVHeaders(content);
    };
    reader.readAsText(file);
  };

  const parseCSVHeaders = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return;

    const firstLine = lines[0];
    const detectedHeaders = firstLine.split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
    setHeaders(detectedHeaders);

    // Auto-detect columns
    detectedHeaders.forEach((h, idx) => {
      const lower = h.toLowerCase();
      if (lower.includes('date')) setDateCol(idx);
      else if (lower.includes('subject') || lower.includes('course') || lower.includes('class'))
        setSubjectCol(idx);
      else if (lower.includes('status') || lower.includes('attendance')) setStatusCol(idx);
      else if (lower.includes('time')) setTimeCol(idx);
      else if (lower.includes('note') || lower.includes('reason')) setNotesCol(idx);
    });

    const dataRows = lines
      .slice(1)
      .map((line) => line.split(',').map((cell) => cell.replace(/^["']|["']$/g, '').trim()));
    setRawRows(dataRows);
    setStep(2);
  };

  const handleRunValidation = () => {
    const STATUS_MAP: Record<string, AttendanceStatus> = {
      p: 'present',
      present: 'present',
      attended: 'present',
      a: 'absent',
      absent: 'absent',
      missed: 'absent',
      l: 'late',
      late: 'late',
      tardy: 'late',
      e: 'excused',
      excused: 'excused',
      c: 'cancelled',
      canceled: 'cancelled',
      cancelled: 'cancelled',
    };

    const validated: ParsedRow[] = rawRows.map((cols, idx) => {
      const rowNum = idx + 2;
      const rawDate = cols[dateCol] || '';
      const rawSubject = cols[subjectCol] || '';
      const rawStatus = (cols[statusCol] || '').toLowerCase().trim();
      const rawTime = timeCol >= 0 ? cols[timeCol] : undefined;
      const rawNotes = notesCol >= 0 ? cols[notesCol] : undefined;

      // Validate date (expected YYYY-MM-DD or standard parseable)
      let parsedDate = rawDate;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          parsedDate = d.toISOString().split('T')[0];
        } else {
          return {
            rowNum,
            rawDate,
            rawSubject,
            rawStatus,
            rawTime,
            rawNotes,
            valid: false,
            error: 'Invalid date format (must be YYYY-MM-DD)',
          };
        }
      }

      // Validate subject
      if (!rawSubject.trim()) {
        return {
          rowNum,
          rawDate,
          rawSubject,
          rawStatus,
          rawTime,
          rawNotes,
          valid: false,
          error: 'Subject name is empty',
        };
      }

      // Validate status
      const normalizedStatus = STATUS_MAP[rawStatus];
      if (!normalizedStatus) {
        return {
          rowNum,
          rawDate,
          rawSubject,
          rawStatus,
          rawTime,
          rawNotes,
          valid: false,
          error: `Unrecognized status "${rawStatus}". Expected Present, Absent, Late, Excused, or Cancelled.`,
        };
      }

      // Check linked subject ID if matching existing
      const matchedSub = subjects.find(
        (s) => s.name.toLowerCase().trim() === rawSubject.toLowerCase().trim()
      );

      const record: AttendanceRecord = {
        id: `att_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        subjectId: matchedSub?.id,
        subjectName: rawSubject.trim(),
        date: parsedDate,
        startTime: rawTime?.trim() || undefined,
        status: normalizedStatus,
        notes: rawNotes?.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        rowNum,
        rawDate: parsedDate,
        rawSubject,
        rawStatus: normalizedStatus,
        rawTime,
        rawNotes,
        valid: true,
        normalizedRecord: record,
      };
    });

    setParsedRows(validated);
    setStep(3);
  };

  const validRows = parsedRows.filter((r) => r.valid && r.normalizedRecord);
  const invalidRows = parsedRows.filter((r) => !r.valid);

  const handleConfirmImport = async () => {
    if (validRows.length === 0) return;
    setIsSaving(true);

    try {
      const recordsToCommit = validRows.map((r) => r.normalizedRecord!);
      await batchSaveAttendanceRecords(userId, recordsToCommit);
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(`Import failed: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Import Attendance Records
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Step {step} of 3 • CSV structured importer
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

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <FileSpreadsheet className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Upload CSV File
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Select a CSV file containing your attendance records. Standard columns include Date, Subject, Status, Time, and Notes.
                </p>
                <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Choose CSV File</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Or paste CSV text directly:
                </label>
                <textarea
                  rows={4}
                  placeholder="Date,Subject,Status,Time,Notes&#10;2026-09-21,Calculus I,Present,09:00,Lecture 1"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                {csvText.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => parseCSVHeaders(csvText)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <span>Parse Pasted CSV</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200">
                Confirm which column in your CSV corresponds to each attendance field:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    Date Column *
                  </label>
                  <select
                    value={dateCol}
                    onChange={(e) => setDateCol(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        Column {i + 1}: {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    Subject Column *
                  </label>
                  <select
                    value={subjectCol}
                    onChange={(e) => setSubjectCol(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        Column {i + 1}: {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    Status Column *
                  </label>
                  <select
                    value={statusCol}
                    onChange={(e) => setStatusCol(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        Column {i + 1}: {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    Time Column (Optional)
                  </label>
                  <select
                    value={timeCol}
                    onChange={(e) => setTimeCol(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={-1}>-- None --</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        Column {i + 1}: {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    Notes / Remarks Column (Optional)
                  </label>
                  <select
                    value={notesCol}
                    onChange={(e) => setNotesCol(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={-1}>-- None --</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        Column {i + 1}: {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleRunValidation}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <span>Validate Records</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                  <div className="text-xl font-bold">{validRows.length}</div>
                  <div className="text-xs">Valid Records to Import</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                  <div className="text-xl font-bold">{invalidRows.length}</div>
                  <div className="text-xs">Invalid Rows (Will be skipped)</div>
                </div>
              </div>

              {invalidRows.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-1 text-xs">
                  <span className="font-bold text-rose-700 dark:text-rose-300">Validation issues:</span>
                  <ul className="list-disc list-inside text-rose-600 dark:text-rose-400 text-[11px] max-h-24 overflow-y-auto">
                    {invalidRows.map((r) => (
                      <li key={r.rowNum}>
                        Row {r.rowNum}: {r.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Date</th>
                      <th className="px-3 py-2 font-semibold">Subject</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                      <th className="px-3 py-2 font-semibold">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {parsedRows.slice(0, 50).map((r) => (
                      <tr key={r.rowNum} className={!r.valid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}>
                        <td className="px-3 py-1.5 font-mono">{r.rawDate}</td>
                        <td className="px-3 py-1.5">{r.rawSubject}</td>
                        <td className="px-3 py-1.5 capitalize">{r.rawStatus}</td>
                        <td className="px-3 py-1.5">
                          {r.valid ? (
                            <span className="text-emerald-600 font-semibold">Valid</span>
                          ) : (
                            <span className="text-rose-600 font-semibold">Error</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 italic">
                Only the {validRows.length} valid records will be stored in your private Firestore database.
              </div>
            </div>
          )}
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
          {step === 3 && (
            <button
              type="button"
              disabled={isSaving || validRows.length === 0}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {importSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Imported!</span>
                </>
              ) : (
                <span>Confirm Import ({validRows.length} Records)</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
