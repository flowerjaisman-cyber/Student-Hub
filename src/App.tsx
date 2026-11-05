/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoadingScreen } from './components/LoadingScreen.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { ToolPlaceholderView } from './components/ToolPlaceholderView.tsx';
import { ImageToolsView } from './components/image-tools/ImageToolsView.tsx';
import { DocumentStudioView } from './components/document-studio/DocumentStudioView.tsx';
import { WritingToolsView } from './components/writing-tools/WritingToolsView.tsx';
import { CalculatorsView } from './components/calculators/CalculatorsView.tsx';
import { StudyPlannerView, StudyTabType } from './components/study/StudyPlannerView.tsx';
import { MyFilesView } from './components/files/MyFilesView.tsx';
import { AIStudyView } from './components/ai-study/AIStudyView.tsx';
import { ProgressView } from './components/progress/ProgressView.tsx';
import { AttendanceView } from './components/attendance/AttendanceView.tsx';
import { NativeBannerAd } from './components/ads/NativeBannerAd.tsx';
import {
  NavSection,
  UserDocument,
  UserNote,
  UserFile,
  StudyTask,
  StudyAssignment,
  StudyExam,
  StudyHabit,
  StudySubject,
} from './types/index.ts';
import { subscribeUserDocuments } from './services/documentService.ts';
import { subscribeToUserNotes, subscribeToUserFiles } from './services/userService.ts';
import {
  subscribeStudyTasks,
  subscribeStudyAssignments,
  subscribeStudyExams,
  subscribeStudyHabits,
  subscribeStudySubjects,
} from './services/studyService.ts';

function MainAppShell() {
  const { user, loading, settings } = useAuth();
  
  // Route determination helper
  const getSectionFromPath = (path: string): { section: NavSection; tab?: StudyTabType } => {
    if (path === '/attendance' || path.startsWith('/attendance/')) return { section: 'attendance' };
    if (path === '/progress' || path.startsWith('/progress/')) return { section: 'progress' };
    if (path === '/ai-study' || path.startsWith('/ai-study/')) return { section: 'ai-study' };
    if (path === '/files' || path === '/my-files' || path.startsWith('/files/')) return { section: 'my-files' };
    if (path === '/documents' || path === '/pdf-docs' || path.startsWith('/documents/')) return { section: 'pdf-docs' };
    if (path === '/notes' || path === '/writing-tools') return { section: 'writing-tools' };
    if (path === '/tasks') return { section: 'study-tools', tab: 'tasks' };
    if (path === '/calendar') return { section: 'study-tools', tab: 'timetable' };
    if (path === '/study-planner' || path === '/study-tools' || path.startsWith('/study-planner/')) return { section: 'study-tools', tab: 'today' };
    if (path === '/calculators') return { section: 'calculators' };
    if (path === '/image-tools') return { section: 'image-tools' };
    if (path === '/settings') return { section: 'settings' };
    return { section: 'dashboard' };
  };

  const initialRoute = typeof window !== 'undefined' ? getSectionFromPath(window.location.pathname) : { section: 'dashboard' as NavSection };

  const [currentSection, setCurrentSection] = useState<NavSection>(initialRoute.section);
  const [studyTab, setStudyTab] = useState<StudyTabType>(initialRoute.tab || 'today');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active AI Context when navigated from Document Studio or files
  const [aiInitialContext, setAiInitialContext] = useState<any>(null);

  // Real-time data states
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [files, setFiles] = useState<UserFile[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [assignments, setAssignments] = useState<StudyAssignment[]>([]);
  const [exams, setExams] = useState<StudyExam[]>([]);
  const [habits, setHabits] = useState<StudyHabit[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);

  // Sync URL route when section changes
  const handleNavigate = (section: NavSection) => {
    setCurrentSection(section);
    if (typeof window !== 'undefined') {
      if (section === 'attendance') {
        window.history.pushState({}, '', '/attendance');
      } else if (section === 'progress') {
        window.history.pushState({}, '', '/progress');
      } else if (section === 'ai-study') {
        window.history.pushState({}, '', '/ai-study');
      } else if (section === 'my-files') {
        window.history.pushState({}, '', '/files');
      } else if (section === 'pdf-docs' || section === 'documents') {
        window.history.pushState({}, '', '/documents');
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

  // Subscribe to real data in Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const unsubDocs = subscribeUserDocuments(user.uid, (d) =>
      setDocuments(d.filter((doc) => !doc.deleted && !doc.isTrashed))
    );
    const unsubNotes = subscribeToUserNotes(user.uid, setNotes);
    const unsubFiles = subscribeToUserFiles(user.uid, setFiles);
    const unsubTasks = subscribeStudyTasks(user.uid, setTasks);
    const unsubAssign = subscribeStudyAssignments(user.uid, setAssignments);
    const unsubExams = subscribeStudyExams(user.uid, setExams);
    const unsubHabits = subscribeStudyHabits(user.uid, setHabits);
    const unsubSubj = subscribeStudySubjects(user.uid, setSubjects);

    return () => {
      unsubDocs();
      unsubNotes();
      unsubFiles();
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

      {/* Main Container (offset on desktop by sidebar width) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
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
          {currentSection === 'dashboard' && (
            <DashboardView onNavigate={handleNavigate} />
          )}

          {currentSection === 'attendance' && (
            <AttendanceView onNavigate={handleNavigate} />
          )}

          {currentSection === 'progress' && (
            <ProgressView onNavigate={handleNavigate} />
          )}

          {currentSection === 'ai-study' && (
            <AIStudyView
              userId={activeUserId}
              documents={documents}
              notes={notes}
              files={files}
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

          {(currentSection === 'pdf-docs' || currentSection === 'documents') && (
            <DocumentStudioView
              onNavigate={handleNavigate}
              onLaunchAIWithDoc={(doc) => {
                const clean = (doc.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                setAiInitialContext({
                  type: 'document',
                  id: doc.id,
                  title: doc.title || 'Document',
                  content: clean,
                });
                handleNavigate('ai-study');
              }}
            />
          )}

          {currentSection === 'writing-tools' && (
            <WritingToolsView
              onNavigateToDocumentStudio={() => handleNavigate('pdf-docs')}
            />
          )}

          {currentSection === 'calculators' && <CalculatorsView />}

          {currentSection === 'study-tools' && <StudyPlannerView initialTab={studyTab} />}

          {currentSection === 'my-files' && <MyFilesView />}

          {currentSection !== 'dashboard' &&
            currentSection !== 'attendance' &&
            currentSection !== 'progress' &&
            currentSection !== 'ai-study' &&
            currentSection !== 'settings' &&
            currentSection !== 'image-tools' &&
            currentSection !== 'pdf-docs' &&
            currentSection !== 'writing-tools' &&
            currentSection !== 'calculators' &&
            currentSection !== 'study-tools' &&
            currentSection !== 'my-files' && (
              <ToolPlaceholderView
                section={currentSection}
                onNavigate={handleNavigate}
              />
            )}

          {/* Adsterra Native Banner (Unit 31447846) 4:1 Widget */}
          <NativeBannerAd />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppShell />
    </AuthProvider>
  );
}
