import { useState, useMemo } from 'react';
import { TwoPanelWorkspace } from './TwoPanelWorkspace.tsx';
import {
  applyListNumbering,
  NumberingStyle,
  BulletStyle,
} from '../../utils/textUtils.ts';
import {
  List,
  ListOrdered,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Hash,
  RemoveFormatting,
} from 'lucide-react';

export function ListNumberingTool() {
  const [inputText, setInputText] = useState('');
  const [numStyle, setNumStyle] = useState<NumberingStyle>('123');
  const [bulletStyle, setBulletStyle] = useState<BulletStyle>('•');
  const [customBullet, setCustomBullet] = useState('—');
  const [lastAction, setLastAction] = useState<string>('numbered');

  const outputText = useMemo(() => {
    if (!inputText) return '';
    if (lastAction === 'numbered') {
      return applyListNumbering(inputText, 'numbered', { numStyle });
    }
    if (lastAction === 'bullet') {
      return applyListNumbering(inputText, 'bullet', { bulletStyle, customBullet });
    }
    if (lastAction === 'remove-numbering') {
      return applyListNumbering(inputText, 'remove-numbering');
    }
    if (lastAction === 'remove-bullets') {
      return applyListNumbering(inputText, 'remove-bullets');
    }
    if (lastAction === 'renumber') {
      return applyListNumbering(inputText, 'renumber', { numStyle });
    }
    if (lastAction === 'alphabetize-asc') {
      return applyListNumbering(inputText, 'alphabetize-asc');
    }
    if (lastAction === 'alphabetize-desc') {
      return applyListNumbering(inputText, 'alphabetize-desc');
    }
    if (lastAction === 'reverse') {
      return applyListNumbering(inputText, 'reverse');
    }
    return inputText;
  }, [inputText, lastAction, numStyle, bulletStyle, customBullet]);

  const handleApply = () => {
    if (outputText) {
      setInputText(outputText);
    }
  };

  return (
    <TwoPanelWorkspace
      title="List & Numbering Tools"
      description="Format lists, sequence bibliography entries, renumber items, and sort references alphabetically or in reverse."
      badge="Academic Utility"
      inputText={inputText}
      outputText={outputText}
      onInputChange={setInputText}
      onApplyChanges={handleApply}
      downloadFilename="formatted-list.txt"
      controls={
        <div className="space-y-3">
          {/* Main Action Bar */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setLastAction('numbered')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                lastAction === 'numbered'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Numbered List</span>
            </button>

            <button
              type="button"
              onClick={() => setLastAction('bullet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                lastAction === 'bullet'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Bullet List</span>
            </button>

            <button
              type="button"
              onClick={() => setLastAction('renumber')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                lastAction === 'renumber'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Renumber 1..N</span>
            </button>

            <button
              type="button"
              onClick={() => setLastAction('alphabetize-asc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                lastAction === 'alphabetize-asc'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              <span>Sort A &rarr; Z</span>
            </button>

            <button
              type="button"
              onClick={() => setLastAction('alphabetize-desc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                lastAction === 'alphabetize-desc'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              <ArrowUpAZ className="w-3.5 h-3.5" />
              <span>Sort Z &rarr; A</span>
            </button>

            <button
              type="button"
              onClick={() => setLastAction('reverse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                lastAction === 'reverse'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Reverse Lines</span>
            </button>

            <button
              type="button"
              onClick={() => setLastAction('remove-numbering')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RemoveFormatting className="w-3 h-3" />
              <span>Strip Numbers</span>
            </button>

            <button
              type="button"
              onClick={() => setLastAction('remove-bullets')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RemoveFormatting className="w-3 h-3" />
              <span>Strip Bullets</span>
            </button>
          </div>

          {/* Sub-options for Numbering Style or Bullet Character */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {lastAction === 'numbered' || lastAction === 'renumber' ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Number Format:
                </span>
                <select
                  value={numStyle}
                  onChange={(e) => setNumStyle(e.target.value as NumberingStyle)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs"
                >
                  <option value="123">1, 2, 3 (Standard)</option>
                  <option value="0102">01, 02, 03 (Two digits)</option>
                  <option value="ABC">A, B, C (Uppercase)</option>
                  <option value="abc">a, b, c (Lowercase)</option>
                  <option value="roman">I, II, III (Roman)</option>
                </select>
              </div>
            ) : lastAction === 'bullet' ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Bullet Style:
                </span>
                <select
                  value={bulletStyle}
                  onChange={(e) => setBulletStyle(e.target.value as BulletStyle)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs"
                >
                  <option value="•">• Round Dot</option>
                  <option value="-">- Hyphen</option>
                  <option value="*">* Asterisk</option>
                  <option value="▸">▸ Arrow</option>
                  <option value="custom">Custom Character</option>
                </select>

                {bulletStyle === 'custom' && (
                  <input
                    type="text"
                    value={customBullet}
                    onChange={(e) => setCustomBullet(e.target.value)}
                    maxLength={3}
                    className="w-12 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-mono text-center"
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>
      }
    />
  );
}
