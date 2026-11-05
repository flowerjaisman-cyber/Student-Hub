import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Plus,
  ArrowRight,
  BookOpen,
  GraduationCap,
  ListTodo,
} from 'lucide-react';
import {
  StudyTask,
  StudyAssignment,
  StudyExam,
  StudyHabit,
  StudySubject,
  AIProposedAction,
} from '../../types/index.ts';
import {
  generateStudyPlan,
  StudyPlanGenerateResponse,
  StudyPlanSuggestionItem,
  executeAIProposedAction,
  saveUserAIMaterial,
} from '../../services/aiStudyService.ts';
import { AIActionConfirmationModal } from './AIActionConfirmationModal.tsx';

interface AIStudyPlanGeneratorProps {
  userId: string;
  subjects: StudySubject[];
  tasks: StudyTask[];
  assignments: StudyAssignment[];
  exams: StudyExam[];
  habits: StudyHabit[];
  onSuccessToast?: (msg: string) => void;
}

export const AIStudyPlanGenerator: React.FC<AIStudyPlanGeneratorProps> = ({
  userId,
  subjects,
  tasks,
  assignments,
  exams,
  habits,
  onSuccessToast,
}) => {
  const [availableHours, setAvailableHours] = useState<number>(2.5);
  const [targetDate, setTargetDate] = useState<string>('');
  const [customFocus, setCustomFocus] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Plan result state
  const [planResult, setPlanResult] = useState<StudyPlanGenerateResponse | null>(null);

  // Selected suggested task to add
  const [selectedTaskToAdd, setSelectedTaskToAdd] = useState<StudyPlanSuggestionItem | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  const handleGeneratePlan = async () => {
    setErrorMsg(null);
    setIsGenerating(true);

    try {
      const res = await generateStudyPlan({
        availableHoursPerDay: availableHours,
        targetDate: targetDate || undefined,
        subjects: subjects.map((s) => ({ name: s.name, color: s.color })),
        tasks: tasks.filter((t) => t.status !== 'completed').map((t) => ({
          title: t.title,
          priority: t.priority,
          dueDate: t.dueDate,
        })),
        assignments: assignments.filter((a) => a.status !== 'completed').map((a) => ({
          title: a.title,
          dueDate: a.dueDate,
        })),
        exams: exams.filter((e) => !e.completed).map((e) => ({
          title: e.title,
          examDate: e.date,
        })),
        habits: habits.map((h) => ({ name: h.name })),
        customFocus: customFocus || undefined,
      });

      setPlanResult(res);
    } catch (err: any) {
      console.error('Study plan generation failed:', err);
      setErrorMsg(err.message || 'Failed to generate study plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenAddTaskModal = (item: StudyPlanSuggestionItem) => {
    setSelectedTaskToAdd(item);
    setActionModalOpen(true);
  };

  const handleConfirmAddTask = async () => {
    if (!selectedTaskToAdd) return;
    setIsExecutingAction(true);
    try {
      const proposedAction: AIProposedAction = {
        id: `act_${Date.now()}`,
        type: 'create_task',
        title: `Add Task: ${selectedTaskToAdd.title}`,
        description: selectedTaskToAdd.description || 'Add suggested study block into Study Planner tasks',
        payload: {
          title: selectedTaskToAdd.title,
          priority: selectedTaskToAdd.priority || 'medium',
          estimatedMinutes: selectedTaskToAdd.estimatedMinutes || 45,
          notes: selectedTaskToAdd.description,
          dueDate: selectedTaskToAdd.date || targetDate || new Date().toISOString().split('T')[0],
        },
      };

      await executeAIProposedAction(userId, proposedAction);
      setActionModalOpen(false);
      onSuccessToast?.(`Added "${selectedTaskToAdd.title}" to your Study Planner!`);
    } catch (err: any) {
      console.error('Failed to create task:', err);
    } finally {
      setIsExecutingAction(false);
    }
  };

  const handleSavePlanToMaterials = async () => {
    if (!planResult) return;
    try {
      await saveUserAIMaterial(userId, {
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        title: planResult.planTitle || 'AI Recommended Study Schedule',
        category: 'study-plan',
        content: planResult.overview,
        data: planResult,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onSuccessToast?.('Saved Study Plan to My Study Materials!');
    } catch (err: any) {
      console.error('Failed to save plan:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Schedule Parameters Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI Study Plan Generator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grounded strictly in your real enrolled subjects, upcoming assignments, and deadlines
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-40"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Building Study Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Plan</span>
              </>
            )}
          </button>
        </div>

        {/* Real Data Context Indicators */}
        <div className="py-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Live Context:</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
            {subjects.length} Subjects
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
            {tasks.filter((t) => t.status !== 'completed').length} Pending Tasks
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
            {assignments.length} Assignments
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
            {exams.length} Exams
          </span>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Available Time (Hours / Day)
            </label>
            <div className="flex items-center gap-2">
              {[1.5, 2.5, 4, 6].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => setAvailableHours(hrs)}
                  className={`flex-1 py-1.5 rounded-lg border font-semibold text-center transition-colors cursor-pointer ${
                    availableHours === hrs
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {hrs}h
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Completion Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Specific Study Focus (Optional)
            </label>
            <input
              type="text"
              value={customFocus}
              onChange={(e) => setCustomFocus(e.target.value)}
              placeholder="e.g. Focus on Midterm Physics chapters"
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Generated Plan Suggestions */}
      {planResult && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 text-[10px] font-bold uppercase tracking-wider mb-1">
                  AI Suggestions • Not yet committed to database
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {planResult.planTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {planResult.overview}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSavePlanToMaterials}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                <Bookmark className="w-4 h-4" />
                <span>Save to My Materials</span>
              </button>
            </div>

            {/* Daily Breakdown Schedule */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Daily Pacing Breakdown</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {planResult.dailyBreakdown.map((day, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{day.day}</span>
                      <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                        {day.suggestedMinutes} mins
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Focus: {day.focus}
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside">
                      {day.tasks.map((task, tIdx) => (
                        <li key={tIdx}>{task}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Suggested Tasks (Can be added to StudentHub) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-emerald-500" />
                  <span>Actionable Study Tasks (Click to Add to StudentHub)</span>
                </h4>
              </div>

              <div className="space-y-2.5">
                {planResult.actionableTasks.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 flex items-center justify-between gap-4 text-xs hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 capitalize">
                          {item.priority || 'medium'} priority
                        </span>
                        {item.estimatedMinutes && (
                          <span className="text-[10px] font-mono text-slate-400">
                            ~{item.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddTaskModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Tasks</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Tips */}
            {planResult.tips && planResult.tips.length > 0 && (
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs">
                <span className="font-bold text-blue-900 dark:text-blue-300 block mb-1.5">
                  Academic Strategy Tips:
                </span>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300 list-disc list-inside">
                  {planResult.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionModalOpen && selectedTaskToAdd && (
        <AIActionConfirmationModal
          isOpen={actionModalOpen}
          action={{
            id: `act_${selectedTaskToAdd.id}`,
            type: 'create_task',
            title: `Add Task: ${selectedTaskToAdd.title}`,
            description: selectedTaskToAdd.description || 'Schedule this task into your Study Planner.',
            payload: {
              title: selectedTaskToAdd.title,
              estimatedMinutes: selectedTaskToAdd.estimatedMinutes || 45,
              priority: selectedTaskToAdd.priority || 'medium',
              dueDate: selectedTaskToAdd.date || targetDate || new Date().toISOString().split('T')[0],
            },
          }}
          onConfirm={handleConfirmAddTask}
          onCancel={() => setActionModalOpen(false)}
          isExecuting={isExecutingAction}
        />
      )}
    </div>
  );
};
