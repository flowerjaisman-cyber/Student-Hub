import { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Sun,
  Moon,
  Laptop,
  Check,
  Globe,
  LayoutGrid,
  HardDrive,
  Trash2,
  User as UserIcon,
  AlertCircle,
  Save,
} from 'lucide-react';
import { AppearanceMode } from '../types/index.ts';
import { localDb } from '../lib/localDb.ts';

const LANGUAGES = [
  { code: 'en', label: 'English (US)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
];

export function SettingsView() {
  const { user, profile, settings, updateSettings, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const displayName = profile?.displayName || user?.displayName || 'Student';
  const email = profile?.email || user?.email || 'student@studenthub.local';
  const photoURL = profile?.photoURL || user?.photoURL;
  const currentAppearance: AppearanceMode = settings?.appearance || 'system';
  const currentLang = settings?.language || 'en';
  const compactView = settings?.compactView || false;

  const [nameInput, setNameInput] = useState(displayName);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ displayName: nameInput.trim() });
      showToast('Student name updated successfully');
    } catch (err) {
      console.error(err);
      showToast('Failed to update student name.');
    } finally {
      setSaving(false);
    }
  };

  const handleAppearanceChange = async (mode: AppearanceMode) => {
    setSaving(true);
    try {
      await updateSettings({ appearance: mode });
      showToast(`Appearance set to ${mode.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to save appearance setting.');
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    setSaving(true);
    try {
      await updateSettings({ language: newLang });
      showToast('Preferred language updated and saved');
    } catch (err) {
      console.error(err);
      showToast('Failed to save language preference.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCompact = async () => {
    setSaving(true);
    try {
      await updateSettings({ compactView: !compactView });
      showToast(`Compact density ${!compactView ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to update UI preference.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetWorkspace = () => {
    localDb.clearAllData(user?.uid || 'student_user');
    showToast('Workspace data reset successfully.');
    setShowResetConfirm(false);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div id="settings-view" className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings &amp; Preferences
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Manage your student profile, visual preferences, and local workspace storage.
        </p>
      </div>

      {/* Save Feedback Toast */}
      {toastMessage && (
        <div
          id="settings-toast"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-lg shadow-black/10 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Profile Section */}
      <section
        id="settings-profile-section"
        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6"
      >
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <UserIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Student Profile
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Personalize your student identity for your workspace
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {displayName}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">{email}</p>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Free Local Workspace Active
            </span>
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Your Name / Display Name
          </label>
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              disabled={saving || !nameInput.trim() || nameInput.trim() === displayName}
              onClick={handleSaveName}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Appearance Section */}
      <section
        id="settings-appearance-section"
        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6"
      >
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Appearance
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select your preferred visual mode for study sessions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light Mode */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleAppearanceChange('light')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-3 text-center transition-all cursor-pointer ${
              currentAppearance === 'light'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20 text-indigo-900 dark:text-indigo-200 font-bold'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-amber-500 shadow-2xs">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">Light</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Clean high-contrast daytime layout
              </p>
            </div>
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleAppearanceChange('dark')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-3 text-center transition-all cursor-pointer ${
              currentAppearance === 'dark'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20 text-indigo-900 dark:text-indigo-200 font-bold'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-2xs">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">Dark</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Reduced eye strain for night study
              </p>
            </div>
          </button>

          {/* System Default */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleAppearanceChange('system')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-3 text-center transition-all cursor-pointer ${
              currentAppearance === 'system'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20 text-indigo-900 dark:text-indigo-200 font-bold'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">System</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Follow your device settings
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 3. General Preferences */}
      <section
        id="settings-general-section"
        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6"
      >
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              General
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Language and layout density preferences
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Language selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Preferred Language
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Primary language for tool descriptions and documentation
              </p>
            </div>
            <select
              value={currentLang}
              disabled={saving}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Compact View toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Compact UI Density
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Condense spacing for smaller laptops and tablets
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={compactView}
              disabled={saving}
              onClick={handleToggleCompact}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                compactView ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                  compactView ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Local Storage & Privacy */}
      <section
        id="settings-storage-section"
        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6"
      >
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Local Storage &amp; Privacy
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Free, local-first storage in your browser with zero external accounts required
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Workspace Status
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                100% Free of Use &bull; Direct Access &bull; Offline Capable
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
            All your files, notes, study tasks, documents, and attendance records are saved securely inside your browser's LocalStorage and IndexedDB. There is no login barrier or external dependency required to use any feature.
          </p>
        </div>

        <div className="pt-2">
          {!showResetConfirm ? (
            <button
              id="settings-reset-workspace-btn"
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Local Workspace Data</span>
            </button>
          ) : (
            <div
              id="reset-confirmation-box"
              className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 space-y-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Are you sure you want to reset your local workspace?
                  </p>
                  <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
                    This will clear all locally saved documents, tasks, attendance records, and files. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="confirm-reset-btn"
                  type="button"
                  onClick={handleResetWorkspace}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Yes, Reset Everything
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
