import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  CalculatorId,
  CalculatorCategory,
  SavedCalculationItem,
  CalculationHistoryItem,
} from '../../types/index.ts';
import {
  saveUserCalculation,
  deleteUserCalculation,
  subscribeUserCalculations,
} from '../../services/calculatorService.ts';

// Component Imports
import {
  PercentageMarksCalculator,
  GpaCalculator,
  CgpaCalculator,
  GradeCalculator,
  WeightedAverageCalculator,
} from './AcademicCalculators.tsx';
import {
  BasicCalculator,
  ScientificCalculator,
  FractionCalculator,
  RatioCalculator,
  PercentageChangeCalculator,
  StatisticsCalculator,
  RandomNumberUtility,
} from './MathCalculators.tsx';
import {
  AgeCalculator,
  DateDifferenceCalculator,
  AddSubtractDatesCalculator,
  TimeDurationCalculator,
  ExamCountdownTool,
} from './DateTimeCalculators.tsx';
import {
  UnitConverter,
  CurrencyConverter,
} from './MeasurementConverters.tsx';
import {
  SimpleInterestCalculator,
  CompoundInterestCalculator,
  EmiCalculator,
  SavingsCalculator,
  DiscountCalculator,
  MarkupCalculator,
  ProfitLossCalculator,
} from './FinanceCalculators.tsx';

// Icons
import {
  Calculator as CalcIcon,
  GraduationCap,
  Percent,
  Award,
  Layers,
  BarChart,
  Binary,
  Divide,
  Scale,
  TrendingUp,
  Calendar,
  Clock,
  Hourglass,
  CalendarDays,
  Ruler,
  Boxes,
  Thermometer,
  Gauge,
  HardDrive,
  Coins,
  DollarSign,
  Landmark,
  PiggyBank,
  Tag,
  Search,
  Bookmark,
  History,
  Trash2,
  Copy,
  Check,
  X,
  Plus,
  ShieldCheck,
  Lock,
  ArrowRight,
  ChevronRight,
  Star,
} from 'lucide-react';

interface ToolMeta {
  id: CalculatorId;
  name: string;
  category: CalculatorCategory;
  categoryLabel: string;
  description: string;
  icon: any;
  tags: string[];
}

const ALL_CALCULATORS: ToolMeta[] = [
  // Academic
  {
    id: 'percentage-marks',
    name: 'Percentage & Marks',
    category: 'academic',
    categoryLabel: 'Academic',
    description: 'Subject-wise marks totals, remaining scores, and overall percentages.',
    icon: Percent,
    tags: ['marks', 'percentage', 'subjects', 'exams', 'score', 'results'],
  },
  {
    id: 'gpa',
    name: 'GPA Calculator',
    category: 'academic',
    categoryLabel: 'Academic',
    description: 'Semester Grade Point Average with course credit weighting and scale presets.',
    icon: GraduationCap,
    tags: ['gpa', 'grade', 'credits', 'quality points', 'semester', '4.0', 'scale'],
  },
  {
    id: 'cgpa',
    name: 'CGPA Calculator',
    category: 'academic',
    categoryLabel: 'Academic',
    description: 'Cumulative GPA across all semesters accurately weighted by credit hours.',
    icon: Award,
    tags: ['cgpa', 'cumulative', 'degree', 'transcripts', 'weighted', 'academic'],
  },
  {
    id: 'grade',
    name: 'Grade Converter',
    category: 'academic',
    categoryLabel: 'Academic',
    description: 'Convert marks/percentage to letter grades based on US, UK, or 10-point scales.',
    icon: Layers,
    tags: ['grade', 'letter', 'conversion', 'boundaries', 'honours', 'points'],
  },
  {
    id: 'weighted-average',
    name: 'Weighted Average',
    category: 'academic',
    categoryLabel: 'Academic',
    description: 'Calculate weighted averages for coursework assignments, exams, and projects.',
    icon: Scale,
    tags: ['average', 'weight', 'assignments', 'syllabus', 'proportions'],
  },

  // Mathematics
  {
    id: 'basic',
    name: 'Basic Calculator',
    category: 'math',
    categoryLabel: 'Mathematics',
    description: 'Standard 4-function arithmetic calculator with parenthesis evaluation.',
    icon: CalcIcon,
    tags: ['calculator', 'arithmetic', 'add', 'subtract', 'multiply', 'divide'],
  },
  {
    id: 'scientific',
    name: 'Scientific Calculator',
    category: 'math',
    categoryLabel: 'Mathematics',
    description: 'Trigonometry, logarithms, exponentials, roots, powers, and factorials.',
    icon: Binary,
    tags: ['scientific', 'sin', 'cos', 'tan', 'log', 'sqrt', 'power', 'factorial', 'radians'],
  },
  {
    id: 'fraction',
    name: 'Fraction Calculator',
    category: 'math',
    categoryLabel: 'Mathematics',
    description: 'Add, subtract, multiply, and divide fractions with mixed-number outputs.',
    icon: Divide,
    tags: ['fractions', 'numerator', 'denominator', 'mixed number', 'simplify', 'gcd'],
  },
  {
    id: 'ratio',
    name: 'Ratio & Proportions',
    category: 'math',
    categoryLabel: 'Mathematics',
    description: 'Simplify ratios and split totals into proportional shares.',
    icon: Scale,
    tags: ['ratio', 'proportions', 'split', 'sharing', 'simplify'],
  },
  {
    id: 'percentage-change',
    name: 'Percentage Change',
    category: 'math',
    categoryLabel: 'Mathematics',
    description: 'Determine absolute difference and percentage increase or decrease.',
    icon: TrendingUp,
    tags: ['growth', 'change', 'increase', 'decrease', 'difference'],
  },
  {
    id: 'statistics',
    name: 'Statistics Calculator',
    category: 'math',
    categoryLabel: 'Mathematics',
    description: 'Mean, median, mode, range, and sample vs population standard deviation.',
    icon: BarChart,
    tags: ['stats', 'mean', 'median', 'mode', 'standard deviation', 'variance', 'range'],
  },
  {
    id: 'random-number',
    name: 'Random & Simulation',
    category: 'math',
    categoryLabel: 'Mathematics',
    description: 'Generate unique random numbers, simulate dice rolls, and random picks.',
    icon: Binary,
    tags: ['random', 'dice', 'simulation', 'd6', 'd20', 'sample', 'generator'],
  },

  // Date & Time
  {
    id: 'age',
    name: 'Age Calculator',
    category: 'date-time',
    categoryLabel: 'Date & Time',
    description: 'Chronological age breakdown in years, months, days, and birthday countdown.',
    icon: Calendar,
    tags: ['age', 'birthday', 'dob', 'years', 'months', 'days', 'life'],
  },
  {
    id: 'date-difference',
    name: 'Date Difference',
    category: 'date-time',
    categoryLabel: 'Date & Time',
    description: 'Exact day count, weeks, and duration between any two calendar dates.',
    icon: CalendarDays,
    tags: ['dates', 'difference', 'days between', 'span', 'calendar', 'weeks'],
  },
  {
    id: 'add-subtract-dates',
    name: 'Add / Subtract Date',
    category: 'date-time',
    categoryLabel: 'Date & Time',
    description: 'Add or subtract days, weeks, months, or years with month-end adjustment.',
    icon: Calendar,
    tags: ['adjust date', 'add days', 'subtract months', 'future date', 'deadline'],
  },
  {
    id: 'time-duration',
    name: 'Time Duration',
    category: 'date-time',
    categoryLabel: 'Date & Time',
    description: 'Hours and minutes elapsed between two times with overnight midnight handling.',
    icon: Clock,
    tags: ['time', 'duration', 'hours', 'minutes', 'elapsed', 'shift', 'study time'],
  },
  {
    id: 'exam-countdown',
    name: 'Exam Countdown',
    category: 'date-time',
    categoryLabel: 'Date & Time',
    description: 'Live ticking countdowns for upcoming exams, midterms, and project deadlines.',
    icon: Hourglass,
    tags: ['exam', 'countdown', 'ticker', 'deadlines', 'tests', 'timer', 'finals'],
  },

  // Measurement
  {
    id: 'length',
    name: 'Length & Distance',
    category: 'measurement',
    categoryLabel: 'Measurement',
    description: 'Convert between millimeters, meters, kilometers, inches, feet, and miles.',
    icon: Ruler,
    tags: ['length', 'meters', 'feet', 'inches', 'km', 'miles', 'metric', 'imperial'],
  },
  {
    id: 'weight',
    name: 'Weight & Mass',
    category: 'measurement',
    categoryLabel: 'Measurement',
    description: 'Convert between milligrams, grams, kilograms, pounds, and ounces.',
    icon: Scale,
    tags: ['weight', 'mass', 'kg', 'grams', 'lbs', 'pounds', 'ounces'],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    category: 'measurement',
    categoryLabel: 'Measurement',
    description: 'Convert Celsius, Fahrenheit, and Kelvin using exact scientific equations.',
    icon: Thermometer,
    tags: ['temperature', 'celsius', 'fahrenheit', 'kelvin', 'thermodynamics'],
  },
  {
    id: 'area',
    name: 'Area & Surface',
    category: 'measurement',
    categoryLabel: 'Measurement',
    description: 'Convert square meters, square feet, acres, and hectares.',
    icon: Boxes,
    tags: ['area', 'sq ft', 'sq meters', 'acres', 'hectares', 'surface'],
  },
  {
    id: 'volume',
    name: 'Volume & Capacity',
    category: 'measurement',
    categoryLabel: 'Measurement',
    description: 'Convert liters, milliliters, fluid ounces, cups, pints, and gallons.',
    icon: Boxes,
    tags: ['volume', 'liters', 'ml', 'cups', 'gallons', 'fl oz', 'capacity'],
  },
  {
    id: 'speed',
    name: 'Speed & Velocity',
    category: 'measurement',
    categoryLabel: 'Measurement',
    description: 'Convert between meters per second, km/h, mph, and nautical knots.',
    icon: Gauge,
    tags: ['speed', 'velocity', 'kmh', 'mph', 'knots', 'm/s'],
  },
  {
    id: 'time-unit',
    name: 'Time Units',
    category: 'measurement',
    categoryLabel: 'Measurement',
    description: 'Convert between milliseconds, seconds, minutes, hours, days, and weeks.',
    icon: Clock,
    tags: ['time units', 'seconds', 'hours', 'minutes', 'days', 'weeks'],
  },
  {
    id: 'data-storage',
    name: 'Data Storage Units',
    category: 'measurement',
    categoryLabel: 'Measurement',
    description: 'Convert bits, bytes, KB, MB, GB, and TB with decimal vs binary toggle.',
    icon: HardDrive,
    tags: ['data', 'bytes', 'mb', 'gb', 'tb', 'binary', 'decimal', 'bits'],
  },
  {
    id: 'currency',
    name: 'Currency & Exchange',
    category: 'measurement',
    categoryLabel: 'Measurement',
    description: 'Deterministic conversion with user-verifiable exchange rates (no fake rates).',
    icon: Coins,
    tags: ['currency', 'exchange', 'usd', 'eur', 'forex', 'rate', 'money'],
  },

  // Finance
  {
    id: 'simple-interest',
    name: 'Simple Interest',
    category: 'finance',
    categoryLabel: 'Finance',
    description: 'Linear interest calculation and total maturity amount on savings/loans.',
    icon: DollarSign,
    tags: ['interest', 'simple interest', 'principal', 'rate', 'maturity'],
  },
  {
    id: 'compound-interest',
    name: 'Compound Interest',
    category: 'finance',
    categoryLabel: 'Finance',
    description: 'Model exponential interest growth with daily, monthly, or annual compounding.',
    icon: TrendingUp,
    tags: ['compound interest', 'growth', 'savings', 'future value', 'investing'],
  },
  {
    id: 'emi',
    name: 'Loan EMI Calculator',
    category: 'finance',
    categoryLabel: 'Finance',
    description: 'Calculate monthly loan repayment installments, total interest, and principal.',
    icon: Landmark,
    tags: ['emi', 'loan', 'installments', 'student loan', 'monthly payment'],
  },
  {
    id: 'savings',
    name: 'Savings Goal Projection',
    category: 'finance',
    categoryLabel: 'Finance',
    description: 'Project future balance based on periodic deposits and compound growth.',
    icon: PiggyBank,
    tags: ['savings', 'budget', 'goal', 'recurring deposit', 'wealth'],
  },
  {
    id: 'discount',
    name: 'Discount & Sale Savings',
    category: 'finance',
    categoryLabel: 'Finance',
    description: 'Calculate net price and monetary savings after percentage discounts.',
    icon: Tag,
    tags: ['discount', 'sale', 'savings', 'percentage off', 'shopping'],
  },
  {
    id: 'profit-loss',
    name: 'Profit & Loss',
    category: 'finance',
    categoryLabel: 'Finance',
    description: 'Determine net financial margin, gains, or losses on sales and costs.',
    icon: TrendingUp,
    tags: ['profit', 'loss', 'margin', 'cost', 'revenue', 'business'],
  },
  {
    id: 'markup',
    name: 'Markup Calculator',
    category: 'finance',
    categoryLabel: 'Finance',
    description: 'Determine selling prices and gross markup margins over base costs.',
    icon: Percent,
    tags: ['markup', 'pricing', 'retail', 'selling price', 'cost'],
  },
];

interface CalculatorsViewProps {
  initialToolId?: CalculatorId;
}

export function CalculatorsView({ initialToolId }: CalculatorsViewProps) {
  const { user } = useAuth();

  const [activeToolId, setActiveToolId] = useState<CalculatorId>(
    initialToolId || 'percentage-marks'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Favorites in localStorage
  const [favoriteIds, setFavoriteIds] = useState<CalculatorId[]>(() => {
    try {
      const saved = localStorage.getItem('studenthub_calculator_favorites');
      return saved ? JSON.parse(saved) : ['percentage-marks', 'gpa', 'basic', 'age'];
    } catch {
      return ['percentage-marks', 'gpa', 'basic', 'age'];
    }
  });

  const toggleFavorite = (id: CalculatorId, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('studenthub_calculator_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Session History Tape
  const [historyTape, setHistoryTape] = useState<CalculationHistoryItem[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const handleRecordHistory = (expression: string, result: string) => {
    const activeTool = ALL_CALCULATORS.find((t) => t.id === activeToolId);
    setHistoryTape((prev) => [
      {
        id: Date.now().toString(),
        calculatorId: activeToolId,
        calculatorName: activeTool?.name || 'Calculation',
        expression,
        result,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      ...prev.slice(0, 49), // Keep latest 50
    ]);
  };

  // Firestore Saved Calculations & Countdowns
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculationItem[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalTitle, setSaveModalTitle] = useState('');
  const [pendingSavePayload, setPendingSavePayload] = useState<{
    type: CalculatorId;
    inputs: any;
    result: string;
    targetDate?: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Subscribe to user calculations in Firestore
  useEffect(() => {
    if (!user?.uid) {
      setSavedCalculations([]);
      return;
    }
    const unsubscribe = subscribeUserCalculations(user.uid, (items) => {
      setSavedCalculations(items);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleOpenSaveModal = (
    defaultTitle: string,
    type: CalculatorId,
    inputs: any,
    result: string,
    targetDate?: string
  ) => {
    if (!user) {
      alert('Please sign in with Google to save calculations to your cloud workspace.');
      return;
    }

    // Direct save for countdowns
    if (type === 'exam-countdown') {
      const newItem: SavedCalculationItem = {
        id: Date.now().toString(),
        title: defaultTitle,
        calculatorType: type,
        calculatorName: 'Exam Countdown',
        inputs,
        result,
        targetDate,
        createdAt: new Date().toISOString(),
      };
      saveUserCalculation(user.uid, newItem);
      return;
    }

    setSaveModalTitle(defaultTitle);
    setPendingSavePayload({ type, inputs, result, targetDate });
    setSaveModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!user || !pendingSavePayload || !saveModalTitle.trim()) return;
    setIsSaving(true);

    try {
      const activeTool = ALL_CALCULATORS.find((t) => t.id === pendingSavePayload.type);
      const item: SavedCalculationItem = {
        id: Date.now().toString(),
        title: saveModalTitle.trim(),
        calculatorType: pendingSavePayload.type,
        calculatorName: activeTool?.name || 'Calculation',
        inputs: pendingSavePayload.inputs,
        result: pendingSavePayload.result,
        createdAt: new Date().toISOString(),
      };

      await saveUserCalculation(user.uid, item);
      setSaveModalOpen(false);
      setPendingSavePayload(null);
    } catch (err) {
      console.error('Failed to save calculation:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    if (!user) return;
    try {
      await deleteUserCalculation(user.uid, id);
    } catch (err) {
      console.error('Failed to delete saved item:', err);
    }
  };

  // Filtered calculators
  const filteredCalculators = useMemo(() => {
    let list = ALL_CALCULATORS;

    if (selectedCategory === 'favorites') {
      list = list.filter((c) => favoriteIds.includes(c.id));
    } else if (selectedCategory !== 'all') {
      list = list.filter((c) => c.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((tag) => tag.includes(q))
      );
    }

    return list;
  }, [selectedCategory, searchQuery, favoriteIds]);

  const activeToolMeta = ALL_CALCULATORS.find((t) => t.id === activeToolId);

  // Render the currently selected calculator
  const renderActiveCalculator = () => {
    switch (activeToolId) {
      // Academic
      case 'percentage-marks':
        return (
          <PercentageMarksCalculator
            onSaveCalculation={handleOpenSaveModal}
            onRecordHistory={handleRecordHistory}
          />
        );
      case 'gpa':
        return <GpaCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'cgpa':
        return <CgpaCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'grade':
        return <GradeCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'weighted-average':
        return <WeightedAverageCalculator onSaveCalculation={handleOpenSaveModal} />;

      // Mathematics
      case 'basic':
        return (
          <BasicCalculator
            onSaveCalculation={handleOpenSaveModal}
            onRecordHistory={handleRecordHistory}
          />
        );
      case 'scientific':
        return (
          <ScientificCalculator
            onSaveCalculation={handleOpenSaveModal}
            onRecordHistory={handleRecordHistory}
          />
        );
      case 'fraction':
        return <FractionCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'ratio':
        return <RatioCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'percentage-change':
        return <PercentageChangeCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'statistics':
        return <StatisticsCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'random-number':
        return <RandomNumberUtility />;

      // Date & Time
      case 'age':
        return <AgeCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'date-difference':
        return <DateDifferenceCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'add-subtract-dates':
        return <AddSubtractDatesCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'time-duration':
        return <TimeDurationCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'exam-countdown':
        return (
          <ExamCountdownTool
            onSaveCalculation={handleOpenSaveModal}
            savedCountdowns={savedCalculations}
            onDeleteCountdown={handleDeleteSaved}
            uid={user?.uid}
          />
        );

      // Measurement
      case 'length':
      case 'weight':
      case 'temperature':
      case 'area':
      case 'volume':
      case 'speed':
      case 'time-unit':
      case 'data-storage':
        return (
          <UnitConverter
            toolId={activeToolId as any}
            onSaveCalculation={handleOpenSaveModal}
          />
        );
      case 'currency':
        return <CurrencyConverter onSaveCalculation={handleOpenSaveModal} />;

      // Finance
      case 'simple-interest':
        return <SimpleInterestCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'compound-interest':
        return <CompoundInterestCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'emi':
        return <EmiCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'savings':
        return <SavingsCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'discount':
        return <DiscountCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'markup':
        return <MarkupCalculator onSaveCalculation={handleOpenSaveModal} />;
      case 'profit-loss':
        return <ProfitLossCalculator onSaveCalculation={handleOpenSaveModal} />;

      default:
        return (
          <PercentageMarksCalculator
            onSaveCalculation={handleOpenSaveModal}
            onRecordHistory={handleRecordHistory}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CalcIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Calculators &amp; Converters
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Deterministic academic, scientific, date, unit, and financial tools. 100% private and calculated from your real inputs.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowHistoryDrawer(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-4 h-4 text-indigo-500" />
            <span>Tape History ({historyTape.length})</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Sidebar / Catalog (5 Cols on large) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 32+ calculators..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'favorites', label: 'Starred' },
                { key: 'academic', label: 'Academic' },
                { key: 'math', label: 'Math' },
                { key: 'date-time', label: 'Date' },
                { key: 'measurement', label: 'Units' },
                { key: 'finance', label: 'Finance' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    selectedCategory === cat.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Tools List */}
            <div className="space-y-1 max-h-[550px] overflow-y-auto pr-1">
              {filteredCalculators.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No calculators matching &quot;{searchQuery}&quot;
                </p>
              ) : (
                filteredCalculators.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = tool.id === activeToolId;
                  const isFav = favoriteIds.includes(tool.id);

                  return (
                    <div
                      key={tool.id}
                      onClick={() => setActiveToolId(tool.id)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shadow-xs'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${
                              isActive
                                ? 'text-indigo-950 dark:text-indigo-200'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {tool.name}
                          </p>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {tool.categoryLabel}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(tool.id, e)}
                        className={`p-1 rounded transition-colors shrink-0 ${
                          isFav
                            ? 'text-amber-500'
                            : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                        }`}
                        title={isFav ? 'Remove from favorites' : 'Star calculator'}
                      >
                        <Star
                          className="w-3.5 h-3.5"
                          fill={isFav ? 'currentColor' : 'none'}
                        />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Cloud Persistence Notice */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs flex items-start gap-2.5 text-indigo-950 dark:text-indigo-300">
            <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Private &amp; Authenticated:</strong> All saved GPA records, countdowns, and notes are securely stored in your personal cloud collection.
            </div>
          </div>
        </div>

        {/* Right Active Calculator Workspace (7 Cols on large) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            {renderActiveCalculator()}
          </div>

          {/* Saved Items for Current User */}
          {savedCalculations.length > 0 && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Your Saved Calculations &amp; Records ({savedCalculations.length})
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {savedCalculations.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleDeleteSaved(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer shrink-0"
                          title="Delete saved item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block">
                        {item.calculatorName}
                      </span>
                      <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate mt-1">
                        {item.result}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <button
                        type="button"
                        onClick={() => setActiveToolId(item.calculatorType)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        Open tool &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Calculation Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Save Calculation to Cloud
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Title / Label:
              </label>
              <input
                type="text"
                value={saveModalTitle}
                onChange={(e) => setSaveModalTitle(e.target.value)}
                placeholder="e.g. Fall 2026 GPA, Physics Midterm Percentage..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {pendingSavePayload && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-xs">
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Calculated Outcome:
                </span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {pendingSavePayload.result}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving || !saveModalTitle.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save to Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session History Drawer */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm h-full bg-white dark:bg-slate-900 p-5 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 animate-slide-left">
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Calculation Tape History
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryDrawer(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {historyTape.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-10">
                    No calculations recorded in this session yet.
                  </p>
                ) : (
                  historyTape.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {h.calculatorName}
                        </span>
                        <span>{h.timestamp}</span>
                      </div>
                      <p className="font-mono text-slate-500 text-[11px] truncate">
                        {h.expression}
                      </p>
                      <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        = {h.result}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {historyTape.length > 0 && (
              <button
                type="button"
                onClick={() => setHistoryTape([])}
                className="w-full py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 dark:border-rose-900 cursor-pointer"
              >
                Clear Session History
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
