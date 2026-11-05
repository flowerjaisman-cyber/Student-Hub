import { useState, useEffect } from 'react';
import {
  calculateAge,
  calculateDateDifference,
  addSubtractDate,
} from '../../utils/calculatorUtils.ts';
import { CalculatorCardWrapper } from './CalculatorCardWrapper.tsx';
import { SavedCalculationItem } from '../../types/index.ts';
import {
  Calendar,
  Clock,
  Hourglass,
  Plus,
  Trash2,
  AlertCircle,
  Timer,
} from 'lucide-react';

interface DateTimeCalculatorsProps {
  onSaveCalculation?: (title: string, type: any, inputs: any, result: string, targetDate?: string) => void;
  savedCountdowns?: SavedCalculationItem[];
  onDeleteCountdown?: (id: string) => void;
  uid?: string;
}

// ==========================================
// 1. AGE CALCULATOR
// ==========================================
export function AgeCalculator({ onSaveCalculation }: { onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [birthDate, setBirthDate] = useState('2003-05-15');
  const [targetDate, setTargetDate] = useState(todayStr);

  let result: any = null;
  let error: string | null = null;

  try {
    result = calculateAge(birthDate, targetDate);
  } catch (err: any) {
    error = err.message;
  }

  const resultSnippet = result
    ? `Age: ${result.years} years, ${result.months} months, ${result.days} days (Total: ${result.totalDays} days, Next Birthday in: ${result.daysUntilNextBirthday} days)`
    : undefined;

  return (
    <CalculatorCardWrapper
      title="Age Calculator"
      description="Exact calendar age in years, months, and days, total days lived, and countdown to your next birthday."
      categoryBadge="Date &amp; Time"
      formula="Calendar difference with variable month lengths & leap-year compensation"
      formulaExplanation="Calculates the exact chronological difference between date of birth and target reference date."
      onReset={() => {
        setBirthDate('2003-05-15');
        setTargetDate(todayStr);
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Age Breakdown', 'age', { birthDate, targetDate }, resultSnippet || '')}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Date of Birth:
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Age at Target Date:
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {error ? (
          <div className="p-3 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/50 rounded-xl text-center">
            {error}
          </div>
        ) : result ? (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Exact Chronological Age
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {result.years} <span className="text-xs font-sans text-slate-500">years</span> {result.months} <span className="text-xs font-sans text-slate-500">months</span> {result.days} <span className="text-xs font-sans text-slate-500">days</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500">Total Days Lived</span>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  {result.totalDays.toLocaleString()} days
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500">Next Birthday</span>
                <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                  in {result.daysUntilNextBirthday} days
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 2. DATE DIFFERENCE CALCULATOR
// ==========================================
export function DateDifferenceCalculator({ onSaveCalculation }: { onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState('2026-12-31');

  let result: any = null;
  let error: string | null = null;

  try {
    result = calculateDateDifference(startDate, endDate);
  } catch (err: any) {
    error = err.message;
  }

  const resultSnippet = result
    ? `Difference between ${startDate} and ${endDate}: ${result.totalDays} days (${result.weeks} weeks and ${result.remainingDays} days)`
    : undefined;

  return (
    <CalculatorCardWrapper
      title="Date Difference Calculator"
      description="Calculate the exact span between any two calendar dates in days, weeks, and remaining days."
      categoryBadge="Date &amp; Time"
      formula="Span = |End Date - Start Date| (in Unix Milliseconds) / (1000 × 60 × 60 × 24)"
      formulaExplanation="Accurately parses full day boundaries regardless of local Daylight Saving Time shifts."
      onReset={() => {
        setStartDate(todayStr);
        setEndDate('2026-12-31');
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Date Difference', 'date-difference', { startDate, endDate }, resultSnippet || '')}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Start Date:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              End Date:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {error ? (
          <div className="p-3 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/50 rounded-xl text-center">
            {error}
          </div>
        ) : result ? (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-2">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Calculated Duration
            </span>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {result.totalDays.toLocaleString()}{' '}
              <span className="text-sm font-sans font-normal text-slate-500">days</span>
            </p>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
              Equivalent to {result.weeks} weeks and {result.remainingDays} days
            </p>
            {result.isReversed && (
              <p className="text-[11px] text-amber-600 italic">
                Note: Start date was after end date; inverted absolute span shown.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 3. ADD / SUBTRACT DATES CALCULATOR
// ==========================================
export function AddSubtractDatesCalculator({ onSaveCalculation }: { onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [baseDate, setBaseDate] = useState(todayStr);
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState(30);
  const [unit, setUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('days');

  let resultDateStr = '';
  let error: string | null = null;

  try {
    resultDateStr = addSubtractDate(baseDate, amount, unit, operation);
  } catch (err: any) {
    error = err.message;
  }

  const formattedDate = resultDateStr
    ? new Date(resultDateStr + 'T12:00:00Z').toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const resultSnippet = resultDateStr
    ? `${baseDate} ${operation} ${amount} ${unit} = ${resultDateStr} (${formattedDate})`
    : undefined;

  return (
    <CalculatorCardWrapper
      title="Add or Subtract from Date"
      description="Add or subtract days, weeks, months, or years with automatic leap-year and month-end adjustment."
      categoryBadge="Date &amp; Time"
      formula="Result Date = Base Date ± (Delta Units) with Month-end Clamping"
      formulaExplanation="Correctly adjusts month overflows (for example, adding 1 month to January 31 lands on February 28 or 29)."
      onReset={() => {
        setBaseDate(todayStr);
        setOperation('add');
        setAmount(30);
        setUnit('days');
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Adjusted Date', 'add-subtract-dates', { baseDate, operation, amount, unit }, resultSnippet || '')}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Starting Date:
          </label>
          <input
            type="date"
            value={baseDate}
            onChange={(e) => setBaseDate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Operation:
            </label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            >
              <option value="add">+ Add</option>
              <option value="subtract">- Subtract</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Amount:
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Unit:
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
        </div>

        {resultDateStr && (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Target Calculated Date
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {resultDateStr}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {formattedDate}
            </p>
          </div>
        )}
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 4. TIME DURATION CALCULATOR
// ==========================================
export function TimeDurationCalculator({ onSaveCalculation }: { onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void }) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:30');

  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);

  let totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
  const crossesMidnight = totalMinutes < 0;
  if (crossesMidnight) {
    totalMinutes += 24 * 60;
  }

  const diffHours = Math.floor(totalMinutes / 60);
  const diffMinutes = totalMinutes % 60;
  const decimalHours = (totalMinutes / 60).toFixed(2);

  const resultSnippet = `From ${startTime} to ${endTime}: ${diffHours} hours and ${diffMinutes} minutes (${decimalHours} decimal hours)`;

  return (
    <CalculatorCardWrapper
      title="Time Duration &amp; Hour Tracker"
      description="Calculate exact hours and minutes elapsed between two times with overnight midnight handling."
      categoryBadge="Date &amp; Time"
      formula="Minutes = (End Time Minutes - Start Time Minutes + 1440) % 1440"
      formulaExplanation="Calculates clock differences with automatic 24-hour wrap-around for shifts crossing midnight."
      onReset={() => {
        setStartTime('09:00');
        setEndTime('17:30');
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Time Duration', 'time-duration', { startTime, endTime }, resultSnippet)}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Start Time:
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              End Time:
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-2">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Total Elapsed Duration
          </span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
            {diffHours} <span className="text-sm font-sans font-normal text-slate-500">hrs</span> {diffMinutes} <span className="text-sm font-sans font-normal text-slate-500">mins</span>
          </p>
          <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
            Total decimal hours: {decimalHours} hrs
          </p>
          {crossesMidnight && (
            <p className="text-[11px] text-amber-600 italic">
              Note: End time is on the following day (spans past midnight).
            </p>
          )}
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 5. EXAM COUNTDOWN (Live & Persistent)
// ==========================================
export function ExamCountdownTool({
  onSaveCalculation,
  savedCountdowns = [],
  onDeleteCountdown,
  uid,
}: DateTimeCalculatorsProps) {
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('09:00');
  const [now, setNow] = useState(new Date());

  // Ticker timer for live second counts
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) return;

    const targetIso = `${examDate}T${examTime || '09:00'}:00`;
    const targetDateObj = new Date(targetIso);

    if (isNaN(targetDateObj.getTime())) {
      alert('Please enter a valid date and time');
      return;
    }

    onSaveCalculation?.(
      examTitle.trim(),
      'exam-countdown',
      { examTitle: examTitle.trim(), examDate, examTime },
      `Exam Countdown: ${examTitle} on ${examDate} at ${examTime}`,
      targetIso
    );

    setExamTitle('');
    setExamDate('');
  };

  const getCountdownParts = (targetIsoStr: string) => {
    const target = new Date(targetIsoStr);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return { isPast: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { isPast: false, days, hours, minutes, seconds };
  };

  // Only show countdowns from saved items matching type 'exam-countdown'
  const countdownItems = savedCountdowns.filter(
    (item) => item.calculatorType === 'exam-countdown'
  );

  return (
    <div className="space-y-5">
      {/* Creation Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Hourglass className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Create New Exam or Submission Countdown
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Strict Privacy: Only countdowns you explicitly create will appear here. Saved to your private cloud profile.
        </p>

        <form onSubmit={handleCreate} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Exam or Assignment Title:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Organic Chemistry Final Exam, Senior Thesis Defense..."
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Exam Date:
              </label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Start Time:
              </label>
              <input
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Countdown</span>
          </button>
        </form>
      </div>

      {/* Active Countdowns List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Your Active Countdowns ({countdownItems.length})
        </h4>

        {countdownItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <Timer className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-slate-500 font-medium">
              No exam countdowns created yet.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Add your upcoming midterms, finals, or deadlines above to start tracking.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {countdownItems.map((item) => {
              const targetDateStr = item.targetDate || (item.inputs?.examDate ? `${item.inputs.examDate}T${item.inputs.examTime || '09:00'}:00` : null);
              if (!targetDateStr) return null;

              const parts = getCountdownParts(targetDateStr);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {new Date(targetDateStr).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    {onDeleteCountdown && (
                      <button
                        type="button"
                        onClick={() => onDeleteCountdown(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                        title="Delete countdown"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Ticker Display */}
                  {parts.isPast ? (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-xs font-bold text-slate-500">
                      Event has concluded
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900">
                        <span className="text-lg font-black font-mono text-indigo-700 dark:text-indigo-300">
                          {parts.days}
                        </span>
                        <span className="block text-[10px] text-slate-500 uppercase tracking-tight">
                          Days
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900">
                        <span className="text-lg font-black font-mono text-indigo-700 dark:text-indigo-300">
                          {parts.hours}
                        </span>
                        <span className="block text-[10px] text-slate-500 uppercase tracking-tight">
                          Hours
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900">
                        <span className="text-lg font-black font-mono text-indigo-700 dark:text-indigo-300">
                          {parts.minutes}
                        </span>
                        <span className="block text-[10px] text-slate-500 uppercase tracking-tight">
                          Mins
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900">
                        <span className="text-lg font-black font-mono text-indigo-700 dark:text-indigo-300 animate-pulse">
                          {parts.seconds}
                        </span>
                        <span className="block text-[10px] text-slate-500 uppercase tracking-tight">
                          Secs
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
