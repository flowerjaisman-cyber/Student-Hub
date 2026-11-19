import {
  LayoutDashboard,
  Image as ImageIcon,
  PenTool,
  Calculator,
  GraduationCap,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { NavSection, ConfigurableModuleId } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useSiteConfig } from '../context/SiteConfigContext.tsx';

interface SidebarProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const MODULE_ICONS: Record<ConfigurableModuleId, typeof LayoutDashboard> = {
  'ai-study': Sparkles,
  'study-tools': GraduationCap,
  'writing-tools': PenTool,
  'image-tools': ImageIcon,
  calculators: Calculator,
};

export function Sidebar({
  currentSection,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { user, profile } = useAuth();
  const { config } = useSiteConfig();

  const handleSelect = (section: NavSection) => {
    onNavigate(section);
    onCloseMobile();
  };

  const displayName = profile?.displayName || user?.displayName || 'Student';

  const activeModuleItems = [...config.modules]
    .filter((m) => m.enabled)
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      id: m.id as NavSection,
      label: m.name,
      icon: MODULE_ICONS[m.id] || Sparkles,
      badge: m.badge,
    }));

  const navItems: Array<{
    id: NavSection;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...activeModuleItems,
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Drawer backdrop */}
      {mobileOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar drawer */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {config.branding.siteName}
              </h2>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">
                {config.branding.siteSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Workspace
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

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
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom workspace */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                Local Workspace
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
              {displayName} · Free Access
            </p>
          </div>


        </div>
      </aside>
    </>
  );
}
