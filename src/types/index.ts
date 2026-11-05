/**
 * Core application data models and type definitions for StudentHub
 */

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AppearanceMode = 'system' | 'light' | 'dark';

export interface UserSettings {
  appearance: AppearanceMode;
  language: string;
  compactView: boolean;
  updatedAt: string;
}

export type DocumentCategory =
  | 'Blank'
  | 'Assignment'
  | 'Study Notes'
  | 'Project Report'
  | 'Class Summary'
  | 'Meeting Notes'
  | 'Personal Notes'
  | 'Notes'
  | 'Report'
  | 'Application'
  | 'Resume'
  | 'Letter'
  | 'Project'
  | 'Other';

export type PageSize = 'A4' | 'A5' | 'Letter' | 'Legal';
export type PageOrientation = 'portrait' | 'landscape';
export type PageMarginPreset = 'normal' | 'narrow' | 'wide' | 'custom';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface UserDocument {
  id: string;
  userId?: string;
  title: string;
  content: string;
  category?: DocumentCategory | string;
  docType?: string;
  type?: string;
  pageSize?: PageSize;
  orientation?: PageOrientation;
  margins?: PageMarginPreset;
  customMargins?: PageMargins;
  fontFamily?: string;
  fontSize?: string;
  wordCount?: number;
  charCount?: number;
  charWithoutSpacesCount?: number;
  paragraphCount?: number;
  readingTimeMinutes?: number;
  folderId?: string | null;
  isStarred?: boolean;
  starred?: boolean;
  isTrashed?: boolean;
  deleted?: boolean;
  deletedAt?: string | null;
  storagePath?: string;
  exportedFileId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  // Phase 9 extensions:
  originalName?: string;
  storagePath?: string;
  downloadUrl?: string;
  extension?: string;
  folderId?: string | null;
  updatedAt?: string;
  uploadedAt?: string;
  lastAccessedAt?: string;
  deleted?: boolean;
  deletedAt?: string | null;
  previousFolderId?: string | null;
  starred?: boolean;
  width?: number;
  height?: number;
  pageCount?: number;
}

export interface CloudFolder {
  id: string;
  name: string;
  parentFolderId?: string | null;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
  deletedAt?: string | null;
  starred?: boolean;
  color?: string;
}

export interface FileUploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  folderId?: string | null;
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  status: 'queued' | 'uploading' | 'saving' | 'completed' | 'failed' | 'paused' | 'canceled';
  error?: string;
  cancelFn?: () => void;
  pauseFn?: () => void;
  resumeFn?: () => void;
}

export type FileSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'newest'
  | 'oldest'
  | 'largest'
  | 'smallest'
  | 'type';

export type FileFilterCategory =
  | 'all'
  | 'documents'
  | 'pdf'
  | 'images'
  | 'spreadsheets'
  | 'presentations'
  | 'text'
  | 'archives'
  | 'starred'
  | 'trash';

export type FileViewMode = 'list' | 'grid';

export interface UserActivity {
  id: string;
  action: string;
  timestamp: string;
}

export type WritingToolId =
  | 'formatter'
  | 'case-converter'
  | 'cleaner'
  | 'duplicate-remover'
  | 'find-replace'
  | 'compare'
  | 'readability'
  | 'sentence-paragraph'
  | 'list-numbering'
  | 'citation'
  | 'writing-pad'
  | 'spellcheck';

export type CitationStyle = 'apa7' | 'mla9' | 'chicago' | 'harvard';
export type CitationSourceType = 'journal' | 'book' | 'website' | 'chapter' | 'conference';

export interface CitationSource {
  id: string;
  sourceType: CitationSourceType;
  authors: string;
  title: string;
  publicationTitle?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  edition?: string;
  year?: string;
  pages?: string;
  url?: string;
  accessDate?: string;
  doi?: string;
}

export interface ReadabilityMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  avgCharsPerWord: number;
  readingTimeMinutes: number;
  fleschReadingEase?: number;
  fleschKincaidGrade?: number;
  isEnglishOrLatin: boolean;
  detectedScript: 'Latin' | 'Urdu/Arabic' | 'Mixed/Other';
}

export type NavSection =
  | 'dashboard'
  | 'attendance'
  | 'progress'
  | 'image-tools'
  | 'pdf-docs'
  | 'documents'
  | 'writing-tools'
  | 'calculators'
  | 'study-tools'
  | 'my-files'
  | 'ai-study'
  | 'settings';

export * from './progress.ts';
export * from './attendance.ts';

export type CalculatorCategory =
  | 'academic'
  | 'math'
  | 'date-time'
  | 'measurement'
  | 'finance';

export type CalculatorId =
  // Academic
  | 'percentage-marks'
  | 'gpa'
  | 'cgpa'
  | 'grade'
  | 'weighted-average'
  // Mathematics
  | 'basic'
  | 'scientific'
  | 'fraction'
  | 'ratio'
  | 'percentage-change'
  | 'statistics'
  | 'random-number'
  // Date & Time
  | 'age'
  | 'date-difference'
  | 'add-subtract-dates'
  | 'time-duration'
  | 'exam-countdown'
  // Measurement
  | 'length'
  | 'weight'
  | 'temperature'
  | 'area'
  | 'volume'
  | 'speed'
  | 'time-unit'
  | 'data-storage'
  | 'currency'
  // Finance
  | 'simple-interest'
  | 'compound-interest'
  | 'emi'
  | 'savings'
  | 'discount'
  | 'markup'
  | 'profit-loss';

export interface SavedCalculationItem {
  id: string;
  title: string;
  calculatorType: CalculatorId;
  calculatorName: string;
  inputs: Record<string, any>;
  result: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  targetDate?: string; // For countdowns
}

export interface CalculationHistoryItem {
  id: string;
  calculatorId: CalculatorId;
  calculatorName: string;
  expression: string;
  result: string;
  timestamp: string;
}

// ==========================================
// PHASE 8: STUDY PLANNER & PRODUCTIVITY TYPES
// ==========================================

export type StudyToolsTab =
  | 'today'
  | 'tasks'
  | 'assignments'
  | 'exams'
  | 'timetable'
  | 'sessions'
  | 'goals'
  | 'habits'
  | 'pomodoro'
  | 'progress'
  | 'subjects';

export type StudyTaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type StudyTaskStatus = 'todo' | 'in_progress' | 'completed';
export type StudyTaskCategory = 'study' | 'assignment' | 'revision' | 'personal' | 'other';
export type StudyTaskRecurrence = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface StudyTask {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  priority: StudyTaskPriority;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  status: StudyTaskStatus;
  category: StudyTaskCategory;
  estimatedDuration?: number; // in minutes
  notes?: string;
  recurrence?: StudyTaskRecurrence;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AssignmentStatus = 'not_started' | 'in_progress' | 'submitted' | 'completed';

export interface StudyAssignment {
  id: string;
  title: string;
  subjectId?: string;
  subjectName?: string;
  description?: string;
  instructor?: string;
  assignedDate?: string;
  dueDate: string;
  dueTime?: string;
  priority: StudyTaskPriority;
  estimatedStudyTime?: number;
  status: AssignmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type StudyExamType =
  | 'exam'
  | 'quiz'
  | 'presentation'
  | 'project'
  | 'assignment'
  | 'deadline'
  | 'other';

export interface StudyExam {
  id: string;
  title: string;
  subjectId?: string;
  subjectName?: string;
  type: StudyExamType;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location?: string;
  notes?: string;
  priority: StudyTaskPriority;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface TimetableEntry {
  id: string;
  title: string;
  subjectId?: string;
  subjectName?: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm (24hr)
  endTime: string; // HH:mm (24hr)
  location?: string;
  instructor?: string;
  notes?: string;
  active: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export type StudySessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface StudySession {
  id: string;
  subjectId?: string;
  subjectName?: string;
  topic: string;
  title?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart: string; // ISO
  actualEnd?: string; // ISO
  startTime?: string;
  endTime?: string;
  duration: number; // in seconds
  durationMinutes?: number;
  durationSeconds?: number;
  status: StudySessionStatus;
  type?: 'stopwatch' | 'manual' | 'pomodoro';
  rating?: number;
  notes?: string;
  linkedPomodoro?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type GoalUnit = 'hours' | 'chapters' | 'pages' | 'assignments' | 'exercises' | 'custom';
export type StudyGoalUnit = GoalUnit;

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue?: number;
  completed: boolean;
}
export type StudyGoalMilestone = GoalMilestone;

export interface StudyGoal {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  targetValue: number;
  currentValue: number;
  unit: GoalUnit;
  customUnit?: string;
  startDate?: string;
  targetDate?: string;
  deadline?: string;
  status?: GoalStatus;
  completed?: boolean;
  milestones?: GoalMilestone[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type HabitFrequency = 'daily' | 'weekdays' | 'weekly' | 'custom';

export interface StudyHabit {
  id: string;
  name: string;
  title?: string;
  description?: string;
  frequency?: HabitFrequency;
  targetDaysPerWeek?: number;
  icon?: string;
  startDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCheck {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  timestamp: string;
}

export interface StudySubject {
  id: string;
  name: string;
  code?: string;
  instructor?: string;
  color: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PomodoroMode = 'focus' | 'short_break' | 'long_break';

export interface PomodoroSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak?: number;
  longBreakInterval?: number;
  autoStartBreaks?: boolean;
  autoStartFocus?: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface PomodoroRecord {
  id: string;
  mode?: PomodoroMode;
  subjectId?: string;
  subjectName?: string;
  topic?: string;
  focusDuration?: number; // in minutes
  durationMinutes?: number;
  completedAt: string;
  linkedSessionId?: string;
  notes?: string;
}

// ==========================================
// Phase 11: AI Study Intelligence & Assistant
// ==========================================

export type AIMaterialCategory =
  | 'explanation'
  | 'summary'
  | 'flashcards'
  | 'quiz'
  | 'study-plan'
  | 'writing-suggestion'
  | 'notes-summary'
  | 'assignment-guide';

export interface AIStudyMaterial {
  id: string;
  userId: string;
  title: string;
  category: AIMaterialCategory;
  sourceContext?: {
    type: 'document' | 'file' | 'note' | 'assignment' | 'subject' | 'custom';
    sourceId?: string;
    sourceTitle?: string;
  };
  content: string; // Markdown or primary output text
  data?: any; // Structured payload (e.g. FlashcardCard[], QuizQuestion[], study plan items, etc.)
  tags?: string[];
  isStarred?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardCard {
  id: string;
  front: string;
  back: string;
  sourceReference?: string;
  known?: boolean;
  markedForReview?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizResult {
  id: string;
  quizTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timestamp: string;
  answers: Array<{
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }>;
}

export interface AISessionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  groundedInContext?: boolean;
  contextTitle?: string;
}

export interface AISession {
  id: string;
  userId: string;
  title: string;
  messages: AISessionMessage[];
  contextInfo?: {
    type: string;
    title: string;
    charCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AIProposedAction {
  id: string;
  type:
    | 'create_task'
    | 'create_reminder'
    | 'complete_task'
    | 'insert_document_content'
    | 'replace_selected_text'
    | 'save_flashcards'
    | 'save_quiz_result'
    | 'create_study_session'
    | 'create_milestone';
  title: string;
  description: string;
  payload: any;
}


