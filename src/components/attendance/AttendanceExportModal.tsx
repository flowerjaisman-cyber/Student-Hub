import React, { useState } from 'react';
import { X, Download, Copy, Printer, Check, FileText, FileSpreadsheet } from 'lucide-react';
import { AttendanceRecord, AttendanceStats } from '../../types/attendance.ts';

interface AttendanceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  stats: AttendanceStats;
  subjectFilterLabel: string;
  periodLabel: string;
  dateRangeLabel: string;
}

export function AttendanceExportModal({
  isOpen,
  onClose,
  records,
  stats,
  subjectFilterLabel,
  periodLabel,
  dateRangeLabel,
}: AttendanceExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'markdown' | 'txt'>('csv');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const title = `StudentHub Attendance Records — ${subjectFilterLabel}`;

  // Generate CSV
  const generateCSV = (): string => {
    const headers = ['Date', 'Subject', 'Status', 'Start Time', 'End Time', 'Make-up', 'Notes'];
    const rows = records.map((r) => [
      r.date,
      `"${r.subjectName.replace(/"/g, '""')}"`,
      r.status,
      r.startTime || '',
      r.endTime || '',
      r.isMakeup ? 'Yes' : 'No',
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  // Generate Markdown
  const generateMarkdown = (): string => {
    return `# ${title}
**Period:** ${periodLabel} | **Date Range:** ${dateRangeLabel}  
**Total Classes:** ${stats.totalRecorded} | **Attended:** ${stats.present} | **Missed:** ${stats.absent} | **Late:** ${stats.late} | **Excused:** ${stats.excused}  
**Attendance Percentage:** ${stats.percentage !== null ? `${stats.percentage}%` : 'N/A'}  
*Rule:* ${stats.calculationRuleSummary}

| Date | Subject | Status | Time | Make-up | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
${records
  .map(
    (r) =>
      `| ${r.date} | ${r.subjectName} | ${r.status} | ${r.startTime || '-'} | ${
        r.isMakeup ? 'Yes' : 'No'
      } | ${r.notes || '-'} |`
  )
  .join('\n')}

---
*Exported from StudentHub on ${new Date().toLocaleDateString()}*
`;
  };

  // Generate TXT
  const generateTXT = (): string => {
    return `=======================================================
${title.toUpperCase()}
Period: ${periodLabel} | Date Range: ${dateRangeLabel}
Total Classes: ${stats.totalRecorded} | Present: ${stats.present} | Absent: ${stats.absent}
Late: ${stats.late} | Excused: ${stats.excused} | Cancelled: ${stats.cancelled}
Percentage: ${stats.percentage !== null ? `${stats.percentage}%` : 'N/A'}
Calculation Rule: ${stats.calculationRuleSummary}
=======================================================

${records
  .map(
    (r) =>
      `[${r.date}] ${r.subjectName} - ${r.status.toUpperCase()}${
        r.startTime ? ` (${r.startTime})` : ''
      }${r.notes ? ` | Note: ${r.notes}` : ''}`
  )
  .join('\n')}
`;
  };

  const getExportData = () => {
    switch (format) {
      case 'csv':
        return { text: generateCSV(), mime: 'text/csv', ext: 'csv' };
      case 'markdown':
        return { text: generateMarkdown(), mime: 'text/markdown', ext: 'md' };
      case 'txt':
        return { text: generateTXT(), mime: 'text/plain', ext: 'txt' };
    }
  };

  const handleDownload = () => {
    const { text, mime, ext } = getExportData();
    const blob = new Blob([text], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_records_${new Date().toISOString().split('T')[0]}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const { text } = getExportData();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  const { text } = getExportData();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Export Attendance Records
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Export {records.length} records in your preferred format
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

        {/* Format Selector */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'csv', label: 'CSV Spreadsheet', icon: FileSpreadsheet },
              { id: 'markdown', label: 'Markdown (.md)', icon: FileText },
              { id: 'txt', label: 'Plain Text (.txt)', icon: FileText },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = format === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id as any)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Preview Box */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>Preview</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 max-h-56 overflow-y-auto whitespace-pre-wrap">
              {text}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
