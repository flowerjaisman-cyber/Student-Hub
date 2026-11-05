import { useState, useMemo } from 'react';
import {
  StudyTask,
  StudyTaskPriority,
  StudyTaskStatus,
  StudyTaskCategory,
  StudyTaskRecurrence,
  StudySubject,
} from '../../types/index.ts';
import { saveStudyTask, deleteStudyTask } from '../../services/studyService.ts';
import { getLocalDateString } from '../../utils/studyUtils.ts';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Filter,
  ArrowUpDown,
  Search,
  Repeat,
  Tag,
  Check,
} from 'lucide-react';

interface TasksManagerTabProps {
  uid: string;
  tasks: StudyTask[];
  subjects: StudySubject[];
  onOpenSubjectsModal?: () => void;
}

type FilterType =
  | 'all'
  | 'today'
  | 'upcoming'
  | 'overdue'
  | 'completed'
  | 'incomplete'
  | 'high_priority'
  | 'by_subject';

type SortType =
  | 'due_date_asc'
  | 'due_date_desc'
  | 'priority'
  | 'created'
  | 'alpha_asc'
  | 'alpha_desc';

const PRIORITY_ORDER: Record<StudyTaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function TasksManagerTab({
  uid,
  tasks,
  subjects,
  onOpenSubjectsModal,
}: TasksManagerTabProps) {
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [priority, setPriority] = useState<StudyTaskPriority>('medium');
  const [dueDate, setDueDate] = useState(getLocalDateString());
  const [dueTime, setDueTime] = useState('');
  const [category, setCategory] = useState<StudyTaskCategory>('study');
  const [estimatedDuration, setEstimatedDuration] = useState<number | ''>(45);
  const [recurrence, setRecurrence] = useState<StudyTaskRecurrence>('none');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('due_date_asc');
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = getLocalDateString();

  const resetForm = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setSubjectId('');
    setPriority('medium');
    setDueDate(getLocalDateString());
    setDueTime('');
    setCategory('study');
    setEstimatedDuration(45);
    setRecurrence('none');
    setNotes('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: StudyTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setSubjectId(task.subjectId || '');
    setPriority(task.priority);
    setDueDate(task.dueDate);
    setDueTime(task.dueTime || '');
    setCategory(task.category);
    setEstimatedDuration(task.estimatedDuration || '');
    setRecurrence(task.recurrence || 'none');
    setNotes(task.notes || '');
    setIsModalOpen(true);
  };

  const handleDuplicate = async (task: StudyTask) => {
    const now = new Date().toISOString();
    const copy: StudyTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: `${task.title} (Copy)`,
      status: 'todo',
      completedAt: undefined,
      createdAt: now,
      updatedAt: now,
    };
    await saveStudyTask(uid, copy);
  };

  const handleToggleComplete = async (task: StudyTask) => {
    const isCompleted = task.status === 'completed';
    const now = new Date().toISOString();

    // If recurring and completing, advance the due date to next occurrence
    if (!isCompleted && task.recurrence && task.recurrence !== 'none') {
      const currentDue = new Date(task.dueDate + 'T12:00:00Z');
      const nextDue = new Date(currentDue);

      if (task.recurrence === 'daily') {
        nextDue.setDate(nextDue.getDate() + 1);
      } else if (task.recurrence === 'weekdays') {
        const day = nextDue.getDay();
        if (day === 5) {
          // Friday -> Monday (+3)
          nextDue.setDate(nextDue.getDate() + 3);
        } else if (day === 6) {
          // Saturday -> Monday (+2)
          nextDue.setDate(nextDue.getDate() + 2);
        } else {
          nextDue.setDate(nextDue.getDate() + 1);
        }
      } else if (task.recurrence === 'weekly') {
        nextDue.setDate(nextDue.getDate() + 7);
      } else if (task.recurrence === 'monthly') {
        nextDue.setMonth(nextDue.getMonth() + 1);
      }

      await saveStudyTask(uid, {
        ...task,
        dueDate: getLocalDateString(nextDue),
        status: 'todo',
        updatedAt: now,
      });
      return;
    }

    const updated: StudyTask = {
      ...task,
      status: isCompleted ? 'todo' : 'completed',
      completedAt: isCompleted ? undefined : now,
      updatedAt: now,
    };
    await saveStudyTask(uid, updated);
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteStudyTask(uid, taskId);
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const selectedSub = subjects.find((s) => s.id === subjectId);

      const taskPayload: StudyTask = {
        id: editingTask ? editingTask.id : `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        description: description.trim() || undefined,
        subjectId: subjectId || undefined,
        subjectName: selectedSub ? selectedSub.name : undefined,
        priority,
        dueDate,
        dueTime: dueTime || undefined,
        status: editingTask ? editingTask.status : 'todo',
        category,
        estimatedDuration: typeof estimatedDuration === 'number' && estimatedDuration > 0 ? estimatedDuration : undefined,
        recurrence,
        notes: notes.trim() || undefined,
        completedAt: editingTask?.completedAt,
        createdAt: editingTask ? editingTask.createdAt : now,
        updatedAt: now,
      };

      await saveStudyTask(uid, taskPayload);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving task:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter & Sort tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesSub = task.subjectName?.toLowerCase().includes(q);
        const matchesNotes = task.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSub && !matchesNotes) return false;
      }

      // Filter logic
      switch (activeFilter) {
        case 'today':
          return task.dueDate === todayStr;
        case 'upcoming':
          return task.dueDate > todayStr && task.status !== 'completed';
        case 'overdue':
          return task.dueDate < todayStr && task.status !== 'completed';
        case 'completed':
          return task.status === 'completed';
        case 'incomplete':
          return task.status !== 'completed';
        case 'high_priority':
          return task.priority === 'high' || task.priority === 'urgent';
        case 'by_subject':
          if (filterSubjectId === 'all') return true;
          return task.subjectId === filterSubjectId;
        default:
          return true;
      }
    });
  }, [tasks, activeFilter, filterSubjectId, searchQuery, todayStr]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      switch (sortBy) {
        case 'due_date_asc':
          return a.dueDate.localeCompare(b.dueDate) || (a.dueTime || '').localeCompare(b.dueTime || '');
        case 'due_date_desc':
          return b.dueDate.localeCompare(a.dueDate) || (b.dueTime || '').localeCompare(a.dueTime || '');
        case 'priority':
          return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
        case 'created':
          return b.createdAt.localeCompare(a.createdAt);
        case 'alpha_asc':
          return a.title.localeCompare(b.title);
        case 'alpha_desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  }, [filteredTasks, sortBy]);

  const priorityBadge = (p: StudyTaskPriority) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">URGENT</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">MED</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar & search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks by title, course, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          {(
            [
              { id: 'all', label: `All (${tasks.length})` },
              { id: 'today', label: 'Due Today' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'incomplete', label: 'Incomplete' },
              { id: 'completed', label: 'Completed' },
              { id: 'high_priority', label: 'High / Urgent' },
              { id: 'by_subject', label: 'By Course' },
            ] as { id: FilterType; label: string }[]
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sorting & Subject selector */}
        <div className="flex items-center gap-2 shrink-0">
          {activeFilter === 'by_subject' && (
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Courses</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="due_date_asc">Due Date (Earliest)</option>
              <option value="due_date_desc">Due Date (Latest)</option>
              <option value="priority">Priority (Urgent first)</option>
              <option value="created">Recently Added</option>
              <option value="alpha_asc">Title A–Z</option>
              <option value="alpha_desc">Title Z–A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filter'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {tasks.length === 0
                ? 'Create your first academic or study task above. Everything stays private to your account.'
                : 'Try adjusting your search criteria or switching filter views.'}
            </p>
          </div>
          {tasks.length === 0 && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isOverdue = !isCompleted && task.dueDate < todayStr;
            const isDueToday = !isCompleted && task.dueDate === todayStr;

            return (
              <div
                key={task.id}
                className={`group p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isCompleted
                    ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-70'
                    : isOverdue
                    ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-2xs'
                }`}
              >
                {/* Left: Checkbox + details */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 cursor-pointer"
                    aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`text-sm font-bold truncate ${
                          isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                      {priorityBadge(task.priority)}
                      {task.recurrence && task.recurrence !== 'none' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <Repeat className="w-2.5 h-2.5" />
                          <span className="capitalize">{task.recurrence}</span>
                        </span>
                      )}
                      {task.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                          {task.category}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
                      {task.subjectName && (
                        <span className="font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {task.subjectName}
                        </span>
                      )}
                      <span
                        className={`flex items-center gap-1 font-mono ${
                          isOverdue
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : isDueToday
                            ? 'text-amber-600 dark:text-amber-400 font-bold'
                            : ''
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {task.dueDate} {task.dueTime ? `at ${task.dueTime}` : ''}
                        {isOverdue && ' (Overdue)'}
                        {isDueToday && ' (Today)'}
                      </span>
                      {task.estimatedDuration && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {task.estimatedDuration}m
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDuplicate(task)}
                    title="Duplicate Task"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(task)}
                    title="Edit Task"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    title="Delete Task"
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTask ? 'Edit Study Task' : 'Create New Study Task'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read Chapter 4 of Macroeconomics, Finish Lab 2 code..."
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
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as StudyTaskCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white capitalize"
                  >
                    <option value="study">Study</option>
                    <option value="assignment">Assignment</option>
                    <option value="revision">Revision</option>
                    <option value="personal">Personal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Recurrence
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as StudyTaskRecurrence)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="none">No Recurrence (One-time)</option>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays (Mon–Fri)</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Est. Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    placeholder="e.g. 45"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Sub-tasks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context or checklist..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  <Check className="w-4 h-4" />
                  <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
