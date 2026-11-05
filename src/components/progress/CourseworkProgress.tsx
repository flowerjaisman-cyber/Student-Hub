import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  FileCheck2,
  Calendar,
  AlertCircle,
  Filter,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { StudyTask, StudyAssignment, StudySubject } from '../../types/index.ts';
import { ProgressEmptyState } from './ProgressEmptyState.tsx';

interface CourseworkProgressProps {
  tasks: StudyTask[];
  assignments: StudyAssignment[];
  subjects: StudySubject[];
  onNavigateToStudyItem?: (tab: string, itemId: string) => void;
}

type UnifiedCourseworkItem = {
  id: string;
  itemType: 'task' | 'assignment';
  title: string;
  subjectName?: string;
  subjectId?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'completed' | 'in_progress' | 'pending' | 'overdue';
  updatedAt: string;
  raw: StudyTask | StudyAssignment;
};

export function CourseworkProgress({
  tasks,
  assignments,
  subjects,
  onNavigateToStudyItem,
}: CourseworkProgressProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'subject' | 'updatedAt'>('dueDate');

  const todayStr = new Date().toISOString().split('T')[0];

  // Aggregate into unified list
  const unifiedItems: UnifiedCourseworkItem[] = useMemo(() => {
    const list: UnifiedCourseworkItem[] = [];

    // Map tasks
    tasks.forEach((t) => {
      let status: UnifiedCourseworkItem['status'] = 'pending';
      if (t.status === 'completed') {
        status = 'completed';
      } else if (t.status === 'in_progress') {
        status = 'in_progress';
      } else if (t.dueDate && t.dueDate < todayStr) {
        status = 'overdue';
      }

      list.push({
        id: t.id,
        itemType: 'task',
        title: t.title,
        subjectName: t.subjectName,
        subjectId: t.subjectId,
        dueDate: t.dueDate,
        priority: t.priority || 'medium',
        status,
        updatedAt: t.updatedAt || t.createdAt || '',
        raw: t,
      });
    });

    // Map assignments
    assignments.forEach((a) => {
      let status: UnifiedCourseworkItem['status'] = 'pending';
      if (a.status === 'submitted' || a.status === 'completed') {
        status = 'completed';
      } else if (a.status === 'in_progress') {
        status = 'in_progress';
      } else if (a.dueDate && a.dueDate < todayStr) {
        status = 'overdue';
      }

      list.push({
        id: a.id,
        itemType: 'assignment',
        title: a.title,
        subjectName: a.subjectName,
        subjectId: a.subjectId,
        dueDate: a.dueDate,
        priority: a.priority || 'medium',
        status,
        updatedAt: a.updatedAt || a.createdAt || '',
        raw: a,
      });
    });

    return list;
  }, [tasks, assignments, todayStr]);

  // Counts by status
  const counts = useMemo(() => {
    return {
      total: unifiedItems.length,
      completed: unifiedItems.filter((i) => i.status === 'completed').length,
      in_progress: unifiedItems.filter((i) => i.status === 'in_progress').length,
      pending: unifiedItems.filter((i) => i.status === 'pending').length,
      overdue: unifiedItems.filter((i) => i.status === 'overdue').length,
    };
  }, [unifiedItems]);

  // Priority weights for sorting
  const priorityWeight: Record<string, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return unifiedItems
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchSubject = item.subjectName?.toLowerCase().includes(q);
          if (!matchTitle && !matchSubject) return false;
        }
        if (selectedSubjectId !== 'all') {
          if (item.subjectId !== selectedSubjectId && item.subjectName !== selectedSubjectId) {
            return false;
          }
        }
        if (selectedStatus !== 'all' && item.status !== selectedStatus) {
          return false;
        }
        if (selectedPriority !== 'all' && item.priority !== selectedPriority) {
          return false;
        }
        if (selectedType !== 'all' && item.itemType !== selectedType) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (sortBy === 'priority') {
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        }
        if (sortBy === 'subject') {
          return (a.subjectName || '').localeCompare(b.subjectName || '');
        }
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      });
  }, [
    unifiedItems,
    searchQuery,
    selectedSubjectId,
    selectedStatus,
    selectedPriority,
    selectedType,
    sortBy,
  ]);

  if (unifiedItems.length === 0) {
    return (
      <ProgressEmptyState
        icon={<CheckSquare className="w-6 h-6 text-indigo-500" />}
        title="No coursework records found"
        description="Add tasks or assignments in the Study Planner to track their deadlines, priorities, and completion progress here."
      />
    );
  }

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'high':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'medium':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusBadge = (s: UnifiedCourseworkItem['status']) => {
    switch (s) {
      case 'completed':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'in_progress':
        return 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
      case 'overdue':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Status Tabs / Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          type="button"
          onClick={() => setSelectedStatus('all')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'all'
              ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">All Items</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            {counts.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('completed')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'completed'
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">
            Completed
          </span>
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono">
            {counts.completed}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('in_progress')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'in_progress'
              ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[11px] text-cyan-600 dark:text-cyan-400 block font-medium">
            In Progress
          </span>
          <span className="text-lg font-bold text-cyan-700 dark:text-cyan-300 font-mono">
            {counts.in_progress}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('pending')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'pending'
              ? 'border-slate-500 bg-slate-100 dark:bg-slate-800'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Pending</span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono">
            {counts.pending}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('overdue')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            selectedStatus === 'overdue'
              ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[11px] text-rose-600 dark:text-rose-400 block font-medium">
            Overdue
          </span>
          <span className="text-lg font-bold text-rose-700 dark:text-rose-300 font-mono">
            {counts.overdue}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coursework title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Subject Filter */}
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="task">Tasks Only</option>
          <option value="assignment">Assignments Only</option>
        </select>

        {/* Priority Filter */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Sort By */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pl-1">
          <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="subject">Sort by Subject</option>
            <option value="updatedAt">Sort by Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Coursework Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No coursework matches the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map((item) => (
              <div
                key={`${item.itemType}_${item.id}`}
                className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="shrink-0">
                    {item.itemType === 'task' ? (
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{item.itemType === 'task' ? 'Study Task' : 'Assignment'}</span>
                      {item.subjectName && <span>• {item.subjectName}</span>}
                      {item.dueDate && <span>• Due: {item.dueDate}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${getPriorityBadge(
                      item.priority
                    )}`}
                  >
                    {item.priority}
                  </span>

                  {onNavigateToStudyItem && (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateToStudyItem(
                          item.itemType === 'task' ? 'tasks' : 'assignments',
                          item.id
                        )
                      }
                      title="Open in Study Planner"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
