import { useState, useEffect, FormEvent } from 'react';
import {
  ShieldCheck,
  LogOut,
  ExternalLink,
  Save,
  RotateCcw,
  Megaphone,
  LayoutGrid,
  Link2,
  Sliders,
  Activity,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  KeyRound,
  Edit3,
} from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext.tsx';
import {
  NavSection,
  SiteConfig,
  SiteAnnouncement,
  AnnouncementSeverity,
  FeaturedResourceLink,
  DashboardModuleConfig,
} from '../../types/index.ts';

interface AdminPanelViewProps {
  onNavigate: (section: NavSection) => void;
}

type AdminTab =
  | 'overview'
  | 'dashboard'
  | 'modules'
  | 'announcements'
  | 'resources'
  | 'branding';

const TARGET_SECTION_OPTIONS: Array<{ value: NavSection; label: string }> = [
  { value: 'ai-study', label: 'AI Study Assistant' },
  { value: 'study-tools', label: 'Study Planner' },
  { value: 'writing-tools', label: 'Writing Tools' },
  { value: 'image-tools', label: 'Image Tools' },
  { value: 'calculators', label: 'Calculators' },
  { value: 'settings', label: 'Settings' },
];

export function AdminPanelView({ onNavigate }: AdminPanelViewProps) {
  const {
    config,
    adminSession,
    adminLogs,
    logoutAdmin,
    saveConfig,
    resetConfig,
    changeAdminPassword,
  } = useSiteConfig();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [draft, setDraft] = useState<SiteConfig>(() => structuredClone(config));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Announcement form state
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annSeverity, setAnnSeverity] = useState<AnnouncementSeverity>('info');
  const [annLinkLabel, setAnnLinkLabel] = useState('');
  const [annLinkUrl, setAnnLinkUrl] = useState('');
  const [annActive, setAnnActive] = useState(true);

  // Resource link form state
  const [editingResId, setEditingResId] = useState<string | null>(null);
  const [resTitle, setResTitle] = useState('');
  const [resCategory, setResCategory] = useState('Academic');
  const [resUrl, setResUrl] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resActive, setResActive] = useState(true);

  // Password form state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPwFields, setShowPwFields] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Sync draft when live config updates externally if no unsaved edits exist
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setDraft(structuredClone(config));
    }
  }, [config, hasUnsavedChanges]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  const publishConfig = async (
    nextConfig: SiteConfig,
    summary: string,
    section: string
  ) => {
    setSaving(true);
    try {
      await saveConfig(nextConfig, summary, section);
      setDraft(structuredClone(nextConfig));
      setHasUnsavedChanges(false);
      showToast('success', `${summary} — Live on Dashboard.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to publish changes.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishDraft = async (summary: string, section: string) => {
    await publishConfig(draft, summary, section);
  };

  const handleDiscardDraft = () => {
    setDraft(structuredClone(config));
    setHasUnsavedChanges(false);
    showToast('success', 'Reverted unsaved edits to currently published configuration.');
  };

  const handleConfirmReset = async () => {
    setSaving(true);
    try {
      await resetConfig();
      setHasUnsavedChanges(false);
      setConfirmResetOpen(false);
      showToast('success', 'All site settings reset to default configuration.');
    } catch (err: any) {
      showToast('error', err?.message || 'Could not reset configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Module helpers (publish immediately on toggle/reorder, or allow editing text & saving)
  const updateModuleField = (
    moduleId: DashboardModuleConfig['id'],
    patch: Partial<DashboardModuleConfig>
  ) => {
    setDraft((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === moduleId ? { ...m, ...patch } : m)),
    }));
    setHasUnsavedChanges(true);
  };

  const toggleModuleLive = async (moduleId: DashboardModuleConfig['id']) => {
    const target = draft.modules.find((m) => m.id === moduleId);
    if (!target) return;
    const nextEnabled = !target.enabled;
    const nextConfig: SiteConfig = {
      ...draft,
      modules: draft.modules.map((m) =>
        m.id === moduleId ? { ...m, enabled: nextEnabled } : m
      ),
    };
    await publishConfig(
      nextConfig,
      `${nextEnabled ? 'Enabled' : 'Disabled'} module "${target.name}"`,
      'Modules'
    );
  };

  const moveModuleLive = async (index: number, direction: -1 | 1) => {
    const sorted = [...draft.modules].sort((a, b) => a.order - b.order);
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const [moved] = sorted.splice(index, 1);
    sorted.splice(targetIdx, 0, moved);
    const reordered = sorted.map((m, idx) => ({ ...m, order: idx }));
    await publishConfig(
      { ...draft, modules: reordered },
      `Reordered module "${moved.name}"`,
      'Modules'
    );
  };

  // Announcement CRUD (publishes immediately to live Dashboard)
  const resetAnnouncementForm = () => {
    setEditingAnnId(null);
    setAnnTitle('');
    setAnnMessage('');
    setAnnSeverity('info');
    setAnnLinkLabel('');
    setAnnLinkUrl('');
    setAnnActive(true);
  };

  const handleSaveAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) {
      showToast('error', 'Announcement title and message are required.');
      return;
    }

    let nextAnnouncements: SiteAnnouncement[];
    let actionSummary: string;

    if (editingAnnId) {
      nextAnnouncements = draft.announcements.map((a) =>
        a.id === editingAnnId
          ? {
              ...a,
              title: annTitle.trim(),
              message: annMessage.trim(),
              severity: annSeverity,
              linkLabel: annLinkLabel.trim() || undefined,
              linkUrl: annLinkUrl.trim() || undefined,
              active: annActive,
            }
          : a
      );
      actionSummary = `Updated announcement "${annTitle.trim()}"`;
    } else {
      const created: SiteAnnouncement = {
        id: `ann_${Date.now()}`,
        title: annTitle.trim(),
        message: annMessage.trim(),
        severity: annSeverity,
        linkLabel: annLinkLabel.trim() || undefined,
        linkUrl: annLinkUrl.trim() || undefined,
        active: annActive,
        createdAt: new Date().toISOString(),
      };
      nextAnnouncements = [created, ...draft.announcements];
      actionSummary = `Published announcement "${created.title}"`;
    }

    await publishConfig(
      { ...draft, announcements: nextAnnouncements },
      actionSummary,
      'Announcements'
    );
    resetAnnouncementForm();
  };

  const handleToggleAnnouncement = async (id: string) => {
    const target = draft.announcements.find((a) => a.id === id);
    if (!target) return;
    const nextAnnouncements = draft.announcements.map((a) =>
      a.id === id ? { ...a, active: !a.active } : a
    );
    await publishConfig(
      { ...draft, announcements: nextAnnouncements },
      `${!target.active ? 'Activated' : 'Paused'} announcement "${target.title}"`,
      'Announcements'
    );
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const target = draft.announcements.find((a) => a.id === id);
    const nextAnnouncements = draft.announcements.filter((a) => a.id !== id);
    await publishConfig(
      { ...draft, announcements: nextAnnouncements },
      `Deleted announcement "${target?.title || 'Notice'}"`,
      'Announcements'
    );
    if (editingAnnId === id) resetAnnouncementForm();
  };

  // Resource CRUD (publishes immediately to live Dashboard)
  const resetResourceForm = () => {
    setEditingResId(null);
    setResTitle('');
    setResCategory('Academic');
    setResUrl('');
    setResDesc('');
    setResActive(true);
  };

  const handleSaveResource = async (e: FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim()) {
      showToast('error', 'Resource title and URL are required.');
      return;
    }

    const normalizedUrl =
      resUrl.trim().startsWith('http://') || resUrl.trim().startsWith('https://')
        ? resUrl.trim()
        : `https://${resUrl.trim()}`;

    let nextResources: FeaturedResourceLink[];
    let actionSummary: string;

    if (editingResId) {
      nextResources = draft.resources.map((r) =>
        r.id === editingResId
          ? {
              ...r,
              title: resTitle.trim(),
              category: resCategory.trim() || 'Academic',
              url: normalizedUrl,
              description: resDesc.trim(),
              active: resActive,
            }
          : r
      );
      actionSummary = `Updated resource "${resTitle.trim()}"`;
    } else {
      const created: FeaturedResourceLink = {
        id: `res_${Date.now()}`,
        title: resTitle.trim(),
        category: resCategory.trim() || 'Academic',
        url: normalizedUrl,
        description: resDesc.trim(),
        active: resActive,
        createdAt: new Date().toISOString(),
      };
      nextResources = [created, ...draft.resources];
      actionSummary = `Added resource "${created.title}"`;
    }

    await publishConfig(
      { ...draft, resources: nextResources },
      actionSummary,
      'Resources'
    );
    resetResourceForm();
  };

  const handleToggleResource = async (id: string) => {
    const target = draft.resources.find((r) => r.id === id);
    if (!target) return;
    const nextResources = draft.resources.map((r) =>
      r.id === id ? { ...r, active: !r.active } : r
    );
    await publishConfig(
      { ...draft, resources: nextResources },
      `${!target.active ? 'Published' : 'Hidden'} resource "${target.title}"`,
      'Resources'
    );
  };

  const handleDeleteResource = async (id: string) => {
    const target = draft.resources.find((r) => r.id === id);
    const nextResources = draft.resources.filter((r) => r.id !== id);
    await publishConfig(
      { ...draft, resources: nextResources },
      `Deleted resource "${target?.title || 'Link'}"`,
      'Resources'
    );
    if (editingResId === id) resetResourceForm();
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      showToast('error', 'New password and confirmation do not match.');
      return;
    }
    setPwSaving(true);
    try {
      await changeAdminPassword(currentPw, newPw);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      showToast('success', 'Administrator password updated successfully.');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update password.');
    } finally {
      setPwSaving(false);
    }
  };

  const sortedModules = [...draft.modules].sort((a, b) => a.order - b.order);
  const activeModulesCount = config.modules.filter((m) => m.enabled).length;
  const activeAnnouncementsCount = config.announcements.filter((a) => a.active).length;
  const activeResourcesCount = config.resources.filter((r) => r.active).length;

  const formattedUpdated = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(config.updatedAt));

  const tabs: Array<{ id: AdminTab; label: string; icon: typeof Activity }> = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'dashboard', label: 'Dashboard Hero', icon: Sliders },
    { id: 'modules', label: 'Modules', icon: LayoutGrid },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'resources', label: 'Resources', icon: Link2 },
    { id: 'branding', label: 'Site & Security', icon: ShieldCheck },
  ];

  return (
    <div id="admin-panel-view" className="space-y-6 pb-12">
      {/* Top Console Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mb-1">
              <span className="break-all">{adminSession?.email || 'Administrator'}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Last published {formattedUpdated}</span>
              {hasUnsavedChanges && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    Unsaved draft changes
                  </span>
                </>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Admin Control Console
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                disabled={saving}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Discard
              </button>
            )}

            <button
              id="admin-publish-btn"
              type="button"
              onClick={() => handlePublishDraft('Published dashboard and site updates', 'Dashboard')}
              disabled={saving || !hasUnsavedChanges}
              className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Publishing...' : 'Publish Changes'}</span>
            </button>

            <button
              id="admin-view-dashboard-btn"
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/70 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Live Dashboard</span>
            </button>

            <button
              id="admin-logout-btn"
              type="button"
              onClick={logoutAdmin}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Toast Feedback */}
        {toast && (
          <div
            role="status"
            className={`mt-4 px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Active Modules
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {activeModulesCount} / {config.modules.length}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Visible in Dashboard &amp; Sidebar
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Live Announcements
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {activeAnnouncementsCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {config.announcements.length} total notices stored
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Featured Resources
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {activeResourcesCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {config.resources.length} total links stored
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Site Availability
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {config.maintenance.enabled ? 'Maintenance' : 'Live'}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {config.maintenance.enabled ? 'Public workspace paused' : 'Publicly accessible'}
              </p>
            </div>
          </div>

          {/* Quick Jump Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Quick Management Actions
            </h2>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Edit Dashboard Hero
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Post Announcement
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('modules')}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Toggle or Reorder Modules
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('resources')}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Add Student Link
              </button>
            </div>
          </div>

          {/* Real Change History Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Change Log
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {adminLogs.length} entries
              </span>
            </div>

            {adminLogs.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  No administrative changes recorded yet. Updates you publish will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile stacked log cards */}
                <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {adminLogs.slice(0, 15).map((log) => (
                    <div key={log.id} className="p-4 space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {log.section}
                        </span>
                        <span className="tabular-nums">
                          {new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(log.timestamp))}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {log.summary}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {log.adminEmail}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-5">Time</th>
                        <th className="py-3 px-4">Section</th>
                        <th className="py-3 px-4">Change Summary</th>
                        <th className="py-3 px-5 text-right">Administrator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {adminLogs.slice(0, 15).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-5 text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                            {new Intl.DateTimeFormat('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(new Date(log.timestamp))}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {log.section}
                          </td>
                          <td className="py-3 px-4 text-slate-900 dark:text-slate-100">
                            {log.summary}
                          </td>
                          <td className="py-3 px-5 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {log.adminEmail}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DASHBOARD HERO & SECTION VISIBILITY */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Dashboard Hero &amp; Layout
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Changes published here update the live StudentHub Dashboard automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handlePublishDraft('Updated Dashboard Hero content and visibility', 'Dashboard Hero')}
                disabled={saving}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save & Publish'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Welcome Label
                </label>
                <input
                  type="text"
                  value={draft.branding.welcomeBadge}
                  onChange={(e) => {
                    setDraft((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, welcomeBadge: e.target.value },
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status Text
                </label>
                <input
                  type="text"
                  value={draft.branding.workspaceStatusLabel}
                  onChange={(e) => {
                    setDraft((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, workspaceStatusLabel: e.target.value },
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hero Headline
              </label>
              <input
                type="text"
                value={draft.branding.heroTitle}
                onChange={(e) => {
                  setDraft((prev) => ({
                    ...prev,
                    branding: { ...prev.branding, heroTitle: e.target.value },
                  }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hero Subtitle
              </label>
              <input
                type="text"
                value={draft.branding.heroSubtitle}
                onChange={(e) => {
                  setDraft((prev) => ({
                    ...prev,
                    branding: { ...prev.branding, heroSubtitle: e.target.value },
                  }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hero Description
              </label>
              <textarea
                rows={3}
                value={draft.branding.heroDescription}
                onChange={(e) => {
                  setDraft((prev) => ({
                    ...prev,
                    branding: { ...prev.branding, heroDescription: e.target.value },
                  }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Button Label
                </label>
                <input
                  type="text"
                  value={draft.branding.primaryCtaLabel}
                  onChange={(e) => {
                    setDraft((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, primaryCtaLabel: e.target.value },
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Button Target
                </label>
                <select
                  value={draft.branding.primaryCtaTarget}
                  onChange={(e) => {
                    setDraft((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, primaryCtaTarget: e.target.value as NavSection },
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                >
                  {TARGET_SECTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Secondary Button Label
                </label>
                <input
                  type="text"
                  value={draft.branding.secondaryCtaLabel}
                  onChange={(e) => {
                    setDraft((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, secondaryCtaLabel: e.target.value },
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Secondary Button Target
                </label>
                <select
                  value={draft.branding.secondaryCtaTarget}
                  onChange={(e) => {
                    setDraft((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, secondaryCtaTarget: e.target.value as NavSection },
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                >
                  {TARGET_SECTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section Visibility Switches */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
                Dashboard Section Visibility
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    ['showWelcomeCard', 'Welcome Hero Banner'],
                    ['showAnnouncements', 'Announcements Notice Board'],
                    ['showQuickTools', 'Quick Tools Grid'],
                    ['showFeaturedResources', 'Featured Student Resources'],
                    ['showWorkspaceWidgets', 'AI & Notes Workspace'],
                    ['showWorkspaceInfo', 'Workspace Info Footer'],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  >
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {label}
                    </span>
                    <input
                      type="checkbox"
                      checked={draft.sections[key]}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setDraft((prev) => ({
                          ...prev,
                          sections: { ...prev.sections, [key]: checked },
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live Hero Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Hero Preview
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {draft.sections.showWelcomeCard ? 'Visible on Dashboard' : 'Hidden'}
                </span>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-5">
                {draft.branding.welcomeBadge && (
                  <p className="text-[11px] font-medium text-indigo-200 mb-2">
                    {draft.branding.welcomeBadge}
                  </p>
                )}
                <h3 className="text-lg font-bold tracking-tight">
                  {draft.branding.heroTitle || 'Welcome to StudentHub'}
                </h3>
                <p className="mt-1 text-xs font-medium text-indigo-100/90">
                  {draft.branding.heroSubtitle}
                </p>
                <p className="mt-2 text-[11px] text-indigo-200/80 leading-relaxed">
                  {draft.branding.heroDescription}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-white text-indigo-950 text-[11px] font-bold">
                    {draft.branding.primaryCtaLabel || 'Primary'}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-indigo-800/70 text-white text-[11px] font-semibold">
                    {draft.branding.secondaryCtaLabel || 'Secondary'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODULES & NAVIGATION */}
      {activeTab === 'modules' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Modules &amp; Sidebar Navigation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toggle visibility, change display order, or customize titles and descriptions shown across Dashboard &amp; Sidebar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handlePublishDraft('Updated module titles and descriptions', 'Modules')}
              disabled={saving || !hasUnsavedChanges}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-xs font-semibold whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Text Edits'}
            </button>
          </div>

          <div className="space-y-3">
            {sortedModules.map((mod, idx) => (
              <div
                key={mod.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      0{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {mod.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Route: /{mod.id} · Status: {mod.enabled ? 'Active' : 'Hidden'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveModuleLive(idx, -1)}
                      disabled={idx === 0 || saving}
                      aria-label={`Move ${mod.name} up`}
                      className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveModuleLive(idx, 1)}
                      disabled={idx === sortedModules.length - 1 || saving}
                      aria-label={`Move ${mod.name} down`}
                      className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleModuleLive(mod.id)}
                      disabled={saving}
                      className={`min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        mod.enabled
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {mod.enabled ? 'Enabled' : 'Hidden'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Display Title
                    </label>
                    <input
                      type="text"
                      value={mod.name}
                      onChange={(e) => updateModuleField(mod.id, { name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={mod.badge}
                      onChange={(e) => updateModuleField(mod.id, { badge: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={mod.description}
                      onChange={(e) => updateModuleField(mod.id, { description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveAnnouncement}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingAnnId ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active announcements automatically appear at the top of the StudentHub Dashboard.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="e.g. Fall Exam Timetable Updated"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Message
              </label>
              <textarea
                rows={3}
                value={annMessage}
                onChange={(e) => setAnnMessage(e.target.value)}
                placeholder="Write a clear message for students..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={annSeverity}
                  onChange={(e) => setAnnSeverity(e.target.value as AnnouncementSeverity)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                >
                  <option value="info">Information</option>
                  <option value="success">Update / Live</option>
                  <option value="warning">Important Alert</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>Publish Active</span>
                  <input
                    type="checkbox"
                    checked={annActive}
                    onChange={(e) => setAnnActive(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Label (Optional)
                </label>
                <input
                  type="text"
                  value={annLinkLabel}
                  onChange={(e) => setAnnLinkLabel(e.target.value)}
                  placeholder="Open Link"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link URL (Optional)
                </label>
                <input
                  type="text"
                  value={annLinkUrl}
                  onChange={(e) => setAnnLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingAnnId ? 'Update & Publish' : 'Publish Announcement'}</span>
              </button>
              {editingAnnId && (
                <button
                  type="button"
                  onClick={resetAnnouncementForm}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Published &amp; Saved Announcements
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {draft.announcements.length} total
              </span>
            </div>

            {draft.announcements.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Megaphone className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No announcements created yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Use the form to publish a live notice onto the StudentHub Dashboard.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {draft.announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        {ann.severity === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        ) : ann.severity === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span className="capitalize">{ann.severity}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ann.active ? 'Live on Dashboard' : 'Paused'}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {ann.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {ann.message}
                      </p>
                      {ann.linkUrl && (
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate">
                          Link: {ann.linkLabel || ann.linkUrl} ({ann.linkUrl})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleAnnouncement(ann.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          ann.active
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {ann.active ? 'Active' : 'Paused'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAnnId(ann.id);
                          setAnnTitle(ann.title);
                          setAnnMessage(ann.message);
                          setAnnSeverity(ann.severity);
                          setAnnLinkLabel(ann.linkLabel || '');
                          setAnnLinkUrl(ann.linkUrl || '');
                          setAnnActive(ann.active);
                        }}
                        aria-label="Edit announcement"
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        aria-label="Delete announcement"
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: FEATURED RESOURCES */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveResource}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingResId ? 'Edit Resource Link' : 'Add Featured Resource'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Publish helpful links (Past Papers, Syllabus, Exam Portal, Community) directly onto the Dashboard.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Resource Title
              </label>
              <input
                type="text"
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                placeholder="e.g. University Past Papers Archive"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={resCategory}
                  onChange={(e) => setResCategory(e.target.value)}
                  placeholder="Academic"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <label className="w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>Visible</span>
                  <input
                    type="checkbox"
                    checked={resActive}
                    onChange={(e) => setResActive(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination URL
              </label>
              <input
                type="text"
                value={resUrl}
                onChange={(e) => setResUrl(e.target.value)}
                placeholder="https://example.edu/resources"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={resDesc}
                onChange={(e) => setResDesc(e.target.value)}
                placeholder="Brief summary of what students will find at this link..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingResId ? 'Update Resource' : 'Publish Resource'}</span>
              </button>
              {editingResId && (
                <button
                  type="button"
                  onClick={resetResourceForm}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Student Resource Links
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {draft.resources.length} total
              </span>
            </div>

            {draft.resources.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Link2 className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No featured resources added yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add curated study links on the left to show them on the Dashboard.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {draft.resources.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{res.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{res.active ? 'Visible on Dashboard' : 'Hidden'}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {res.title}
                      </h3>
                      {res.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {res.description}
                        </p>
                      )}
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate">
                        {res.url}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleResource(res.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          res.active
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {res.active ? 'Visible' : 'Hidden'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingResId(res.id);
                          setResTitle(res.title);
                          setResCategory(res.category);
                          setResUrl(res.url);
                          setResDesc(res.description);
                          setResActive(res.active);
                        }}
                        aria-label="Edit resource"
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteResource(res.id)}
                        aria-label="Delete resource"
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: BRANDING, MAINTENANCE & SECURITY */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Branding & Maintenance */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Branding &amp; Maintenance
              </h2>
              <button
                type="button"
                onClick={() => handlePublishDraft('Updated site branding & maintenance settings', 'Branding')}
                disabled={saving}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold whitespace-nowrap self-start sm:self-auto cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save & Publish'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  value={draft.branding.siteName}
                  onChange={(e) => {
                    setDraft((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, siteName: e.target.value },
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sidebar Subtitle
                </label>
                <input
                  type="text"
                  value={draft.branding.siteSubtitle}
                  onChange={(e) => {
                    setDraft((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, siteSubtitle: e.target.value },
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Header Label
                </label>
                <input
                  type="text"
                  value={draft.branding.headerBadge}
                  onChange={(e) => {
                    setDraft((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, headerBadge: e.target.value },
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Maintenance Mode
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Temporarily pause public workspace access while keeping Admin Console open.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={draft.maintenance.enabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setDraft((prev) => ({
                      ...prev,
                      maintenance: { ...prev.maintenance, enabled },
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
                />
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Maintenance Title
                </label>
                <input
                  type="text"
                  value={draft.maintenance.title}
                  onChange={(e) => {
                    setDraft((prev) => ({
                      ...prev,
                      maintenance: { ...prev.maintenance, title: e.target.value },
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Maintenance Notice Message
                </label>
                <textarea
                  rows={2}
                  value={draft.maintenance.message}
                  onChange={(e) => {
                    setDraft((prev) => ({
                      ...prev,
                      maintenance: { ...prev.maintenance, message: e.target.value },
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Factory Reset
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Restore original Dashboard text, modules, and clear notices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 whitespace-nowrap self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Administrator Security */}
          <form
            onSubmit={handleChangePassword}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Administrator Security
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Signed in as {adminSession?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPwFields((p) => !p)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shrink-0 cursor-pointer"
              >
                {showPwFields ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPwFields ? 'Hide' : 'Show'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type={showPwFields ? 'text' : 'password'}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password (min 6 characters)
              </label>
              <input
                type={showPwFields ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                minLength={6}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type={showPwFields ? 'text' : 'password'}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                minLength={6}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={pwSaving}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{pwSaving ? 'Updating...' : 'Update Admin Password'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Confirmation Modal for Factory Reset */}
      {confirmResetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reset Site Configuration?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This will restore the default Dashboard headlines, enable all 5 modules, and remove published announcements and resource links.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
              >
                {saving ? 'Resetting...' : 'Yes, Reset Defaults'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
