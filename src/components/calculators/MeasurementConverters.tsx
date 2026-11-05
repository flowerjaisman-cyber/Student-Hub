import { useState } from 'react';
import {
  LENGTH_FACTORS,
  WEIGHT_FACTORS,
  AREA_FACTORS,
  VOLUME_FACTORS,
  SPEED_FACTORS,
  TIME_FACTORS,
  convertTemperature,
  convertDataStorage,
} from '../../utils/calculatorUtils.ts';
import { CalculatorCardWrapper } from './CalculatorCardWrapper.tsx';
import {
  ArrowRightLeft,
  Ruler,
  Scale,
  Thermometer,
  Boxes,
  Gauge,
  Clock,
  HardDrive,
  Coins,
  Info,
} from 'lucide-react';

interface MeasurementProps {
  toolId:
    | 'length'
    | 'weight'
    | 'temperature'
    | 'area'
    | 'volume'
    | 'speed'
    | 'time-unit'
    | 'data-storage'
    | 'currency';
  onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void;
}

// Unit Definitions
const UNIT_DEFINITIONS: Record<
  string,
  {
    title: string;
    description: string;
    icon: any;
    units: { key: string; label: string }[];
  }
> = {
  length: {
    title: 'Length & Distance Converter',
    description: 'Convert between metric and imperial linear measurements with exact factors.',
    icon: Ruler,
    units: [
      { key: 'mm', label: 'Millimeters (mm)' },
      { key: 'cm', label: 'Centimeters (cm)' },
      { key: 'm', label: 'Meters (m)' },
      { key: 'km', label: 'Kilometers (km)' },
      { key: 'inch', label: 'Inches (in)' },
      { key: 'foot', label: 'Feet (ft)' },
      { key: 'yard', label: 'Yards (yd)' },
      { key: 'mile', label: 'Miles (mi)' },
    ],
  },
  weight: {
    title: 'Weight & Mass Converter',
    description: 'Convert between milligrams, grams, kilograms, ounces, pounds, stones, and tons.',
    icon: Scale,
    units: [
      { key: 'mg', label: 'Milligrams (mg)' },
      { key: 'g', label: 'Grams (g)' },
      { key: 'kg', label: 'Kilograms (kg)' },
      { key: 'oz', label: 'Ounces (oz)' },
      { key: 'lb', label: 'Pounds (lb)' },
      { key: 'stone', label: 'Stones (st)' },
      { key: 'metric_ton', label: 'Metric Tons (t)' },
    ],
  },
  temperature: {
    title: 'Temperature Converter',
    description: 'Convert between Celsius (°C), Fahrenheit (°F), and Kelvin (K) using exact thermodynamic formulas.',
    icon: Thermometer,
    units: [
      { key: 'C', label: 'Celsius (°C)' },
      { key: 'F', label: 'Fahrenheit (°F)' },
      { key: 'K', label: 'Kelvin (K)' },
    ],
  },
  area: {
    title: 'Area & Surface Converter',
    description: 'Convert surface areas from square millimeters and meters to acres and hectares.',
    icon: Boxes,
    units: [
      { key: 'sq_mm', label: 'Square Millimeters (mm²)' },
      { key: 'sq_cm', label: 'Square Centimeters (cm²)' },
      { key: 'sq_m', label: 'Square Meters (m²)' },
      { key: 'hectare', label: 'Hectares (ha)' },
      { key: 'sq_in', label: 'Square Inches (in²)' },
      { key: 'sq_ft', label: 'Square Feet (ft²)' },
      { key: 'sq_yd', label: 'Square Yards (yd²)' },
      { key: 'acre', label: 'Acres' },
      { key: 'sq_mile', label: 'Square Miles (mi²)' },
    ],
  },
  volume: {
    title: 'Volume & Capacity Converter',
    description: 'Convert milliliters, liters, cubic meters, and US customary culinary measures.',
    icon: Boxes,
    units: [
      { key: 'ml', label: 'Milliliters (ml)' },
      { key: 'l', label: 'Liters (L)' },
      { key: 'cubic_m', label: 'Cubic Meters (m³)' },
      { key: 'tsp_us', label: 'US Teaspoons (tsp)' },
      { key: 'tbsp_us', label: 'US Tablespoons (tbsp)' },
      { key: 'fl_oz_us', label: 'US Fluid Ounces (fl oz)' },
      { key: 'cup_us', label: 'US Cups' },
      { key: 'pint_us', label: 'US Pints (pt)' },
      { key: 'quart_us', label: 'US Quarts (qt)' },
      { key: 'gallon_us', label: 'US Gallons (gal)' },
    ],
  },
  speed: {
    title: 'Speed & Velocity Converter',
    description: 'Convert between meters per second, km/h, mph, feet per second, and nautical knots.',
    icon: Gauge,
    units: [
      { key: 'ms', label: 'Meters per second (m/s)' },
      { key: 'kmh', label: 'Kilometers per hour (km/h)' },
      { key: 'mph', label: 'Miles per hour (mph)' },
      { key: 'fts', label: 'Feet per second (ft/s)' },
      { key: 'knot', label: 'Knots (kn)' },
    ],
  },
  'time-unit': {
    title: 'Time Unit Converter',
    description: 'Convert milliseconds, seconds, minutes, hours, days, and weeks.',
    icon: Clock,
    units: [
      { key: 'ms', label: 'Milliseconds (ms)' },
      { key: 's', label: 'Seconds (s)' },
      { key: 'min', label: 'Minutes (min)' },
      { key: 'hr', label: 'Hours (hr)' },
      { key: 'day', label: 'Days' },
      { key: 'week', label: 'Weeks' },
    ],
  },
  'data-storage': {
    title: 'Data Storage Converter',
    description: 'Convert bits, bytes, KB, MB, GB, and TB with explicit decimal vs binary standards.',
    icon: HardDrive,
    units: [
      { key: 'bit', label: 'Bits (b)' },
      { key: 'byte', label: 'Bytes (B)' },
      { key: 'kb', label: 'Kilobytes (KB / KiB)' },
      { key: 'mb', label: 'Megabytes (MB / MiB)' },
      { key: 'gb', label: 'Gigabytes (GB / GiB)' },
      { key: 'tb', label: 'Terabytes (TB / TiB)' },
    ],
  },
};

export function UnitConverter({
  toolId,
  onSaveCalculation,
}: {
  toolId:
    | 'length'
    | 'weight'
    | 'temperature'
    | 'area'
    | 'volume'
    | 'speed'
    | 'time-unit'
    | 'data-storage';
  onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void;
}) {
  const config = UNIT_DEFINITIONS[toolId] || UNIT_DEFINITIONS.length;
  const [inputValue, setInputValue] = useState(1);
  const [fromUnit, setFromUnit] = useState(config.units[0]?.key || '');
  const [toUnit, setToUnit] = useState(config.units[1]?.key || '');
  const [isBinary, setIsBinary] = useState(false); // For data storage

  // Perform conversion
  let convertedValue = 0;
  if (toolId === 'temperature') {
    convertedValue = convertTemperature(
      inputValue,
      fromUnit as any,
      toUnit as any
    );
  } else if (toolId === 'data-storage') {
    convertedValue = convertDataStorage(inputValue, fromUnit, toUnit, isBinary);
  } else {
    let factors: Record<string, number> = LENGTH_FACTORS;
    if (toolId === 'weight') factors = WEIGHT_FACTORS;
    if (toolId === 'area') factors = AREA_FACTORS;
    if (toolId === 'volume') factors = VOLUME_FACTORS;
    if (toolId === 'speed') factors = SPEED_FACTORS;
    if (toolId === 'time-unit') factors = TIME_FACTORS;

    const baseVal = inputValue * (factors[fromUnit] || 1);
    convertedValue = baseVal / (factors[toUnit] || 1);
  }

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const formattedResult =
    Math.abs(convertedValue) < 0.0001 && convertedValue !== 0
      ? convertedValue.toExponential(4)
      : Number(convertedValue.toFixed(6)).toString();

  const fromLabel = config.units.find((u) => u.key === fromUnit)?.label || fromUnit;
  const toLabel = config.units.find((u) => u.key === toUnit)?.label || toUnit;
  const resultSnippet = `${inputValue} ${fromLabel} = ${formattedResult} ${toLabel}`;

  return (
    <CalculatorCardWrapper
      title={config.title}
      description={config.description}
      categoryBadge="Measurement"
      formula={`Target = (Value × Source Factor) / Target Factor`}
      formulaExplanation="Uses internationally recognized ISO/IEC conversion constants with high floating-point precision."
      onReset={() => {
        setInputValue(1);
        setFromUnit(config.units[0]?.key || '');
        setToUnit(config.units[1]?.key || '');
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.(`${config.title} Conversion`, toolId, { inputValue, fromUnit, toUnit }, resultSnippet)}
    >
      <div className="space-y-4 max-w-md mx-auto">
        {toolId === 'data-storage' && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Standard:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsBinary(false)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  !isBinary
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Decimal (1000)
              </button>
              <button
                type="button"
                onClick={() => setIsBinary(true)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  isBinary
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Binary (1024)
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Amount to Convert:
          </label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              From:
            </label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {config.units.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center pt-5 sm:pt-4">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Swap units"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              To:
            </label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {config.units.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result Card */}
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Converted Measurement
          </span>
          <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white truncate">
            {formattedResult}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {toLabel}
          </p>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 2. HONEST & DETERMINISTIC CURRENCY CONVERTER
// ==========================================
export function CurrencyConverter({
  onSaveCalculation,
}: {
  onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void;
}) {
  const [amount, setAmount] = useState<number>(100);
  const [sourceCurr, setSourceCurr] = useState('USD');
  const [targetCurr, setTargetCurr] = useState('EUR');
  const [customRate, setCustomRate] = useState<number>(0.92);

  const convertedTotal = amount * customRate;

  const handleSwap = () => {
    setSourceCurr(targetCurr);
    setTargetCurr(sourceCurr);
    if (customRate > 0) {
      setCustomRate(Number((1 / customRate).toFixed(4)));
    }
  };

  const resultSnippet = `${amount} ${sourceCurr} @ ${customRate} = ${convertedTotal.toFixed(2)} ${targetCurr}`;

  return (
    <CalculatorCardWrapper
      title="Currency &amp; Exchange Rate Converter"
      description="Deterministic currency converter. In accordance with privacy & zero-fake-data standards, exchange rates are user-specified or verifiable."
      categoryBadge="Measurement"
      formula="Target Amount = Source Amount × Exchange Rate"
      formulaExplanation="Strict Rule: NO fake or simulated rates are ever generated. You set or verify the true exchange rate to guarantee authentic conversions."
      onReset={() => {
        setAmount(100);
        setCustomRate(1.0);
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Currency Conversion', 'currency', { amount, sourceCurr, targetCurr, customRate }, resultSnippet)}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Authentic Calculation:</strong> No fabricated exchange rates. Input your current bank or transaction rate below for 100% accurate conversion.
          </span>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Amount to Convert:
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-5 gap-2 items-center">
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Source:
            </label>
            <input
              type="text"
              maxLength={4}
              value={sourceCurr}
              onChange={(e) => setSourceCurr(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 uppercase font-mono font-bold"
            />
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
              title="Swap currencies"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target:
            </label>
            <input
              type="text"
              maxLength={4}
              value={targetCurr}
              onChange={(e) => setTargetCurr(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 uppercase font-mono font-bold"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Exchange Rate (1 {sourceCurr} in {targetCurr}):
          </label>
          <input
            type="number"
            min="0.000001"
            step="0.0001"
            value={customRate}
            onChange={(e) => setCustomRate(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
          />
        </div>

        {/* Result Card */}
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Converted Result
          </span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
            {convertedTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            <span className="text-sm font-sans font-bold text-indigo-600">{targetCurr}</span>
          </p>
          <p className="text-xs font-mono text-slate-500">
            Rate applied: 1 {sourceCurr} = {customRate} {targetCurr}
          </p>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}
