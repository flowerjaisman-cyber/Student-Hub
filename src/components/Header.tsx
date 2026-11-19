import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSiteConfig } from '../context/SiteConfigContext.tsx';
import {
  Menu,
  Sparkles,
  Settings as SettingsIcon,
  Calendar,
} from 'lucide-react';
import { NavSection } from '../types/index.ts';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
}

export function Header({
  onToggleMobileMenu,
  currentSection,
  onNavigate,
}: HeaderProps) {
  const { user, profile } = useAuth();
  const { config } = useSiteConfig();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = profile?.displayName || user?.displayName || 'Student';
  const email = profile?.email || user?.email || '';
  const photoURL = profile?.photoURL || user?.photoURL;

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200"
    >
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Brand title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="mobile-menu-btn"
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Toggle Navigation Menu"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left cursor-pointer min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-600/30 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight whitespace-nowrap truncate">
                {config.branding.siteName}
              </span>
              {config.branding.headerBadge && (
                <span className="hidden sm:inline text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  · {config.branding.headerBadge}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Center / Date display */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="whitespace-nowrap">{todayFormatted}</span>
        </div>

        {/* Right: Account menu */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              id="account-profile-menu-btn"
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label="User Account Menu"
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center shadow-xs">
                  {getInitials(displayName)}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {displayName}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight max-w-[130px] truncate">
                  {email}
                </span>
              </div>
            </button>

            {/* Account Menu Popover */}
            {menuOpen && (
              <div
                id="account-dropdown-menu"
                className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50"
              >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    {photoURL ? (
                      <img
                        src={photoURL}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center">
                        {getInitials(displayName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 text-[11px] flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                    <span className="font-medium">
                      Workspace: <span className="font-semibold">Free &amp; Active</span>
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('settings');
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Preferences &amp; Settings</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
