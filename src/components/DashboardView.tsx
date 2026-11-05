import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Sparkles,
  Image as ImageIcon,
  FileText,
  PenTool,
  Calculator,
  GraduationCap,
  FolderClosed,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  File,
  StickyNote,
  Copy,
  Check,
  Plus,
  Bot,
  HelpCircle,
  Layers,
  Calendar,
  CalendarCheck,
  TrendingUp,
  Gift,
  ExternalLink,
} from 'lucide-react';
import { NavSection, UserDocument, UserNote, UserFile } from '../types/index.ts';
import {
  subscribeToUserFiles,
  subscribeToUserNotes,
} from '../services/userService.ts';
import { subscribeUserDocuments } from '../services/documentService.ts';

interface DashboardViewProps {
  onNavigate: (section: NavSection) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { user, profile } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [copiedUid, setCopiedUid] = useState(false);

  // Subscribe to real data in Firestore
  useEffect(() => {
    if (!user) return;
    const unsubFiles = subscribeToUserFiles(user.uid, (f) => setFiles(f));
    const unsubDocs = subscribeUserDocuments(user.uid, (d) =>
      setDocuments(d.filter((doc) => !doc.deleted && !doc.isTrashed))
    );
    const unsubNotes = subscribeToUserNotes(user.uid, (n) => setNotes(n));

    return () => {
      unsubFiles();
      unsubDocs();
      unsubNotes();
    };
  }, [user]);

  const displayName = profile?.displayName || user?.displayName || 'Student';
  const email = profile?.email || user?.email || '';

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const quickTools = [
    {
      id: 'attendance' as NavSection,
      name: 'Attendance',
      desc: 'Track classes, attendance, absences, and subject-wise records.',
      icon: CalendarCheck,
      phase: 'Phase 13 • Live',
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    },
    {
      id: 'progress' as NavSection,
      name: 'Academic Progress',
      desc: 'Track your study activity, coursework, exams, and academic progress.',
      icon: TrendingUp,
      phase: 'Phase 12 • Live',
      color: 'from-cyan-500/10 to-indigo-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60',
    },
    {
      id: 'ai-study' as NavSection,
      name: 'AI Study Assistant',
      desc: 'Understand, summarize, organize, and improve your study material.',
      icon: Sparkles,
      phase: 'Phase 11 • Live',
      color: 'from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
    },
    {
      id: 'image-tools' as NavSection,
      name: 'Image Tools (Standard & Advanced)',
      desc: 'Background removal, passport photos, DPI calculator, metadata, image-to-PDF, watermark, convert, and crop.',
      icon: ImageIcon,
      phase: 'Phase 2 & 3 • Live',
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    },
    {
      id: 'pdf-docs' as NavSection,
      name: 'Document Studio & Word Tools',
      desc: 'Create, edit, format, import/export DOCX, PDF, Markdown and TXT with Cloud autosave.',
      icon: FileText,
      phase: 'Phase 5 • Live',
      color: 'from-rose-500/10 to-pink-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
    },
    {
      id: 'writing-tools' as NavSection,
      name: 'Writing & Academic Tools',
      desc: 'Text cleaner, case converter, duplicate remover, citation generator (APA/MLA/Chicago/Harvard), text compare diff, and readability analysis.',
      icon: PenTool,
      phase: 'Phase 6 • Live',
      color: 'from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
    },
    {
      id: 'calculators' as NavSection,
      name: 'Calculators & Converters',
      desc: 'GPA projections, academic marks, scientific math, date & live exam countdowns, unit & financial converters.',
      icon: Calculator,
      phase: 'Phase 7 • Live',
      color: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    },
    {
      id: 'study-tools' as NavSection,
      name: 'Study Planner & Productivity',
      desc: 'Tasks, assignments, exams, timetable, study sessions stopwatch, goals, habits streak tracker, and Pomodoro timer.',
      icon: GraduationCap,
      phase: 'Phase 8 • Live',
      color: 'from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
    },
    {
      id: 'my-files' as NavSection,
      name: 'My Files & Cloud Storage',
      desc: 'Securely store, organize and manage your student files with folders, search, preview, and strict account isolation.',
      icon: FolderClosed,
      phase: 'Phase 9 • Live',
      color: 'from-indigo-500/10 to-blue-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60',
    },
  ];

  return (
    <div id="dashboard-view" className="space-y-8 pb-12">
      {/* 1. Welcome Card */}
      <section
        id="welcome-card"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 shadow-md"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-indigo-200 mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Phase 1: Foundation &amp; Cloud Architecture</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to StudentHub, {displayName}
          </h1>

          <p className="mt-2 text-sm sm:text-base text-indigo-100/90 font-medium">
            Everything a Student Needs — In One Place.
          </p>

          <p className="mt-3 text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
            Your single unified station for student tools. Phase 6 Writing &amp; Academic Tools, Phase 5 Document Studio, and Phase 2 &amp; 3 Image Tools are active with zero fake data, 100% private client processing, and Google cloud workspace persistence.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              id="welcome-writing-tools-btn"
              type="button"
              onClick={() => onNavigate('writing-tools')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-950 font-bold text-xs shadow-xs hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <span>Launch Writing Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="welcome-docs-btn"
              type="button"
              onClick={() => onNavigate('pdf-docs')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-800/80 hover:bg-indigo-800 text-white font-semibold text-xs border border-indigo-700/60 transition-colors cursor-pointer"
            >
              <span>Document Studio</span>
            </button>
            <button
              id="welcome-image-tools-btn"
              type="button"
              onClick={() => onNavigate('image-tools')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-800/60 hover:bg-indigo-800 text-white font-semibold text-xs border border-indigo-700/60 transition-colors cursor-pointer"
            >
              <span>Image Tools</span>
            </button>
            <div className="inline-flex items-center gap-1.5 text-xs text-indigo-200/90 px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Free Local Workspace Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Article & Academic Success Guide Spotlight */}
      <section
        id="featured-article-card"
        className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch"
      >
        <div className="md:w-5/12 lg:w-4/12 relative min-h-[220px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
          <img
            src="https://cdn.phototourl.com/member/2026-10-02-a2671f37-d865-4858-ba8a-3d99118dce8b.png"
            alt="Featured Student Article & Study Guide"
            className="w-full h-full object-cover min-h-[220px]"
            loading="eager"
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-indigo-600/90 text-white text-[11px] font-bold tracking-wide backdrop-blur-xs shadow-xs">
            FEATURED GUIDE
          </div>
        </div>
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Success Spotlight</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500">Academic Productivity</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              Essential Student Utilities &amp; Academic Success Workspace
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Discover all-in-one productivity tools tailored for students — including GPA calculation, timetable management, cloud study notes, Document Studio, AI assistance, and attendance tracking.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('study-tools')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Open Study Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('pdf-docs')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Document Studio</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Quick Tools Section */}
      <section id="quick-tools-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Quick Tools
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access utilities and view roadmap availability
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                id={`quick-tool-${tool.id}`}
                onClick={() => onNavigate(tool.id)}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md transition-all duration-150 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border bg-gradient-to-br ${tool.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {tool.phase}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Explore Module</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. My Workspace (No Fake Data - Clean Real Empty States) */}
      <section id="my-workspace-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              My Workspace
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your real cloud-synced files, documents, and notes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* AI Study Widget Card */}
          <div
            id="workspace-ai-study"
            className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  AI Study Assistant
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  Phase 11
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                Understand, summarize, organize, and test your knowledge.
              </p>

              {/* Real user-driven shortcuts */}
              <div className="space-y-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('ai-study')}
                  className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Ask AI Study Question</span>
                  </span>
                  <span className="text-[10px] text-slate-400">&rarr;</span>
                </button>

                {documents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onNavigate('ai-study')}
                    className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">Summarize: {documents[0].title}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">&rarr;</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onNavigate('ai-study')}
                  className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Quiz Me on Material</span>
                  </span>
                  <span className="text-[10px] text-slate-400">&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('ai-study')}
                  className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>Create Study Plan</span>
                  </span>
                  <span className="text-[10px] text-slate-400">&rarr;</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('ai-study')}
              className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/60 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Launch AI Study Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Files Card */}
          <div
            id="workspace-recent-files"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderClosed className="w-4 h-4 text-indigo-500" />
                  Recent Files
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {files.filter((f) => !f.deleted).length} items
                </span>
              </div>

              {files.filter((f) => !f.deleted).length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mx-auto flex items-center justify-center mb-2">
                    <File className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No files yet
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 max-w-[200px] mx-auto">
                    Upload your first file or create a folder in My Files.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {files
                    .filter((f) => !f.deleted)
                    .slice(0, 5)
                    .map((file) => (
                      <div
                        key={file.id}
                        onClick={() => onNavigate('my-files')}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-750 text-xs flex items-center justify-between cursor-pointer border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-colors"
                      >
                        <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono shrink-0 ml-2">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('my-files')}
              className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open My Files</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Documents Card */}
          <div
            id="workspace-recent-docs"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Recent Documents
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    {documents.length} items
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('pdf-docs')}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 cursor-pointer"
                    title="New Document"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {documents.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mx-auto flex items-center justify-center mb-2">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No documents yet.
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 max-w-[200px] mx-auto">
                    Create assignments, essays, study notes, or import text documents.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('pdf-docs')}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Document</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {documents.slice(0, 5).map((doc) => {
                    const updatedDate = doc.updatedAt
                      ? new Date(doc.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Recently';

                    return (
                      <div
                        key={doc.id}
                        onClick={() => onNavigate('pdf-docs')}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-750 text-xs flex items-center justify-between cursor-pointer border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-colors"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                            {doc.title || 'Untitled Document'}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {doc.category || 'Study Notes'} &bull; {doc.wordCount || 0} words &bull; {updatedDate}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                          Open &rarr;
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('pdf-docs')}
              className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Document Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Notes Card */}
          <div
            id="workspace-notes"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-amber-500" />
                  Notes
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {notes.length} notes
                </span>
              </div>

              {notes.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mx-auto flex items-center justify-center mb-2">
                    <StickyNote className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No notes yet
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 max-w-[200px] mx-auto">
                    Quick notes and lecture highlights will sync directly to Firestore.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs flex items-center justify-between"
                    >
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                        {note.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('study-tools')}
              className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Study &amp; Notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Adsterra Unit 31447845: Smartlink (Student Perks & Deals) */}
      <section
        id="student-perks-banner"
        className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-500/30 shadow-2xs relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Exclusive Student Perks &amp; Learning Deals
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider">
                  Featured
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                Unlock free educational tools, bonus study guides, student discounts, and partner rewards.
              </p>
            </div>
          </div>

          <a
            id="dashboard-smartlink-btn"
            href="https://www.profitableratecpmnetwork.com/pms2uea0?key=912ffa416c42760703ac9a7af1a48332"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
          >
            <span>Explore Free Perks</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* 5. Local Workspace Information Section */}
      <section
        id="account-information-card"
        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              StudentHub Workspace
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Free, private, and instant local storage for your academic data
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Active &amp; Free Access</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Student Profile
            </span>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
              Direct access (no login required)
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Workspace ID
            </span>
            <div className="mt-1 flex items-center gap-2">
              <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {user?.uid || 'student_workspace'}
              </code>
              <button
                type="button"
                onClick={handleCopyUid}
                title="Copy Workspace ID"
                className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {copiedUid ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
              Locally saved in your browser
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Data Privacy
            </span>
            <div className="mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                100% Free &amp; Offline Ready
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
              Your files, notes, and study plans stay securely in your browser.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
