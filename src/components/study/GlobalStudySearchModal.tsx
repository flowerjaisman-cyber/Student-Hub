import { useState, useMemo } from 'react';
import {
  StudyTask,
  StudyAssignment,
  StudyExam,
  TimetableEntry,
  StudyGoal,
  StudyHabit,
  StudySubject,
} from '../../types/index.ts';
import {
  Search,
  X,
  CheckSquare,
  FileCheck2,
  Hourglass,
  CalendarDays,
  Target,
  Flame,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface GlobalStudySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (tab: any, itemId?: string) => void;
  tasks: StudyTask[];
  assignments: StudyAssignment[];
  exams: StudyExam[];
  timetable: TimetableEntry[];
  goals: StudyGoal[];
  habits: StudyHabit[];
  subjects: StudySubject[];
}

export function GlobalStudySearchModal({
  isOpen,
  onClose,
  onSelectResult,
  tasks,
  assignments,
  exams,
  timetable,
  goals,
  habits,
  subjects,
}: GlobalStudySearchModalProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matches: {
      id: string;
      title: string;
      subtitle: string;
      type: 'task' | 'assignment' | 'exam' | 'timetable' | 'goal' | 'habit' | 'subject';
      targetTab: string;
    }[] = [];

    // Search tasks
    tasks.forEach((t) => {
      if (
        t.title.toLowerCase().includes(q) ||
        t.subjectName?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q)
      ) {
        matches.push({
          id: t.id,
          title: t.title,
          subtitle: `Task • Due: ${t.dueDate} • ${t.subjectName || 'General'}`,
          type: 'task',
          targetTab: 'tasks',
        });
      }
    });

    // Search assignments
    assignments.forEach((a) => {
      if (
        a.title.toLowerCase().includes(q) ||
        a.subjectName?.toLowerCase().includes(q) ||
        a.instructor?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q)
      ) {
        matches.push({
          id: a.id,
          title: a.title,
          subtitle: `Assignment • Due: ${a.dueDate} • ${a.subjectName || ''}`,
          type: 'assignment',
          targetTab: 'assignments',
        });
      }
    });

    // Search exams
    exams.forEach((e) => {
      if (
        e.title.toLowerCase().includes(q) ||
        e.subjectName?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
      ) {
        matches.push({
          id: e.id,
          title: e.title,
          subtitle: `Exam / ${e.type.toUpperCase()} • ${e.date} • ${e.subjectName || ''}`,
          type: 'exam',
          targetTab: 'exams',
        });
      }
    });

    // Search timetable
    timetable.forEach((tt) => {
      if (
        tt.title.toLowerCase().includes(q) ||
        tt.subjectName?.toLowerCase().includes(q) ||
        tt.location?.toLowerCase().includes(q) ||
        tt.instructor?.toLowerCase().includes(q)
      ) {
        matches.push({
          id: tt.id,
          title: tt.title,
          subtitle: `Timetable • ${tt.dayOfWeek} ${tt.startTime}–${tt.endTime}`,
          type: 'timetable',
          targetTab: 'timetable',
        });
      }
    });

    // Search goals
    goals.forEach((g) => {
      if (g.title.toLowerCase().includes(q) || g.notes?.toLowerCase().includes(q)) {
        matches.push({
          id: g.id,
          title: g.title,
          subtitle: `Goal • ${g.currentValue}/${g.targetValue} ${g.unit}`,
          type: 'goal',
          targetTab: 'goals',
        });
      }
    });

    // Search habits
    habits.forEach((h) => {
      const habitName = h.name || h.title || '';
      if (habitName.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q)) {
        matches.push({
          id: h.id,
          title: habitName || 'Habit',
          subtitle: `Daily Habit • ${h.icon || '📖'}`,
          type: 'habit',
          targetTab: 'habits',
        });
      }
    });

    // Search subjects
    subjects.forEach((s) => {
      if (
        s.name.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q) ||
        s.instructor?.toLowerCase().includes(q)
      ) {
        matches.push({
          id: s.id,
          title: s.name,
          subtitle: `Course • ${s.code || ''} ${s.instructor ? `• ${s.instructor}` : ''}`,
          type: 'subject',
          targetTab: 'today',
        });
      }
    });

    return matches.slice(0, 20);
  }, [query, tasks, assignments, exams, timetable, goals, habits, subjects]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'assignment':
        return <FileCheck2 className="w-4 h-4 text-blue-500" />;
      case 'exam':
        return <Hourglass className="w-4 h-4 text-rose-500" />;
      case 'timetable':
        return <CalendarDays className="w-4 h-4 text-indigo-500" />;
      case 'goal':
        return <Target className="w-4 h-4 text-amber-500" />;
      case 'habit':
        return <Flame className="w-4 h-4 text-orange-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search tasks, assignments, exams, classes, goals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {!query.trim() ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Type keywords to search your personal courses, tasks, exams, and routines.
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching study items found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((res) => (
                <button
                  key={`${res.type}_${res.id}`}
                  type="button"
                  onClick={() => {
                    onSelectResult(res.targetTab, res.id);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 shrink-0">
                      {getIcon(res.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {res.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {res.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
