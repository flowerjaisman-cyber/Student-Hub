import { localDb } from '../lib/localDb.ts';
import {
  StudyTask,
  StudyAssignment,
  StudyExam,
  TimetableEntry,
  StudySession,
  StudyGoal,
  StudyHabit,
  HabitCheck,
  StudySubject,
  PomodoroRecord,
} from '../types/index.ts';

export type Unsubscribe = () => void;

// ==========================================
// 1. STUDY TASKS
// ==========================================
export async function saveStudyTask(uid: string, task: StudyTask): Promise<void> {
  localDb.saveItem('studyTasks', uid, { ...task, updatedAt: new Date().toISOString() });
}

export async function deleteStudyTask(uid: string, taskId: string): Promise<void> {
  localDb.deleteItem('studyTasks', uid, taskId);
}

export function subscribeStudyTasks(
  uid: string,
  onUpdate: (tasks: StudyTask[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<StudyTask>('studyTasks', uid, onUpdate, {
    orderByField: 'createdAt',
    orderDirection: 'desc',
  });
}

// ==========================================
// 2. ASSIGNMENTS
// ==========================================
export async function saveAssignment(uid: string, assignment: StudyAssignment): Promise<void> {
  localDb.saveItem('assignments', uid, { ...assignment, updatedAt: new Date().toISOString() });
}

export async function deleteAssignment(uid: string, assignmentId: string): Promise<void> {
  localDb.deleteItem('assignments', uid, assignmentId);
}

export function subscribeAssignments(
  uid: string,
  onUpdate: (items: StudyAssignment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<StudyAssignment>('assignments', uid, onUpdate, {
    orderByField: 'dueDate',
    orderDirection: 'asc',
  });
}

// ==========================================
// 3. EXAMS
// ==========================================
export async function saveExam(uid: string, exam: StudyExam): Promise<void> {
  localDb.saveItem('exams', uid, { ...exam, updatedAt: new Date().toISOString() });
}

export async function deleteExam(uid: string, examId: string): Promise<void> {
  localDb.deleteItem('exams', uid, examId);
}

export const saveStudyExam = saveExam;
export const deleteStudyExam = deleteExam;

export function subscribeExams(
  uid: string,
  onUpdate: (items: StudyExam[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<StudyExam>('exams', uid, onUpdate, {
    orderByField: 'examDate',
    orderDirection: 'asc',
  });
}

export const subscribeStudyExams = subscribeExams;

// ==========================================
// 4. TIMETABLE
// ==========================================
export async function saveTimetableEntry(uid: string, entry: TimetableEntry): Promise<void> {
  localDb.saveItem('timetable', uid, { ...entry, updatedAt: new Date().toISOString() });
}

export async function deleteTimetableEntry(uid: string, entryId: string): Promise<void> {
  localDb.deleteItem('timetable', uid, entryId);
}

export function subscribeTimetable(
  uid: string,
  onUpdate: (items: TimetableEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<TimetableEntry>('timetable', uid, onUpdate, {
    orderByField: 'startTime',
    orderDirection: 'asc',
  });
}

// ==========================================
// 5. STUDY SESSIONS
// ==========================================
export async function saveStudySession(uid: string, session: StudySession): Promise<void> {
  localDb.saveItem('studySessions', uid, { ...session, updatedAt: new Date().toISOString() });
}

export async function deleteStudySession(uid: string, sessionId: string): Promise<void> {
  localDb.deleteItem('studySessions', uid, sessionId);
}

export function subscribeStudySessions(
  uid: string,
  onUpdate: (items: StudySession[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<StudySession>('studySessions', uid, onUpdate, {
    orderByField: 'actualStart',
    orderDirection: 'desc',
  });
}

// ==========================================
// 6. STUDY GOALS
// ==========================================
export async function saveStudyGoal(uid: string, goal: StudyGoal): Promise<void> {
  localDb.saveItem('studyGoals', uid, { ...goal, updatedAt: new Date().toISOString() });
}

export async function deleteStudyGoal(uid: string, goalId: string): Promise<void> {
  localDb.deleteItem('studyGoals', uid, goalId);
}

export function subscribeStudyGoals(
  uid: string,
  onUpdate: (items: StudyGoal[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<StudyGoal>('studyGoals', uid, onUpdate, {
    orderByField: 'createdAt',
    orderDirection: 'desc',
  });
}

// ==========================================
// 7. STUDY HABITS & CHECKS
// ==========================================
export async function saveStudyHabit(uid: string, habit: StudyHabit): Promise<void> {
  localDb.saveItem('studyHabits', uid, { ...habit, updatedAt: new Date().toISOString() });
}

export async function deleteStudyHabit(uid: string, habitId: string): Promise<void> {
  localDb.deleteItem('studyHabits', uid, habitId);
}

export function subscribeStudyHabits(
  uid: string,
  onUpdate: (items: StudyHabit[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<StudyHabit>('studyHabits', uid, onUpdate);
}

export async function saveHabitCheck(uid: string, check: HabitCheck): Promise<void> {
  localDb.saveItem('habitChecks', uid, check);
}

export async function recordHabitCheck(
  uid: string,
  habitId: string,
  date: string,
  completed: boolean = true
): Promise<void> {
  const checkId = `check_${habitId}_${date}`;
  await saveHabitCheck(uid, {
    id: checkId,
    habitId,
    date,
    completed,
    timestamp: new Date().toISOString(),
  });
}

export async function deleteHabitCheck(uid: string, checkId: string): Promise<void> {
  localDb.deleteItem('habitChecks', uid, checkId);
}

export async function removeHabitCheck(uid: string, checkId: string): Promise<void> {
  await deleteHabitCheck(uid, checkId);
}

export function subscribeHabitChecks(
  uid: string,
  onUpdate: (items: HabitCheck[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<HabitCheck>('habitChecks', uid, onUpdate);
}

// ==========================================
// 8. SUBJECTS
// ==========================================
export async function saveSubject(uid: string, subject: StudySubject): Promise<void> {
  localDb.saveItem('subjects', uid, { ...subject, updatedAt: new Date().toISOString() });
}

export async function deleteSubject(uid: string, subjectId: string): Promise<void> {
  localDb.deleteItem('subjects', uid, subjectId);
}

export function subscribeSubjects(
  uid: string,
  onUpdate: (items: StudySubject[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<StudySubject>('subjects', uid, onUpdate);
}

// ==========================================
// 9. POMODORO RECORDS
// ==========================================
export async function savePomodoroRecord(uid: string, record: PomodoroRecord): Promise<void> {
  localDb.saveItem('pomodoroSessions', uid, record);
}

export function subscribePomodoroRecords(
  uid: string,
  onUpdate: (items: PomodoroRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<PomodoroRecord>('pomodoroSessions', uid, onUpdate, {
    orderByField: 'completedAt',
    orderDirection: 'desc',
  });
}

// Aliases for compatibility
export const subscribeStudyAssignments = subscribeAssignments;
export const subscribeStudySubjects = subscribeSubjects;
