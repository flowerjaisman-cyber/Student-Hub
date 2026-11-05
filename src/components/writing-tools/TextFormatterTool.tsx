import { useState, useMemo } from 'react';
import { TwoPanelWorkspace } from './TwoPanelWorkspace.tsx';
import { formatText, TextFormatterOptions } from '../../utils/textUtils.ts';
import {
  Space,
  AlignJustify,
  WrapText,
  SlidersHorizontal,
  Scissors,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';

export function TextFormatterTool() {
  const [inputText, setInputText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [options, setOptions] = useState<TextFormatterOptions>({
    trimLeadingTrailing: true,
    normalizeMultipleSpaces: true,
    normalizeLineBreaks: true,
    trimEmptyLines: false,
    addBlankLinesBetweenParagraphs: false,
    removeBlankLines: false,
    joinLines: false,
    wrapText: false,
    wrapColumn: 80,
    tabsToSpaces: true,
    tabSpacesCount: 4,
    removeTabs: false,
    convertRepeatedPunctuation: true,
  });

  const outputText = useMemo(() => {
    return formatText(inputText, options);
  }, [inputText, options]);

  const handleInputChange = (val: string) => {
    if (!originalText && val) {
      setOriginalText(val);
    }
    setInputText(val);
  };

  const handleApply = () => {
    if (outputText) {
      setInputText(outputText);
    }
  };

  const handleReset = () => {
    setInputText(originalText);
  };

  const toggleOption = (key: keyof TextFormatterOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <TwoPanelWorkspace
      title="Text Formatter"
      description="Clean up spacing, indentation, line breaks, wrapping and punctuation across academic notes and drafts."
      badge="Academic Utility"
      inputText={inputText}
      outputText={outputText}
      onInputChange={handleInputChange}
      onApplyChanges={handleApply}
      onReset={handleReset}
      downloadFilename="formatted-text.txt"
      controls={
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Formatting Options</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {/* Trim leading/trailing */}
            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <input
                type="checkbox"
                checked={!!options.trimLeadingTrailing}
                onChange={() => toggleOption('trimLeadingTrailing')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Trim leading & trailing spaces
              </span>
            </label>

            {/* Normalize multiple spaces */}
            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <input
                type="checkbox"
                checked={!!options.normalizeMultipleSpaces}
                onChange={() => toggleOption('normalizeMultipleSpaces')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Collapse multiple spaces
              </span>
            </label>

            {/* Normalize line breaks */}
            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <input
                type="checkbox"
                checked={!!options.normalizeLineBreaks}
                onChange={() => toggleOption('normalizeLineBreaks')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Normalize line breaks (\r\n &rarr; \n)
              </span>
            </label>

            {/* Remove all blank lines */}
            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <input
                type="checkbox"
                checked={!!options.removeBlankLines}
                onChange={() => {
                  setOptions((prev) => ({
                    ...prev,
                    removeBlankLines: !prev.removeBlankLines,
                    addBlankLinesBetweenParagraphs: false,
                  }));
                }}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Remove empty lines
              </span>
            </label>

            {/* Add double space between paragraphs */}
            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <input
                type="checkbox"
                checked={!!options.addBlankLinesBetweenParagraphs}
                onChange={() => {
                  setOptions((prev) => ({
                    ...prev,
                    addBlankLinesBetweenParagraphs: !prev.addBlankLinesBetweenParagraphs,
                    removeBlankLines: false,
                  }));
                }}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Double-space lines / paragraphs
              </span>
            </label>

            {/* Join lines */}
            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <input
                type="checkbox"
                checked={!!options.joinLines}
                onChange={() => toggleOption('joinLines')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Join lines into continuous flow
              </span>
            </label>

            {/* Convert repeated punctuation */}
            <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <input
                type="checkbox"
                checked={!!options.convertRepeatedPunctuation}
                onChange={() => toggleOption('convertRepeatedPunctuation')}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Normalize repeated punctuation (?? &rarr; ?)
              </span>
            </label>

            {/* Tabs to Spaces */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!options.tabsToSpaces}
                  onChange={() => toggleOption('tabsToSpaces')}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Tabs &rarr; Spaces
                </span>
              </label>
              {options.tabsToSpaces && (
                <select
                  value={options.tabSpacesCount || 4}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      tabSpacesCount: parseInt(e.target.value, 10),
                    }))
                  }
                  className="text-xs bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5"
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              )}
            </div>

            {/* Wrap text */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!options.wrapText}
                  onChange={() => toggleOption('wrapText')}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Wrap text
                </span>
              </label>
              {options.wrapText && (
                <select
                  value={options.wrapColumn || 80}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      wrapColumn: parseInt(e.target.value, 10),
                    }))
                  }
                  className="text-xs bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5"
                >
                  <option value={60}>60 chars</option>
                  <option value={80}>80 chars</option>
                  <option value={100}>100 chars</option>
                  <option value={120}>120 chars</option>
                </select>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}
