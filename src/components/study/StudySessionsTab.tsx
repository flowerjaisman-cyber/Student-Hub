import { useState, useEffect, useRef } from 'react';
import { StudySession, StudySubject } from '../../types/index.ts';
import {
  saveStudySession,
  deleteStudySession,
} from '../../services/studyService.ts';
import {
  formatDurationSeconds,
  getLocalDateString,
} from '../../utils/studyUtils.ts';
import {
  Play,
  Pause,
  Square,
  Clock,
  Calendar,
  Star,
  Plus,
  Trash2,
  BookOpen,
  Filter,
  CheckCircle,
  Tag,
} from 'lucide-react';

interface StudySessionsTabProps {
  uid: string;
  sessions: StudySession[];
  subjects: StudySubject[];
  onOpenSubjectsModal?: () => void;
}

export function StudySessionsTab({
  uid,
  sessions,
  subjects,
  onOpenSubjectsModal,
}: StudySessionsTabProps) {
  // Live Timer State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Active session metadata
  const [activeSubjectId, setActiveSubjectId] = useState('');
  const [activeTitle, setActiveTitle] = useState('');
  const [activeNotes, setActiveNotes] = useState('');
  const [activeRating, setActiveRating] = useState<number>(4);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Track pauses
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(0);

  // Finish modal for active session
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

  // Manual session modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualSubjectId, setManualSubjectId] = useState('');
  const [manualDate, setManualDate] = useState(getLocalDateString());
  const [manualDurationMins, setManualDurationMins] = useState<number>(60);
  const [manualNotes, setManualNotes] = useState('');
  const [manualRating, setManualRating] = useState<number>(4);
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Filter
  const [filterSubjectId, setFilterSubjectId] = useState('all');

  // Timer Tick Engine: resistant to background throttling
  useEffect(() => {
    if (isRunning && !isPaused) {
      lastTickRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTickRef.current) / 1000);
        if (delta >= 1) {
          setElapsedSeconds((prev) => prev + delta);
          lastTickRef.current = now;
        }
      }, 500);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const handleStartTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setSessionStartTime(new Date());
  };

  const handlePauseTimer = () => {
    setIsPaused(true);
  };

  const handleResumeTimer = () => {
    setIsPaused(false);
    lastTickRef.current = Date.now();
  };

  const handleOpenFinish = () => {
    if (elapsedSeconds < 10) {
      if (!confirm('Session duration is less than 10 seconds. Do you still want to log it?')) {
        return;
      }
    }
    setIsPaused(true);
    setIsFinishModalOpen(true);
  };

  const handleDiscardTimer = () => {
    if (confirm('Discard current study session?')) {
      setIsRunning(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      setSessionStartTime(null);
    }
  };

  const handleSaveActiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionStartTime) return;

    const endTime = new Date();
    const selectedSub = subjects.find((s) => s.id === activeSubjectId);
    const nowIso = endTime.toISOString();

    const sessionTopic = activeTitle.trim() || 'Study Session';
    const newSession: StudySession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      topic: sessionTopic,
      title: sessionTopic,
      subjectId: activeSubjectId || undefined,
      subjectName: selectedSub ? selectedSub.name : undefined,
      actualStart: sessionStartTime.toISOString(),
      actualEnd: nowIso,
      startTime: sessionStartTime.toISOString(),
      endTime: nowIso,
      duration: elapsedSeconds,
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      durationSeconds: elapsedSeconds,
      status: 'completed',
      notes: activeNotes.trim() || undefined,
      rating: activeRating,
      type: 'stopwatch',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await saveStudySession(uid, newSession);

    // Reset stopwatch
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setSessionStartTime(null);
    setActiveTitle('');
    setActiveNotes('');
    setIsFinishModalOpen(false);
  };

  const handleSaveManualSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDate || manualDurationMins <= 0) return;

    setIsSavingManual(true);
    try {
      const selectedSub = subjects.find((s) => s.id === manualSubjectId);
      const start = new Date(`${manualDate}T12:00:00`);
      const end = new Date(start.getTime() + manualDurationMins * 60000);
      const nowIso = new Date().toISOString();
      const sessionTopic = manualTitle.trim() || 'Manual Study Session';

      const newSession: StudySession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        topic: sessionTopic,
        title: sessionTopic,
        subjectId: manualSubjectId || undefined,
        subjectName: selectedSub ? selectedSub.name : undefined,
        actualStart: start.toISOString(),
        actualEnd: end.toISOString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        duration: manualDurationMins * 60,
        durationMinutes: manualDurationMins,
        durationSeconds: manualDurationMins * 60,
        status: 'completed',
        notes: manualNotes.trim() || undefined,
        rating: manualRating,
        type: 'manual',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await saveStudySession(uid, newSession);
      setIsManualModalOpen(false);
      setManualTitle('');
      setManualNotes('');
      setManualDurationMins(60);
    } catch (err) {
      console.error('Failed to log manual session:', err);
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm('Delete this logged study session?')) {
      await deleteStudySession(uid, id);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (filterSubjectId !== 'all' && s.subjectId !== filterSubjectId) {
      return false;
    }
    return true;
  });

  const totalStudyMinutes = sessions.reduce((acc, s) => {
    const mins = s.durationMinutes ?? Math.round((s.duration || s.durationSeconds || 0) / 60);
    return acc + mins;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Active Stopwatch Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 border border-white/20 text-indigo-200 uppercase tracking-wider">
              {isRunning ? (isPaused ? 'Session Paused' : 'Live Studying') : 'Stopwatch Ready'}
            </span>
            <h3 className="text-xl font-extrabold tracking-tight">
              {isRunning ? (activeTitle || 'Active Study Block') : 'Ready to Focus?'}
            </h3>
            <p className="text-xs text-indigo-200/80 max-w-sm">
              Real stopwatch with pause-exclusion. Persisted safely to your Google account when finished.
            </p>
          </div>

          {/* Time Display */}
          <div className="flex flex-col items-center">
            <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-wider text-white bg-black/30 px-6 py-3 rounded-2xl border border-white/10 shadow-inner">
              {formatDurationSeconds(elapsedSeconds)}
            </div>
            {isRunning && isPaused && (
              <span className="text-[11px] text-amber-300 font-semibold mt-1">
                Paused (time not accumulating)
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                type="button"
                onClick={handleStartTimer}
                className="px-5 py-2.5 text-xs font-bold text-indigo-950 bg-white hover:bg-indigo-50 rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-indigo-950" />
                <span>Start Studying</span>
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    type="button"
                    onClick={handleResumeTimer}
                    className="p-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Resume"
                  >
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseTimer}
                    className="p-3 text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Pause"
                  >
                    <Pause className="w-4 h-4 fill-white" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenFinish}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Finish &amp; Log</span>
                </button>

                <button
                  type="button"
                  onClick={handleDiscardTimer}
                  className="p-3 text-slate-400 hover:text-rose-300 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  title="Discard"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header and Manual Log Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Study History &amp; Logs
            </h4>
            <p className="text-xs text-slate-500">
              Total Recorded: <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{(totalStudyMinutes / 60).toFixed(1)} hrs</span> ({sessions.length} sessions)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterSubjectId}
            onChange={(e) => setFilterSubjectId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Courses</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Past Session</span>
          </button>
        </div>
      </div>

      {/* History Log List */}
      {filteredSessions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No study sessions logged yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Start the stopwatch above when you study or manually log previous study blocks.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  {session.durationMinutes ?? Math.round((session.duration || 0) / 60)}m
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      {session.topic || session.title || 'Study Session'}
                    </h5>
                    {session.subjectName && (
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {session.subjectName}
                      </span>
                    )}
                    {session.type && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                        {session.type}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1 font-sans">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(session.actualStart || session.startTime || session.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      {new Date(session.actualStart || session.startTime || session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {(session.actualEnd || session.endTime) && ` – ${new Date(session.actualEnd || session.endTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                    {session.rating && (
                      <span className="flex items-center gap-0.5 text-amber-500 font-sans">
                        {Array.from({ length: session.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-500" />
                        ))}
                      </span>
                    )}
                  </div>

                  {session.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {session.notes}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteSession(session.id)}
                title="Delete session"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 self-end sm:self-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Finish Active Session Modal */}
      {isFinishModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Log Completed Study Session
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center font-mono">
              <span className="text-xs text-slate-500">Measured Duration:</span>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatDurationSeconds(elapsedSeconds)}
              </div>
            </div>

            <form onSubmit={handleSaveActiveSession} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic / What did you study?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 6 Problem Set, Quiz Revision..."
                  value={activeTitle}
                  onChange={(e) => setActiveTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Course / Subject
                </label>
                <select
                  value={activeSubjectId}
                  onChange={(e) => setActiveSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">No Course / General</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Focus / Quality Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setActiveRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= activeRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reflection / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Key concepts covered, questions to ask instructor..."
                  value={activeNotes}
                  onChange={(e) => setActiveNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFinishModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Back to Timer
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Log Past Study Session
            </h3>

            <form onSubmit={handleSaveManualSession} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Library Study Group, Homework Session"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={manualDurationMins}
                    onChange={(e) => setManualDurationMins(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Course / Subject
                </label>
                <select
                  value={manualSubjectId}
                  onChange={(e) => setManualSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">No Course / General</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Focus Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setManualRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= manualRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual || !manualTitle.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs"
                >
                  Save Manual Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
