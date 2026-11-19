import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { SiteConfig, AdminChangeLogEntry } from '../types/index.ts';
import {
  AdminSession,
  SITE_CONFIG_CHANNEL,
  SITE_CONFIG_STORAGE_KEY,
  readCachedSiteConfig,
  fetchLiveSiteConfig,
  readStoredAdminSession,
  storeAdminSession,
  verifyAdminSessionRequest,
  adminLoginRequest,
  saveAdminSiteConfigRequest,
  resetAdminSiteConfigRequest,
  fetchAdminLogsRequest,
  changeAdminPasswordRequest,
  normalizeSiteConfig,
} from '../services/siteConfigService.ts';

interface SiteConfigContextType {
  config: SiteConfig;
  configLoading: boolean;
  adminSession: AdminSession | null;
  adminChecking: boolean;
  adminLogs: AdminChangeLogEntry[];
  refreshConfig: () => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => void;
  saveConfig: (
    nextConfig: SiteConfig,
    summary: string,
    section: string
  ) => Promise<void>;
  resetConfig: () => Promise<void>;
  changeAdminPassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(() => readCachedSiteConfig());
  const [configLoading, setConfigLoading] = useState<boolean>(true);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() =>
    readStoredAdminSession()
  );
  const [adminChecking, setAdminChecking] = useState<boolean>(false);
  const [adminLogs, setAdminLogs] = useState<AdminChangeLogEntry[]>([]);

  const refreshConfig = useCallback(async () => {
    const live = await fetchLiveSiteConfig();
    setConfig(live);
  }, []);

  // Load live server config on mount + listen for live cross-tab updates + window focus revalidation
  useEffect(() => {
    let active = true;
    fetchLiveSiteConfig()
      .then((live) => {
        if (active) setConfig(live);
      })
      .finally(() => {
        if (active) setConfigLoading(false);
      });

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(SITE_CONFIG_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.type === 'CONFIG_UPDATED' && event.data?.config) {
          setConfig(normalizeSiteConfig(event.data.config));
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === SITE_CONFIG_STORAGE_KEY && e.newValue) {
        try {
          setConfig(normalizeSiteConfig(JSON.parse(e.newValue)));
        } catch {
          // ignore
        }
      }
    };

    const handleFocus = () => {
      fetchLiveSiteConfig().then((live) => {
        if (active) setConfig(live);
      });
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);

    return () => {
      active = false;
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Verify stored admin session & load logs if authenticated
  useEffect(() => {
    if (!adminSession) {
      setAdminLogs([]);
      return;
    }
    let active = true;
    setAdminChecking(true);
    verifyAdminSessionRequest(adminSession)
      .then(async (valid) => {
        if (!active) return;
        if (!valid) {
          setAdminSession(null);
          setAdminLogs([]);
          return;
        }
        const logs = await fetchAdminLogsRequest(adminSession);
        if (active) setAdminLogs(logs);
      })
      .finally(() => {
        if (active) setAdminChecking(false);
      });

    return () => {
      active = false;
    };
  }, [adminSession?.token]);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    const session = await adminLoginRequest(email, password);
    setAdminSession(session);
    const logs = await fetchAdminLogsRequest(session);
    setAdminLogs(logs);
  }, []);

  const logoutAdmin = useCallback(() => {
    storeAdminSession(null);
    setAdminSession(null);
    setAdminLogs([]);
  }, []);

  const saveConfig = useCallback(
    async (nextConfig: SiteConfig, summary: string, section: string) => {
      if (!adminSession) {
        throw new Error('Admin authentication required.');
      }
      const { config: saved, logs } = await saveAdminSiteConfigRequest(
        adminSession,
        nextConfig,
        summary,
        section
      );
      setConfig(saved);
      setAdminLogs(logs);
    },
    [adminSession]
  );

  const resetConfig = useCallback(async () => {
    if (!adminSession) {
      throw new Error('Admin authentication required.');
    }
    const { config: saved, logs } = await resetAdminSiteConfigRequest(adminSession);
    setConfig(saved);
    setAdminLogs(logs);
  }, [adminSession]);

  const changeAdminPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!adminSession) {
        throw new Error('Admin authentication required.');
      }
      await changeAdminPasswordRequest(adminSession, currentPassword, newPassword);
      const logs = await fetchAdminLogsRequest(adminSession);
      setAdminLogs(logs);
    },
    [adminSession]
  );

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        configLoading,
        adminSession,
        adminChecking,
        adminLogs,
        refreshConfig,
        loginAdmin,
        logoutAdmin,
        saveConfig,
        resetConfig,
        changeAdminPassword,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig(): SiteConfigContextType {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return ctx;
}
