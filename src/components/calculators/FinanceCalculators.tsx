import { useState } from 'react';
import {
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateEmi,
  calculateSavings,
} from '../../utils/calculatorUtils.ts';
import { CalculatorCardWrapper } from './CalculatorCardWrapper.tsx';
import { DollarSign, Percent, TrendingUp, Landmark, Tag } from 'lucide-react';

interface FinanceProps {
  toolId:
    | 'simple-interest'
    | 'compound-interest'
    | 'emi'
    | 'savings'
    | 'discount'
    | 'markup'
    | 'profit-loss';
  onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void;
}

// ==========================================
// 1. SIMPLE INTEREST
// ==========================================
export function SimpleInterestCalculator({ onSaveCalculation }: { onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void }) {
  const [principal, setPrincipal] = useState(1000);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(3);

  const res = calculateSimpleInterest(principal, rate, years);
  const resultSnippet = `Principal: $${principal} @ ${rate}% for ${years} yrs = Interest: $${res.interest}, Total: $${res.totalAmount}`;

  return (
    <CalculatorCardWrapper
      title="Simple Interest Calculator"
      description="Calculate linear interest and total maturity amount on savings or loans."
      categoryBadge="Finance"
      formula="Interest (I) = (Principal × Rate × Time) / 100 | Total Amount = P + I"
      formulaExplanation="Assumes fixed linear growth on the original principal without reinvestment compounding."
      onReset={() => {
        setPrincipal(1000);
        setRate(5);
        setYears(3);
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Simple Interest', 'simple-interest', { principal, rate, years }, resultSnippet)}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Principal ($):</label>
            <input
              type="number"
              min="0"
              value={principal}
              onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Annual Rate (%):</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Time (Years):</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={years}
              onChange={(e) => setYears(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Interest Earned</span>
            <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
              ${res.interest.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Total Maturity Value</span>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              ${res.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 2. COMPOUND INTEREST
// ==========================================
export function CompoundInterestCalculator({ onSaveCalculation }: { onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void }) {
  const [principal, setPrincipal] = useState(5000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(5);
  const [frequency, setFrequency] = useState(12); // monthly

  const res = calculateCompoundInterest(principal, rate, years, frequency);
  const resultSnippet = `Compound Interest: $${principal} @ ${rate}% for ${years} yrs compounded ${frequency}/yr = Interest: $${res.interest}, Total: $${res.totalAmount}`;

  return (
    <CalculatorCardWrapper
      title="Compound Interest Calculator"
      description="Model exponential growth with customizable compounding intervals (daily, monthly, quarterly, annual)."
      categoryBadge="Finance"
      formula="A = P × (1 + r/n)^(n × t) | Interest = A - P"
      formulaExplanation="r = annual interest rate as a decimal, n = number of compound periods per year, t = time in years."
      onReset={() => {
        setPrincipal(5000);
        setRate(7);
        setYears(5);
        setFrequency(12);
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Compound Interest', 'compound-interest', { principal, rate, years, frequency }, resultSnippet)}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Principal ($):</label>
            <input
              type="number"
              min="0"
              value={principal}
              onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Annual Rate (%):</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Time (Years):</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={years}
              onChange={(e) => setYears(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Compounding:</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            >
              <option value={1}>Annually (1/yr)</option>
              <option value={2}>Semi-annually (2/yr)</option>
              <option value={4}>Quarterly (4/yr)</option>
              <option value={12}>Monthly (12/yr)</option>
              <option value={365}>Daily (365/yr)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Compound Interest</span>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              ${res.interest.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Future Value</span>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              ${res.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 3. EMI CALCULATOR
// ==========================================
export function EmiCalculator({ onSaveCalculation }: { onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void }) {
  const [loanAmount, setLoanAmount] = useState(20000);
  const [annualRate, setAnnualRate] = useState(6.5);
  const [tenureMonths, setTenureMonths] = useState(36);

  const res = calculateEmi(loanAmount, annualRate, tenureMonths);
  const resultSnippet = `Loan: $${loanAmount} @ ${annualRate}% for ${tenureMonths} mos = Monthly EMI: $${res.monthlyEmi}, Total Interest: $${res.totalInterest}`;

  return (
    <CalculatorCardWrapper
      title="Loan EMI &amp; Installment Calculator"
      description="Compute monthly loan repayment installments (EMI), interest totals, and total repayment amounts."
      categoryBadge="Finance"
      formula="EMI = [P × r × (1 + r)^n] / [(1 + r)^n - 1]"
      formulaExplanation="P = principal loan amount, r = monthly interest rate (annual rate / 1200), n = tenure in months."
      onReset={() => {
        setLoanAmount(20000);
        setAnnualRate(6.5);
        setTenureMonths(36);
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Loan EMI', 'emi', { loanAmount, annualRate, tenureMonths }, resultSnippet)}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Loan Principal ($):</label>
            <input
              type="number"
              min="0"
              value={loanAmount}
              onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Annual Rate (%):</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={annualRate}
              onChange={(e) => setAnnualRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tenure (Months):</label>
            <input
              type="number"
              min="1"
              value={tenureMonths}
              onChange={(e) => setTenureMonths(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Monthly EMI Installment
          </span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
            ${res.monthlyEmi.toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Total Interest Payable</span>
            <p className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              ${res.totalInterest.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Total Payment (P + I)</span>
            <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              ${res.totalPayment.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 4. SAVINGS GOAL CALCULATOR
// ==========================================
export function SavingsCalculator({ onSaveCalculation }: { onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void }) {
  const [initialBalance, setInitialBalance] = useState(1000);
  const [regularDeposit, setRegularDeposit] = useState(200);
  const [depositFreq, setDepositFreq] = useState<'monthly' | 'annually'>('monthly');
  const [annualRate, setAnnualRate] = useState(5.0);
  const [years, setYears] = useState(5);

  const res = calculateSavings(initialBalance, regularDeposit, depositFreq, annualRate, years);
  const resultSnippet = `Savings Projection: Initial $${initialBalance} + $${regularDeposit}/${depositFreq} @ ${annualRate}% for ${years} yrs = $${res.endingBalance} (Interest: $${res.totalInterestEarned})`;

  return (
    <CalculatorCardWrapper
      title="Savings &amp; Investment Goal Calculator"
      description="Estimate future value from initial deposits and recurring contributions with interest growth."
      categoryBadge="Finance"
      formula="FV = Initial × (1+r)^t + Σ [Deposit × (1+r)^remaining]"
      formulaExplanation="Disclaimer: This is a deterministic mathematical projection based on a steady rate assumption; not a guaranteed financial return."
      onReset={() => {
        setInitialBalance(1000);
        setRegularDeposit(200);
        setAnnualRate(5.0);
        setYears(5);
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Savings Projection', 'savings', { initialBalance, regularDeposit, depositFreq, annualRate, years }, resultSnippet)}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Initial Balance ($):</label>
            <input
              type="number"
              min="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recurring Deposit ($):</label>
            <input
              type="number"
              min="0"
              value={regularDeposit}
              onChange={(e) => setRegularDeposit(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Frequency:</label>
            <select
              value={depositFreq}
              onChange={(e) => setDepositFreq(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            >
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Expected Rate (%):</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={annualRate}
              onChange={(e) => setAnnualRate(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Time (Years):</label>
            <input
              type="number"
              min="1"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value) || 1)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Projected Ending Balance
          </span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
            ${res.endingBalance.toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Total Contributed</span>
            <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              ${res.totalDeposited.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Total Interest Growth</span>
            <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              +${res.totalInterestEarned.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 5. DISCOUNT CALCULATOR
// ==========================================
export function DiscountCalculator({ onSaveCalculation }: { onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void }) {
  const [originalPrice, setOriginalPrice] = useState(80);
  const [discountPercent, setDiscountPercent] = useState(25);

  const savings = (originalPrice * discountPercent) / 100;
  const finalPrice = Math.max(0, originalPrice - savings);

  const resultSnippet = `Original: $${originalPrice} with ${discountPercent}% off = Pay $${finalPrice.toFixed(2)} (Save $${savings.toFixed(2)})`;

  return (
    <CalculatorCardWrapper
      title="Discount &amp; Sale Savings Calculator"
      description="Quickly calculate net price after discounts and total monetary savings on student purchases."
      categoryBadge="Finance"
      formula="Savings = Original × (Discount % / 100) | Final Price = Original - Savings"
      formulaExplanation="Calculates percentage markdown on retail goods and course materials."
      onReset={() => {
        setOriginalPrice(80);
        setDiscountPercent(25);
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Discount Calculation', 'discount', { originalPrice, discountPercent }, resultSnippet)}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Original Price ($):</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Discount (%):</label>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Final Price to Pay
          </span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
            ${finalPrice.toFixed(2)}
          </p>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            You save: ${savings.toFixed(2)}
          </p>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 6. PROFIT & LOSS CALCULATOR
// ==========================================
export function ProfitLossCalculator({ onSaveCalculation }: { onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void }) {
  const [costPrice, setCostPrice] = useState(50);
  const [sellingPrice, setSellingPrice] = useState(65);

  const diff = sellingPrice - costPrice;
  const isProfit = diff >= 0;
  const percentage = costPrice > 0 ? (Math.abs(diff) / costPrice) * 100 : 0;

  const resultSnippet = `Cost: $${costPrice}, Selling: $${sellingPrice} = ${isProfit ? 'Profit' : 'Loss'} of $${Math.abs(diff).toFixed(2)} (${percentage.toFixed(2)}%)`;

  return (
    <CalculatorCardWrapper
      title="Profit &amp; Loss Calculator"
      description="Determine net financial gains or losses and profit margins for campus businesses or projects."
      categoryBadge="Finance"
      formula="Gain/Loss = Selling Price - Cost Price | Margin % = (|Diff| / Cost) × 100"
      formulaExplanation="Positive difference denotes net profit; negative indicates net loss relative to original cost basis."
      onReset={() => {
        setCostPrice(50);
        setSellingPrice(65);
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Profit & Loss', 'profit-loss', { costPrice, sellingPrice }, resultSnippet)}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cost Price ($):</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Selling Price ($):</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            Financial Result: {isProfit ? 'Net Profit' : 'Net Loss'}
          </span>
          <p className={`text-3xl font-black font-mono ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isProfit ? '+' : '-'}${Math.abs(diff).toFixed(2)}
          </p>
          <p className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
            {percentage.toFixed(2)}% margin
          </p>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}

// ==========================================
// 7. MARKUP CALCULATOR
// ==========================================
export function MarkupCalculator({ onSaveCalculation }: { onSaveCalculation?: (title: string, type: any, inputs: any, result: string) => void }) {
  const [cost, setCost] = useState(40);
  const [markupPercent, setMarkupPercent] = useState(30);

  const markupAmount = (cost * markupPercent) / 100;
  const sellingPrice = cost + markupAmount;

  const resultSnippet = `Cost: $${cost} + ${markupPercent}% Markup = Selling Price: $${sellingPrice.toFixed(2)} (Markup: $${markupAmount.toFixed(2)})`;

  return (
    <CalculatorCardWrapper
      title="Markup Calculator"
      description="Calculate selling price and markup dollar amounts based on wholesale product costs."
      categoryBadge="Finance"
      formula="Markup Amount = Cost × (Markup % / 100) | Selling Price = Cost + Markup Amount"
      formulaExplanation="Determines target pricing by applying percentage markup over cost base."
      onReset={() => {
        setCost(40);
        setMarkupPercent(30);
      }}
      resultSnippet={resultSnippet}
      onSave={() => onSaveCalculation?.('Markup Calculation', 'markup', { cost, markupPercent }, resultSnippet)}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cost Price ($):</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Markup (%):</label>
            <input
              type="number"
              min="0"
              step="1"
              value={markupPercent}
              onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Recommended Selling Price
          </span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
            ${sellingPrice.toFixed(2)}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            Markup amount: ${markupAmount.toFixed(2)}
          </p>
        </div>
      </div>
    </CalculatorCardWrapper>
  );
}
