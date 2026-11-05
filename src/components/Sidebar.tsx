import {
  LayoutDashboard,
  CalendarCheck,
  Image as ImageIcon,
  FileText,
  PenTool,
  Calculator,
  GraduationCap,
  FolderClosed,
  Settings,
  Sparkles,
  TrendingUp,
  X,
  ShieldCheck,
  LogOut,
  Gift,
  ExternalLink,
} from 'lucide-react';
import { NavSection } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface SidebarProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, badge: 'Phase 13 • Live' },
  { id: 'progress', label: 'Progress', icon: TrendingUp, badge: 'Phase 12 • Live' },
  { id: 'ai-study', label: 'AI Study', icon: Sparkles, badge: 'Phase 11 • Live' },
  { id: 'pdf-docs', label: 'Document Studio', icon: FileText, badge: 'Phase 10 • Live' },
  { id: 'my-files', label: 'My Files', icon: FolderClosed, badge: 'Phase 9 • Live' },
  { id: 'study-tools', label: 'Study Tools', icon: GraduationCap, badge: 'Phase 8' },
  { id: 'writing-tools', label: 'Writing Tools', icon: PenTool, badge: 'Phase 6' },
  { id: 'image-tools', label: 'Image Tools', icon: ImageIcon, badge: 'Phase 2 & 3' },
  { id: 'calculators', label: 'Calculators', icon: Calculator, badge: 'Phase 7' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  currentSection,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { user, profile, signOut } = useAuth();

  const handleSelect = (section: NavSection) => {
    onNavigate(section);
    onCloseMobile();
  };

  const displayName = profile?.displayName || user?.displayName || 'Student';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                StudentHub
              </h2>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                Student Utilities
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Workspace
            </span>
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentSection === item.id ||
              (item.id === 'pdf-docs' && currentSection === 'documents');

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span className="truncate flex-1 text-left">{item.label}</span>
                {item.badge && !isActive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Adsterra Smartlink 31447845: Student Deals & Perks */}
        <div className="px-3 pb-2">
          <a
            id="sidebar-smartlink-btn"
            href="https://www.profitableratecpmnetwork.com/pms2uea0?key=912ffa416c42760703ac9a7af1a48332"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:via-orange-500/20 hover:to-indigo-500/20 border border-amber-500/30 text-slate-800 dark:text-slate-100 transition-all duration-200 group cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Gift className="w-3.5 h-3.5" />
              </div>
              <div className="truncate text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Student Perks</span>
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500 text-white uppercase tracking-wider">
                    Free
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Bonus rewards &amp; tools
                </p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0" />
          </a>
        </div>

        {/* Bottom account info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                Local Workspace
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
              {displayName} (Free Access)
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
