import { useState, useEffect } from 'react';
import {
  evaluateMathExpression,
  simplifyFraction,
  calculateRatioSharing,
  calculateStatistics,
  gcd,
  AngleMode,
} from '../../utils/calculatorUtils.ts';
import { CalculatorCardWrapper } from './CalculatorCardWrapper.tsx';
import {
  Calculator as CalcIcon,
  Delete,
  CornerDownLeft,
  Dices,
  Shuffle,
  Binary,
  HelpCircle,
} from 'lucide-react';

interface MathCalculatorProps {
  onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void;
  onRecordHistory?: (expression: string, result: string) => void;
}

// ==========================================
// 1. BASIC CALCULATOR
// ==========================================
export function BasicCalculator({ onSaveCalculation, onRecordHistory }: MathCalculatorProps) {
  const [expression, setExpression] = useState('');
  const [displayResult, setDisplayResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleInput = (char: string) => {
    setError(null);
    setExpression((prev) => prev + char);
  };

  const handleClear = () => {
    setExpression('');
    setDisplayResult('');
    setError(null);
  };

  const handleBackspace = () => {
    setError(null);
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    if (!expression.trim()) return;
    const res = evaluateMathExpression(expression);
    if (res.error) {
      setError(res.error);
      setDisplayResult('');
    } else if (res.value !== undefined) {
      const formatted = Number.isInteger(res.value)
        ? res.value.toString()
        : Number(res.value.toFixed(8)).toString();
      setDisplayResult(formatted);
      setError(null);
      onRecordHistory?.(expression, formatted);
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Only capture if not focused in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (/[0-9+\-*/().%^]/.test(e.key)) {
        e.preventDefault();
        handleInput(e.key);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expression]);

  const resultSnippet = displayResult ? `${expression} = ${displayResult}` : undefined;

  return (
    <CalculatorCardWrapper
      title="Basic Arithmetic Calculator"
      description="Standard 4-function arithmetic calculator with parenthesis evaluation, decimal safety, and keyboard support."
      categoryBadge="Mathematics"
      formula="Standard algebraic order of operations (PEMDAS)"
      formulaExplanation="Safely evaluated using Shunting-yard and Reverse Polish Notation without arbitrary code execution."
      onReset={handleClear}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Basic Calculation', 'basic', { expression }, resultSnippet || '')}
    >
      <div className="max-w-xs mx-auto space-y-3">
        {/* Display Screen */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-inner flex flex-col justify-end min-h-[90px] border border-slate-700">
          <div className="text-right text-xs text-slate-400 font-mono truncate h-5">
            {expression || '0'}
          </div>
          <div className="text-right text-2xl font-mono font-bold tracking-wider text-emerald-400 truncate mt-1">
            {error ? <span className="text-rose-400 text-xs font-sans">{error}</span> : displayResult || '0'}
          </div>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-2 text-sm font-bold">
          <button
            type="button"
            onClick={handleClear}
            className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-200 transition-colors cursor-pointer"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handleInput('(')}
            className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
          >
            (
          </button>
          <button
            type="button"
            onClick={() => handleInput(')')}
            className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
          >
            )
          </button>
          <button
            type="button"
            onClick={() => handleInput('/')}
            className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 cursor-pointer"
          >
            ÷
          </button>

          <button
            type="button"
            onClick={() => handleInput('7')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleInput('8')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleInput('9')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleInput('*')}
            className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 cursor-pointer"
          >
            &times;
          </button>

          <button
            type="button"
            onClick={() => handleInput('4')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleInput('5')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleInput('6')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleInput('-')}
            className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 cursor-pointer"
          >
            -
          </button>

          <button
            type="button"
            onClick={() => handleInput('1')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleInput('2')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleInput('3')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => handleInput('+')}
            className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 cursor-pointer"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => handleInput('0')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleInput('.')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCalculate}
            className="p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm flex items-center justify-center cursor-pointer"
          >
            =
          </button>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 2. SCIENTIFIC CALCULATOR
// ==========================================
export function ScientificCalculator({ onSaveCalculation, onRecordHistory }: MathCalculatorProps) {
  const [expression, setExpression] = useState('');
  const [displayResult, setDisplayResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');

  const handleInput = (val: string) => {
    setError(null);
    setExpression((prev) => prev + val);
  };

  const handleClear = () => {
    setExpression('');
    setDisplayResult('');
    setError(null);
  };

  const handleBackspace = () => {
    setError(null);
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    if (!expression.trim()) return;
    const res = evaluateMathExpression(expression, angleMode);
    if (res.error) {
      setError(res.error);
      setDisplayResult('');
    } else if (res.value !== undefined) {
      const formatted = Number.isInteger(res.value)
        ? res.value.toString()
        : Number(res.value.toFixed(8)).toString();
      setDisplayResult(formatted);
      setError(null);
      onRecordHistory?.(expression, formatted);
    }
  };

  const resultSnippet = displayResult ? `${expression} = ${displayResult} (${angleMode.toUpperCase()})` : undefined;

  return (
    <CalculatorCardWrapper
      title="Scientific Calculator"
      description="Advanced trigonometry, logarithms, roots, powers, factorials, and mathematical constants."
      categoryBadge="Mathematics"
      formula="Trigonometry, Exponentials & Powers: sin(x), cos(x), tan(x), log(x), ln(x), sqrt(x), x^y, x!"
      formulaExplanation="Supports Degree or Radian angles with domain validation (rejecting negative square roots and division by zero)."
      onReset={handleClear}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Scientific Calculation', 'scientific', { expression, angleMode }, resultSnippet || '')}
    >
      <div className="max-w-md mx-auto space-y-3">
        {/* Angle Mode Switch */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setAngleMode('deg')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                angleMode === 'deg'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              DEG
            </button>
            <button
              type="button"
              onClick={() => setAngleMode('rad')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                angleMode === 'rad'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              RAD
            </button>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Current: {angleMode === 'deg' ? 'Degrees (°)' : 'Radians (rad)'}
          </span>
        </div>

        {/* Display Screen */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-inner flex flex-col justify-end min-h-[90px] border border-slate-700">
          <div className="text-right text-xs text-slate-400 font-mono truncate h-5">
            {expression || '0'}
          </div>
          <div className="text-right text-2xl font-mono font-bold tracking-wider text-indigo-400 truncate mt-1">
            {error ? <span className="text-rose-400 text-xs font-sans">{error}</span> : displayResult || '0'}
          </div>
        </div>

        {/* Scientific Keypad */}
        <div className="grid grid-cols-5 gap-1.5 text-xs font-bold font-mono">
          <button
            type="button"
            onClick={() => handleInput('sin(')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            sin
          </button>
          <button
            type="button"
            onClick={() => handleInput('cos(')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            cos
          </button>
          <button
            type="button"
            onClick={() => handleInput('tan(')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            tan
          </button>
          <button
            type="button"
            onClick={() => handleInput('pi')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            &pi;
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-200 cursor-pointer"
          >
            C
          </button>

          <button
            type="button"
            onClick={() => handleInput('asin(')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            asin
          </button>
          <button
            type="button"
            onClick={() => handleInput('acos(')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            acos
          </button>
          <button
            type="button"
            onClick={() => handleInput('atan(')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            atan
          </button>
          <button
            type="button"
            onClick={() => handleInput('e')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            e
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleInput('log(')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            log
          </button>
          <button
            type="button"
            onClick={() => handleInput('ln(')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            ln
          </button>
          <button
            type="button"
            onClick={() => handleInput('(')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            (
          </button>
          <button
            type="button"
            onClick={() => handleInput(')')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            )
          </button>
          <button
            type="button"
            onClick={() => handleInput('/')}
            className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 cursor-pointer"
          >
            ÷
          </button>

          <button
            type="button"
            onClick={() => handleInput('sqrt(')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            &radic;
          </button>
          <button
            type="button"
            onClick={() => handleInput('7')}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleInput('8')}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleInput('9')}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleInput('*')}
            className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 cursor-pointer"
          >
            &times;
          </button>

          <button
            type="button"
            onClick={() => handleInput('^')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            x<sup>y</sup>
          </button>
          <button
            type="button"
            onClick={() => handleInput('4')}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleInput('5')}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleInput('6')}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleInput('-')}
            className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 cursor-pointer"
          >
            -
          </button>

          <button
            type="button"
            onClick={() => handleInput('!')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            n!
          </button>
          <button
            type="button"
            onClick={() => handleInput('1')}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleInput('2')}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleInput('3')}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => handleInput('+')}
            className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 cursor-pointer"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => handleInput('abs(')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            |x|
          </button>
          <button
            type="button"
            onClick={() => handleInput('0')}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleInput('.')}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 cursor-pointer"
          >
            .
          </button>
          <button
            type="button"
            onClick={() => handleInput('%')}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            %
          </button>
          <button
            type="button"
            onClick={handleCalculate}
            className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm flex items-center justify-center cursor-pointer"
          >
            =
          </button>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 3. FRACTION CALCULATOR
// ==========================================
export function FractionCalculator({ onSaveCalculation }: MathCalculatorProps) {
  const [num1, setNum1] = useState(3);
  const [den1, setDen1] = useState(4);
  const [operator, setOperator] = useState<'+' | '-' | '*' | '/'>('+');
  const [num2, setNum2] = useState(1);
  const [den2, setDen2] = useState(2);

  let error: string | null = null;
  let result: any = null;

  try {
    if (den1 === 0 || den2 === 0) {
      error = 'Denominator cannot be zero';
    } else {
      let resNum = 0;
      let resDen = 1;

      if (operator === '+') {
        resNum = num1 * den2 + num2 * den1;
        resDen = den1 * den2;
      } else if (operator === '-') {
        resNum = num1 * den2 - num2 * den1;
        resDen = den1 * den2;
      } else if (operator === '*') {
        resNum = num1 * num2;
        resDen = den1 * den2;
      } else if (operator === '/') {
        if (num2 === 0) {
          throw new Error('Cannot divide by zero fraction');
        }
        resNum = num1 * den2;
        resDen = den1 * num2;
      }

      result = simplifyFraction(resNum, resDen);
    }
  } catch (err: any) {
    error = err.message || 'Fraction error';
  }

  const resultSnippet = result
    ? `${num1}/${den1} ${operator} ${num2}/${den2} = ${result.num}/${result.den}`
    : undefined;

  return (
    <CalculatorCardWrapper
      title="Fraction Calculator"
      description="Add, subtract, multiply, and divide fractions with automated simplification and mixed-number conversion."
      categoryBadge="Mathematics"
      formula="a/b ± c/d = (ad ± bc)/bd | (a/b) × (c/d) = ac/bd | (a/b) ÷ (c/d) = ad/bc"
      formulaExplanation="Computes the exact rational fraction using greatest common divisor (GCD) reduction."
      onReset={() => {
        setNum1(1);
        setDen1(2);
        setNum2(1);
        setDen2(4);
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Fraction Operation', 'fraction', { num1, den1, operator, num2, den2 }, resultSnippet || '')}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="flex items-center justify-center gap-3">
          {/* Fraction 1 */}
          <div className="flex flex-col items-center w-20">
            <input
              type="number"
              value={num1}
              onChange={(e) => setNum1(parseInt(e.target.value) || 0)}
              className="w-full text-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-sm"
            />
            <div className="w-full h-0.5 bg-slate-400 my-1.5" />
            <input
              type="number"
              value={den1}
              onChange={(e) => setDen1(parseInt(e.target.value) || 1)}
              className="w-full text-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-sm"
            />
          </div>

          {/* Operator */}
          <div className="flex flex-col gap-1">
            {(['+', '-', '*', '/'] as const).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setOperator(op)}
                className={`w-9 h-9 rounded-lg font-bold transition-colors cursor-pointer ${
                  operator === op
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {op === '*' ? '×' : op === '/' ? '÷' : op}
              </button>
            ))}
          </div>

          {/* Fraction 2 */}
          <div className="flex flex-col items-center w-20">
            <input
              type="number"
              value={num2}
              onChange={(e) => setNum2(parseInt(e.target.value) || 0)}
              className="w-full text-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-sm"
            />
            <div className="w-full h-0.5 bg-slate-400 my-1.5" />
            <input
              type="number"
              value={den2}
              onChange={(e) => setDen2(parseInt(e.target.value) || 1)}
              className="w-full text-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-sm"
            />
          </div>
        </div>

        {/* Results Panel */}
        {error ? (
          <div className="p-3 text-xs text-center text-rose-500 bg-rose-50 dark:bg-rose-950/50 rounded-xl">
            {error}
          </div>
        ) : result ? (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-2">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Simplified Fraction Result
            </span>
            <div className="flex items-center justify-center gap-4 text-xl font-black font-mono text-slate-900 dark:text-white">
              <span>{result.num} / {result.den}</span>
              {result.isMixed && (
                <span className="text-sm font-sans text-indigo-600 font-bold">
                  (or {result.wholePart} {result.remainderNum}/{result.remainderDen})
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-slate-500">
              Decimal value: {Number(result.decimal.toFixed(6))}
            </p>
          </div>
        ) : null}
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 4. RATIO CALCULATOR
// ==========================================
export function RatioCalculator({ onSaveCalculation }: MathCalculatorProps) {
  const [partA, setPartA] = useState(2);
  const [partB, setPartB] = useState(3);
  const [totalAmount, setTotalAmount] = useState(500);

  const divisor = gcd(partA, partB);
  const simplifiedA = partA / divisor;
  const simplifiedB = partB / divisor;

  let sharingResult: any = null;
  let sharingError: string | null = null;
  try {
    sharingResult = calculateRatioSharing(totalAmount, [partA, partB]);
  } catch (err: any) {
    sharingError = err.message;
  }

  const resultSnippet = `Ratio ${partA}:${partB} (Simplified ${simplifiedA}:${simplifiedB}) of Total ${totalAmount}: Part A = ${sharingResult?.shares[0]?.share}, Part B = ${sharingResult?.shares[1]?.share}`;

  return (
    <CalculatorCardWrapper
      title="Ratio &amp; Proportions Calculator"
      description="Simplify ratios and divide amounts proportionally according to defined parts."
      categoryBadge="Mathematics"
      formula="Share = Total × (Part / Σ Parts) | Simplified = (A/GCD) : (B/GCD)"
      formulaExplanation="Calculates the greatest common divisor for simplification and proportions the total sum across each ratio part."
      onReset={() => {
        setPartA(2);
        setPartB(3);
        setTotalAmount(500);
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Ratio Sharing', 'ratio', { partA, partB, totalAmount }, resultSnippet)}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ratio Part A:
            </label>
            <input
              type="number"
              min="1"
              value={partA}
              onChange={(e) => setPartA(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ratio Part B:
            </label>
            <input
              type="number"
              min="1"
              value={partB}
              onChange={(e) => setPartB(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Total Amount to Split:
          </label>
          <input
            type="number"
            min="0"
            value={totalAmount}
            onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
          />
        </div>

        {/* Results */}
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-indigo-200 dark:border-indigo-800">
            <span className="text-slate-600 dark:text-slate-400">Simplified Ratio:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {simplifiedA} : {simplifiedB}
            </span>
          </div>

          {sharingResult && (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Share A ({sharingResult.shares[0].percentage}%)
                </span>
                <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                  {sharingResult.shares[0].share}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Share B ({sharingResult.shares[1].percentage}%)
                </span>
                <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                  {sharingResult.shares[1].share}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 5. PERCENTAGE CHANGE CALCULATOR
// ==========================================
export function PercentageChangeCalculator({ onSaveCalculation }: MathCalculatorProps) {
  const [initialVal, setInitialVal] = useState(50);
  const [finalVal, setFinalVal] = useState(75);

  const diff = finalVal - initialVal;
  const pctChange = initialVal !== 0 ? (diff / Math.abs(initialVal)) * 100 : 0;
  const isIncrease = diff >= 0;

  const resultSnippet = `${initialVal} -> ${finalVal}: ${Math.abs(diff)} (${Math.abs(pctChange).toFixed(2)}% ${isIncrease ? 'Increase' : 'Decrease'})`;

  return (
    <CalculatorCardWrapper
      title="Percentage Change &amp; Growth Calculator"
      description="Compute the exact absolute and relative percentage increase or decrease between two numbers."
      categoryBadge="Mathematics"
      formula="% Change = ((New Value - Old Value) / |Old Value|) × 100"
      formulaExplanation="Measures relative difference against the starting value. Handled with absolute denominator to preserve direction."
      onReset={() => {
        setInitialVal(50);
        setFinalVal(75);
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Percentage Change', 'percentage-change', { initialVal, finalVal }, resultSnippet)}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Initial / Old Value:
            </label>
            <input
              type="number"
              value={initialVal}
              onChange={(e) => setInitialVal(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Final / New Value:
            </label>
            <input
              type="number"
              value={finalVal}
              onChange={(e) => setFinalVal(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Outcome: {isIncrease ? 'Percentage Increase' : 'Percentage Decrease'}
          </span>
          <p className={`text-3xl font-black font-mono ${isIncrease ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isIncrease ? '+' : ''}{pctChange.toFixed(2)}%
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Absolute difference: {diff >= 0 ? `+${diff}` : diff}
          </p>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 6. STATISTICS CALCULATOR
// ==========================================
export function StatisticsCalculator({ onSaveCalculation }: MathCalculatorProps) {
  const [rawText, setRawText] = useState('12, 15, 18, 22, 22, 25, 30, 35');

  const numbers = rawText
    .split(/[\s,]+/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));

  const stats = calculateStatistics(numbers);

  const resultSnippet = stats
    ? `N=${stats.count}, Mean=${stats.mean}, Median=${stats.median}, StdDev(Sample)=${stats.sampleStdDev}`
    : undefined;

  return (
    <CalculatorCardWrapper
      title="Descriptive Statistics Calculator"
      description="Compute mean, median, mode, variance, and standard deviation with explicit sample vs population labeling."
      categoryBadge="Mathematics"
      formula="Mean = Σx / N | Variance(Sample) = Σ(x - x̄)² / (n - 1) | Variance(Pop) = Σ(x - μ)² / N"
      formulaExplanation="Sample statistics use Bessel's correction (n - 1) to eliminate bias when estimating parameters from an empirical sample."
      onReset={() => setRawText('')}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Descriptive Statistics', 'statistics', { rawText }, resultSnippet || '')}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Enter Numbers (separated by commas, spaces, or lines):
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={3}
            placeholder="e.g. 10, 15, 20, 25, 30..."
            className="w-full p-3 text-xs font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
          />
        </div>

        {stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-slate-500">Count (n)</span>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">{stats.count}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-slate-500">Sum (Σ)</span>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">{stats.sum}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-indigo-600 font-bold">Mean (Average)</span>
              <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">{stats.mean}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-slate-500">Median</span>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">{stats.median}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-slate-500">Mode</span>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {stats.mode.length > 0 ? stats.mode.join(', ') : 'No unique mode'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-slate-500">Min &bull; Max &bull; Range</span>
              <p className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-1">
                {stats.min} &bull; {stats.max} (R: {stats.range})
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-slate-500">Sample Std Dev (s)</span>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">{stats.sampleStdDev}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] text-slate-500">Population Std Dev (σ)</span>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">{stats.populationStdDev}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-4">
            Enter at least one number above to calculate statistical parameters.
          </p>
        )}
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 7. RANDOM NUMBER UTILITY
// ==========================================
export function RandomNumberUtility() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(5);
  const [uniqueOnly, setUniqueOnly] = useState(true);
  const [generated, setGenerated] = useState<number[]>([]);

  const handleGenerate = () => {
    if (min > max) return;
    const poolSize = max - min + 1;
    if (uniqueOnly && count > poolSize) {
      alert(`Cannot generate ${count} unique numbers in a range of ${poolSize}`);
      return;
    }

    if (uniqueOnly) {
      const set = new Set<number>();
      while (set.size < count) {
        const val = Math.floor(Math.random() * (max - min + 1)) + min;
        set.add(val);
      }
      setGenerated(Array.from(set));
    } else {
      const arr: number[] = [];
      for (let i = 0; i < count; i++) {
        arr.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
      setGenerated(arr);
    }
  };

  const handleRollDie = (sides: number) => {
    setGenerated([Math.floor(Math.random() * sides) + 1]);
  };

  return (
    <CalculatorCardWrapper
      title="Random Number &amp; Simulation Utility"
      description="Cryptographically safe random integer generator, dice simulation, and random sampling tool."
      categoryBadge="Mathematics"
      formula="R = floor(rand() × (max - min + 1)) + min"
      onReset={() => {
        setMin(1);
        setMax(100);
        setCount(5);
        setGenerated([]);
      }}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Min:</label>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Max:</label>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Count:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={uniqueOnly}
              onChange={(e) => setUniqueOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Unique Numbers Only (No duplicates)</span>
          </label>

          <button
            type="button"
            onClick={handleGenerate}
            className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>
        </div>

        {/* Quick Dice Rollers */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-slate-500 font-semibold text-[11px]">Quick Dice:</span>
          <button
            type="button"
            onClick={() => handleRollDie(6)}
            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono font-bold cursor-pointer"
          >
            d6
          </button>
          <button
            type="button"
            onClick={() => handleRollDie(10)}
            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono font-bold cursor-pointer"
          >
            d10
          </button>
          <button
            type="button"
            onClick={() => handleRollDie(20)}
            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono font-bold cursor-pointer"
          >
            d20
          </button>
          <button
            type="button"
            onClick={() => handleRollDie(100)}
            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono font-bold cursor-pointer"
          >
            d100
          </button>
        </div>

        {/* Generated Output */}
        {generated.length > 0 && (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {generated.map((val, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 font-mono font-bold text-sm text-indigo-700 dark:text-indigo-300 shadow-xs"
                >
                  {val}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </CalculatorCardWrapper>
  );
}
