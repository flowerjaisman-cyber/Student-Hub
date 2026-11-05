import { useState, useEffect, useRef } from 'react';
import {
  PomodoroMode,
  PomodoroSettings,
  StudySubject,
  StudySession,
} from '../../types/index.ts';
import {
  savePomodoroRecord,
  saveStudySession,
} from '../../services/studyService.ts';
import {
  formatDurationSeconds,
  getLocalDateString,
} from '../../utils/studyUtils.ts';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings2,
  Bell,
  CheckCircle,
  Coffee,
  Brain,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface PomodoroTabProps {
  uid: string;
  subjects: StudySubject[];
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  notificationsEnabled: true,
};

export function PomodoroTab({ uid, subjects }: PomodoroTabProps) {
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    try {
      const saved = localStorage.getItem(`pomodoro_settings_${uid}`);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(settings.focusDuration * 60);
  const [completedSessionsToday, setCompletedSessionsToday] = useState<number>(0);

  // Focus topic & subject tagging
  const [focusTopic, setFocusTopic] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Timestamp references for drift resistance
  const targetTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play sound using native Web Audio API
  const playChime = () => {
    if (!settings.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio chime playback failed:', e);
    }
  };

  // Browser notification
  const sendNotification = (title: string, body: string) => {
    if (!settings.notificationsEnabled) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch (e) {
        console.warn('Notification failed:', e);
      }
    }
  };

  const getDurationForMode = (m: PomodoroMode, s: PomodoroSettings): number => {
    switch (m) {
      case 'focus':
        return s.focusDuration * 60;
      case 'short_break':
        return s.shortBreakDuration * 60;
      case 'long_break':
        return s.longBreakDuration * 60;
    }
  };

  // Mode change handler
  const switchMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setSecondsRemaining(getDurationForMode(newMode, settings));
    targetTimeRef.current = null;
  };

  // On timer completion
  const handleTimerComplete = async () => {
    playChime();

    if (mode === 'focus') {
      const newCount = completedSessionsToday + 1;
      setCompletedSessionsToday(newCount);

      sendNotification('Focus session complete!', 'Time to take a well-deserved rest.');

      // Persist record to Firestore
      const nowIso = new Date().toISOString();
      const selectedSub = subjects.find((s) => s.id === selectedSubjectId);

      // Save Pomodoro record
      await savePomodoroRecord(uid, {
        id: `pomo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        mode: 'focus',
        durationMinutes: settings.focusDuration,
        completedAt: nowIso,
        subjectId: selectedSubjectId || undefined,
        subjectName: selectedSub?.name,
        notes: focusTopic ? `Pomodoro: ${focusTopic}` : undefined,
      });

      const sessionTitle = focusTopic ? `Pomodoro: ${focusTopic}` : 'Pomodoro Focus Block';
      const sessionStartIso = new Date(Date.now() - settings.focusDuration * 60000).toISOString();
      const interval = settings.longBreakInterval ?? 4;

      // Also log as a study session so it appears in Study Sessions history & productivity charts!
      await saveStudySession(uid, {
        id: `session_pomo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        topic: sessionTitle,
        title: sessionTitle,
        subjectId: selectedSubjectId || undefined,
        subjectName: selectedSub?.name,
        actualStart: sessionStartIso,
        actualEnd: nowIso,
        startTime: sessionStartIso,
        endTime: nowIso,
        duration: settings.focusDuration * 60,
        durationMinutes: settings.focusDuration,
        durationSeconds: settings.focusDuration * 60,
        status: 'completed',
        type: 'pomodoro',
        rating: 5,
        notes: 'Completed full Pomodoro session',
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      // Determine next mode
      if (newCount % interval === 0) {
        switchMode('long_break');
      } else {
        switchMode('short_break');
      }
    } else {
      sendNotification('Break finished!', 'Ready to dive back into your focus block?');
      switchMode('focus');
    }
  };

  // Timer Tick Engine: calculates remaining seconds from targetTimeRef to avoid drift
  useEffect(() => {
    if (isRunning) {
      if (!targetTimeRef.current) {
        targetTimeRef.current = Date.now() + secondsRemaining * 1000;
      }

      timerRef.current = setInterval(() => {
        if (!targetTimeRef.current) return;
        const diff = Math.round((targetTimeRef.current - Date.now()) / 1000);

        if (diff <= 0) {
          setSecondsRemaining(0);
          setIsRunning(false);
          targetTimeRef.current = null;
          handleTimerComplete();
        } else {
          setSecondsRemaining(diff);
        }
      }, 500);
    } else {
      targetTimeRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, settings, completedSessionsToday, focusTopic, selectedSubjectId]);

  const handleStart = () => {
    targetTimeRef.current = Date.now() + secondsRemaining * 1000;
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    targetTimeRef.current = null;
  };

  const handleReset = () => {
    setIsRunning(false);
    targetTimeRef.current = null;
    setSecondsRemaining(getDurationForMode(mode, settings));
  };

  const handleSkip = () => {
    if (confirm('Skip to the next interval?')) {
      if (mode === 'focus') {
        switchMode('short_break');
      } else {
        switchMode('focus');
      }
    }
  };

  const handleSaveSettings = (newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    localStorage.setItem(`pomodoro_settings_${uid}`, JSON.stringify(newSettings));
    setIsSettingsOpen(false);
    // Adjust current timer if not running
    if (!isRunning) {
      setSecondsRemaining(getDurationForMode(mode, newSettings));
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        sendNotification('Notifications active', 'StudentHub Pomodoro will alert you when sessions complete.');
      }
    }
  };

  const totalModeDuration = getDurationForMode(mode, settings);
  const progressRatio = Math.max(0, Math.min(1, (totalModeDuration - secondsRemaining) / totalModeDuration));
  const strokeDashoffset = 100 - progressRatio * 100;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Top Selector Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchMode('focus')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              mode === 'focus'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Focus ({settings.focusDuration}m)</span>
          </button>

          <button
            type="button"
            onClick={() => switchMode('short_break')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              mode === 'short_break'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Short Break ({settings.shortBreakDuration}m)</span>
          </button>

          <button
            type="button"
            onClick={() => switchMode('long_break')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              mode === 'long_break'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Long Break ({settings.longBreakDuration}m)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          title="Pomodoro Settings"
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Dial and Clock */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col items-center justify-center space-y-6 text-center">
        {/* Topic Input during focus */}
        {mode === 'focus' && (
          <div className="w-full max-w-sm space-y-2">
            <input
              type="text"
              placeholder="What are you focusing on?"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              className="w-full px-3 py-1.5 text-xs text-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-1 text-[11px] rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-center"
            >
              <option value="">Course (Optional)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Circular Timer Visual */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`transition-all duration-500 ${
                mode === 'focus'
                  ? 'text-indigo-600'
                  : mode === 'short_break'
                  ? 'text-emerald-500'
                  : 'text-blue-500'
              }`}
              strokeWidth="6"
              strokeDasharray="276"
              strokeDashoffset={(strokeDashoffset / 100) * 276}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Time Centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
              {formatDurationSeconds(secondsRemaining)}
            </span>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400 mt-1">
              {mode.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            title="Reset"
            className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {!isRunning ? (
            <button
              type="button"
              onClick={handleStart}
              className={`px-8 py-3.5 rounded-2xl text-white font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer ${
                mode === 'focus'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : mode === 'short_break'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Start</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="px-8 py-3.5 rounded-2xl text-white font-bold bg-amber-600 hover:bg-amber-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-white" />
              <span>Pause</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSkip}
            title="Skip to next mode"
            className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Daily tally */}
        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>
            Focus sessions finished today: <strong className="text-slate-900 dark:text-white font-mono">{completedSessionsToday}</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>Next long break in: <strong className="font-mono">{(settings.longBreakInterval ?? 4) - (completedSessionsToday % (settings.longBreakInterval ?? 4))}</strong></span>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Timer Durations &amp; Audio
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Focus Block (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={settings.focusDuration}
                  onChange={(e) =>
                    setSettings({ ...settings, focusDuration: parseInt(e.target.value) || 25 })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Break (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.shortBreakDuration}
                  onChange={(e) =>
                    setSettings({ ...settings, shortBreakDuration: parseInt(e.target.value) || 5 })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Long Break (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.longBreakDuration}
                  onChange={(e) =>
                    setSettings({ ...settings, longBreakDuration: parseInt(e.target.value) || 15 })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Long Break Interval (Sessions)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.longBreakInterval}
                  onChange={(e) =>
                    setSettings({ ...settings, longBreakInterval: parseInt(e.target.value) || 4 })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>Chime Sound on Completion</span>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    Desktop Notifications
                  </span>
                  <button
                    type="button"
                    onClick={requestNotificationPermission}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Enable / Test
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveSettings(settings)}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
