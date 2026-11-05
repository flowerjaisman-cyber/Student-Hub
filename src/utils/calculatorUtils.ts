/**
 * Pure mathematical, date, unit-conversion, and financial calculation functions for StudentHub.
 * All functions are deterministic and safe (NO eval).
 */

// ==========================================
// 1. SAFE MATHEMATICAL EXPRESSION PARSER
// ==========================================

export interface EvaluationResult {
  value?: number;
  error?: string;
  steps?: string[];
}

export type AngleMode = 'deg' | 'rad';

/**
 * Tokenize mathematical expression
 */
function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const cleanExpr = expr.replace(/\s+/g, '');

  while (i < cleanExpr.length) {
    const ch = cleanExpr[i];

    // Numbers (including decimals)
    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      while (i < cleanExpr.length && /[0-9.]/.test(cleanExpr[i])) {
        numStr += cleanExpr[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }

    // Function identifiers or constants (letters)
    if (/[a-zA-Z]/.test(ch)) {
      let idStr = '';
      while (i < cleanExpr.length && /[a-zA-Z]/.test(cleanExpr[i])) {
        idStr += cleanExpr[i].toLowerCase();
        i++;
      }
      tokens.push(idStr);
      continue;
    }

    // Operators and Parentheses
    if ('+-*/%^()!'.includes(ch)) {
      // Check for unary minus: at beginning of expression or immediately after another operator / '('
      if (ch === '-') {
        const prev = tokens[tokens.length - 1];
        if (!prev || ['+', '-', '*', '/', '%', '^', '('].includes(prev)) {
          tokens.push('u-');
          i++;
          continue;
        }
      }
      tokens.push(ch);
      i++;
      continue;
    }

    // Unknown character
    throw new Error(`Unexpected character: '${ch}'`);
  }

  return tokens;
}

/**
 * Compute factorial of non-negative integer
 */
export function factorial(n: number): number {
  if (n < 0) throw new Error('Factorial is not defined for negative numbers');
  if (!Number.isInteger(n)) throw new Error('Factorial requires an integer');
  if (n > 170) throw new Error('Result exceeds maximum numerical limit');
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) {
    res *= i;
  }
  return res;
}

/**
 * Safe expression evaluation using Shunting-Yard and RPN
 */
export function evaluateMathExpression(
  expression: string,
  angleMode: AngleMode = 'deg'
): EvaluationResult {
  if (!expression.trim()) {
    return { error: 'Please enter an expression' };
  }

  try {
    const tokens = tokenize(expression);
    const outputQueue: Array<{ type: 'num' | 'op' | 'func'; val: string | number }> = [];
    const operatorStack: string[] = [];

    const precedence: Record<string, number> = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '%': 2,
      '^': 3,
      'u-': 4,
    };

    const isRightAssociative: Record<string, boolean> = {
      '^': true,
      'u-': true,
    };

    const functions = new Set([
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
      'log', 'ln', 'sqrt', 'cbrt', 'abs', 'exp', 'fact',
    ]);

    const constants: Record<string, number> = {
      pi: Math.PI,
      e: Math.E,
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Number
      if (/^[0-9.]+$/.test(token)) {
        const num = parseFloat(token);
        if (isNaN(num)) return { error: `Invalid number: ${token}` };
        outputQueue.push({ type: 'num', val: num });
        continue;
      }

      // Constant
      if (constants[token] !== undefined) {
        outputQueue.push({ type: 'num', val: constants[token] });
        continue;
      }

      // Function
      if (functions.has(token)) {
        operatorStack.push(token);
        continue;
      }

      // Left paren
      if (token === '(') {
        operatorStack.push(token);
        continue;
      }

      // Right paren
      if (token === ')') {
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
          outputQueue.push({ type: 'op', val: operatorStack.pop()! });
        }
        if (operatorStack.length === 0) {
          return { error: 'Mismatched parentheses' };
        }
        operatorStack.pop(); // Remove '('

        // If function preceded '(', pop function to output
        if (operatorStack.length > 0 && functions.has(operatorStack[operatorStack.length - 1])) {
          outputQueue.push({ type: 'func', val: operatorStack.pop()! });
        }
        continue;
      }

      // Factorial operator (postfix)
      if (token === '!') {
        outputQueue.push({ type: 'func', val: 'fact' });
        continue;
      }

      // Operator
      if (precedence[token] !== undefined) {
        const p1 = precedence[token];
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== '('
        ) {
          const top = operatorStack[operatorStack.length - 1];
          const p2 = precedence[top] || 0;
          if ((!isRightAssociative[token] && p1 <= p2) || (isRightAssociative[token] && p1 < p2)) {
            outputQueue.push({ type: 'op', val: operatorStack.pop()! });
          } else {
            break;
          }
        }
        operatorStack.push(token);
        continue;
      }

      return { error: `Unknown token: '${token}'` };
    }

    while (operatorStack.length > 0) {
      const op = operatorStack.pop()!;
      if (op === '(' || op === ')') {
        return { error: 'Mismatched parentheses' };
      }
      outputQueue.push({ type: 'op', val: op });
    }

    // Evaluate RPN
    const evalStack: number[] = [];

    for (const item of outputQueue) {
      if (item.type === 'num') {
        evalStack.push(item.val as number);
      } else if (item.type === 'op') {
        const op = item.val as string;
        if (op === 'u-') {
          if (evalStack.length < 1) return { error: 'Invalid unary expression' };
          const a = evalStack.pop()!;
          evalStack.push(-a);
        } else {
          if (evalStack.length < 2) return { error: `Insufficient operands for '${op}'` };
          const b = evalStack.pop()!;
          const a = evalStack.pop()!;

          switch (op) {
            case '+':
              evalStack.push(a + b);
              break;
            case '-':
              evalStack.push(a - b);
              break;
            case '*':
              evalStack.push(a * b);
              break;
            case '/':
              if (b === 0) return { error: 'Division by zero is undefined' };
              evalStack.push(a / b);
              break;
            case '%':
              evalStack.push(a % b);
              break;
            case '^':
              evalStack.push(Math.pow(a, b));
              break;
            default:
              return { error: `Unsupported operator: ${op}` };
          }
        }
      } else if (item.type === 'func') {
        const fn = item.val as string;
        if (evalStack.length < 1) return { error: `Missing argument for ${fn}` };
        const arg = evalStack.pop()!;

        // Angle conversions
        const toRad = (d: number) => (d * Math.PI) / 180;
        const toDeg = (r: number) => (r * 180) / Math.PI;

        switch (fn) {
          case 'sin': {
            const rad = angleMode === 'deg' ? toRad(arg) : arg;
            evalStack.push(Math.sin(rad));
            break;
          }
          case 'cos': {
            const rad = angleMode === 'deg' ? toRad(arg) : arg;
            evalStack.push(Math.cos(rad));
            break;
          }
          case 'tan': {
            const rad = angleMode === 'deg' ? toRad(arg) : arg;
            // Check for asymptote (cos(rad) ~= 0)
            if (Math.abs(Math.cos(rad)) < 1e-12) {
              return { error: 'Tangent is undefined for odd multiples of 90° (π/2)' };
            }
            evalStack.push(Math.tan(rad));
            break;
          }
          case 'asin': {
            if (arg < -1 || arg > 1) {
              return { error: 'asin domain is between -1 and 1' };
            }
            const r = Math.asin(arg);
            evalStack.push(angleMode === 'deg' ? toDeg(r) : r);
            break;
          }
          case 'acos': {
            if (arg < -1 || arg > 1) {
              return { error: 'acos domain is between -1 and 1' };
            }
            const r = Math.acos(arg);
            evalStack.push(angleMode === 'deg' ? toDeg(r) : r);
            break;
          }
          case 'atan': {
            const r = Math.atan(arg);
            evalStack.push(angleMode === 'deg' ? toDeg(r) : r);
            break;
          }
          case 'log': {
            if (arg <= 0) return { error: 'Logarithm undefined for non-positive numbers' };
            evalStack.push(Math.log10(arg));
            break;
          }
          case 'ln': {
            if (arg <= 0) return { error: 'Natural log undefined for non-positive numbers' };
            evalStack.push(Math.log(arg));
            break;
          }
          case 'sqrt': {
            if (arg < 0) return { error: 'Square root of negative number is undefined in real numbers' };
            evalStack.push(Math.sqrt(arg));
            break;
          }
          case 'cbrt':
            evalStack.push(Math.cbrt(arg));
            break;
          case 'abs':
            evalStack.push(Math.abs(arg));
            break;
          case 'exp':
            evalStack.push(Math.exp(arg));
            break;
          case 'fact': {
            try {
              evalStack.push(factorial(arg));
            } catch (err: any) {
              return { error: err.message || 'Factorial error' };
            }
            break;
          }
          default:
            return { error: `Unsupported function: ${fn}` };
        }
      }
    }

    if (evalStack.length !== 1) {
      return { error: 'Invalid expression format' };
    }

    const finalVal = evalStack[0];
    if (!isFinite(finalVal)) {
      return { error: 'Calculation resulted in infinity or undefined' };
    }

    return { value: finalVal };
  } catch (err: any) {
    return { error: err.message || 'Syntax error' };
  }
}

// ==========================================
// 2. ACADEMIC ENGINES
// ==========================================

export interface SubjectMarksItem {
  id: string;
  name: string;
  obtained: number;
  total: number;
}

export function calculatePercentageMarks(subjects: SubjectMarksItem[]) {
  if (subjects.length === 0) {
    return {
      totalObtained: 0,
      totalPossible: 0,
      overallPercentage: 0,
      remainingMarks: 0,
      subjectResults: [],
    };
  }

  let totalObtained = 0;
  let totalPossible = 0;

  const subjectResults = subjects.map((sub) => {
    const ob = Math.max(0, sub.obtained || 0);
    const tot = Math.max(0, sub.total || 0);
    totalObtained += ob;
    totalPossible += tot;

    const pct = tot > 0 ? (ob / tot) * 100 : 0;
    const rem = Math.max(0, tot - ob);

    return {
      id: sub.id,
      name: sub.name || 'Subject',
      obtained: ob,
      total: tot,
      percentage: Number(pct.toFixed(2)),
      remaining: rem,
    };
  });

  const overallPercentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;

  return {
    totalObtained,
    totalPossible,
    overallPercentage: Number(overallPercentage.toFixed(2)),
    remainingMarks: Math.max(0, totalPossible - totalObtained),
    subjectResults,
  };
}

export interface GpaCourseItem {
  id: string;
  name: string;
  creditHours: number;
  gradePoint: number;
  letterGrade?: string;
}

export function calculateGpa(courses: GpaCourseItem[]) {
  let totalCredits = 0;
  let totalQualityPoints = 0;

  for (const c of courses) {
    const credits = Math.max(0, c.creditHours || 0);
    const gp = Math.max(0, c.gradePoint || 0);
    totalCredits += credits;
    totalQualityPoints += credits * gp;
  }

  const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

  return {
    totalCredits: Number(totalCredits.toFixed(2)),
    totalQualityPoints: Number(totalQualityPoints.toFixed(2)),
    gpa: Number(gpa.toFixed(3)),
    gpaFormatted: gpa.toFixed(2),
  };
}

export interface CgpaSemesterItem {
  id: string;
  semesterName: string;
  gpa: number;
  creditHours: number;
}

export function calculateCgpa(semesters: CgpaSemesterItem[]) {
  let totalCredits = 0;
  let totalQualityPoints = 0;

  for (const s of semesters) {
    const credits = Math.max(0, s.creditHours || 0);
    const semGpa = Math.max(0, s.gpa || 0);
    totalCredits += credits;
    totalQualityPoints += credits * semGpa;
  }

  const cgpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

  return {
    totalCredits: Number(totalCredits.toFixed(2)),
    totalQualityPoints: Number(totalQualityPoints.toFixed(2)),
    cgpa: Number(cgpa.toFixed(3)),
    cgpaFormatted: cgpa.toFixed(2),
  };
}

export interface WeightedAverageItem {
  id: string;
  name: string;
  value: number;
  weight: number;
}

export function calculateWeightedAverage(items: WeightedAverageItem[]) {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const item of items) {
    const v = item.value || 0;
    const w = Math.max(0, item.weight || 0);
    totalWeight += w;
    weightedSum += v * w;
  }

  const result = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return {
    totalWeight: Number(totalWeight.toFixed(4)),
    weightedSum: Number(weightedSum.toFixed(4)),
    weightedAverage: Number(result.toFixed(4)),
  };
}

// ==========================================
// 3. FRACTIONS & RATIOS
// ==========================================

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function simplifyFraction(num: number, den: number) {
  if (den === 0) throw new Error('Denominator cannot be zero');
  const divisor = gcd(num, den);
  const simplifiedNum = (num / divisor) * (den < 0 ? -1 : 1);
  const simplifiedDen = Math.abs(den / divisor);

  const whole = Math.floor(Math.abs(simplifiedNum) / simplifiedDen);
  const remainder = Math.abs(simplifiedNum) % simplifiedDen;
  const isNegative = simplifiedNum < 0;

  return {
    num: simplifiedNum,
    den: simplifiedDen,
    decimal: simplifiedNum / simplifiedDen,
    wholePart: isNegative ? -whole : whole,
    remainderNum: remainder,
    remainderDen: simplifiedDen,
    isMixed: whole > 0 && remainder > 0,
  };
}

export function calculateRatioSharing(total: number, parts: number[]) {
  const sumParts = parts.reduce((acc, p) => acc + Math.max(0, p), 0);
  if (sumParts === 0) throw new Error('Sum of ratio parts must be greater than zero');

  const shares = parts.map((part) => {
    const val = (total * Math.max(0, part)) / sumParts;
    return {
      part,
      share: Number(val.toFixed(2)),
      percentage: Number(((part / sumParts) * 100).toFixed(2)),
    };
  });

  return {
    total,
    sumParts,
    shares,
  };
}

// ==========================================
// 4. STATISTICS ENGINE
// ==========================================

export interface StatisticsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  sampleVariance: number;
  sampleStdDev: number;
  populationVariance: number;
  populationStdDev: number;
}

export function calculateStatistics(numbers: number[]): StatisticsResult | null {
  if (!numbers || numbers.length === 0) return null;

  const n = numbers.length;
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = numbers.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // Median
  let median = 0;
  if (n % 2 === 1) {
    median = sorted[Math.floor(n / 2)];
  } else {
    median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  }

  // Mode
  const counts = new Map<number, number>();
  let maxCount = 0;
  for (const num of sorted) {
    const c = (counts.get(num) || 0) + 1;
    counts.set(num, c);
    if (c > maxCount) maxCount = c;
  }

  const mode: number[] = [];
  if (maxCount > 1) {
    counts.forEach((c, num) => {
      if (c === maxCount) mode.push(num);
    });
  }

  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  // Variances
  let sqDiffSum = 0;
  for (const val of numbers) {
    sqDiffSum += Math.pow(val - mean, 2);
  }

  const popVar = sqDiffSum / n;
  const popStd = Math.sqrt(popVar);

  const sampleVar = n > 1 ? sqDiffSum / (n - 1) : 0;
  const sampleStd = Math.sqrt(sampleVar);

  return {
    count: n,
    sum: Number(sum.toFixed(4)),
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    mode,
    min,
    max,
    range: Number(range.toFixed(4)),
    populationVariance: Number(popVar.toFixed(4)),
    populationStdDev: Number(popStd.toFixed(4)),
    sampleVariance: Number(sampleVar.toFixed(4)),
    sampleStdDev: Number(sampleStd.toFixed(4)),
  };
}

// ==========================================
// 5. DATE & TIME UTILITIES
// ==========================================

export function calculateAge(birthDateStr: string, targetDateStr?: string) {
  const birth = new Date(birthDateStr);
  const target = targetDateStr ? new Date(targetDateStr) : new Date();

  if (isNaN(birth.getTime()) || isNaN(target.getTime())) {
    throw new Error('Invalid date provided');
  }

  if (birth > target) {
    throw new Error('Date of birth cannot be in the future relative to the target date');
  }

  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  let days = target.getDate() - birth.getDate();

  if (days < 0) {
    // Days in previous month of target
    const prevMonthDays = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    days += prevMonthDays;
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  // Total days
  const diffTime = target.getTime() - birth.getTime();
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Next birthday countdown
  const nextBday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBday < target) {
    nextBday.setFullYear(target.getFullYear() + 1);
  }
  const daysUntilNextBirthday = Math.ceil(
    (nextBday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    years,
    months,
    days,
    totalDays,
    daysUntilNextBirthday,
  };
}

export function calculateDateDifference(startDateStr: string, endDateStr: string) {
  const d1 = new Date(startDateStr);
  const d2 = new Date(endDateStr);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    throw new Error('Please select valid start and end dates');
  }

  const isReversed = d1 > d2;
  const start = isReversed ? d2 : d1;
  const end = isReversed ? d1 : d2;

  const diffTime = end.getTime() - start.getTime();
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;

  return {
    totalDays,
    weeks,
    remainingDays,
    isReversed,
  };
}

export function addSubtractDate(
  baseDateStr: string,
  amount: number,
  unit: 'days' | 'weeks' | 'months' | 'years',
  operation: 'add' | 'subtract'
): string {
  const d = new Date(baseDateStr);
  if (isNaN(d.getTime())) throw new Error('Invalid date');

  const sign = operation === 'add' ? 1 : -1;
  const delta = amount * sign;

  if (unit === 'days') {
    d.setDate(d.getDate() + delta);
  } else if (unit === 'weeks') {
    d.setDate(d.getDate() + delta * 7);
  } else if (unit === 'months') {
    const currentDay = d.getDate();
    d.setMonth(d.getMonth() + delta);
    // Month-end clamping (e.g. Jan 31 + 1 month -> Feb 28)
    if (d.getDate() !== currentDay) {
      d.setDate(0);
    }
  } else if (unit === 'years') {
    const currentMonth = d.getMonth();
    d.setFullYear(d.getFullYear() + delta);
    // Leap year Feb 29 to Feb 28
    if (d.getMonth() !== currentMonth) {
      d.setDate(0);
    }
  }

  return d.toISOString().split('T')[0];
}

// ==========================================
// 6. UNIT CONVERTERS
// ==========================================

export const LENGTH_FACTORS: Record<string, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  inch: 0.0254,
  foot: 0.3048,
  yard: 0.9144,
  mile: 1609.344,
};

export const WEIGHT_FACTORS: Record<string, number> = {
  mg: 0.000001,
  g: 0.001,
  kg: 1,
  oz: 0.028349523125,
  lb: 0.45359237,
  stone: 6.35029318,
  metric_ton: 1000,
};

export const AREA_FACTORS: Record<string, number> = {
  sq_mm: 0.000001,
  sq_cm: 0.0001,
  sq_m: 1,
  hectare: 10000,
  sq_in: 0.00064516,
  sq_ft: 0.09290304,
  sq_yd: 0.83612736,
  acre: 4046.8564224,
  sq_mile: 2589988.110336,
};

export const VOLUME_FACTORS: Record<string, number> = {
  ml: 0.001,
  l: 1,
  cubic_m: 1000,
  tsp_us: 0.00492892,
  tbsp_us: 0.0147868,
  fl_oz_us: 0.0295735,
  cup_us: 0.236588,
  pint_us: 0.473176,
  quart_us: 0.946353,
  gallon_us: 3.78541,
};

export const SPEED_FACTORS: Record<string, number> = {
  ms: 1,
  kmh: 0.2777777777777778,
  mph: 0.44704,
  fts: 0.3048,
  knot: 0.5144444444444445,
};

export const TIME_FACTORS: Record<string, number> = {
  ms: 0.001,
  s: 1,
  min: 60,
  hr: 3600,
  day: 86400,
  week: 604800,
};

export function convertTemperature(val: number, from: 'C' | 'F' | 'K', to: 'C' | 'F' | 'K'): number {
  let celsius = val;
  if (from === 'F') {
    celsius = ((val - 32) * 5) / 9;
  } else if (from === 'K') {
    celsius = val - 273.15;
  }

  if (to === 'C') return celsius;
  if (to === 'F') return (celsius * 9) / 5 + 32;
  if (to === 'K') return celsius + 273.15;
  return celsius;
}

export function convertDataStorage(
  val: number,
  from: string,
  to: string,
  isBinary: boolean = false
): number {
  const base = isBinary ? 1024 : 1000;
  const powerMap: Record<string, number> = {
    bit: -1, // 1/8 byte
    byte: 0,
    kb: 1,
    mb: 2,
    gb: 3,
    tb: 4,
  };

  const fromP = powerMap[from.toLowerCase()];
  const toP = powerMap[to.toLowerCase()];

  if (fromP === undefined || toP === undefined) return val;

  // Convert to bytes first
  let bytes = 0;
  if (fromP === -1) {
    bytes = val / 8;
  } else {
    bytes = val * Math.pow(base, fromP);
  }

  // Convert from bytes to target
  if (toP === -1) {
    return bytes * 8;
  } else {
    return bytes / Math.pow(base, toP);
  }
}

// ==========================================
// 7. FINANCIAL FORMULAS
// ==========================================

export function calculateSimpleInterest(principal: number, rate: number, timeYears: number) {
  const interest = (principal * rate * timeYears) / 100;
  const totalAmount = principal + interest;
  return {
    principal,
    interest: Number(interest.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

export function calculateCompoundInterest(
  principal: number,
  rate: number,
  timeYears: number,
  compoundFrequencyPerYear: number
) {
  const r = rate / 100;
  const n = compoundFrequencyPerYear;
  const t = timeYears;

  const amount = principal * Math.pow(1 + r / n, n * t);
  const interest = amount - principal;

  return {
    principal,
    interest: Number(interest.toFixed(2)),
    totalAmount: Number(amount.toFixed(2)),
  };
}

export function calculateEmi(principal: number, annualRate: number, tenureMonths: number) {
  if (annualRate === 0) {
    const monthlyPayment = principal / tenureMonths;
    return {
      monthlyEmi: Number(monthlyPayment.toFixed(2)),
      totalPayment: Number(principal.toFixed(2)),
      totalInterest: 0,
    };
  }

  const r = annualRate / (12 * 100);
  const n = tenureMonths;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n;
  const totalInterest = totalPayment - principal;

  return {
    monthlyEmi: Number(emi.toFixed(2)),
    totalPayment: Number(totalPayment.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
  };
}

export function calculateSavings(
  initialBalance: number,
  regularDeposit: number,
  depositFrequency: 'monthly' | 'annually',
  annualRatePct: number,
  years: number
) {
  const r = annualRatePct / 100;
  const periodsPerYear = depositFrequency === 'monthly' ? 12 : 1;
  const totalPeriods = years * periodsPerYear;
  const ratePerPeriod = r / periodsPerYear;

  let balance = initialBalance;
  let totalDeposited = initialBalance;

  for (let i = 0; i < totalPeriods; i++) {
    balance = balance * (1 + ratePerPeriod) + regularDeposit;
    totalDeposited += regularDeposit;
  }

  const totalInterestEarned = balance - totalDeposited;

  return {
    totalDeposited: Number(totalDeposited.toFixed(2)),
    totalInterestEarned: Number(totalInterestEarned.toFixed(2)),
    endingBalance: Number(balance.toFixed(2)),
  };
}
