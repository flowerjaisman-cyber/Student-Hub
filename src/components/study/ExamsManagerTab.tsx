import { useState, useEffect, useMemo } from 'react';
import {
  StudyExam,
  StudyExamType,
  StudyTaskPriority,
  StudySubject,
} from '../../types/index.ts';
import { saveStudyExam, deleteStudyExam } from '../../services/studyService.ts';
import {
  getCountdownParts,
  formatCountdownString,
  getLocalDateString,
} from '../../utils/studyUtils.ts';
import {
  Hourglass,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Search,
  Filter,
  Flame,
} from 'lucide-react';

interface ExamsManagerTabProps {
  uid: string;
  exams: StudyExam[];
  subjects: StudySubject[];
  onOpenSubjectsModal?: () => void;
}

export function ExamsManagerTab({
  uid,
  exams,
  subjects,
  onOpenSubjectsModal,
}: ExamsManagerTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<StudyExam | null>(null);

  // Live second ticker for real countdowns
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Form fields
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState<StudyExamType>('exam');
  const [date, setDate] = useState(getLocalDateString());
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<StudyTaskPriority>('high');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const resetForm = () => {
    setEditingExam(null);
    setTitle('');
    setSubjectId('');
    setType('exam');
    setDate(getLocalDateString());
    setTime('09:00');
    setLocation('');
    setPriority('high');
    setNotes('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exam: StudyExam) => {
    setEditingExam(exam);
    setTitle(exam.title);
    setSubjectId(exam.subjectId || '');
    setType(exam.type);
    setDate(exam.date);
    setTime(exam.time || '09:00');
    setLocation(exam.location || '');
    setPriority(exam.priority);
    setNotes(exam.notes || '');
    setIsModalOpen(true);
  };

  const handleToggleComplete = async (exam: StudyExam) => {
    await saveStudyExam(uid, {
      ...exam,
      completed: !exam.completed,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this exam/deadline record?')) {
      await deleteStudyExam(uid, id);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const selectedSub = subjects.find((s) => s.id === subjectId);

      const payload: StudyExam = {
        id: editingExam ? editingExam.id : `exam_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        subjectId: subjectId || undefined,
        subjectName: selectedSub ? selectedSub.name : undefined,
        type,
        date,
        time: time || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        priority,
        completed: editingExam ? editingExam.completed : false,
        createdAt: editingExam ? editingExam.createdAt : nowIso,
        updatedAt: nowIso,
      };

      await saveStudyExam(uid, payload);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save exam:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredExams = useMemo(() => {
    return exams.filter((ex) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ex.title.toLowerCase().includes(q);
        const matchesSub = ex.subjectName?.toLowerCase().includes(q);
        const matchesLoc = ex.location?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSub && !matchesLoc) return false;
      }

      if (activeTab === 'upcoming') {
        return !ex.completed;
      }
      if (activeTab === 'completed') {
        return ex.completed;
      }
      return true;
    });
  }, [exams, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search exams, quizzes, defense deadlines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exam / Deadline</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'upcoming', label: `Upcoming (${exams.filter((e) => !e.completed).length})` },
          { id: 'completed', label: `Completed (${exams.filter((e) => e.completed).length})` },
          { id: 'all', label: `All Events (${exams.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
            <Hourglass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {exams.length === 0 ? 'No exams scheduled' : 'No matching events'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {exams.length === 0
                ? 'Add midterms, finals, oral presentations, or project defense deadlines with live countdowns.'
                : 'Try adjusting your search query or tab.'}
            </p>
          </div>
          {exams.length === 0 && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Exam</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((exam) => {
            const targetIso = `${exam.date}T${exam.time || '09:00'}:00`;
            const countdown = getCountdownParts(targetIso, now);

            return (
              <div
                key={exam.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  exam.completed
                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-60'
                    : countdown.isPast
                    ? 'bg-slate-50 dark:bg-slate-900/80 border-slate-300 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 uppercase">
                          {exam.type}
                        </span>
                        {exam.subjectName && (
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {exam.subjectName}
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                            exam.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {exam.priority}
                        </span>
                      </div>

                      <h4
                        className={`text-base font-bold mt-2 ${
                          exam.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {exam.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(exam)}
                        title={exam.completed ? 'Mark incomplete' : 'Mark completed'}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg"
                      >
                        {exam.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(exam)}
                        title="Edit"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(exam.id)}
                        title="Delete"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {exam.date} {exam.time ? `at ${exam.time}` : ''}
                    </span>
                    {exam.location && (
                      <span className="flex items-center gap-1 font-sans">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {exam.location}
                      </span>
                    )}
                  </div>

                  {exam.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                      {exam.notes}
                    </p>
                  )}
                </div>

                {/* Live Countdown Display (Phase 7 Engine) */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  {exam.completed ? (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Exam Completed</span>
                    </div>
                  ) : countdown.isPast ? (
                    <div className="text-xs text-slate-500 font-medium">
                      Event date has passed
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                        <Hourglass className="w-4 h-4 animate-pulse text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Countdown:</span>
                      </div>
                      <div className="font-mono text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-200">
                        {countdown.days > 0 && `${countdown.days}d `}
                        {String(countdown.hours).padStart(2, '0')}h{' '}
                        {String(countdown.minutes).padStart(2, '0')}m{' '}
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {String(countdown.seconds).padStart(2, '0')}s
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingExam ? 'Edit Exam / Deadline' : 'Schedule Exam or Major Deadline'}
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
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Chemistry Final Exam, Senior Thesis Defense..."
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
                    Event Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as StudyExamType)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white uppercase"
                  >
                    <option value="exam">Final / Midterm Exam</option>
                    <option value="quiz">Quiz</option>
                    <option value="presentation">Presentation / Defense</option>
                    <option value="project">Project Deadline</option>
                    <option value="assignment">Major Assignment</option>
                    <option value="deadline">Registration / Application Deadline</option>
                    <option value="other">Other Event</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as StudyTaskPriority)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Hall / Link (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science Hall Rm 302, Online Zoom Room..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exam Scope / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Chapters 1-7, bring scientific calculator and student ID card..."
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
                  <Hourglass className="w-4 h-4" />
                  <span>{editingExam ? 'Save Changes' : 'Schedule Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
