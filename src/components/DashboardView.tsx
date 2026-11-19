import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSiteConfig } from '../context/SiteConfigContext.tsx';
import {
  Sparkles,
  Image as ImageIcon,
  PenTool,
  Calculator,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  StickyNote,
  Copy,
  Check,
  Bot,
  HelpCircle,
  Calendar,
  AlertTriangle,
  Info,
  ExternalLink,
  Megaphone,
  Bookmark,
} from 'lucide-react';
import {
  NavSection,
  UserNote,
  ConfigurableModuleId,
} from '../types/index.ts';
import { subscribeToUserNotes } from '../services/userService.ts';

interface DashboardViewProps {
  onNavigate: (section: NavSection) => void;
}

const MODULE_VISUALS: Record<
  ConfigurableModuleId,
  { icon: typeof Sparkles; color: string }
> = {
  'ai-study': {
    icon: Sparkles,
    color:
      'from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
  },
  'image-tools': {
    icon: ImageIcon,
    color:
      'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
  },
  'writing-tools': {
    icon: PenTool,
    color:
      'from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
  },
  calculators: {
    icon: Calculator,
    color:
      'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
  },
  'study-tools': {
    icon: GraduationCap,
    color:
      'from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
  },
};

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { user, profile } = useAuth();
  const { config } = useSiteConfig();
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [copiedUid, setCopiedUid] = useState(false);

  // Subscribe to real data
  useEffect(() => {
    if (!user) return;
    const unsubNotes = subscribeToUserNotes(user.uid, (n) => setNotes(n));

    return () => {
      unsubNotes();
    };
  }, [user]);

  const displayName = profile?.displayName || user?.displayName || 'Student';

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const activeAnnouncements = config.announcements.filter((a) => a.active);
  const activeModules = [...config.modules]
    .filter((m) => m.enabled)
    .sort((a, b) => a.order - b.order);
  const activeResources = config.resources.filter((r) => r.active);

  return (
    <div id="dashboard-view" className="space-y-8 pb-12">
      {/* 0. Admin Announcements Notice Board */}
      {config.sections.showAnnouncements && activeAnnouncements.length > 0 && (
        <section id="dashboard-announcements" className="space-y-3">
          {activeAnnouncements.map((ann) => {
            const isWarning = ann.severity === 'warning';
            const isSuccess = ann.severity === 'success';

            const containerClass = isWarning
              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
              : isSuccess
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
              : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/60';

            const iconClass = isWarning
              ? 'text-amber-600 dark:text-amber-400'
              : isSuccess
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-indigo-600 dark:text-indigo-400';

            const severityLabel = isWarning
              ? 'Important Notice'
              : isSuccess
              ? 'Update'
              : 'Announcement';

            return (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${containerClass}`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 shrink-0 ${iconClass}`}>
                    {isWarning ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isSuccess ? (
                      <Megaphone className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <span className={iconClass}>{severityLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                        }).format(new Date(ann.createdAt))}
                      </span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {ann.title}
                    </h2>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {ann.message}
                    </p>
                  </div>
                </div>

                {ann.linkUrl && (
                  <a
                    href={ann.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
                  >
                    <span>{ann.linkLabel || 'Open Link'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* 1. Welcome Card */}
      {config.sections.showWelcomeCard && (
        <section
          id="welcome-card"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 shadow-md"
        >
          <div className="relative z-10 max-w-2xl">
            {config.branding.welcomeBadge && (
              <p className="text-xs font-medium text-indigo-200/90 mb-3">
                {config.branding.welcomeBadge}
              </p>
            )}

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">
              {config.branding.heroTitle}
              {config.branding.heroTitle === 'Welcome to StudentHub'
                ? `, ${displayName}`
                : ''}
            </h1>

            <p className="mt-2 text-sm sm:text-base text-indigo-100/90 font-medium">
              {config.branding.heroSubtitle}
            </p>

            <p className="mt-3 text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
              {config.branding.heroDescription}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {config.branding.primaryCtaLabel && (
                <button
                  id="welcome-primary-cta-btn"
                  type="button"
                  onClick={() => onNavigate(config.branding.primaryCtaTarget)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-950 font-bold text-xs shadow-xs hover:bg-indigo-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{config.branding.primaryCtaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {config.branding.secondaryCtaLabel && (
                <button
                  id="welcome-secondary-cta-btn"
                  type="button"
                  onClick={() => onNavigate(config.branding.secondaryCtaTarget)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-800/60 hover:bg-indigo-800 text-white font-semibold text-xs border border-indigo-700/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{config.branding.secondaryCtaLabel}</span>
                </button>
              )}

              {config.branding.workspaceStatusLabel && (
                <div className="inline-flex items-center gap-1.5 text-xs text-indigo-200/90 px-2 py-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{config.branding.workspaceStatusLabel}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. Quick Tools Section */}
      {config.sections.showQuickTools && (
        <section id="quick-tools-section">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Quick Tools
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access active student modules and productivity tools
              </p>
            </div>
          </div>

          {activeModules.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                No modules are currently enabled on the Dashboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeModules.map((tool) => {
                const visual = MODULE_VISUALS[tool.id] || MODULE_VISUALS['ai-study'];
                const Icon = visual.icon;
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
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border bg-gradient-to-br ${visual.color}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {tool.badge && (
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {tool.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {tool.description}
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
          )}
        </section>
      )}

      {/* 2.5 Featured Student Resources (Admin-Curated) */}
      {config.sections.showFeaturedResources && activeResources.length > 0 && (
        <section id="featured-resources-section">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Featured Resources
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Curated academic links and study references
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeResources.map((res) => (
              <a
                key={res.id}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{res.category}</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {res.title}
                  </h3>
                  {res.description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {res.description}
                    </p>
                  )}
                </div>
                <span className="mt-3 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 truncate">
                  {res.url}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 3. My Workspace */}
      {config.sections.showWorkspaceWidgets && (
        <section id="my-workspace-section">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                My Workspace
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your AI study shortcuts and saved notes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                    Active
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                  Understand, summarize, organize, and test your knowledge.
                </p>

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
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium tabular-nums">
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
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 max-w-[220px] mx-auto">
                      Quick notes and lecture highlights are saved privately in your browser.
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
      )}

      {/* 4. Local Workspace Information Section */}
      {config.sections.showWorkspaceInfo && (
        <section
          id="account-information-card"
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {config.branding.siteName} Workspace
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Free, private, and instant local storage for your academic data
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 self-start sm:self-auto">
              Active &amp; Free Access
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
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
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
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
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Data Privacy
              </span>
              <div className="mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  100% Free &amp; Offline Ready
                </span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                Your notes and study plans stay securely in your browser.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
