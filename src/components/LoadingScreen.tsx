import { Sparkles } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div
      id="loading-screen"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200"
    >
      <div className="flex flex-col items-center max-w-sm text-center">
        <div className="relative mb-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 animate-pulse">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-2 border-slate-50 dark:border-slate-950 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin bg-white dark:bg-slate-900" />
        </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          StudentHub
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Restoring authenticated Google session &amp; cloud data...
        </p>
      </div>
    </div>
  );
}
