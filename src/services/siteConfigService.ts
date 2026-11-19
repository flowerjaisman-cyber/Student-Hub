import {
  SiteConfig,
  AdminChangeLogEntry,
  DashboardModuleConfig,
} from '../types/index.ts';

export const SITE_CONFIG_STORAGE_KEY = 'studenthub_site_config_v1';
export const ADMIN_SESSION_STORAGE_KEY = 'studenthub_admin_session_v1';
export const ADMIN_LOGS_STORAGE_KEY = 'studenthub_admin_logs_v1';
export const ADMIN_CUSTOM_PASS_HASH_KEY = 'studenthub_admin_pass_hash_v1';
export const SITE_CONFIG_CHANNEL = 'studenthub_site_config_channel';

// SHA-256 digests used strictly when running without a Node backend (e.g. static CDN fallback)
const DEFAULT_ADMIN_EMAIL_SHA256 =
  '7a644e06316a1a31356b74ea42df2c7a8b1227f0914f62ad49d838324ef1b5a8';
const DEFAULT_ADMIN_PASS_SHA256 =
  '60d8973013541a9f102b7dd00142153941c7f989c2fb210d230b4a3fadf9d16f';

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
  mode: 'server' | 'local';
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

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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

export async function adminLoginRequest(
  email: string,
  password: string
): Promise<AdminSession> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid username or password.');
      }
      const session: AdminSession = {
        token: data.token,
        email: data.admin?.email || cleanEmail,
        expiresAt: data.expiresAt,
        mode: 'server',
      };
      storeAdminSession(session);
      return session;
    }
  } catch (err: any) {
    // Re-throw explicit authentication errors from server
    if (err?.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
  }

  // Static/offline fallback when Express backend is absent
  const emailHash = await sha256Hex(cleanEmail);
  const passHash = await sha256Hex(password);
  const storedPassHash = localStorage.getItem(ADMIN_CUSTOM_PASS_HASH_KEY) || DEFAULT_ADMIN_PASS_SHA256;

  if (emailHash !== DEFAULT_ADMIN_EMAIL_SHA256 || passHash !== storedPassHash) {
    throw new Error('Invalid username or password.');
  }

  const session: AdminSession = {
    token: `local_${crypto.randomUUID()}`,
    email: cleanEmail,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    mode: 'local',
  };
  storeAdminSession(session);
  return session;
}

export async function verifyAdminSessionRequest(
  session: AdminSession
): Promise<boolean> {
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    storeAdminSession(null);
    return false;
  }

  if (session.mode === 'local') {
    return true;
  }

  try {
    const res = await fetch('/api/admin/session', {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (res.status === 401 || res.status === 403) {
      storeAdminSession(null);
      return false;
    }
    if (res.ok) {
      return true;
    }
  } catch {
    // Keep session valid if temporarily offline
  }
  return true;
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
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
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
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not update admin password.');
      }
      return;
    }
  }

  const currentHash = await sha256Hex(currentPassword);
  const storedHash = localStorage.getItem(ADMIN_CUSTOM_PASS_HASH_KEY) || DEFAULT_ADMIN_PASS_SHA256;
  if (currentHash !== storedHash) {
    throw new Error('Current password is incorrect.');
  }
  const nextHash = await sha256Hex(newPassword);
  localStorage.setItem(ADMIN_CUSTOM_PASS_HASH_KEY, nextHash);
}
