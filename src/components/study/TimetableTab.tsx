import { useState, useMemo } from 'react';
import {
  TimetableEntry,
  DayOfWeek,
  StudySubject,
} from '../../types/index.ts';
import {
  saveTimetableEntry,
  deleteTimetableEntry,
} from '../../services/studyService.ts';
import {
  checkTimetableOverlap,
  getDayOfWeekFromDate,
} from '../../utils/studyUtils.ts';
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  Edit3,
  Copy,
  AlertTriangle,
  Eye,
  EyeOff,
  Calendar,
} from 'lucide-react';

interface TimetableTabProps {
  uid: string;
  timetable: TimetableEntry[];
  subjects: StudySubject[];
  onOpenSubjectsModal?: () => void;
}

const DAYS_OF_WEEK: { id: DayOfWeek; label: string; short: string }[] = [
  { id: 'monday', label: 'Monday', short: 'Mon' },
  { id: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { id: 'thursday', label: 'Thursday', short: 'Thu' },
  { id: 'friday', label: 'Friday', short: 'Fri' },
  { id: 'saturday', label: 'Saturday', short: 'Sat' },
  { id: 'sunday', label: 'Sunday', short: 'Sun' },
];

export function TimetableTab({
  uid,
  timetable,
  subjects,
  onOpenSubjectsModal,
}: TimetableTabProps) {
  const [viewMode, setViewMode] = useState<'weekly' | 'daily' | 'today'>('weekly');
  const todayDayOfWeek = getDayOfWeekFromDate(new Date());
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDayOfWeek);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('');
  const [instructor, setInstructor] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setEditingEntry(null);
    setTitle('');
    setSubjectId('');
    setDayOfWeek(viewMode === 'daily' ? selectedDay : 'monday');
    setStartTime('09:00');
    setEndTime('10:30');
    setLocation('');
    setInstructor('');
    setNotes('');
    setActive(true);
  };

  const handleOpenAdd = (defaultDay?: DayOfWeek) => {
    resetForm();
    if (defaultDay) setDayOfWeek(defaultDay);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setSubjectId(entry.subjectId || '');
    setDayOfWeek(entry.dayOfWeek);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setLocation(entry.location || '');
    setInstructor(entry.instructor || '');
    setNotes(entry.notes || '');
    setActive(entry.active);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (entry: TimetableEntry) => {
    const now = new Date().toISOString();
    const copy: TimetableEntry = {
      ...entry,
      id: `tt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: `${entry.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    await saveTimetableEntry(uid, copy);
  };

  const handleToggleActive = async (entry: TimetableEntry) => {
    await saveTimetableEntry(uid, {
      ...entry,
      active: !entry.active,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this timetable class/session?')) {
      await deleteTimetableEntry(uid, id);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;

    if (startTime >= endTime) {
      alert('Start time must be before end time');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const selectedSub = subjects.find((s) => s.id === subjectId);

      const payload: TimetableEntry = {
        id: editingEntry ? editingEntry.id : `tt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        subjectId: subjectId || undefined,
        subjectName: selectedSub ? selectedSub.name : undefined,
        dayOfWeek,
        startTime,
        endTime,
        location: location.trim() || undefined,
        instructor: instructor.trim() || undefined,
        notes: notes.trim() || undefined,
        active,
        color: selectedSub?.color,
        createdAt: editingEntry ? editingEntry.createdAt : now,
        updatedAt: now,
      };

      await saveTimetableEntry(uid, payload);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save timetable entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Group entries by day
  const entriesByDay = useMemo(() => {
    const map: Record<DayOfWeek, TimetableEntry[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    timetable.forEach((entry) => {
      if (map[entry.dayOfWeek]) {
        map[entry.dayOfWeek].push(entry);
      }
    });

    // Sort each day chronologically by startTime
    Object.keys(map).forEach((dayKey) => {
      map[dayKey as DayOfWeek].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return map;
  }, [timetable]);

  // Check if an entry overlaps with any other entry on the same day
  const isOverlapping = (entry: TimetableEntry): boolean => {
    const dayEntries = entriesByDay[entry.dayOfWeek] || [];
    return dayEntries.some((other) => checkTimetableOverlap(entry, other));
  };

  const currentDisplayDay = viewMode === 'today' ? todayDayOfWeek : selectedDay;

  return (
    <div className="space-y-6">
      {/* Top Controls: View Selector & Add */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'weekly'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Weekly Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Daily Schedule
          </button>
          <button
            type="button"
            onClick={() => setViewMode('today')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === 'today'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today ({todayDayOfWeek.substring(0, 3).toUpperCase()})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAdd()}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class / Block</span>
        </button>
      </div>

      {/* Daily View Day Selector */}
      {viewMode === 'daily' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {DAYS_OF_WEEK.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDay(d.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedDay === d.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {d.label} ({entriesByDay[d.id].length})
            </button>
          ))}
        </div>
      )}

      {/* Main Schedule Content */}
      {timetable.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No timetable entries
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add your lecture times, tutorials, lab sections, or dedicated study blocks to build your weekly routine.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class / Block</span>
          </button>
        </div>
      ) : viewMode === 'weekly' ? (
        /* Weekly Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {DAYS_OF_WEEK.map((day) => {
            const dayEntries = entriesByDay[day.id];
            const isToday = day.id === todayDayOfWeek;

            return (
              <div
                key={day.id}
                className={`flex flex-col rounded-2xl border p-3 min-h-[300px] transition-colors ${
                  isToday
                    ? 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-900/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold ${
                        isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {day.short}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAdd(day.id)}
                    title={`Add entry to ${day.label}`}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Items */}
                <div className="space-y-2 flex-1">
                  {dayEntries.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic">
                      No classes
                    </div>
                  ) : (
                    dayEntries.map((entry) => {
                      const overlaps = isOverlapping(entry);

                      return (
                        <div
                          key={entry.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all relative flex flex-col justify-between ${
                            !entry.active
                              ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-50'
                              : overlaps
                              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 shadow-2xs'
                          }`}
                        >
                          <div>
                            {overlaps && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 mb-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Overlap</span>
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-1">
                              <p className="font-bold text-slate-900 dark:text-white leading-tight">
                                {entry.title}
                              </p>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(entry)}
                                  className="p-0.5 text-slate-400 hover:text-indigo-600"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(entry.id)}
                                  className="p-0.5 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {entry.subjectName && (
                              <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                                {entry.subjectName}
                              </p>
                            )}

                            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 mt-1.5">
                              <Clock className="w-2.5 h-2.5" />
                              <span>
                                {entry.startTime} – {entry.endTime}
                              </span>
                            </div>

                            {entry.location && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                <span className="truncate">{entry.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Daily / Today Single Day View */
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {currentDisplayDay}'s Schedule ({entriesByDay[currentDisplayDay].length} items)
            </h3>
            <button
              type="button"
              onClick={() => handleOpenAdd(currentDisplayDay)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to {currentDisplayDay}</span>
            </button>
          </div>

          {entriesByDay[currentDisplayDay].length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              No entries scheduled for {currentDisplayDay}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {entriesByDay[currentDisplayDay].map((entry) => {
                const overlaps = isOverlapping(entry);

                return (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                      !entry.active
                        ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        : overlaps
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {entry.startTime} – {entry.endTime}
                        </span>
                        {overlaps && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Overlapping Time
                          </span>
                        )}
                        {entry.subjectName && (
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {entry.subjectName}
                          </span>
                        )}
                        {!entry.active && (
                          <span className="text-[10px] text-slate-500 italic">
                            (Disabled)
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {entry.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {entry.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {entry.location}
                          </span>
                        )}
                        {entry.instructor && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {entry.instructor}
                          </span>
                        )}
                      </div>

                      {entry.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                          {entry.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(entry)}
                        title={entry.active ? 'Disable block' : 'Enable block'}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {entry.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(entry)}
                        title="Duplicate"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(entry)}
                        title="Edit"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        title="Delete"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Timetable Entry Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingEntry ? 'Edit Class / Block' : 'Add Timetable Block'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title / Class Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Lecture, Organic Chemistry Lab, Study Block..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Subject / Course
                    </label>
                    {onOpenSubjectsModal && (
                      <button
                        type="button"
                        onClick={onOpenSubjectsModal}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        + Manage
                      </button>
                    )}
                  </div>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">No Course / General</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.code ? `(${s.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Day of the Week *
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white capitalize"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Room (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hall B Rm 104"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Instructor (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Feynman"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Preparation instructions, textbook chapters..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !title.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl flex items-center gap-1.5"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>{editingEntry ? 'Save Changes' : 'Add Block'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
