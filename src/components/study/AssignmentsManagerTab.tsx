import { useState, useMemo } from 'react';
import {
  StudyAssignment,
  AssignmentStatus,
  StudyTaskPriority,
  StudySubject,
} from '../../types/index.ts';
import { saveAssignment, deleteAssignment } from '../../services/studyService.ts';
import {
  getAssignmentDeadlineState,
  getLocalDateString,
} from '../../utils/studyUtils.ts';
import {
  FileCheck2,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Send,
  Loader2,
  Tag,
  BookOpen,
} from 'lucide-react';

interface AssignmentsManagerTabProps {
  uid: string;
  assignments: StudyAssignment[];
  subjects: StudySubject[];
  onOpenSubjectsModal?: () => void;
}

export function AssignmentsManagerTab({
  uid,
  assignments,
  subjects,
  onOpenSubjectsModal,
}: AssignmentsManagerTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<StudyAssignment | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [description, setDescription] = useState('');
  const [instructor, setInstructor] = useState('');
  const [assignedDate, setAssignedDate] = useState(getLocalDateString());
  const [dueDate, setDueDate] = useState(getLocalDateString());
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<StudyTaskPriority>('medium');
  const [estimatedStudyTime, setEstimatedStudyTime] = useState<number | ''>(120);
  const [status, setStatus] = useState<AssignmentStatus>('not_started');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const resetForm = () => {
    setEditingAssignment(null);
    setTitle('');
    setSubjectId('');
    setDescription('');
    setInstructor('');
    setAssignedDate(getLocalDateString());
    setDueDate(getLocalDateString());
    setDueTime('23:59');
    setPriority('medium');
    setEstimatedStudyTime(120);
    setStatus('not_started');
    setNotes('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: StudyAssignment) => {
    setEditingAssignment(a);
    setTitle(a.title);
    setSubjectId(a.subjectId || '');
    setDescription(a.description || '');
    setInstructor(a.instructor || '');
    setAssignedDate(a.assignedDate || getLocalDateString());
    setDueDate(a.dueDate);
    setDueTime(a.dueTime || '23:59');
    setPriority(a.priority);
    setEstimatedStudyTime(a.estimatedStudyTime || '');
    setStatus(a.status);
    setNotes(a.notes || '');
    setIsModalOpen(true);
  };

  const handleQuickStatusChange = async (assignment: StudyAssignment, newStatus: AssignmentStatus) => {
    await saveAssignment(uid, {
      ...assignment,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      await deleteAssignment(uid, id);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const selectedSub = subjects.find((s) => s.id === subjectId);

      const payload: StudyAssignment = {
        id: editingAssignment ? editingAssignment.id : `asgn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        subjectId: subjectId || undefined,
        subjectName: selectedSub ? selectedSub.name : undefined,
        description: description.trim() || undefined,
        instructor: instructor.trim() || undefined,
        assignedDate: assignedDate || undefined,
        dueDate,
        dueTime: dueTime || undefined,
        priority,
        estimatedStudyTime: typeof estimatedStudyTime === 'number' && estimatedStudyTime > 0 ? estimatedStudyTime : undefined,
        status,
        notes: notes.trim() || undefined,
        createdAt: editingAssignment ? editingAssignment.createdAt : now,
        updatedAt: now,
      };

      await saveAssignment(uid, payload);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save assignment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesSub = a.subjectName?.toLowerCase().includes(q);
        const matchesInst = a.instructor?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSub && !matchesInst) return false;
      }

      if (statusFilter !== 'all' && a.status !== statusFilter) {
        return false;
      }

      if (subjectFilter !== 'all' && a.subjectId !== subjectFilter) {
        return false;
      }

      return true;
    });
  }, [assignments, searchQuery, statusFilter, subjectFilter]);

  return (
    <div className="space-y-6">
      {/* Top action and filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search assignments by title, course, professor..."
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
            <span>Add Assignment</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          {[
            { id: 'all', label: `All (${assignments.length})` },
            { id: 'not_started', label: 'Not Started' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'completed', label: 'Completed' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Courses</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {assignments.length === 0 ? 'No assignments yet' : 'No matching assignments'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {assignments.length === 0
                ? 'Track your homework, lab reports, essays, and papers with accurate deadline states.'
                : 'Try adjusting your filters or search keywords.'}
            </p>
          </div>
          {assignments.length === 0 && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredAssignments.map((asgn) => {
            const deadlineInfo = getAssignmentDeadlineState(asgn.dueDate, asgn.dueTime, asgn.status);

            return (
              <div
                key={asgn.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-2xs transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${deadlineInfo.colorClass}`}
                        >
                          {deadlineInfo.label}
                        </span>
                        {asgn.subjectName && (
                          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                            {asgn.subjectName}
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                          {asgn.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                        {asgn.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(asgn)}
                        title="Edit"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(asgn.id)}
                        title="Delete"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {asgn.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                      {asgn.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Due: {asgn.dueDate} {asgn.dueTime ? `(${asgn.dueTime})` : ''}
                    </span>
                    {asgn.estimatedStudyTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Est. {asgn.estimatedStudyTime} mins
                      </span>
                    )}
                    {asgn.instructor && (
                      <span className="font-sans text-slate-600 dark:text-slate-400">
                        Prof: {asgn.instructor}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Update status:</span>
                  <div className="flex items-center gap-1.5">
                    {asgn.status !== 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(asgn, 'in_progress')}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                      >
                        In Progress
                      </button>
                    )}
                    {asgn.status !== 'submitted' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(asgn, 'submitted')}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                      >
                        Submitted
                      </button>
                    )}
                    {asgn.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(asgn, 'completed')}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                      >
                        Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAssignment ? 'Edit Assignment' : 'New Assignment'}
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
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Problem Set 5, Research Essay First Draft..."
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
                    Instructor (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Davis"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
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
                    Due Time
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
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white capitalize"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Study Time (Mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    placeholder="e.g. 120"
                    value={estimatedStudyTime}
                    onChange={(e) => setEstimatedStudyTime(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Deliverables
                </label>
                <textarea
                  rows={2}
                  placeholder="Outline requirements, submission portal links, formatting..."
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
                  <FileCheck2 className="w-4 h-4" />
                  <span>{editingAssignment ? 'Save Changes' : 'Create Assignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
