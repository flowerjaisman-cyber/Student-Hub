import React, { useState } from 'react';
import {
  BookMarked,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { formatCitationHelper, CitationResponse } from '../../services/aiStudyService.ts';

export const AICitationHelper: React.FC = () => {
  const [style, setStyle] = useState<'apa' | 'mla' | 'chicago'>('apa');
  const [formData, setFormData] = useState({
    sourceTitle: '',
    author: '',
    year: '',
    publisher: '',
    journalName: '',
    volume: '',
    issue: '',
    pages: '',
    url: '',
    doi: '',
    accessDate: '',
  });

  const [isFormatting, setIsFormatting] = useState(false);
  const [result, setResult] = useState<CitationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedInText, setCopiedInText] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormat = async () => {
    if (!formData.sourceTitle.trim()) {
      setErrorMsg('Source title is required.');
      return;
    }

    setErrorMsg(null);
    setIsFormatting(true);

    try {
      const res = await formatCitationHelper(style, formData);
      setResult(res);
    } catch (err: any) {
      console.error('Citation format failed:', err);
      setErrorMsg(err.message || 'Failed to format citation.');
    } finally {
      setIsFormatting(false);
    }
  };

  const handleCopyFull = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.formattedCitation);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleCopyInText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.inTextCitation);
    setCopiedInText(true);
    setTimeout(() => setCopiedInText(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Citation &amp; Reference Assistant
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format APA, MLA, and Chicago citations strictly from user-provided source metadata
              </p>
            </div>
          </div>

          {/* Style Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            {(['apa', 'mla', 'chicago'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                  style === s
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {s} 7th
              </button>
            ))}
          </div>
        </div>

        {/* Academic Integrity Banner */}
        <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <span>
            Zero Hallucination Guarantee: This assistant will never invent fictional authors, publication dates, volume numbers, or DOIs. If information is missing, it will clearly flag the omission.
          </span>
        </div>

        {/* Metadata Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Source Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="sourceTitle"
              value={formData.sourceTitle}
              onChange={handleInputChange}
              placeholder="e.g. The Cognitive Architecture of Memory"
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Author(s)
            </label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              placeholder="e.g. Miller, George A. or Miller, G. A."
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Publication Year
            </label>
            <input
              type="text"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              placeholder="e.g. 2021"
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Journal / Publication Name
            </label>
            <input
              type="text"
              name="journalName"
              value={formData.journalName}
              onChange={handleInputChange}
              placeholder="e.g. Journal of Experimental Psychology"
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Publisher
            </label>
            <input
              type="text"
              name="publisher"
              value={formData.publisher}
              onChange={handleInputChange}
              placeholder="e.g. Cambridge University Press"
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Volume &amp; Issue
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="volume"
                value={formData.volume}
                onChange={handleInputChange}
                placeholder="Vol (e.g. 42)"
                className="w-1/2 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <input
                type="text"
                name="issue"
                value={formData.issue}
                onChange={handleInputChange}
                placeholder="Issue (e.g. 3)"
                className="w-1/2 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pages
            </label>
            <input
              type="text"
              name="pages"
              value={formData.pages}
              onChange={handleInputChange}
              placeholder="e.g. 115-132"
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              DOI or URL
            </label>
            <input
              type="text"
              name="doi"
              value={formData.doi}
              onChange={handleInputChange}
              placeholder="e.g. https://doi.org/10.1037/..."
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleFormat}
            disabled={isFormatting || !formData.sourceTitle.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-40"
          >
            {isFormatting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Formatting Citation...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Format Citation ({style.toUpperCase()})</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Results Card */}
      {result && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {result.style.toUpperCase()} Formatted Citation
            </span>
          </div>

          {/* Full Bibliographic Reference */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Bibliography / Works Cited:
              </span>
              <button
                type="button"
                onClick={handleCopyFull}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
              >
                {copiedFull ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFull ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-sm font-medium text-slate-900 dark:text-white pl-4 border-l-2 border-indigo-500 select-text">
              {result.formattedCitation}
            </div>
          </div>

          {/* In-Text Citation */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Parenthetical In-Text Citation:
              </span>
              <button
                type="button"
                onClick={handleCopyInText}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
              >
                {copiedInText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedInText ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-sm font-medium text-slate-900 dark:text-white pl-4 border-l-2 border-purple-500 font-mono select-text">
              {result.inTextCitation}
            </div>
          </div>

          {/* Missing Fields Alerts */}
          {result.missingFields && result.missingFields.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs">
              <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Optional / Standard Fields Not Provided:</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                {result.missingFields.join(', ')} — placeholders were used where necessary. No false metadata was fabricated.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
