import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  FileCheck2,
  FileText,
  Flame,
  Hourglass,
  LayoutDashboard,
  Plus,
  Sliders,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  StudyTask,
  StudyAssignment,
  StudyExam,
  StudySession,
  StudyHabit,
  HabitCheck,
  StudySubject,
  UserDocument,
  UserNote,
  UserFile,
  AIStudyMaterial,
  NavSection,
} from '../../types/index.ts';
import {
  AcademicPeriod,
  AcademicResult,
  DateRangePreset,
} from '../../types/progress.ts';

// Services
import {
  subscribeStudyTasks,
  subscribeAssignments,
  subscribeStudyExams,
  subscribeStudySessions,
  subscribeStudyHabits,
  subscribeHabitChecks,
  subscribeSubjects,
} from '../../services/studyService.ts';
import {
  subscribeAcademicPeriods,
  subscribeAcademicResults,
  deleteAcademicResult,
} from '../../services/progressService.ts';
import { subscribeUserDocuments } from '../../services/documentService.ts';
import {
  subscribeToUserNotes,
  subscribeToUserFiles,
} from '../../services/userService.ts';
import { subscribeUserAIMaterials } from '../../services/aiStudyService.ts';

// Subcomponents
import { ProgressOverview } from './ProgressOverview.tsx';
import { SubjectProgress } from './SubjectProgress.tsx';
import { CourseworkProgress } from './CourseworkProgress.tsx';
import { ExamProgress } from './ExamProgress.tsx';
import { ResultsGradebook } from './ResultsGradebook.tsx';
import { StudyAnalytics } from './StudyAnalytics.tsx';
import { HabitProgress } from './HabitProgress.tsx';
import { DocumentAnalytics } from './DocumentAnalytics.tsx';
import { ProgressCalendar } from './ProgressCalendar.tsx';
import { AIProgressInsights } from './AIProgressInsights.tsx';
import { ProgressReportGenerator } from './ProgressReportGenerator.tsx';
import { AcademicPeriodsModal } from './AcademicPeriodsModal.tsx';
import { ResultsManagerModal } from './ResultsManagerModal.tsx';

interface ProgressViewProps {
  onNavigate: (section: NavSection) => void;
}

export function ProgressView({ onNavigate }: ProgressViewProps) {
  const { user } = useAuth();

  // Primary Tab State
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Filters
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Modals
  const [periodsModalOpen, setPeriodsModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<AcademicResult | null>(null);

  // Stored Records State
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [assignments, setAssignments] = useState<StudyAssignment[]>([]);
  const [exams, setExams] = useState<StudyExam[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [habits, setHabits] = useState<StudyHabit[]>([]);
  const [habitChecks, setHabitChecks] = useState<HabitCheck[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [results, setResults] = useState<AcademicResult[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [files, setFiles] = useState<UserFile[]>([]);
  const [aiMaterials, setAiMaterials] = useState<AIStudyMaterial[]>([]);

  // Subscriptions to real Firestore data
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    const unsubs = [
      subscribeStudyTasks(uid, (t) => setTasks(t)),
      subscribeAssignments(uid, (a) => setAssignments(a)),
      subscribeStudyExams(uid, (e) => setExams(e)),
      subscribeStudySessions(uid, (s) => setStudySessions(s)),
      subscribeStudyHabits(uid, (h) => setHabits(h)),
      subscribeHabitChecks(uid, (hc) => setHabitChecks(hc)),
      subscribeSubjects(uid, (sub) => setSubjects(sub)),
      subscribeAcademicResults(uid, (r) => setResults(r)),
      subscribeAcademicPeriods(uid, (p) => {
        setPeriods(p);
        const active = p.find((item) => item.isActive);
        if (active && selectedPeriodId === 'all') {
          // If there's an active period and we haven't touched period selector, default to active
          setSelectedPeriodId(active.id);
        }
      }),
      subscribeUserDocuments(uid, (d) => setDocuments(d)),
      subscribeToUserNotes(uid, (n) => setNotes(n)),
      subscribeToUserFiles(uid, (f) => setFiles(f)),
      subscribeUserAIMaterials(uid, (m) => setAiMaterials(m)),
    ];

    return () => {
      unsubs.forEach((u) => u && u());
    };
  }, [user]);

  // Selected Period Object
  const selectedPeriod = useMemo(() => {
    if (selectedPeriodId === 'all') return null;
    return periods.find((p) => p.id === selectedPeriodId) || null;
  }, [periods, selectedPeriodId]);

  // Calculate Date Boundaries
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (dateRangePreset === 'today') {
      return { start: todayStr, end: todayStr, label: 'Today' };
    }

    if (dateRangePreset === 'this_week') {
      const first = now.getDate() - now.getDay();
      const firstDay = new Date(now.setDate(first)).toISOString().split('T')[0];
      const lastDay = new Date(now.setDate(first + 6)).toISOString().split('T')[0];
      return { start: firstDay, end: lastDay, label: 'This Week' };
    }

    if (dateRangePreset === 'this_month') {
      const y = now.getFullYear();
      const m = now.getMonth();
      const first = new Date(y, m, 1).toISOString().split('T')[0];
      const last = new Date(y, m + 1, 0).toISOString().split('T')[0];
      return { start: first, end: last, label: 'This Month' };
    }

    if (dateRangePreset === 'last_7_days') {
      const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      return { start, end: todayStr, label: 'Last 7 Days' };
    }

    if (dateRangePreset === 'last_30_days') {
      const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      return { start, end: todayStr, label: 'Last 30 Days' };
    }

    if (dateRangePreset === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd, label: `${customStart} to ${customEnd}` };
    }

    // Default: period or all time
    if (selectedPeriod) {
      return {
        start: selectedPeriod.startDate,
        end: selectedPeriod.endDate,
        label: selectedPeriod.name,
      };
    }

    return { start: '1970-01-01', end: '2099-12-31', label: 'All Recorded Time' };
  }, [dateRangePreset, customStart, customEnd, selectedPeriod]);

  // Filter records by period / subject where relevant
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedSubjectId !== 'all') {
        if (t.subjectId !== selectedSubjectId && t.subjectName !== selectedSubjectId) return false;
      }
      return true;
    });
  }, [tasks, selectedSubjectId]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (selectedSubjectId !== 'all') {
        if (a.subjectId !== selectedSubjectId && a.subjectName !== selectedSubjectId) return false;
      }
      return true;
    });
  }, [assignments, selectedSubjectId]);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      if (selectedSubjectId !== 'all') {
        if (e.subjectId !== selectedSubjectId && e.subjectName !== selectedSubjectId) return false;
      }
      return true;
    });
  }, [exams, selectedSubjectId]);

  const filteredStudySessions = useMemo(() => {
    return studySessions.filter((s) => {
      if (selectedSubjectId !== 'all') {
        if (s.subjectId !== selectedSubjectId && s.subjectName !== selectedSubjectId) return false;
      }
      const sessionDate = s.actualStart?.split('T')[0] || s.plannedStart?.split('T')[0] || s.startTime?.split('T')[0];
      if (sessionDate) {
        if (sessionDate < dateRangeBounds.start || sessionDate > dateRangeBounds.end) return false;
      }
      return true;
    });
  }, [studySessions, selectedSubjectId, dateRangeBounds]);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (selectedSubjectId !== 'all') {
        if (r.subjectId !== selectedSubjectId && r.subjectName !== selectedSubjectId) return false;
      }
      if (selectedPeriodId !== 'all') {
        if (r.periodId && r.periodId !== selectedPeriodId) return false;
      }
      return true;
    });
  }, [results, selectedSubjectId, selectedPeriodId]);

  const handleEditResult = (res: AcademicResult) => {
    setEditingResult(res);
    setResultModalOpen(true);
  };

  const handleDeleteResult = async (resId: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this assessment result?')) {
      await deleteAcademicResult(user.uid, resId);
    }
  };

  const handleNavigateToStudyPlanner = (tab: string = 'dashboard') => {
    onNavigate('study-tools');
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'coursework', label: 'Coursework', icon: CheckSquare, count: filteredTasks.length + filteredAssignments.length },
    { id: 'subjects', label: 'Subject Progress', icon: BookOpen, count: subjects.length },
    { id: 'exams', label: 'Exams & Readiness', icon: Hourglass, count: filteredExams.length },
    { id: 'gradebook', label: 'Results & GPA', icon: Award, count: filteredResults.length },
    { id: 'study', label: 'Study Activity', icon: Clock },
    { id: 'habits', label: 'Habits', icon: Flame, count: habits.length },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'calendar', label: 'Progress Calendar', icon: Calendar },
    { id: 'ai-insights', label: 'AI Insights', icon: Sparkles },
    { id: 'reports', label: 'Report Generator', icon: TrendingUp },
  ];

  return (
    <div id="progress-view" className="space-y-6 pb-16">
      {/* Workspace Header & Top Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Academic Progress &amp; Analytics
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Phase 12 • Live
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Empirical study activity, coursework tracker, exam readiness, and GPA calculated
            exclusively from your real StudentHub data.
          </p>
        </div>

        {/* Filters: Academic Period, Course / Subject, Date Range */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Academic Period Selector */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Academic Periods</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isActive ? '★ Active' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPeriodsModalOpen(true)}
              title="Manage Periods"
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. Subject Selector */}
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Courses</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.code ? `(${s.code})` : ''}
              </option>
            ))}
          </select>

          {/* 3. Date Range Selector */}
          <select
            value={dateRangePreset}
            onChange={(e) => setDateRangePreset(e.target.value as DateRangePreset)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {dateRangePreset === 'custom' && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <ProgressOverview
            tasks={filteredTasks}
            assignments={filteredAssignments}
            exams={filteredExams}
            studySessions={filteredStudySessions}
            habits={habits}
            subjects={subjects}
            results={filteredResults}
            documents={documents}
            notes={notes}
            files={files}
            selectedPeriod={selectedPeriod}
            onNavigateTab={(t) => setActiveTab(t)}
            onOpenNewResult={() => {
              setEditingResult(null);
              setResultModalOpen(true);
            }}
            onOpenPeriodsModal={() => setPeriodsModalOpen(true)}
          />
        )}

        {activeTab === 'coursework' && (
          <CourseworkProgress
            tasks={filteredTasks}
            assignments={filteredAssignments}
            subjects={subjects}
            onNavigateToStudyItem={(tab, id) => onNavigate('study-tools')}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectProgress
            subjects={subjects}
            tasks={tasks}
            assignments={assignments}
            exams={exams}
            studySessions={studySessions}
            results={results}
            documents={documents}
            notes={notes}
            onNavigateToStudyPlanner={() => onNavigate('study-tools')}
          />
        )}

        {activeTab === 'exams' && (
          <ExamProgress
            exams={filteredExams}
            tasks={filteredTasks}
            studySessions={filteredStudySessions}
            subjects={subjects}
            onNavigateToStudyItem={(tab, id) => onNavigate('study-tools')}
          />
        )}

        {activeTab === 'gradebook' && (
          <ResultsGradebook
            results={filteredResults}
            subjects={subjects}
            periods={periods}
            onOpenAddResult={() => {
              setEditingResult(null);
              setResultModalOpen(true);
            }}
            onOpenEditResult={handleEditResult}
            onDeleteResult={handleDeleteResult}
          />
        )}

        {activeTab === 'study' && (
          <StudyAnalytics
            studySessions={filteredStudySessions}
            subjects={subjects}
            dateRangeLabel={dateRangeBounds.label}
          />
        )}

        {activeTab === 'habits' && (
          <HabitProgress habits={habits} habitChecks={habitChecks} />
        )}

        {activeTab === 'documents' && (
          <DocumentAnalytics
            documents={documents}
            notes={notes}
            files={files}
            aiMaterials={aiMaterials}
          />
        )}

        {activeTab === 'calendar' && (
          <ProgressCalendar
            tasks={tasks}
            assignments={assignments}
            exams={exams}
            studySessions={studySessions}
            habitChecks={habitChecks}
            documents={documents}
          />
        )}

        {activeTab === 'ai-insights' && (
          <AIProgressInsights
            tasks={filteredTasks}
            assignments={filteredAssignments}
            exams={filteredExams}
            studySessions={filteredStudySessions}
            habits={habits}
            habitChecks={habitChecks}
            results={filteredResults}
            documents={documents}
            notes={notes}
            files={files}
            aiMaterials={aiMaterials}
            selectedPeriod={selectedPeriod}
            dateRangeLabel={dateRangeBounds.label}
          />
        )}

        {activeTab === 'reports' && user && (
          <ProgressReportGenerator
            userId={user.uid}
            tasks={filteredTasks}
            assignments={filteredAssignments}
            exams={filteredExams}
            studySessions={filteredStudySessions}
            habits={habits}
            habitChecks={habitChecks}
            results={filteredResults}
            documents={documents}
            notes={notes}
            files={files}
            aiMaterials={aiMaterials}
            selectedPeriod={selectedPeriod}
            dateRangeLabel={dateRangeBounds.label}
          />
        )}
      </div>

      {/* Modals */}
      {user && (
        <>
          <AcademicPeriodsModal
            isOpen={periodsModalOpen}
            onClose={() => setPeriodsModalOpen(false)}
            userId={user.uid}
            periods={periods}
            activePeriodId={selectedPeriodId}
            onSelectPeriod={(id) => setSelectedPeriodId(id)}
          />

          <ResultsManagerModal
            isOpen={resultModalOpen}
            onClose={() => {
              setResultModalOpen(false);
              setEditingResult(null);
            }}
            userId={user.uid}
            existingResult={editingResult}
            subjects={subjects}
            periods={periods}
          />
        </>
      )}
    </div>
  );
}
