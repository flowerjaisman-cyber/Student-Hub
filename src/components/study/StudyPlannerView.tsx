import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  StudyTask,
  StudyAssignment,
  StudyExam,
  TimetableEntry,
  StudySession,
  StudyGoal,
  StudyHabit,
  HabitCheck,
  StudySubject,
} from '../../types/index.ts';
import {
  subscribeStudyTasks,
  subscribeAssignments,
  subscribeStudyExams,
  subscribeTimetable,
  subscribeStudySessions,
  subscribeStudyGoals,
  subscribeStudyHabits,
  subscribeHabitChecks,
  subscribeSubjects,
  saveStudyTask,
  recordHabitCheck,
  removeHabitCheck,
} from '../../services/studyService.ts';

// Tabs & Modals
import { StudyDashboardTab } from './StudyDashboardTab.tsx';
import { TasksManagerTab } from './TasksManagerTab.tsx';
import { AssignmentsManagerTab } from './AssignmentsManagerTab.tsx';
import { ExamsManagerTab } from './ExamsManagerTab.tsx';
import { TimetableTab } from './TimetableTab.tsx';
import { StudySessionsTab } from './StudySessionsTab.tsx';
import { GoalsManagerTab } from './GoalsManagerTab.tsx';
import { HabitsTrackerTab } from './HabitsTrackerTab.tsx';
import { PomodoroTab } from './PomodoroTab.tsx';
import { ProductivityProgressTab } from './ProductivityProgressTab.tsx';
import { SubjectsManagerModal } from './SubjectsManagerModal.tsx';
import { GlobalStudySearchModal } from './GlobalStudySearchModal.tsx';

import {
  LayoutDashboard,
  CheckSquare,
  FileCheck2,
  Hourglass,
  CalendarDays,
  Clock,
  Target,
  Flame,
  Brain,
  BarChart3,
  BookOpen,
  Search,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export type StudyTabType =
  | 'today'
  | 'tasks'
  | 'assignments'
  | 'exams'
  | 'timetable'
  | 'sessions'
  | 'goals'
  | 'habits'
  | 'pomodoro'
  | 'progress';

export interface StudyPlannerViewProps {
  initialTab?: StudyTabType;
}

export function StudyPlannerView({ initialTab = 'today' }: StudyPlannerViewProps = {}) {
  const { user } = useAuth();
  const uid = user?.uid;

  // Active tab
  const [activeTab, setActiveTab] = useState<StudyTabType>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modals
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Data states
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [assignments, setAssignments] = useState<StudyAssignment[]>([]);
  const [exams, setExams] = useState<StudyExam[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [habits, setHabits] = useState<StudyHabit[]>([]);
  const [checks, setChecks] = useState<HabitCheck[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to all 9 real-time collections scoped to user UID
  useEffect(() => {
    if (!uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 9) setIsLoading(false);
    };

    const unsubTasks = subscribeStudyTasks(uid, (data) => {
      setTasks(data);
      checkLoaded();
    });

    const unsubAssignments = subscribeAssignments(uid, (data) => {
      setAssignments(data);
      checkLoaded();
    });

    const unsubExams = subscribeStudyExams(uid, (data) => {
      setExams(data);
      checkLoaded();
    });

    const unsubTimetable = subscribeTimetable(uid, (data) => {
      setTimetable(data);
      checkLoaded();
    });

    const unsubSessions = subscribeStudySessions(uid, (data) => {
      setSessions(data);
      checkLoaded();
    });

    const unsubGoals = subscribeStudyGoals(uid, (data) => {
      setGoals(data);
      checkLoaded();
    });

    const unsubHabits = subscribeStudyHabits(uid, (data) => {
      setHabits(data);
      checkLoaded();
    });

    const unsubChecks = subscribeHabitChecks(uid, (data) => {
      setChecks(data);
      checkLoaded();
    });

    const unsubSubjects = subscribeSubjects(uid, (data) => {
      setSubjects(data);
      checkLoaded();
    });

    return () => {
      unsubTasks();
      unsubAssignments();
      unsubExams();
      unsubTimetable();
      unsubSessions();
      unsubGoals();
      unsubHabits();
      unsubChecks();
      unsubSubjects();
    };
  }, [uid]);

  if (!uid) {
    return (
      <div className="p-12 text-center text-slate-500">
        Please sign in with your Google account to access your private study planner.
      </div>
    );
  }

  // Cross-tab actions
  const handleToggleTaskComplete = async (task: StudyTask) => {
    const isCompleted = task.status === 'completed';
    const now = new Date().toISOString();
    await saveStudyTask(uid, {
      ...task,
      status: isCompleted ? 'todo' : 'completed',
      completedAt: isCompleted ? undefined : now,
      updatedAt: now,
    });
  };

  const handleToggleHabitCheck = async (habitId: string, dateStr: string) => {
    const existingCheck = checks.find(
      (c) => c.habitId === habitId && c.date === dateStr && c.completed
    );
    if (existingCheck) {
      await removeHabitCheck(uid, existingCheck.id);
    } else {
      await recordHabitCheck(uid, habitId, dateStr, true);
    }
  };

  const navTabs: { id: StudyTabType; label: string; icon: any; count?: number }[] = [
    { id: 'today', label: 'Today', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: tasks.filter((t) => t.status !== 'completed').length },
    { id: 'assignments', label: 'Assignments', icon: FileCheck2, count: assignments.filter((a) => a.status !== 'completed').length },
    { id: 'exams', label: 'Exams & Countdowns', icon: Hourglass, count: exams.filter((e) => !e.completed).length },
    { id: 'timetable', label: 'Timetable', icon: CalendarDays },
    { id: 'sessions', label: 'Study Sessions', icon: Clock },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'habits', label: 'Habits', icon: Flame },
    { id: 'pomodoro', label: 'Pomodoro', icon: Brain },
    { id: 'progress', label: 'Progress & Stats', icon: BarChart3 },
  ];

  return (
    <div id="study-planner-workspace" className="space-y-6 pb-12">
      {/* 1. Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Phase 8 • Study Planner &amp; Productivity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Study Planner &amp; Productivity
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Plan your classes, assignments, exams and study time in one place.
          </p>
        </div>

        {/* Global Search & Course Catalog Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search Study Items</span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">⌘K</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSubjectsModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl border border-indigo-200 dark:border-indigo-800/80 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Courses ({subjects.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Horizontal Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main Tab Contents */}
      {activeTab === 'today' && (
        <StudyDashboardTab
          tasks={tasks}
          assignments={assignments}
          exams={exams}
          timetable={timetable}
          sessions={sessions}
          goals={goals}
          habits={habits}
          checks={checks}
          subjects={subjects}
          onNavigateTab={setActiveTab}
          onToggleTaskComplete={handleToggleTaskComplete}
          onToggleHabitCheck={handleToggleHabitCheck}
          onOpenAddTask={() => setActiveTab('tasks')}
          onOpenAddAssignment={() => setActiveTab('assignments')}
          onOpenAddExam={() => setActiveTab('exams')}
        />
      )}

      {activeTab === 'tasks' && (
        <TasksManagerTab
          uid={uid}
          tasks={tasks}
          subjects={subjects}
          onOpenSubjectsModal={() => setIsSubjectsModalOpen(true)}
        />
      )}

      {activeTab === 'assignments' && (
        <AssignmentsManagerTab
          uid={uid}
          assignments={assignments}
          subjects={subjects}
          onOpenSubjectsModal={() => setIsSubjectsModalOpen(true)}
        />
      )}

      {activeTab === 'exams' && (
        <ExamsManagerTab
          uid={uid}
          exams={exams}
          subjects={subjects}
          onOpenSubjectsModal={() => setIsSubjectsModalOpen(true)}
        />
      )}

      {activeTab === 'timetable' && (
        <TimetableTab
          uid={uid}
          timetable={timetable}
          subjects={subjects}
          onOpenSubjectsModal={() => setIsSubjectsModalOpen(true)}
        />
      )}

      {activeTab === 'sessions' && (
        <StudySessionsTab
          uid={uid}
          sessions={sessions}
          subjects={subjects}
          onOpenSubjectsModal={() => setIsSubjectsModalOpen(true)}
        />
      )}

      {activeTab === 'goals' && (
        <GoalsManagerTab
          uid={uid}
          goals={goals}
          subjects={subjects}
          onOpenSubjectsModal={() => setIsSubjectsModalOpen(true)}
        />
      )}

      {activeTab === 'habits' && (
        <HabitsTrackerTab
          uid={uid}
          habits={habits}
          checks={checks}
        />
      )}

      {activeTab === 'pomodoro' && (
        <PomodoroTab
          uid={uid}
          subjects={subjects}
        />
      )}

      {activeTab === 'progress' && (
        <ProductivityProgressTab
          tasks={tasks}
          assignments={assignments}
          exams={exams}
          sessions={sessions}
          goals={goals}
          habits={habits}
          checks={checks}
          subjects={subjects}
        />
      )}

      {/* Course & Subject Catalog Modal */}
      <SubjectsManagerModal
        isOpen={isSubjectsModalOpen}
        onClose={() => setIsSubjectsModalOpen(false)}
        uid={uid}
        subjects={subjects}
      />

      {/* Global Search Modal */}
      <GlobalStudySearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectResult={(tab) => setActiveTab(tab)}
        tasks={tasks}
        assignments={assignments}
        exams={exams}
        timetable={timetable}
        goals={goals}
        habits={habits}
        subjects={subjects}
      />
    </div>
  );
}
