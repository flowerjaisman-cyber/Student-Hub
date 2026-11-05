import { useState, useMemo } from 'react';
import { TwoPanelWorkspace } from './TwoPanelWorkspace.tsx';
import { convertCase, CaseType } from '../../utils/textUtils.ts';
import { Type, ShieldCheck } from 'lucide-react';

interface CaseOption {
  id: CaseType;
  label: string;
  sample: string;
  desc: string;
}

const CASE_OPTIONS: CaseOption[] = [
  { id: 'sentence', label: 'Sentence case', sample: 'This is academic text.', desc: 'Capitalizes the first letter of each sentence.' },
  { id: 'title', label: 'Title Case', sample: 'Principles of Modern Physics', desc: 'Capitalizes major words, keeps minor prepositions lowercase.' },
  { id: 'capitalize-words', label: 'Capitalize Each Word', sample: 'Department Of Computer Science', desc: 'Capitalizes the initial letter of every word.' },
  { id: 'uppercase', label: 'UPPERCASE', sample: 'RESEARCH HYPOTHESIS', desc: 'Converts all letters to capital form.' },
  { id: 'lowercase', label: 'lowercase', sample: 'literature review notes', desc: 'Converts all characters to lowercase.' },
  { id: 'camel', label: 'camelCase', sample: 'studentAssignmentScore', desc: 'Identifier casing with initial lowercase.' },
  { id: 'pascal', label: 'PascalCase', sample: 'StudentAssignmentScore', desc: 'Identifier casing with initial uppercase.' },
  { id: 'snake', label: 'snake_case', sample: 'student_assignment_score', desc: 'Underscore-separated lowercase text.' },
  { id: 'kebab', label: 'kebab-case', sample: 'student-assignment-score', desc: 'Hyphen-separated lowercase words.' },
  { id: 'alternating', label: 'aLtErNaTiNg CaSe', sample: 'aLtErNaTiNg TeXt', desc: 'Alternates uppercase and lowercase letters.' },
];

export function CaseConverterTool() {
  const [inputText, setInputText] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseType>('sentence');
  const [preserveAcronyms, setPreserveAcronyms] = useState(true);

  const outputText = useMemo(() => {
    return convertCase(inputText, selectedCase, { preserveAcronyms });
  }, [inputText, selectedCase, preserveAcronyms]);

  const handleApply = () => {
    if (outputText) {
      setInputText(outputText);
    }
  };

  return (
    <TwoPanelWorkspace
      title="Case Converter"
      description="Convert text capitalization and naming conventions while protecting URLs, emails, and academic acronyms."
      badge="Academic Utility"
      inputText={inputText}
      outputText={outputText}
      onInputChange={setInputText}
      onApplyChanges={handleApply}
      downloadFilename="case-converted.txt"
      controls={
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Type className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Select Target Case</span>
            </div>

            {/* Preserve Acronyms Toggle */}
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={preserveAcronyms}
                onChange={(e) => setPreserveAcronyms(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Preserve Acronyms (NASA, DNA, AI, etc.)</span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {CASE_OPTIONS.map((opt) => {
              const active = selectedCase === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedCase(opt.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{opt.label}</div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {opt.sample}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      }
    />
  );
}
