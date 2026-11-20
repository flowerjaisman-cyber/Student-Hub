import {
  SiteConfig,
  AdminChangeLogEntry,
  DashboardModuleConfig,
} from '../types/index.ts';

export const SITE_CONFIG_STORAGE_KEY = 'studenthub_site_config_v1';
export const ADMIN_SESSION_STORAGE_KEY = 'studenthub_admin_session_v1';
export const ADMIN_LOGS_STORAGE_KEY = 'studenthub_admin_logs_v1';
export const SITE_CONFIG_CHANNEL = 'studenthub_site_config_channel';

// Supabase publishable credentials are safe to include in a browser client.
const SUPABASE_URL = 'https://yssoddwbmqthhaqfvsku.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ksL4bmddl0wPEEvE0vBNuQ_KUst0UiH';

export const DEFAULT_MODULES: DashboardModuleConfig[] = [
  {
    id: 'ai-study',
    name: 'AI Study Assistant',
    description: 'Understand, summarize, organize, and improve your study material.',
    badge: 'Live',
    enabled: true,
    order: 0,
  },
  {
    id: 'study-tools',
    name: 'Study Planner & Productivity',
    description:
      'Tasks, assignments, exams, timetable, study sessions stopwatch, goals, habits streak tracker, and Pomodoro timer.',
    badge: 'Planner',
    enabled: true,
    order: 1,
  },
  {
    id: 'writing-tools',
    name: 'Writing & Academic Tools',
    description:
      'Text cleaner, case converter, duplicate remover, citation generator (APA/MLA/Chicago/Harvard), text compare diff, and readability analysis.',
    badge: 'Academic',
    enabled: true,
    order: 2,
  },
  {
    id: 'image-tools',
    name: 'Image Tools (Standard & Advanced)',
    description:
      'Background removal, passport photos, DPI calculator, metadata, image-to-PDF, watermark, convert, and crop.',
    badge: 'Utilities',
    enabled: true,
    order: 3,
  },
  {
    id: 'calculators',
    name: 'Calculators & Converters',
    description:
      'GPA projections, academic marks, scientific math, date & live exam countdowns, unit & financial converters.',
    badge: 'Tools',
    enabled: true,
    order: 4,
  },
];

export function getDefaultSiteConfig(): SiteConfig {
  return {
    branding: {
      siteName: 'StudentHub',
      siteSubtitle: 'Student Utilities',
      headerBadge: 'Workspace',
      welcomeBadge: 'Unified Academic Workspace',
      heroTitle: 'Welcome to StudentHub',
      heroSubtitle: 'Everything a Student Needs — In One Place.',
      heroDescription:
        'Your single unified station for student tools. Writing & Academic Tools, Study Planner, Calculators, AI Study Assistant, and Image Tools are active with zero fake data, 100% private client processing, and local workspace persistence.',
      primaryCtaLabel: 'Launch Writing Tools',
      primaryCtaTarget: 'writing-tools',
      secondaryCtaLabel: 'Image Tools',
      secondaryCtaTarget: 'image-tools',
      workspaceStatusLabel: 'Free Local Workspace Active',
    },
    sections: {
      showWelcomeCard: true,
      showAnnouncements: true,
      showQuickTools: true,
      showFeaturedResources: true,
      showWorkspaceWidgets: true,
      showWorkspaceInfo: true,
    },
    maintenance: {
      enabled: false,
      title: 'Scheduled Maintenance',
      message:
        'StudentHub is currently undergoing scheduled maintenance. Please check back shortly.',
    },
    announcements: [],
    modules: DEFAULT_MODULES.map((m) => ({ ...m })),
    resources: [],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeSiteConfig(raw: Partial<SiteConfig> | null | undefined): SiteConfig {
  const defaults = getDefaultSiteConfig();
  if (!raw || typeof raw !== 'object') return defaults;

  const mergedModules = Array.isArray(raw.modules) && raw.modules.length > 0
    ? raw.modules
        .filter((m) => m && typeof m.id === 'string')
        .map((m, idx) => {
          const fallback = DEFAULT_MODULES.find((d) => d.id === m.id);
          return {
            id: m.id,
            name: m.name ?? fallback?.name ?? m.id,
            description: m.description ?? fallback?.description ?? '',
            badge: m.badge ?? fallback?.badge ?? '',
            enabled: typeof m.enabled === 'boolean' ? m.enabled : true,
            order: typeof m.order === 'number' ? m.order : idx,
          };
        })
        .sort((a, b) => a.order - b.order)
    : defaults.modules;

  // Ensure any default module missing from custom array is appended cleanly
  DEFAULT_MODULES.forEach((defMod) => {
    if (!mergedModules.some((m) => m.id === defMod.id)) {
      mergedModules.push({ ...defMod, order: mergedModules.length });
    }
  });

  return {
    branding: { ...defaults.branding, ...(raw.branding || {}) },
    sections: { ...defaults.sections, ...(raw.sections || {}) },
    maintenance: { ...defaults.maintenance, ...(raw.maintenance || {}) },
    announcements: Array.isArray(raw.announcements) ? raw.announcements : [],
    modules: mergedModules,
    resources: Array.isArray(raw.resources) ? raw.resources : [],
    updatedAt: raw.updatedAt || defaults.updatedAt,
  };
}

export function readCachedSiteConfig(): SiteConfig {
  if (typeof window === 'undefined') return getDefaultSiteConfig();
  try {
    const raw = localStorage.getItem(SITE_CONFIG_STORAGE_KEY);
    if (!raw) return getDefaultSiteConfig();
    return normalizeSiteConfig(JSON.parse(raw));
  } catch {
    return getDefaultSiteConfig();
  }
}

export function writeCachedSiteConfig(config: SiteConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SITE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(SITE_CONFIG_CHANNEL);
      ch.postMessage({ type: 'CONFIG_UPDATED', config });
      ch.close();
    }
  } catch (err) {
    console.warn('Could not persist site config cache:', err);
  }
}

export interface AdminSession {
  token: string;
  email: string;
  expiresAt: string;
  mode: 'server' | 'supabase';
  refreshToken?: string;
}

export function readStoredAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.token || !parsed?.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function storeAdminSession(session: AdminSession | null): void {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  } else {
    localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
  }
}

async function supabaseRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('apikey', SUPABASE_PUBLISHABLE_KEY);
  headers.set('Content-Type', 'application/json');
  return fetch(`${SUPABASE_URL}${path}`, { ...init, headers });
}

async function getSupabaseUser(accessToken: string): Promise<any | null> {
  const response = await supabaseRequest('/auth/v1/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  return response.json();
}

function isAdminUser(user: any): boolean {
  return user?.app_metadata?.role === 'admin';
}

export async function fetchLiveSiteConfig(): Promise<SiteConfig> {
  try {
    const res = await fetch('/api/site-config', { cache: 'no-store' });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        const normalized = normalizeSiteConfig(data);
        localStorage.setItem(SITE_CONFIG_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    }
  } catch {
    // Fallback to cached localStorage config when running offline or statically
  }
  return readCachedSiteConfig();
}

export async function verifyAdminSessionRequest(
  session: AdminSession
): Promise<boolean> {
  if (session.mode === 'server') {
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      storeAdminSession(null);
      return false;
    }
    try {
      const res = await fetch('/api/admin/session', {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  if (session.mode !== 'supabase') {
    storeAdminSession(null);
    return false;
  }

  try {
    let activeSession = session;
    let user = await getSupabaseUser(activeSession.token);

    if (!user && activeSession.refreshToken) {
      const refreshed = await supabaseRequest('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: activeSession.refreshToken }),
      });
      if (!refreshed.ok) {
        storeAdminSession(null);
        return false;
      }
      const data = await refreshed.json();
      user = data.user;
      activeSession = {
        ...activeSession,
        token: data.access_token,
        refreshToken: data.refresh_token || activeSession.refreshToken,
        email: data.user?.email || activeSession.email,
        expiresAt: new Date(Date.now() + (Number(data.expires_in) || 3600) * 1000).toISOString(),
      };
      storeAdminSession(activeSession);
    }

    if (!isAdminUser(user)) {
      storeAdminSession(null);
      return false;
    }
    return true;
  } catch {
    // Fail closed if the auth server cannot verify the stored administrator session.
    return false;
  }
}

function appendLocalAdminLog(entry: AdminChangeLogEntry): AdminChangeLogEntry[] {
  const existing = readLocalAdminLogs();
  const next = [entry, ...existing].slice(0, 50);
  try {
    localStorage.setItem(ADMIN_LOGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
  return next;
}

export function readLocalAdminLogs(): AdminChangeLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ADMIN_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function fetchAdminLogsRequest(
  session: AdminSession
): Promise<AdminChangeLogEntry[]> {
  if (session.mode === 'server') {
    try {
      const res = await fetch('/api/admin/logs', {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          localStorage.setItem(ADMIN_LOGS_STORAGE_KEY, JSON.stringify(data.logs));
          return data.logs;
        }
      }
    } catch {
      // fallback to local logs
    }
  }
  return readLocalAdminLogs();
}

export async function saveAdminSiteConfigRequest(
  session: AdminSession,
  config: SiteConfig,
  summary: string,
  section: string
): Promise<{ config: SiteConfig; logs: AdminChangeLogEntry[] }> {
  const stampedConfig: SiteConfig = {
    ...normalizeSiteConfig(config),
    updatedAt: new Date().toISOString(),
  };

  if (session.mode === 'server') {
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ config: stampedConfig, summary, section }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save configuration.');
      }
      const normalized = normalizeSiteConfig(data.config);
      writeCachedSiteConfig(normalized);
      const logs = Array.isArray(data.logs) ? data.logs : readLocalAdminLogs();
      localStorage.setItem(ADMIN_LOGS_STORAGE_KEY, JSON.stringify(logs));
      return { config: normalized, logs };
    }
  }

  writeCachedSiteConfig(stampedConfig);
  const logs = appendLocalAdminLog({
    id: `log_${Date.now()}`,
    summary,
    section,
    timestamp: new Date().toISOString(),
    adminEmail: session.email,
  });
  return { config: stampedConfig, logs };
}

export async function resetAdminSiteConfigRequest(
  session: AdminSession
): Promise<{ config: SiteConfig; logs: AdminChangeLogEntry[] }> {
  if (session.mode === 'server') {
    const res = await fetch('/api/admin/config/reset', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset configuration.');
      }
      const normalized = normalizeSiteConfig(data.config);
      writeCachedSiteConfig(normalized);
      const logs = Array.isArray(data.logs) ? data.logs : readLocalAdminLogs();
      localStorage.setItem(ADMIN_LOGS_STORAGE_KEY, JSON.stringify(logs));
      return { config: normalized, logs };
    }
  }

  const defaults = getDefaultSiteConfig();
  writeCachedSiteConfig(defaults);
  const logs = appendLocalAdminLog({
    id: `log_${Date.now()}`,
    summary: 'Reset site configuration to defaults',
    section: 'System',
    timestamp: new Date().toISOString(),
    adminEmail: session.email,
  });
  return { config: defaults, logs };
}

export async function changeAdminPasswordRequest(
  session: AdminSession,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters.');
  }

  if (session.mode === 'supabase') {
    const reauthenticated = await supabaseRequest('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: session.email, password: currentPassword }),
    });
    if (!reauthenticated.ok) {
      throw new Error('Current password is incorrect.');
    }

    const response = await supabaseRequest('/auth/v1/user', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ password: newPassword }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.msg || data.message || 'Could not update Supabase password.');
    }
    return;
  }

  if (session.mode === 'server') {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not update admin password.');
    return;
  }

  throw new Error('Unsupported administrator authentication method.');
}
