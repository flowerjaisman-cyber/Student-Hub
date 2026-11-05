/**
 * Academic Progress & Analytics Center Type Definitions (Phase 12)
 */

export interface AcademicPeriod {
  id: string;
  userId: string;
  name: string; // e.g. "Fall Semester 2026", "Spring 2026", "Term 1"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AssessmentType =
  | 'assignment'
  | 'quiz'
  | 'midterm'
  | 'final'
  | 'project'
  | 'practical'
  | 'homework'
  | 'presentation'
  | 'lab'
  | 'other';

export interface AcademicResult {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName: string;
  assessmentName: string;
  assessmentType: AssessmentType;
  date: string; // YYYY-MM-DD
  maxMarks: number;
  obtainedMarks: number;
  percentage: number; // calculated: (obtainedMarks / maxMarks) * 100
  grade?: string; // Optional letter grade
  weight?: number; // Optional course weight percentage (e.g. 20 for 20%)
  periodId?: string; // Linked academic period
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type GradingScaleType =
  | 'percentage_unweighted'
  | 'percentage_weighted'
  | 'gpa_4_0'
  | 'gpa_4_3'
  | 'gpa_5_0'
  | 'gpa_10_0'
  | 'custom_scale';

export interface GradeScaleRange {
  minPercentage: number;
  maxPercentage: number;
  letterGrade: string;
  gpaPoint: number;
}

export interface GradingScaleConfig {
  type: GradingScaleType;
  customRanges?: GradeScaleRange[];
}

export type ProgressReportType =
  | 'summary'
  | 'detailed'
  | 'weekly'
  | 'monthly'
  | 'exam_readiness';

export interface ProgressReport {
  id: string;
  userId: string;
  title: string;
  reportType: ProgressReportType;
  dateRange: {
    from: string;
    to: string;
    label: string;
  };
  periodId?: string;
  subjectId?: string;
  includedCategories: string[];
  content: string; // Markdown formatted report
  metricsSnapshot?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export type DateRangePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_7_days'
  | 'last_30_days'
  | 'custom';

export interface ProgressFilterState {
  periodId: string; // 'all' or specific period ID
  subjectId: string; // 'all' or specific subject ID
  dateRangePreset: DateRangePreset;
  customStartDate?: string;
  customEndDate?: string;
}

export interface ProgressInsightsResponse {
  observations: string[];
  patterns: string[];
  suggestions: string[];
}

export interface ProgressAnalysisData {
  periodName?: string;
  dateRangeLabel: string;
  tasksCount: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  assignmentsCount: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  examsCount: {
    total: number;
    upcoming: number;
    completed: number;
  };
  studyTime: {
    totalSessions: number;
    completedSessions: number;
    totalCompletedMinutes: number;
    averageMinutesPerSession: number;
    bySubject: Record<string, number>;
  };
  habits: {
    totalHabits: number;
    activeHabits: number;
    completedChecksInRange: number;
  };
  results: {
    count: number;
    averagePercentage?: number;
    weightedAveragePercentage?: number;
    highestScore?: { name: string; percentage: number };
    lowestScore?: { name: string; percentage: number };
  };
  documentsCount: {
    documents: number;
    notes: number;
    files: number;
    savedAIMaterials: number;
  };
}
