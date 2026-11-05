import { localDb } from '../lib/localDb.ts';
import {
  AttendanceRecord,
  AttendanceSettings,
  AttendanceStats,
  DEFAULT_ATTENDANCE_SETTINGS,
  AttendanceAnalysisRequestData,
} from '../types/attendance.ts';

export type Unsubscribe = () => void;

// ==========================================
// 1. DETERMINISTIC ATTENDANCE CALCULATIONS
// ==========================================

export function calculateAttendanceStats(
  records: AttendanceRecord[],
  settings?: AttendanceSettings
): AttendanceStats {
  const lateTreatment = settings?.lateTreatment || DEFAULT_ATTENDANCE_SETTINGS.lateTreatment;
  const excusedTreatment = settings?.excusedTreatment || DEFAULT_ATTENDANCE_SETTINGS.excusedTreatment;
  const target = settings?.targetPercentage;

  const totalRecorded = records.length;
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  let cancelled = 0;

  records.forEach((r) => {
    switch (r.status) {
      case 'present':
        present++;
        break;
      case 'absent':
        absent++;
        break;
      case 'late':
        late++;
        break;
      case 'excused':
        excused++;
        break;
      case 'cancelled':
        cancelled++;
        break;
    }
  });

  // Calculate Present Equivalent based on lateTreatment
  let presentEquivalent = present;
  if (lateTreatment === 'present') {
    presentEquivalent += late;
  } else if (lateTreatment === 'separate') {
    presentEquivalent += late * 0.5;
  } else if (lateTreatment === 'absent') {
    presentEquivalent += 0;
  }

  let countedClasses = 0;
  if (excusedTreatment === 'exclude') {
    countedClasses = present + absent + late;
  } else if (excusedTreatment === 'present') {
    presentEquivalent += excused;
    countedClasses = present + absent + late + excused;
  } else if (excusedTreatment === 'absent') {
    countedClasses = present + absent + late + excused;
  }

  const percentage =
    countedClasses > 0
      ? Number(((presentEquivalent / countedClasses) * 100).toFixed(1))
      : null;

  const lateRuleText =
    lateTreatment === 'present'
      ? 'Late counted as 100% Present'
      : lateTreatment === 'separate'
      ? 'Late counted as 50% Present'
      : 'Late counted as Absent';

  const excusedRuleText =
    excusedTreatment === 'exclude'
      ? 'Excused excluded from total'
      : excusedTreatment === 'present'
      ? 'Excused counted as 100% Present'
      : 'Excused counted as Absent';

  let differenceFromTarget: number | undefined;
  let classesCanMissToMaintainTarget: number | undefined;
  let consecutivePresentsNeededForTarget: number | undefined;

  if (target !== undefined && target > 0 && countedClasses > 0 && percentage !== null) {
    differenceFromTarget = Number((percentage - target).toFixed(1));
    const targetFrac = target / 100;

    if (percentage >= target) {
      const allowedMisses = Math.floor((presentEquivalent - targetFrac * countedClasses) / targetFrac);
      classesCanMissToMaintainTarget = Math.max(0, allowedMisses);
      consecutivePresentsNeededForTarget = 0;
    } else {
      classesCanMissToMaintainTarget = 0;
      if (targetFrac < 1) {
        const needed = Math.ceil((targetFrac * countedClasses - presentEquivalent) / (1 - targetFrac));
        consecutivePresentsNeededForTarget = Math.max(0, needed);
      } else {
        consecutivePresentsNeededForTarget = 999;
      }
    }
  }

  return {
    totalRecorded,
    countedClasses,
    present,
    absent,
    late,
    excused,
    cancelled,
    presentEquivalent,
    percentage,
    calculationRuleSummary: `${lateRuleText}. ${excusedRuleText}.`,
    targetPercentage: target,
    differenceFromTarget,
    classesCanMissToMaintainTarget,
    consecutivePresentsNeededForTarget,
  };
}

// ==========================================
// 2. LOCAL DATABASE CRUD FOR ATTENDANCE
// ==========================================

export async function saveAttendanceRecord(
  uid: string,
  record: AttendanceRecord
): Promise<void> {
  localDb.saveItem('attendance', uid, {
    ...record,
    updatedAt: new Date().toISOString(),
  });
}

export async function batchSaveAttendanceRecords(
  uid: string,
  records: AttendanceRecord[]
): Promise<void> {
  if (records.length === 0) return;
  const now = new Date().toISOString();
  const prepared = records.map((r) => ({
    ...r,
    updatedAt: now,
  }));
  localDb.batchSaveItems('attendance', uid, prepared);
}

export async function deleteAttendanceRecord(
  uid: string,
  recordId: string
): Promise<void> {
  localDb.deleteItem('attendance', uid, recordId);
}

export function subscribeAttendanceRecords(
  uid: string,
  onUpdate: (records: AttendanceRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<AttendanceRecord>('attendance', uid, onUpdate, {
    orderByField: 'date',
    orderDirection: 'desc',
  });
}

// ==========================================
// 3. ATTENDANCE SETTINGS
// ==========================================

export async function saveAttendanceSettings(
  uid: string,
  settings: AttendanceSettings
): Promise<void> {
  localDb.saveItem('attendanceSettings', uid, {
    ...settings,
    id: 'main',
    userId: uid,
    updatedAt: new Date().toISOString(),
  });
}

export function subscribeAttendanceSettings(
  uid: string,
  onUpdate: (settings: AttendanceSettings) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<AttendanceSettings & { id: string }>(
    'attendanceSettings',
    uid,
    (items) => {
      const found = items.find((i) => i.id === 'main');
      if (found) {
        onUpdate(found);
      } else {
        onUpdate({
          ...DEFAULT_ATTENDANCE_SETTINGS,
          id: 'main',
          userId: uid,
        });
      }
    }
  );
}

// ==========================================
// 4. DUPLICATE CHECK HELPER
// ==========================================

export function findExistingAttendanceRecord(
  records: AttendanceRecord[],
  date: string,
  subjectName: string,
  timetableEntryId?: string,
  startTime?: string
): AttendanceRecord | undefined {
  return records.find((r) => {
    if (r.date !== date) return false;
    if (timetableEntryId && r.timetableEntryId === timetableEntryId) return true;
    const sameSubject = r.subjectName.toLowerCase().trim() === subjectName.toLowerCase().trim();
    if (!sameSubject) return false;
    if (startTime && r.startTime) {
      return r.startTime === startTime;
    }
    return true;
  });
}

// ==========================================
// 5. AI ATTENDANCE INTELLIGENCE CLIENT API
// ==========================================

export async function analyzeAttendanceWithAI(
  data: AttendanceAnalysisRequestData
): Promise<{
  observations: string[];
  patterns: string[];
  suggestions: string[];
  targetAnalysisNote?: string;
}> {
  const response = await fetch('/api/attendance/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Analysis failed' }));
    throw new Error(err.error || 'Failed to analyze attendance with AI');
  }

  return response.json();
}
