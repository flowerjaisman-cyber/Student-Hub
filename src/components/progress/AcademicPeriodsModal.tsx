import React, { useState } from 'react';
import { X, Plus, Calendar, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AcademicPeriod } from '../../types/progress.ts';
import { saveAcademicPeriod, deleteAcademicPeriod } from '../../services/progressService.ts';

interface AcademicPeriodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  periods: AcademicPeriod[];
  activePeriodId: string;
  onSelectPeriod: (periodId: string) => void;
}

export function AcademicPeriodsModal({
  isOpen,
  onClose,
  userId,
  periods,
  activePeriodId,
  onSelectPeriod,
}: AcademicPeriodsModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [makeActive, setMakeActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Period name is required (e.g. Fall 2026, Semester 1)');
      return;
    }
    if (!startDate || !endDate) {
      setError('Both start and end dates are required');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const periodId = `period_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newPeriod: AcademicPeriod = {
        id: periodId,
        userId,
        name: name.trim(),
        startDate,
        endDate,
        description: description.trim() || undefined,
        isActive: makeActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // If makeActive, mark other periods as inactive
      if (makeActive) {
        for (const p of periods) {
          if (p.isActive) {
            await saveAcademicPeriod(userId, { ...p, isActive: false });
          }
        }
      }

      await saveAcademicPeriod(userId, newPeriod);
      if (makeActive) {
        onSelectPeriod(periodId);
      }

      // Reset form
      setName('');
      setStartDate('');
      setEndDate('');
      setDescription('');
      setIsCreating(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create academic period');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetActive = async (period: AcademicPeriod) => {
    try {
      for (const p of periods) {
        if (p.id === period.id) {
          await saveAcademicPeriod(userId, { ...p, isActive: true });
        } else if (p.isActive) {
          await saveAcademicPeriod(userId, { ...p, isActive: false });
        }
      }
      onSelectPeriod(period.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to set active period');
    }
  };

  const handleDelete = async (periodId: string) => {
    if (!window.confirm('Delete this academic period? Associated coursework will not be deleted.')) {
      return;
    }
    try {
      await deleteAcademicPeriod(userId, periodId);
      if (activePeriodId === periodId) {
        onSelectPeriod('all');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete academic period');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Academic Periods
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organize analytics by Semester, Term, or Academic Year
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Creation Form */}
          {isCreating ? (
            <form onSubmit={handleCreate} className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                New Academic Period
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Period Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fall Semester 2026, Term 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Major core courses and research project"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={makeActive}
                  onChange={(e) => setMakeActive(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Set as current active period</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Period'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Create New Academic Period</span>
            </button>
          )}

          {/* Periods List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Your Periods ({periods.length})
            </h4>

            {periods.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                No academic periods created yet. Create one to organize coursework by semester or term.
              </div>
            ) : (
              periods.map((period) => (
                <div
                  key={period.id}
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                    period.isActive
                      ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {period.name}
                      </span>
                      {period.isActive && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {period.startDate} to {period.endDate}
                      {period.description ? ` • ${period.description}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!period.isActive && (
                      <button
                        type="button"
                        onClick={() => handleSetActive(period)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(period.id)}
                      title="Delete Period"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
