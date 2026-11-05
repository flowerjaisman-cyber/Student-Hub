import { useState, useMemo } from 'react';
import { TwoPanelWorkspace } from './TwoPanelWorkspace.tsx';
import {
  splitTextIntoSentences,
  oneSentencePerLine,
  combineShortLinesIntoParagraphs,
  capitalizeFirstLetterOfSentences,
} from '../../utils/textUtils.ts';
import { Split, Combine, CaseUpper, FileText, CornerDownRight } from 'lucide-react';

export type SentenceAction =
  | 'one-sentence-per-line'
  | 'combine-short-lines'
  | 'capitalize-sentences'
  | 'remove-empty-paragraphs';

export function SentenceParagraphTool() {
  const [inputText, setInputText] = useState('');
  const [selectedAction, setSelectedAction] = useState<SentenceAction>('one-sentence-per-line');

  const outputText = useMemo(() => {
    if (!inputText) return '';
    switch (selectedAction) {
      case 'one-sentence-per-line':
        return oneSentencePerLine(inputText);
      case 'combine-short-lines':
        return combineShortLinesIntoParagraphs(inputText);
      case 'capitalize-sentences':
        return capitalizeFirstLetterOfSentences(inputText);
      case 'remove-empty-paragraphs':
        return inputText
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
          .join('\n\n');
    }
  }, [inputText, selectedAction]);

  const handleApply = () => {
    if (outputText) {
      setInputText(outputText);
    }
  };

  return (
    <TwoPanelWorkspace
      title="Sentence & Paragraph Tools"
      description="Restructure fragmented lines, isolate sentences for line-by-line review, and combine segmented notes into continuous academic prose."
      badge="Academic Utility"
      inputText={inputText}
      outputText={outputText}
      onInputChange={setInputText}
      onApplyChanges={handleApply}
      downloadFilename="structured-text.txt"
      controls={
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Split className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Select Restructuring Action</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedAction('one-sentence-per-line')}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedAction === 'one-sentence-per-line'
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-xs'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <CornerDownRight className="w-3.5 h-3.5 text-indigo-500" />
                <span>One Sentence Per Line</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Splits on periods/exclamations while protecting abbreviations (Dr., e.g., i.e.).
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAction('combine-short-lines')}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedAction === 'combine-short-lines'
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-xs'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Combine className="w-3.5 h-3.5 text-indigo-500" />
                <span>Combine Broken Lines</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Joins lines that wrap prematurely into clean, coherent paragraphs.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAction('capitalize-sentences')}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedAction === 'capitalize-sentences'
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-xs'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <CaseUpper className="w-3.5 h-3.5 text-indigo-500" />
                <span>Capitalize Sentences</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Ensures the initial character of each sentence begins with uppercase.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAction('remove-empty-paragraphs')}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                selectedAction === 'remove-empty-paragraphs'
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-xs'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>Trim Blank Paragraphs</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Removes redundant gaps between paragraphs, leaving clean single breaks.
              </p>
            </button>
          </div>
        </div>
      }
    />
  );
}
