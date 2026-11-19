/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { SiteConfigProvider, useSiteConfig } from './context/SiteConfigContext.tsx';
import { LoadingScreen } from './components/LoadingScreen.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { ToolPlaceholderView } from './components/ToolPlaceholderView.tsx';
import { ImageToolsView } from './components/image-tools/ImageToolsView.tsx';
import { WritingToolsView } from './components/writing-tools/WritingToolsView.tsx';
import { CalculatorsView } from './components/calculators/CalculatorsView.tsx';
import { StudyPlannerView, StudyTabType } from './components/study/StudyPlannerView.tsx';
import { AIStudyView } from './components/ai-study/AIStudyView.tsx';
import { AdminLoginView } from './components/admin/AdminLoginView.tsx';
import { AdminPanelView } from './components/admin/AdminPanelView.tsx';
import { Lock, Wrench, ArrowLeft } from 'lucide-react';
import {
  NavSection,
  UserNote,
  StudyTask,
  StudyAssignment,
  StudyExam,
  StudyHabit,
  StudySubject,
  ConfigurableModuleId,
} from './types/index.ts';
import { subscribeToUserNotes } from './services/userService.ts';
import {
  subscribeStudyTasks,
  subscribeStudyAssignments,
  subscribeStudyExams,
  subscribeStudyHabits,
  subscribeStudySubjects,
} from './services/studyService.ts';

const CONFIGURABLE_SECTIONS: ConfigurableModuleId[] = [
  'ai-study',
  'study-tools',
  'writing-tools',
  'image-tools',
  'calculators',
];

function MainAppShell() {
  const { user, loading, settings } = useAuth();
  const { config, adminSession, adminChecking } = useSiteConfig();

  // Route determination helper
  const getSectionFromPath = (path: string): { section: NavSection; tab?: StudyTabType } => {
    if (path === '/admin' || path.startsWith('/admin/')) return { section: 'admin' };
    if (path === '/ai-study' || path.startsWith('/ai-study/')) return { section: 'ai-study' };
    if (path === '/notes' || path === '/writing-tools') return { section: 'writing-tools' };
    if (path === '/tasks') return { section: 'study-tools', tab: 'tasks' };
    if (path === '/calendar') return { section: 'study-tools', tab: 'timetable' };
    if (path === '/study-planner' || path === '/study-tools' || path.startsWith('/study-planner/')) return { section: 'study-tools', tab: 'today' };
    if (path === '/calculators') return { section: 'calculators' };
    if (path === '/image-tools') return { section: 'image-tools' };
    if (path === '/settings') return { section: 'settings' };
    return { section: 'dashboard' };
  };

  const initialRoute =
    typeof window !== 'undefined'
      ? getSectionFromPath(window.location.pathname)
      : { section: 'dashboard' as NavSection };

  const [currentSection, setCurrentSection] = useState<NavSection>(initialRoute.section);
  const [studyTab, setStudyTab] = useState<StudyTabType>(initialRoute.tab || 'today');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active AI Context
  const [aiInitialContext] = useState<any>(null);

  // Real-time data states
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [assignments, setAssignments] = useState<StudyAssignment[]>([]);
  const [exams, setExams] = useState<StudyExam[]>([]);
  const [habits, setHabits] = useState<StudyHabit[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);

  // Sync URL route when section changes
  const handleNavigate = (section: NavSection) => {
    setCurrentSection(section);
    if (typeof window !== 'undefined') {
      if (section === 'admin') {
        window.history.pushState({}, '', '/admin');
      } else if (section === 'ai-study') {
        window.history.pushState({}, '', '/ai-study');
      } else if (section === 'writing-tools') {
        window.history.pushState({}, '', '/notes');
      } else if (section === 'study-tools') {
        window.history.pushState({}, '', '/study-planner');
      } else if (section === 'dashboard') {
        window.history.pushState({}, '', '/dashboard');
      } else {
        window.history.pushState({}, '', `/${section}`);
      }
    }
  };

  // Listen to browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const { section, tab } = getSectionFromPath(window.location.pathname);
      setCurrentSection(section);
      if (tab) {
        setStudyTab(tab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync browser document title with Admin Branding
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${config.branding.siteName} — ${config.branding.heroSubtitle}`;
    }
  }, [config.branding.siteName, config.branding.heroSubtitle]);

  // Subscribe to real data in local store
  useEffect(() => {
    if (!user?.uid) return;
    const unsubNotes = subscribeToUserNotes(user.uid, setNotes);
    const unsubTasks = subscribeStudyTasks(user.uid, setTasks);
    const unsubAssign = subscribeStudyAssignments(user.uid, setAssignments);
    const unsubExams = subscribeStudyExams(user.uid, setExams);
    const unsubHabits = subscribeStudyHabits(user.uid, setHabits);
    const unsubSubj = subscribeStudySubjects(user.uid, setSubjects);

    return () => {
      unsubNotes();
      unsubTasks();
      unsubAssign();
      unsubExams();
      unsubHabits();
      unsubSubj();
    };
  }, [user?.uid]);

  if (loading) {
    return <LoadingScreen />;
  }

  const activeUserId = user?.uid || 'student_user';
  const isCompact = settings?.compactView || false;

  const isModuleDisabled =
    CONFIGURABLE_SECTIONS.includes(currentSection as ConfigurableModuleId) &&
    config.modules.find((m) => m.id === currentSection)?.enabled === false;

  const isMaintenanceBlocked =
    config.maintenance.enabled && currentSection !== 'admin' && !adminSession;

  // Keep the administrator portal separate from the student workspace.
  if (currentSection === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {adminChecking ? (
          <div className="min-h-screen flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Verifying administrator session...
          </div>
        ) : adminSession ? (
          <AdminPanelView onNavigate={handleNavigate} />
        ) : (
          <AdminLoginView onBackToDashboard={() => handleNavigate('dashboard')} />
        )}
      </div>
    );
  }

  return (
    <div
      id="studenthub-app-shell"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200"
    >
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onNavigate={handleNavigate}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <Header
          currentSection={currentSection}
          onNavigate={handleNavigate}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        {/* Dynamic Main Workspace Content */}
        <main
          id="main-workspace-content"
          className={`flex-1 min-w-0 ${
            isCompact ? 'p-3 sm:p-5 max-w-7xl w-full mx-auto' : 'p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto'
          }`}
        >
          {isMaintenanceBlocked ? (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
              <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                  <Wrench className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {config.maintenance.title || 'Scheduled Maintenance'}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {config.maintenance.message}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleNavigate('admin')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Admin Sign In</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isModuleDisabled ? (
            <div className="min-h-[50vh] flex items-center justify-center px-4">
              <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  Module Currently Unavailable
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  This module has been temporarily hidden by the site administrator.
                </p>
                <button
                  type="button"
                  onClick={() => handleNavigate('dashboard')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Dashboard</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentSection === 'dashboard' && (
                <DashboardView onNavigate={handleNavigate} />
              )}

              {currentSection === 'ai-study' && (
                <AIStudyView
                  userId={activeUserId}
                  notes={notes}
                  tasks={tasks}
                  assignments={assignments}
                  exams={exams}
                  habits={habits}
                  subjects={subjects}
                  initialContext={aiInitialContext}
                />
              )}

              {currentSection === 'settings' && <SettingsView />}

              {currentSection === 'image-tools' && <ImageToolsView />}

              {currentSection === 'writing-tools' && <WritingToolsView />}

              {currentSection === 'calculators' && <CalculatorsView />}

              {currentSection === 'study-tools' && <StudyPlannerView initialTab={studyTab} />}

              {currentSection !== 'dashboard' &&
                currentSection !== 'ai-study' &&
                currentSection !== 'settings' &&
                currentSection !== 'image-tools' &&
                currentSection !== 'writing-tools' &&
                currentSection !== 'calculators' &&
                currentSection !== 'study-tools' && (
                  <ToolPlaceholderView
                    section={currentSection}
                    onNavigate={handleNavigate}
                  />
                )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SiteConfigProvider>
        <MainAppShell />
      </SiteConfigProvider>
    </AuthProvider>
  );
}
