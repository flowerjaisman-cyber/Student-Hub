import { localDb } from '../lib/localDb.ts';
import {
  AcademicPeriod,
  AcademicResult,
  ProgressReport,
  ProgressInsightsResponse,
  ProgressAnalysisData,
  ProgressReportType,
  GradingScaleType,
} from '../types/progress.ts';

export type Unsubscribe = () => void;

// ============================================================
// 1. ACADEMIC PERIODS
// ============================================================

export async function saveAcademicPeriod(uid: string, period: AcademicPeriod): Promise<void> {
  localDb.saveItem('academicPeriods', uid, { ...period, updatedAt: new Date().toISOString() });
}

export async function deleteAcademicPeriod(uid: string, periodId: string): Promise<void> {
  localDb.deleteItem('academicPeriods', uid, periodId);
}

export function subscribeAcademicPeriods(
  uid: string,
  onUpdate: (periods: AcademicPeriod[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<AcademicPeriod>('academicPeriods', uid, onUpdate, {
    orderByField: 'startDate',
    orderDirection: 'desc',
  });
}

// ============================================================
// 2. ACADEMIC RESULTS (GRADEBOOK)
// ============================================================

export async function saveAcademicResult(uid: string, result: AcademicResult): Promise<void> {
  // Validate marks
  if (result.maxMarks <= 0) {
    throw new Error('Maximum marks must be greater than 0');
  }
  if (result.obtainedMarks < 0) {
    throw new Error('Obtained marks cannot be negative');
  }
  if (result.obtainedMarks > result.maxMarks) {
    throw new Error('Obtained marks cannot exceed maximum marks');
  }

  // Calculate percentage accurately (rounded to 2 decimal places)
  const percentage = Number(((result.obtainedMarks / result.maxMarks) * 100).toFixed(2));
  const sanitizedResult: AcademicResult = {
    ...result,
    percentage,
    updatedAt: new Date().toISOString(),
  };

  localDb.saveItem('results', uid, sanitizedResult);
}

export async function deleteAcademicResult(uid: string, resultId: string): Promise<void> {
  localDb.deleteItem('results', uid, resultId);
}

export function subscribeAcademicResults(
  uid: string,
  onUpdate: (results: AcademicResult[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<AcademicResult>('results', uid, onUpdate, {
    orderByField: 'date',
    orderDirection: 'desc',
  });
}

// ============================================================
// 3. PROGRESS REPORTS
// ============================================================

export async function saveProgressReport(uid: string, report: ProgressReport): Promise<void> {
  localDb.saveItem('progressReports', uid, { ...report, updatedAt: new Date().toISOString() });
}

export async function deleteProgressReport(uid: string, reportId: string): Promise<void> {
  localDb.deleteItem('progressReports', uid, reportId);
}

export function subscribeProgressReports(
  uid: string,
  onUpdate: (reports: ProgressReport[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return localDb.subscribe<ProgressReport>('progressReports', uid, onUpdate, {
    orderByField: 'createdAt',
    orderDirection: 'desc',
  });
}

// ============================================================
// 4. GPA & AVERAGE CALCULATION HELPERS
// ============================================================

export function calculateAcademicMetrics(
  results: AcademicResult[],
  scaleType: GradingScaleType = 'percentage_unweighted'
): {
  count: number;
  unweightedAverage: number | null;
  weightedAverage: number | null;
  gpa: number | null;
  gradeEquivalent: string | null;
  methodLabel: string;
} {
  if (results.length === 0) {
    return {
      count: 0,
      unweightedAverage: null,
      weightedAverage: null,
      gpa: null,
      gradeEquivalent: null,
      methodLabel: 'No recorded results',
    };
  }

  // 1. Unweighted Average
  const totalPercentage = results.reduce((acc, r) => acc + r.percentage, 0);
  const unweightedAverage = Number((totalPercentage / results.length).toFixed(2));

  // 2. Weighted Average (if weights are provided)
  let weightedSum = 0;
  let totalWeight = 0;
  for (const r of results) {
    if (typeof r.weight === 'number' && r.weight > 0) {
      weightedSum += r.percentage * r.weight;
      totalWeight += r.weight;
    }
  }
  const weightedAverage =
    totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(2)) : unweightedAverage;

  // 3. GPA Conversion
  let gpa: number | null = null;
  let gradeEquivalent: string | null = null;
  let methodLabel = `Unweighted average: ${unweightedAverage}%`;

  const avgToUse = scaleType === 'percentage_weighted' && totalWeight > 0 ? weightedAverage : unweightedAverage;

  // Standard letter grade mapping
  if (avgToUse >= 93) gradeEquivalent = 'A';
  else if (avgToUse >= 90) gradeEquivalent = 'A-';
  else if (avgToUse >= 87) gradeEquivalent = 'B+';
  else if (avgToUse >= 83) gradeEquivalent = 'B';
  else if (avgToUse >= 80) gradeEquivalent = 'B-';
  else if (avgToUse >= 77) gradeEquivalent = 'C+';
  else if (avgToUse >= 73) gradeEquivalent = 'C';
  else if (avgToUse >= 70) gradeEquivalent = 'C-';
  else if (avgToUse >= 67) gradeEquivalent = 'D+';
  else if (avgToUse >= 65) gradeEquivalent = 'D';
  else gradeEquivalent = 'F';

  if (scaleType === 'gpa_4_0') {
    if (avgToUse >= 93) gpa = 4.0;
    else if (avgToUse >= 90) gpa = 3.7;
    else if (avgToUse >= 87) gpa = 3.3;
    else if (avgToUse >= 83) gpa = 3.0;
    else if (avgToUse >= 80) gpa = 2.7;
    else if (avgToUse >= 77) gpa = 2.3;
    else if (avgToUse >= 73) gpa = 2.0;
    else if (avgToUse >= 70) gpa = 1.7;
    else if (avgToUse >= 67) gpa = 1.3;
    else if (avgToUse >= 65) gpa = 1.0;
    else gpa = 0.0;
    methodLabel = `4.0 GPA Scale (Converted from ${avgToUse}%)`;
  } else if (scaleType === 'gpa_4_3') {
    if (avgToUse >= 97) gpa = 4.3;
    else if (avgToUse >= 93) gpa = 4.0;
    else if (avgToUse >= 90) gpa = 3.7;
    else if (avgToUse >= 87) gpa = 3.3;
    else if (avgToUse >= 83) gpa = 3.0;
    else if (avgToUse >= 80) gpa = 2.7;
    else if (avgToUse >= 77) gpa = 2.3;
    else if (avgToUse >= 73) gpa = 2.0;
    else if (avgToUse >= 70) gpa = 1.7;
    else if (avgToUse >= 65) gpa = 1.0;
    else gpa = 0.0;
    methodLabel = `4.3 GPA Scale (Converted from ${avgToUse}%)`;
  } else if (scaleType === 'gpa_5_0') {
    gpa = Number(((avgToUse / 100) * 5.0).toFixed(2));
    methodLabel = `5.0 Scale Linear Projection (${avgToUse}%)`;
  } else if (scaleType === 'gpa_10_0') {
    gpa = Number(((avgToUse / 100) * 10.0).toFixed(2));
    methodLabel = `10.0 Scale Linear Projection (${avgToUse}%)`;
  } else if (scaleType === 'percentage_weighted') {
    methodLabel = totalWeight > 0 ? `Weighted average: ${weightedAverage}% (Sum of weights: ${totalWeight}%)` : `Unweighted average: ${unweightedAverage}% (No weights specified)`;
  } else {
    methodLabel = `Unweighted average: ${unweightedAverage}%`;
  }

  return {
    count: results.length,
    unweightedAverage,
    weightedAverage,
    gpa,
    gradeEquivalent,
    methodLabel,
  };
}

// ============================================================
// 5. AI PROGRESS INSIGHTS & REPORTS
// ============================================================

export async function generateProgressInsights(params: {
  data: ProgressAnalysisData;
  userFocus?: string;
}): Promise<ProgressInsightsResponse> {
  const res = await fetch('/api/ai/progress-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to generate progress insights (HTTP ${res.status})`);
  }

  return await res.json();
}

export async function generateAcademicProgressReport(params: {
  format: ProgressReportType;
  dateRangeLabel: string;
  data: ProgressAnalysisData;
  includedCategories: string[];
}): Promise<string> {
  const res = await fetch('/api/ai/progress-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to generate academic progress report (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.reportContent || data.content || '';
}
