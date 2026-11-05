import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Plus,
  Sliders,
  Sparkles,
  Download,
  Calendar,
  Layers,
  BarChart3,
  FileText,
  Filter,
  CheckCheck,
  CalendarRange,
  BookOpen,
  Target,
  ArrowUpDown,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceSettings,
  DateRangeFilter,
} from '../../types/attendance.ts';
import { StudySubject, TimetableEntry, NavSection } from '../../types/index.ts';
import { AcademicPeriod } from '../../types/progress.ts';

// Services
import {
  subscribeAttendanceRecords,
  subscribeAttendanceSettings,
  calculateAttendanceStats,
} from '../../services/attendanceService.ts';
import { subscribeSubjects, subscribeTimetable } from '../../services/studyService.ts';
import { subscribeAcademicPeriods } from '../../services/progressService.ts';

// Child components
import { AttendanceOverview } from './AttendanceOverview.tsx';
import { AttendanceQuickMark } from './AttendanceQuickMark.tsx';
import { SubjectAttendance } from './SubjectAttendance.tsx';
import { AttendanceTargetAnalysis } from './AttendanceTargetAnalysis.tsx';
import { AttendanceCalendar } from './AttendanceCalendar.tsx';
import { AttendanceHistory } from './AttendanceHistory.tsx';
import { AttendanceTrendCharts } from './AttendanceTrendCharts.tsx';
import { AttendanceReports } from './AttendanceReports.tsx';
import { AttendanceAIAnalysis } from './AttendanceAIAnalysis.tsx';
import { AttendanceEmptyState } from './AttendanceEmptyState.tsx';

// Modals
import { ManualAttendanceModal } from './ManualAttendanceModal.tsx';
import { BulkAttendanceModal } from './BulkAttendanceModal.tsx';
import { RecurringAttendanceModal } from './RecurringAttendanceModal.tsx';
import { AttendanceRulesModal } from './AttendanceRulesModal.tsx';
import { AttendanceImportModal } from './AttendanceImportModal.tsx';
import { AttendanceExportModal } from './AttendanceExportModal.tsx';

interface AttendanceViewProps {
  onNavigate?: (section: NavSection) => void;
}

export function AttendanceView({ onNavigate }: AttendanceViewProps) {
  const { user } = useAuth();
  const userId = user?.uid || '';

  // Data states
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<AttendanceSettings | undefined>(undefined);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // View & Filter states
  const [activeTab, setActiveTab] = useState<
    'quick' | 'overview' | 'calendar' | 'history' | 'trends' | 'reports' | 'ai'
  >('quick');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DateRangeFilter['preset']>('all');
  const [quickDate, setQuickDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Active editing record for manual modal
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [defaultModalSubjectId, setDefaultModalSubjectId] = useState<string | undefined>(undefined);
  const [defaultModalDate, setDefaultModalDate] = useState<string | undefined>(undefined);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    let loadedCount = 0;
    const checkDone = () => {
      loadedCount++;
      if (loadedCount >= 5) setIsLoading(false);
    };

    const unsubRecords = subscribeAttendanceRecords(
      userId,
      (recs) => {
        setRecords(recs);
        checkDone();
      },
      () => checkDone()
    );

    const unsubSettings = subscribeAttendanceSettings(
      userId,
      (s) => {
        setSettings(s);
        checkDone();
      },
      () => checkDone()
    );

    const unsubSubjects = subscribeSubjects(
      userId,
      (subs) => {
        setSubjects(subs);
        checkDone();
      },
      () => checkDone()
    );

    const unsubTimetable = subscribeTimetable(
      userId,
      (entries) => {
        setTimetable(entries);
        checkDone();
      },
      () => checkDone()
    );

    const unsubPeriods = subscribeAcademicPeriods(
      userId,
      (pers) => {
        setPeriods(pers);
        // Default to active period if set
        const active = pers.find((p) => p.isActive);
        if (active && selectedPeriodId === 'all') {
          // Keep as 'all' or active depending on preference
        }
        checkDone();
      },
      () => checkDone()
    );

    return () => {
      unsubRecords();
      unsubSettings();
      unsubSubjects();
      unsubTimetable();
      unsubPeriods();
    };
  }, [userId]);

  // Compute filtered records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Filter by Academic Period
    if (selectedPeriodId !== 'all') {
      const activePeriod = periods.find((p) => p.id === selectedPeriodId);
      if (activePeriod) {
        result = result.filter((r) => {
          if (r.periodId) return r.periodId === selectedPeriodId;
          // Fall back to date window of the period if present
          if (activePeriod.startDate && r.date < activePeriod.startDate) return false;
          if (activePeriod.endDate && r.date > activePeriod.endDate) return false;
          return true;
        });
      } else {
        result = result.filter((r) => r.periodId === selectedPeriodId);
      }
    }

    // Filter by Subject
    if (selectedSubjectId !== 'all') {
      const sub = subjects.find((s) => s.id === selectedSubjectId);
      const subName = sub ? sub.name.toLowerCase().trim() : selectedSubjectId.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.subjectId === selectedSubjectId ||
          r.subjectName.toLowerCase().trim() === subName
      );
    }

    // Filter by Date Preset
    if (datePreset !== 'all') {
      const now = new Date();
      let cutoffDate = '';
      if (datePreset === '7days') {
        const d = new Date(now.getTime() - 7 * 86400000);
        cutoffDate = d.toISOString().split('T')[0];
      } else if (datePreset === '30days') {
        const d = new Date(now.getTime() - 30 * 86400000);
        cutoffDate = d.toISOString().split('T')[0];
      } else if (datePreset === '90days') {
        const d = new Date(now.getTime() - 90 * 86400000);
        cutoffDate = d.toISOString().split('T')[0];
      } else if (datePreset === 'period') {
        const activePeriod = periods.find((p) => p.isActive);
        if (activePeriod?.startDate) cutoffDate = activePeriod.startDate;
      }

      if (cutoffDate) {
        result = result.filter((r) => r.date >= cutoffDate);
      }
    }

    return result;
  }, [records, selectedPeriodId, selectedSubjectId, datePreset, periods, subjects]);

  // Overall stats for filtered set
  const filteredStats = useMemo(() => {
    return calculateAttendanceStats(filteredRecords, settings);
  }, [filteredRecords, settings]);

  // Total unique subjects with records
  const subjectsWithRecordsCount = useMemo(() => {
    const set = new Set(filteredRecords.map((r) => r.subjectName.toLowerCase().trim()));
    return set.size;
  }, [filteredRecords]);

  // Modal helpers
  const handleOpenManual = (defaultSubId?: string, defaultDt?: string) => {
    setEditingRecord(null);
    setDefaultModalSubjectId(defaultSubId);
    setDefaultModalDate(defaultDt || quickDate);
    setIsManualModalOpen(true);
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setIsManualModalOpen(true);
  };

  const handleSelectSubjectFilter = (subIdOrName: string) => {
    setSelectedSubjectId(subIdOrName);
    setActiveTab('history');
  };

  const selectedPeriodObj = periods.find((p) => p.id === selectedPeriodId);
  const selectedSubObj = subjects.find((s) => s.id === selectedSubjectId);

  const periodLabel = selectedPeriodObj ? selectedPeriodObj.name : 'All Periods';
  const subjectLabel = selectedSubObj ? selectedSubObj.name : 'All Subjects';
  const dateRangeLabel =
    datePreset === '7days'
      ? 'Past 7 Days'
      : datePreset === '30days'
      ? 'Past 30 Days'
      : datePreset === '90days'
      ? 'Past 90 Days'
      : datePreset === 'period'
      ? 'Current Academic Period'
      : 'All Time';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Attendance &amp; Class Tracking
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Phase 13 • Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Track classes, attendance, absences, and subject-wise records using real user-entered
              data and timetable integration.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenManual()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Bulk Attendance Marking for Scheduled Classes"
          >
            <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Bulk Mark</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRecurringModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Recurring Class Helper"
          >
            <CalendarRange className="w-3.5 h-3.5 text-indigo-500" />
            <span>Recurring</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Configure Rules & Personal Target"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Export Records"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 2. Global Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Period:</span>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">All Periods</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isActive ? '★ (Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Subject:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Preset */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Range:</span>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">All Time</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
              <option value="90days">Past 90 Days</option>
              <option value="period">Active Period</option>
            </select>
          </div>
        </div>

        {/* Right Summary Info */}
        <div className="flex items-center gap-3 text-slate-500">
          <span>
            <strong>{filteredRecords.length}</strong> record{filteredRecords.length === 1 ? '' : 's'} in view
          </span>
          {settings?.targetPercentage && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-900">
              <Target className="w-3 h-3" />
              <span>Target: {settings.targetPercentage}%</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto space-x-1 sm:space-x-2 text-xs font-semibold">
        {[
          { id: 'quick', label: 'Daily Quick Mark', icon: CheckCircle2 },
          { id: 'overview', label: 'Overview & Target', icon: BarChart3 },
          { id: 'calendar', label: 'Calendar View', icon: Calendar },
          { id: 'history', label: `History (${records.length})`, icon: Clock },
          { id: 'trends', label: 'Analytics & Trends', icon: Layers },
          { id: 'reports', label: 'Formal Reports', icon: FileText },
          { id: 'ai', label: 'AI Intelligence', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content */}
      <div className="space-y-6">
        {/* Tab 1: Daily Quick Mark */}
        {activeTab === 'quick' && (
          <div className="space-y-6">
            <AttendanceQuickMark
              userId={userId}
              selectedDate={quickDate}
              onDateChange={setQuickDate}
              timetable={timetable}
              attendanceRecords={records}
              subjects={subjects}
              onOpenManualModal={handleOpenManual}
              onEditRecord={handleEditRecord}
            />

            {/* Also show mini overview below quick mark */}
            <AttendanceOverview
              stats={filteredStats}
              subjectsCount={subjectsWithRecordsCount}
              settings={settings}
              onOpenSettings={() => setIsRulesModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 2: Overview & Target */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <AttendanceOverview
              stats={filteredStats}
              subjectsCount={subjectsWithRecordsCount}
              settings={settings}
              onOpenSettings={() => setIsRulesModalOpen(true)}
            />

            <AttendanceTargetAnalysis
              stats={filteredStats}
              settings={settings}
              onOpenSettings={() => setIsRulesModalOpen(true)}
            />

            <SubjectAttendance
              subjects={subjects}
              attendanceRecords={filteredRecords}
              settings={settings}
              onOpenManualModal={handleOpenManual}
              onSelectSubjectFilter={handleSelectSubjectFilter}
            />
          </div>
        )}

        {/* Tab 3: Calendar View */}
        {activeTab === 'calendar' && (
          <AttendanceCalendar
            attendanceRecords={filteredRecords}
            onOpenManualModal={handleOpenManual}
            onEditRecord={handleEditRecord}
          />
        )}

        {/* Tab 4: History Table */}
        {activeTab === 'history' && (
          <AttendanceHistory
            userId={userId}
            records={filteredRecords}
            subjects={subjects}
            periods={periods}
            onEditRecord={handleEditRecord}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}

        {/* Tab 5: Analytics & Trends */}
        {activeTab === 'trends' && (
          <AttendanceTrendCharts
            records={filteredRecords}
            stats={filteredStats}
            settings={settings}
          />
        )}

        {/* Tab 6: Formal Reports */}
        {activeTab === 'reports' && (
          <AttendanceReports
            records={filteredRecords}
            subjects={subjects}
            periods={periods}
            settings={settings}
          />
        )}

        {/* Tab 7: AI Attendance Intelligence */}
        {activeTab === 'ai' && (
          <AttendanceAIAnalysis
            records={filteredRecords}
            stats={filteredStats}
            settings={settings}
            periodName={selectedPeriodObj?.name}
            dateRangeLabel={dateRangeLabel}
          />
        )}
      </div>

      {/* Modals */}
      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        userId={userId}
        existingRecord={editingRecord}
        existingRecords={records}
        subjects={subjects}
        periods={periods}
        defaultDate={defaultModalDate}
        defaultSubjectId={defaultModalSubjectId}
      />

      <BulkAttendanceModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        userId={userId}
        timetable={timetable}
        existingRecords={records}
        subjects={subjects}
        initialDate={quickDate}
      />

      <RecurringAttendanceModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        userId={userId}
        timetable={timetable}
        subjects={subjects}
        existingRecords={records}
      />

      <AttendanceRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        userId={userId}
        settings={settings}
      />

      <AttendanceImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        userId={userId}
        subjects={subjects}
        existingRecords={records}
      />

      <AttendanceExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        records={filteredRecords}
        stats={filteredStats}
        subjectFilterLabel={subjectLabel}
        periodLabel={periodLabel}
        dateRangeLabel={dateRangeLabel}
      />
    </div>
  );
}
