/**
 * Phase 13: Attendance & Class Tracking Center Types
 */

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'cancelled';

export type LateTreatment = 'present' | 'separate' | 'absent';
export type ExcusedTreatment = 'exclude' | 'present' | 'absent';

export interface AttendanceSettings {
  id: string;
  userId: string;
  lateTreatment: LateTreatment;
  excusedTreatment: ExcusedTreatment;
  targetPercentage?: number; // e.g. 75
  remindersEnabled: boolean;
  reminderTiming?: string; // e.g. "17:00"
  reminderDays?: string[]; // e.g. ["monday", "tuesday", "wednesday", "thursday", "friday"]
  updatedAt: string;
}

export const DEFAULT_ATTENDANCE_SETTINGS: Omit<AttendanceSettings, 'id' | 'userId'> = {
  lateTreatment: 'separate',
  excusedTreatment: 'exclude',
  targetPercentage: undefined, // Personal target is never assumed
  remindersEnabled: false,
  reminderTiming: '18:00',
  reminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  updatedAt: new Date().toISOString(),
};

export interface AttendanceRecord {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName: string;
  periodId?: string;
  timetableEntryId?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  status: AttendanceStatus;
  notes?: string;
  isMakeup?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalRecorded: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  cancelled: number;
  countedClasses: number;
  presentEquivalent: number;
  percentage: number | null; // null if countedClasses === 0
  calculationRuleSummary: string;
  // Target analysis
  targetPercentage?: number;
  differenceFromTarget?: number | null;
  classesCanMissToMaintainTarget?: number | null;
  consecutivePresentsNeededForTarget?: number | null;
}

export interface SubjectAttendanceSummary {
  subjectId?: string;
  subjectName: string;
  code?: string;
  color?: string;
  stats: AttendanceStats;
  records: AttendanceRecord[];
}

export type AttendanceReportType = 'subject' | 'period' | 'date_range' | 'monthly';

export interface AttendanceAnalysisRequestData {
  recordsCount: number;
  overallStats: AttendanceStats;
  bySubject: Array<{
    subjectName: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number | null;
  }>;
  targetPercentage?: number;
  dateRangeLabel: string;
  periodName?: string;
}

export interface AttendanceActionProposal {
  actionType: 'mark' | 'update' | 'delete' | 'bulk_mark';
  description: string;
  records: Array<{
    subjectName: string;
    date: string;
    currentStatus?: AttendanceStatus;
    proposedStatus?: AttendanceStatus;
    notes?: string;
  }>;
}

export interface AIAttendanceAnalysisResult {
  observations: string[];
  patterns: string[];
  suggestions: string[];
  targetAnalysisNote?: string;
}

export type AttendanceDateRangePreset = 'all' | '7days' | '30days' | '90days' | 'period' | 'custom';

export interface DateRangeFilter {
  preset: AttendanceDateRangePreset;
  startDate?: string;
  endDate?: string;
}

