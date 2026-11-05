import React, { useState, useEffect } from 'react';
import { X, Sliders, Check, Bell, Info, ShieldAlert } from 'lucide-react';
import {
  AttendanceSettings,
  LateTreatment,
  ExcusedTreatment,
  DEFAULT_ATTENDANCE_SETTINGS,
} from '../../types/attendance.ts';
import { saveAttendanceSettings } from '../../services/attendanceService.ts';

interface AttendanceRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  settings?: AttendanceSettings;
}

export function AttendanceRulesModal({
  isOpen,
  onClose,
  userId,
  settings,
}: AttendanceRulesModalProps) {
  const [lateTreatment, setLateTreatment] = useState<LateTreatment>(
    settings?.lateTreatment || DEFAULT_ATTENDANCE_SETTINGS.lateTreatment
  );
  const [excusedTreatment, setExcusedTreatment] = useState<ExcusedTreatment>(
    settings?.excusedTreatment || DEFAULT_ATTENDANCE_SETTINGS.excusedTreatment
  );
  const [hasTarget, setHasTarget] = useState<boolean>(
    settings?.targetPercentage !== undefined && settings.targetPercentage > 0
  );
  const [targetPercentage, setTargetPercentage] = useState<string>(
    settings?.targetPercentage !== undefined ? String(settings.targetPercentage) : '75'
  );
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(
    settings?.remindersEnabled || false
  );
  const [reminderTiming, setReminderTiming] = useState<string>(
    settings?.reminderTiming || '18:00'
  );
  const [reminderDays, setReminderDays] = useState<string[]>(
    settings?.reminderDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setLateTreatment(settings.lateTreatment || 'separate');
      setExcusedTreatment(settings.excusedTreatment || 'exclude');
      setHasTarget(settings.targetPercentage !== undefined && settings.targetPercentage > 0);
      setTargetPercentage(settings.targetPercentage !== undefined ? String(settings.targetPercentage) : '75');
      setRemindersEnabled(settings.remindersEnabled || false);
      setReminderTiming(settings.reminderTiming || '18:00');
      setReminderDays(settings.reminderDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleDayToggle = (day: string) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter((d) => d !== day));
    } else {
      setReminderDays([...reminderDays, day]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const parsedTarget = hasTarget && targetPercentage ? Number(targetPercentage) : undefined;
      const validTarget =
        parsedTarget !== undefined && !isNaN(parsedTarget)
          ? Math.min(100, Math.max(1, parsedTarget))
          : undefined;

      await saveAttendanceSettings(userId, {
        id: 'main',
        userId,
        lateTreatment,
        excusedTreatment,
        targetPercentage: validTarget,
        remindersEnabled,
        reminderTiming,
        reminderDays,
        updatedAt: new Date().toISOString(),
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(`Failed to save attendance settings: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const DAYS = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Attendance Calculation Rules &amp; Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure deterministic counting rules and personal attendance targets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto">
          {/* 1. Late Treatment */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Late Arrival Treatment
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Determine how classes marked as Late contribute to attendance calculations
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`flex flex-col p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  lateTreatment === 'separate'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="lateTreatment"
                  value="separate"
                  checked={lateTreatment === 'separate'}
                  onChange={() => setLateTreatment('separate')}
                  className="sr-only"
                />
                <span className="font-bold">50% Present</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Counts as half-credit
                </span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  lateTreatment === 'present'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="lateTreatment"
                  value="present"
                  checked={lateTreatment === 'present'}
                  onChange={() => setLateTreatment('present')}
                  className="sr-only"
                />
                <span className="font-bold">100% Present</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Counts as full presence
                </span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  lateTreatment === 'absent'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="lateTreatment"
                  value="absent"
                  checked={lateTreatment === 'absent'}
                  onChange={() => setLateTreatment('absent')}
                  className="sr-only"
                />
                <span className="font-bold">Absent</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Zero presence credit
                </span>
              </label>
            </div>
          </div>

          {/* 2. Excused Treatment */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Excused Absence Treatment
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Choose how verified excused absences affect the calculation denominator
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`flex flex-col p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  excusedTreatment === 'exclude'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="excusedTreatment"
                  value="exclude"
                  checked={excusedTreatment === 'exclude'}
                  onChange={() => setExcusedTreatment('exclude')}
                  className="sr-only"
                />
                <span className="font-bold">Exclude</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Removed from denominator
                </span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  excusedTreatment === 'present'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="excusedTreatment"
                  value="present"
                  checked={excusedTreatment === 'present'}
                  onChange={() => setExcusedTreatment('present')}
                  className="sr-only"
                />
                <span className="font-bold">Count as Present</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Counts as attended
                </span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  excusedTreatment === 'absent'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="excusedTreatment"
                  value="absent"
                  checked={excusedTreatment === 'absent'}
                  onChange={() => setExcusedTreatment('absent')}
                  className="sr-only"
                />
                <span className="font-bold">Count as Absent</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Counts as missed class
                </span>
              </label>
            </div>
          </div>

          {/* 3. Personal Attendance Target */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTarget}
                  onChange={(e) => setHasTarget(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Enable Personal Attendance Target
                </span>
              </label>
            </div>

            {hasTarget && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-100">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    value={targetPercentage}
                    onChange={(e) => setTargetPercentage(e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">%</span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {[75, 80, 85].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTargetPercentage(String(preset))}
                        className={`px-2 py-1 rounded text-[11px] font-medium border ${
                          targetPercentage === String(preset)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400/90 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/50">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Important:</strong> Attendance target is a personal setting unless
                    entered by the user based on institutional requirements. StudentHub does not
                    represent official institutional policy.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Logging Reminders */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remindersEnabled}
                  onChange={(e) => setRemindersEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Enable Daily Attendance Logging Reminders</span>
                </span>
              </label>
            </div>

            {remindersEnabled && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Reminder Time:</span>
                  <input
                    type="time"
                    value={reminderTiming}
                    onChange={(e) => setReminderTiming(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 block mb-1.5">
                    Active Days:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {DAYS.map((d) => {
                      const active = reminderDays.includes(d.key);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => handleDayToggle(d.key)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Reminders are personal convenience notifications and not institutional requirements.
                </p>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Attendance Rules</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
