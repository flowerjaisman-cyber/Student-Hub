import { useState, useMemo } from 'react';
import { calculateReadability } from '../../utils/textUtils.ts';
import {
  BookOpen,
  Info,
  Clock,
  FileText,
  AlignLeft,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export function ReadabilityCheckerTool() {
  const [text, setText] = useState('');

  const metrics = useMemo(() => {
    return calculateReadability(text);
  }, [text]);

  const getFleschDescription = (score?: number) => {
    if (score === undefined) return null;
    if (score >= 90) return { label: 'Very Easy', desc: '5th grade level (conversational)', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 70) return { label: 'Fairly Easy', desc: '7th grade level', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 60) return { label: 'Standard / Plain English', desc: '8th - 9th grade level (general audience)', color: 'text-indigo-600 dark:text-indigo-400' };
    if (score >= 50) return { label: 'Fairly Difficult', desc: 'High school / early undergraduate', color: 'text-amber-600 dark:text-amber-400' };
    if (score >= 30) return { label: 'Difficult', desc: 'College / university academic prose', color: 'text-orange-600 dark:text-orange-400' };
    return { label: 'Very Confusing / Specialized', desc: 'Post-graduate / scientific publication', color: 'text-purple-600 dark:text-purple-400' };
  };

  const fleschInfo = getFleschDescription(metrics.fleschReadingEase);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Readability Checker
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Statistical Analysis
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Statistical sentence length, structural density, and formula-based reading ease estimates calculated strictly from your text.
          </p>
        </div>

        {text && (
          <button
            type="button"
            onClick={() => setText('')}
            className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-rose-500 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Input Text Box */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Paste Academic Manuscript or Essay Excerpt
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {metrics.wordCount} words &bull; {metrics.detectedScript} script
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or write your text here to compute real-time readability metrics..."
          className="w-full min-h-[180px] p-4 text-xs sm:text-sm font-sans text-slate-800 dark:text-slate-200 bg-transparent resize-y focus:outline-hidden"
        />
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Word Count */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Total Words
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {metrics.wordCount}
          </div>
        </div>

        {/* Sentences */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Sentences
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {metrics.sentenceCount}
          </div>
        </div>

        {/* Paragraphs */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Paragraphs
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {metrics.paragraphCount}
          </div>
        </div>

        {/* Avg Words per Sentence */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Words / Sentence
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics.avgWordsPerSentence}
          </div>
        </div>

        {/* Avg Chars per Word */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Chars / Word
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics.avgCharsPerWord}
          </div>
        </div>

        {/* Reading Time */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Reading Time
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            ~{metrics.readingTimeMinutes} min
          </div>
        </div>
      </div>

      {/* Academic Readability Formulas Card */}
      {metrics.isEnglishOrLatin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Flesch Reading Ease */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Flesch Reading Ease (Estimate)
              </span>
              <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {metrics.fleschReadingEase !== undefined ? `${metrics.fleschReadingEase} / 100` : '—'}
              </span>
            </div>
            {fleschInfo ? (
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                <span className={`font-bold ${fleschInfo.color}`}>{fleschInfo.label}: </span>
                <span className="text-slate-600 dark:text-slate-300">{fleschInfo.desc}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Enter at least 5 words to calculate.</p>
            )}
            <p className="text-[11px] text-slate-500 leading-normal">
              Based on statistical syllable density and words per sentence. Higher scores indicate simpler phrasing.
            </p>
          </div>

          {/* Flesch-Kincaid Grade Level */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Flesch-Kincaid Grade Level (Estimate)
              </span>
              <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {metrics.fleschKincaidGrade !== undefined ? `Grade ${metrics.fleschKincaidGrade}` : '—'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
              {metrics.fleschKincaidGrade !== undefined ? (
                <span>
                  Corresponds approximately to US school grade <strong>{Math.floor(metrics.fleschKincaidGrade)}</strong> education level.
                </span>
              ) : (
                <span className="italic">Enter at least 5 words to calculate.</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Statistical formula approximating the years of education generally required to comprehend the text.
            </p>
          </div>
        </div>
      ) : (
        /* Non-Latin / Urdu Alert */
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Language Script Notice:</span>
            <p className="mt-0.5">
              Detected script: <strong>{metrics.detectedScript}</strong>. English-specific readability formulas (Flesch Ease & Flesch-Kincaid Grade) are based on English syllable counts and are disabled for this text. Structural metrics (word count, sentence count, paragraph count, reading time) are fully computed above.
            </p>
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          Readability formulas are statistical estimates based on sentence lengths and syllable counts; they do not measure conceptual depth, empirical validity, or academic rigor.
        </span>
      </div>
    </div>
  );
}
