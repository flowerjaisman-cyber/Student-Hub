import { useState } from 'react';
import {
  calculatePercentageMarks,
  calculateGpa,
  calculateCgpa,
  calculateWeightedAverage,
  SubjectMarksItem,
  GpaCourseItem,
  CgpaSemesterItem,
  WeightedAverageItem,
} from '../../utils/calculatorUtils.ts';
import { CalculatorCardWrapper } from './CalculatorCardWrapper.tsx';
import { Plus, Trash2, Award, Percent, BookOpen, Layers } from 'lucide-react';

interface AcademicCalculatorProps {
  toolId: 'percentage-marks' | 'gpa' | 'cgpa' | 'grade' | 'weighted-average';
  onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void;
  onRecordHistory?: (expression: string, result: string) => void;
}

// ==========================================
// 1. PERCENTAGE & MARKS CALCULATOR
// ==========================================
export function PercentageMarksCalculator({ onSaveCalculation, onRecordHistory }: {
  onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void;
  onRecordHistory?: (expression: string, result: string) => void;
}) {
  const [subjects, setSubjects] = useState<SubjectMarksItem[]>([
    { id: '1', name: 'Mathematics', obtained: 85, total: 100 },
    { id: '2', name: 'Physics', obtained: 78, total: 100 },
    { id: '3', name: 'English Literature', obtained: 92, total: 100 },
  ]);

  const result = calculatePercentageMarks(subjects);

  const handleAddSubject = () => {
    setSubjects((prev) => [
      ...prev,
      { id: Date.now().toString(), name: `Subject ${prev.length + 1}`, obtained: 0, total: 100 },
    ]);
  };

  const handleUpdate = (id: string, field: 'name' | 'obtained' | 'total', val: string | number) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const handleDelete = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const handleReset = () => {
    setSubjects([
      { id: '1', name: 'Subject 1', obtained: 0, total: 100 },
    ]);
  };

  const resultString = `Total: ${result.totalObtained}/${result.totalPossible} (${result.overallPercentage}%)`;

  return (
    <CalculatorCardWrapper
      title="Percentage & Marks Calculator"
      description="Calculate subject-wise and overall percentages, remaining marks, and aggregate totals."
      categoryBadge="Academic"
      formula="Percentage = (Obtained Marks / Total Marks) × 100 | Overall = (Σ Obtained / Σ Total) × 100"
      formulaExplanation="Each subject's percentage is calculated relative to its total possible marks. Overall percentage sums all obtained marks divided by the sum of all possible marks."
      onReset={handleReset}
      resultSnippet={resultString}
      onSave={() => onSaveCalculation?.('Marks Breakdown', 'percentage-marks', { subjects }, resultString)}
    >
      <div className="space-y-4">
        {/* Subject Rows */}
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2">
            <span className="col-span-5 sm:col-span-4">Subject</span>
            <span className="col-span-3 sm:col-span-3">Obtained</span>
            <span className="col-span-3 sm:col-span-3">Total</span>
            <span className="hidden sm:block sm:col-span-1 text-center">%</span>
            <span className="col-span-1 text-right">Del</span>
          </div>

          {subjects.map((sub) => {
            const subPct = sub.total > 0 ? ((sub.obtained / sub.total) * 100).toFixed(1) : '0';
            return (
              <div
                key={sub.id}
                className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
              >
                <input
                  type="text"
                  value={sub.name}
                  onChange={(e) => handleUpdate(sub.id, 'name', e.target.value)}
                  placeholder="Subject name"
                  className="col-span-5 sm:col-span-4 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  min="0"
                  max={sub.total}
                  value={sub.obtained}
                  onChange={(e) => handleUpdate(sub.id, 'obtained', parseFloat(e.target.value) || 0)}
                  className="col-span-3 sm:col-span-3 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  min="1"
                  value={sub.total}
                  onChange={(e) => handleUpdate(sub.id, 'total', parseFloat(e.target.value) || 0)}
                  className="col-span-3 sm:col-span-3 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <div className="hidden sm:block sm:col-span-1 text-center font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                  {subPct}%
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(sub.id)}
                  disabled={subjects.length === 1}
                  className="col-span-1 p-1 text-slate-400 hover:text-rose-500 rounded disabled:opacity-20 flex justify-end cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddSubject}
          className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Subject</span>
        </button>

        {/* Results Summary Box */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-850 border border-indigo-200 dark:border-indigo-800/80 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Obtained</span>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {result.totalObtained}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Possible</span>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {result.totalPossible}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Remaining</span>
              <p className="text-base sm:text-lg font-extrabold text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                {result.remainingMarks}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">Overall Percentage</span>
              <p className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                {result.overallPercentage}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 2. GPA CALCULATOR
// ==========================================
export function GpaCalculator({ onSaveCalculation }: {
  onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void;
}) {
  const [scalePreset, setScalePreset] = useState<'4.0' | '5.0' | '10.0'>('4.0');
  const [courses, setCourses] = useState<GpaCourseItem[]>([
    { id: '1', name: 'Computer Architecture', creditHours: 3, gradePoint: 4.0 },
    { id: '2', name: 'Calculus II', creditHours: 4, gradePoint: 3.7 },
    { id: '3', name: 'Data Structures', creditHours: 3, gradePoint: 3.3 },
  ]);

  const result = calculateGpa(courses);

  const handleAddCourse = () => {
    setCourses((prev) => [
      ...prev,
      { id: Date.now().toString(), name: `Course ${prev.length + 1}`, creditHours: 3, gradePoint: scalePreset === '10.0' ? 8.0 : scalePreset === '5.0' ? 4.0 : 3.0 },
    ]);
  };

  const handleUpdate = (id: string, field: 'name' | 'creditHours' | 'gradePoint', val: string | number) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleDelete = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleReset = () => {
    setCourses([{ id: '1', name: 'Course 1', creditHours: 3, gradePoint: 4.0 }]);
  };

  const resultString = `GPA: ${result.gpaFormatted} (${result.totalCredits} credits, ${result.totalQualityPoints} quality points)`;

  return (
    <CalculatorCardWrapper
      title="GPA Calculator"
      description="Compute term Grade Point Average with credit hour weighting and flexible grading scale presets."
      categoryBadge="Academic"
      formula="GPA = Σ (Credit Hours × Grade Points) / Σ Credit Hours"
      formulaExplanation="Total quality points are accumulated by multiplying each course's credit hours by its assigned grade point, then dividing by total credit hours."
      onReset={handleReset}
      resultSnippet={resultString}
      onSave={() => onSaveCalculation?.('Semester GPA', 'gpa', { courses, scalePreset }, resultString)}
    >
      <div className="space-y-4">
        {/* Scale Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Grading Scale:</span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            {(['4.0', '5.0', '10.0'] as const).map((scale) => (
              <button
                key={scale}
                type="button"
                onClick={() => setScalePreset(scale)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  scalePreset === scale
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {scale} Scale
              </button>
            ))}
          </div>
        </div>

        {/* Course Rows */}
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2">
            <span className="col-span-5 sm:col-span-5">Course Title</span>
            <span className="col-span-3 sm:col-span-3">Credits</span>
            <span className="col-span-3 sm:col-span-3">Grade Point</span>
            <span className="col-span-1 text-right">Del</span>
          </div>

          {courses.map((course) => (
            <div
              key={course.id}
              className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
            >
              <input
                type="text"
                value={course.name}
                onChange={(e) => handleUpdate(course.id, 'name', e.target.value)}
                placeholder="Course title"
                className="col-span-5 sm:col-span-5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={course.creditHours}
                onChange={(e) => handleUpdate(course.id, 'creditHours', parseFloat(e.target.value) || 0)}
                className="col-span-3 sm:col-span-3 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="number"
                min="0"
                max={scalePreset === '10.0' ? 10 : scalePreset === '5.0' ? 5 : 4}
                step="0.1"
                value={course.gradePoint}
                onChange={(e) => handleUpdate(course.id, 'gradePoint', parseFloat(e.target.value) || 0)}
                className="col-span-3 sm:col-span-3 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleDelete(course.id)}
                disabled={courses.length === 1}
                className="col-span-1 p-1 text-slate-400 hover:text-rose-500 rounded disabled:opacity-20 flex justify-end cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddCourse}
          className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Course</span>
        </button>

        {/* GPA Summary Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-850 border border-indigo-200 dark:border-indigo-800/80 shadow-xs">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Credits</span>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {result.totalCredits}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Quality Points</span>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {result.totalQualityPoints}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">Calculated GPA</span>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                {result.gpaFormatted}
              </p>
            </div>
          </div>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 3. CGPA CALCULATOR
// ==========================================
export function CgpaCalculator({ onSaveCalculation }: {
  onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void;
}) {
  const [semesters, setSemesters] = useState<CgpaSemesterItem[]>([
    { id: '1', semesterName: 'Semester 1', gpa: 3.65, creditHours: 16 },
    { id: '2', semesterName: 'Semester 2', gpa: 3.8, creditHours: 18 },
    { id: '3', semesterName: 'Semester 3', gpa: 3.5, creditHours: 15 },
  ]);

  const result = calculateCgpa(semesters);

  const handleAddSemester = () => {
    setSemesters((prev) => [
      ...prev,
      { id: Date.now().toString(), semesterName: `Semester ${prev.length + 1}`, gpa: 3.5, creditHours: 15 },
    ]);
  };

  const handleUpdate = (id: string, field: 'semesterName' | 'gpa' | 'creditHours', val: string | number) => {
    setSemesters((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const handleDelete = (id: string) => {
    setSemesters((prev) => prev.filter((s) => s.id !== id));
  };

  const handleReset = () => {
    setSemesters([{ id: '1', semesterName: 'Semester 1', gpa: 3.5, creditHours: 15 }]);
  };

  const resultString = `CGPA: ${result.cgpaFormatted} (${result.totalCredits} total credits, ${result.totalQualityPoints} quality points)`;

  return (
    <CalculatorCardWrapper
      title="Cumulative GPA (CGPA) Calculator"
      description="Calculate your overall Cumulative GPA weighted accurately by credit hours across multiple semesters."
      categoryBadge="Academic"
      formula="CGPA = Σ (Semester GPA × Semester Credits) / Σ Semester Credits"
      formulaExplanation="A simple average of GPAs is only correct if each semester has the exact same credit count. This calculator uses weighted quality points to guarantee mathematical accuracy."
      onReset={handleReset}
      resultSnippet={resultString}
      onSave={() => onSaveCalculation?.('Degree CGPA', 'cgpa', { semesters }, resultString)}
    >
      <div className="space-y-4">
        {/* Semester Rows */}
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2">
            <span className="col-span-5 sm:col-span-5">Semester</span>
            <span className="col-span-3 sm:col-span-3">Credits</span>
            <span className="col-span-3 sm:col-span-3">Semester GPA</span>
            <span className="col-span-1 text-right">Del</span>
          </div>

          {semesters.map((sem) => (
            <div
              key={sem.id}
              className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
            >
              <input
                type="text"
                value={sem.semesterName}
                onChange={(e) => handleUpdate(sem.id, 'semesterName', e.target.value)}
                placeholder="Semester name"
                className="col-span-5 sm:col-span-5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="number"
                min="1"
                value={sem.creditHours}
                onChange={(e) => handleUpdate(sem.id, 'creditHours', parseFloat(e.target.value) || 0)}
                className="col-span-3 sm:col-span-3 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={sem.gpa}
                onChange={(e) => handleUpdate(sem.id, 'gpa', parseFloat(e.target.value) || 0)}
                className="col-span-3 sm:col-span-3 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleDelete(sem.id)}
                disabled={semesters.length === 1}
                className="col-span-1 p-1 text-slate-400 hover:text-rose-500 rounded disabled:opacity-20 flex justify-end cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddSemester}
          className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Semester</span>
        </button>

        {/* CGPA Summary Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-850 border border-indigo-200 dark:border-indigo-800/80 shadow-xs">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Credits</span>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {result.totalCredits}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Cumulative Quality Points</span>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {result.totalQualityPoints}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">Cumulative CGPA</span>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                {result.cgpaFormatted}
              </p>
            </div>
          </div>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 4. GRADE CALCULATOR
// ==========================================
export function GradeCalculator({ onSaveCalculation }: {
  onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void;
}) {
  const [score, setScore] = useState<number>(88.5);
  const [scheme, setScheme] = useState<'us' | 'uk' | 'ten-point'>('us');

  const getGrade = (pct: number) => {
    if (scheme === 'us') {
      if (pct >= 93) return { grade: 'A', desc: 'Excellent' };
      if (pct >= 90) return { grade: 'A-', desc: 'Superior' };
      if (pct >= 87) return { grade: 'B+', desc: 'Very Good' };
      if (pct >= 83) return { grade: 'B', desc: 'Good' };
      if (pct >= 80) return { grade: 'B-', desc: 'Above Average' };
      if (pct >= 77) return { grade: 'C+', desc: 'Average' };
      if (pct >= 73) return { grade: 'C', desc: 'Competent' };
      if (pct >= 70) return { grade: 'C-', desc: 'Passing' };
      if (pct >= 60) return { grade: 'D', desc: 'Barely Passing' };
      return { grade: 'F', desc: 'Fail' };
    }
    if (scheme === 'uk') {
      if (pct >= 70) return { grade: 'First-Class Honours (1st)', desc: 'Exceptional' };
      if (pct >= 60) return { grade: 'Upper Second (2:1)', desc: 'Very Good' };
      if (pct >= 50) return { grade: 'Lower Second (2:2)', desc: 'Good' };
      if (pct >= 40) return { grade: 'Third-Class (3rd)', desc: 'Passing' };
      return { grade: 'Fail', desc: 'Unsuccessful' };
    }
    // ten-point
    if (pct >= 90) return { grade: 'O (Outstanding)', desc: 'Grade Point: 10' };
    if (pct >= 80) return { grade: 'A+ (Excellent)', desc: 'Grade Point: 9' };
    if (pct >= 70) return { grade: 'A (Very Good)', desc: 'Grade Point: 8' };
    if (pct >= 60) return { grade: 'B+ (Good)', desc: 'Grade Point: 7' };
    if (pct >= 50) return { grade: 'B (Above Average)', desc: 'Grade Point: 6' };
    if (pct >= 40) return { grade: 'C (Average)', desc: 'Grade Point: 5' };
    return { grade: 'F (Fail)', desc: 'Grade Point: 0' };
  };

  const currentGrade = getGrade(score);
  const resultString = `Score: ${score}% -> ${currentGrade.grade} (${currentGrade.desc})`;

  return (
    <CalculatorCardWrapper
      title="Grade Boundary & Conversion Calculator"
      description="Convert marks and percentages into letter grades based on standard academic grading policies."
      categoryBadge="Academic"
      formula="Grade = Boundary Threshold[Selected Grading Scheme]"
      formulaExplanation="Identifies the assigned letter grade according to the threshold policy of the selected educational grading scale."
      onReset={() => setScore(85)}
      resultSnippet={resultString}
      onSave={() => onSaveCalculation?.('Grade Conversion', 'grade', { score, scheme }, resultString)}
    >
      <div className="space-y-4 max-w-md">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Grading Scale Standard:
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setScheme('us')}
              className={`p-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                scheme === 'us'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
              }`}
            >
              US Standard (A-F)
            </button>
            <button
              type="button"
              onClick={() => setScheme('uk')}
              className={`p-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                scheme === 'uk'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
              }`}
            >
              UK Honours (1st-3rd)
            </button>
            <button
              type="button"
              onClick={() => setScheme('ten-point')}
              className={`p-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                scheme === 'ten-point'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
              }`}
            >
              10-Point Scale
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Marks / Percentage (%):
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={score}
            onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
          />
        </div>

        {/* Grade Display */}
        <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
            Your Equivalent Grade
          </span>
          <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300 font-serif">
            {currentGrade.grade}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentGrade.desc}
          </p>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 5. WEIGHTED AVERAGE CALCULATOR
// ==========================================
export function WeightedAverageCalculator({ onSaveCalculation }: {
  onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void;
}) {
  const [items, setItems] = useState<WeightedAverageItem[]>([
    { id: '1', name: 'Midterm Exam', value: 88, weight: 30 },
    { id: '2', name: 'Final Exam', value: 92, weight: 40 },
    { id: '3', name: 'Assignments', value: 95, weight: 20 },
    { id: '4', name: 'Participation', value: 100, weight: 10 },
  ]);

  const result = calculateWeightedAverage(items);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: `Task ${prev.length + 1}`, value: 80, weight: 10 },
    ]);
  };

  const handleUpdate = (id: string, field: 'name' | 'value' | 'weight', val: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReset = () => {
    setItems([{ id: '1', name: 'Assignment 1', value: 80, weight: 50 }]);
  };

  const resultString = `Weighted Average: ${result.weightedAverage} (Total weight: ${result.totalWeight}, Weighted sum: ${result.weightedSum})`;

  return (
    <CalculatorCardWrapper
      title="Weighted Average Calculator"
      description="Calculate weighted averages for assignments, exam contributions, or course modules."
      categoryBadge="Academic"
      formula="Weighted Average = Σ (Value × Weight) / Σ Weight"
      formulaExplanation="Multiplies each value by its corresponding weight coefficient, sums them together, and divides by the sum of all weights."
      onReset={handleReset}
      resultSnippet={resultString}
      onSave={() => onSaveCalculation?.('Course Weighted Average', 'weighted-average', { items }, resultString)}
    >
      <div className="space-y-4">
        {/* Rows */}
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2">
            <span className="col-span-5 sm:col-span-5">Assessment / Item</span>
            <span className="col-span-3 sm:col-span-3">Score / Value</span>
            <span className="col-span-3 sm:col-span-3">Weight (%)</span>
            <span className="col-span-1 text-right">Del</span>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
            >
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleUpdate(item.id, 'name', e.target.value)}
                placeholder="Assessment title"
                className="col-span-5 sm:col-span-5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="number"
                value={item.value}
                onChange={(e) => handleUpdate(item.id, 'value', parseFloat(e.target.value) || 0)}
                className="col-span-3 sm:col-span-3 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <input
                type="number"
                min="0"
                value={item.weight}
                onChange={(e) => handleUpdate(item.id, 'weight', parseFloat(e.target.value) || 0)}
                className="col-span-3 sm:col-span-3 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={items.length === 1}
                className="col-span-1 p-1 text-slate-400 hover:text-rose-500 rounded disabled:opacity-20 flex justify-end cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Assessment</span>
        </button>

        {/* Results Summary Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-850 border border-indigo-200 dark:border-indigo-800/80 shadow-xs">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Weight</span>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {result.totalWeight}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Weighted Sum</span>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {result.weightedSum}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">Weighted Average</span>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                {result.weightedAverage}
              </p>
            </div>
          </div>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}
