import { useState, useRef } from 'react';
import {
  Copy,
  Check,
  Download,
  Trash2,
  Upload,
  ArrowRightLeft,
  RotateCcw,
  Sparkles,
  AlignLeft,
  AlignRight,
} from 'lucide-react';
import { copyToClipboard, downloadTextFile, detectRTL } from '../../utils/textUtils.ts';

interface TwoPanelWorkspaceProps {
  title: string;
  description: string;
  badge?: string;
  inputText: string;
  outputText?: string;
  onInputChange: (val: string) => void;
  onApplyChanges?: () => void;
  onReset?: () => void;
  controls?: React.ReactNode;
  extraOutputActions?: React.ReactNode;
  downloadFilename?: string;
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  singlePanel?: boolean;
  children?: React.ReactNode;
  stats?: React.ReactNode;
}

export function TwoPanelWorkspace({
  title,
  description,
  badge,
  inputText,
  outputText = '',
  onInputChange,
  onApplyChanges,
  onReset,
  controls,
  extraOutputActions,
  downloadFilename = 'processed-text.txt',
  inputPlaceholder = 'Paste or type your text here...',
  outputPlaceholder = 'Transformed output will appear here...',
  singlePanel = false,
  children,
  stats,
}: TwoPanelWorkspaceProps) {
  const [copied, setCopied] = useState(false);
  const [direction, setDirection] = useState<'ltr' | 'rtl' | 'auto'>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRtl =
    direction === 'rtl' ||
    (direction === 'auto' && (detectRTL(inputText) || detectRTL(outputText)));

  const handleCopy = async (text: string) => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const textToDownload = outputText || inputText;
    if (!textToDownload) return;
    downloadTextFile(downloadFilename, textToDownload);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (typeof content === 'string') {
        onInputChange(content);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const inputWords = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const inputChars = inputText.length;
  const outputWords = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;
  const outputChars = outputText.length;

  return (
    <div className="space-y-4">
      {/* Header and Direction Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            {badge && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        </div>

        {/* Text Direction Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setDirection('ltr')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                direction === 'ltr'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Left-to-Right (English / Latin)"
            >
              <AlignLeft className="w-3 h-3" />
              LTR
            </button>
            <button
              type="button"
              onClick={() => setDirection('rtl')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                direction === 'rtl'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Right-to-Left (Urdu / Arabic)"
            >
              <AlignRight className="w-3 h-3" />
              RTL
            </button>
            <button
              type="button"
              onClick={() => setDirection('auto')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                direction === 'auto'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Auto-detect script direction"
            >
              Auto
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar (if provided) */}
      {controls && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
          {controls}
        </div>
      )}

      {/* Stats Bar (if provided) */}
      {stats && <div>{stats}</div>}

      {/* Workspace Panels */}
      {singlePanel ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          {children}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input Panel */}
          <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Input Text
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  {inputWords} words &bull; {inputChars} chars
                </span>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md,.csv,.text"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Upload .txt, .md, or .csv file locally"
                >
                  <Upload className="w-3 h-3" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInputChange('')}
                  disabled={!inputText}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                  title="Clear input text"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            </div>

            <textarea
              id="writing-input-textarea"
              value={inputText}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={inputPlaceholder}
              dir={isRtl ? 'rtl' : 'ltr'}
              className="w-full min-h-[260px] p-3.5 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 bg-transparent resize-y focus:outline-hidden"
              spellCheck={true}
            />
          </div>

          {/* Output Panel */}
          <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Output Result
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  {outputWords} words &bull; {outputChars} chars
                </span>
              </div>

              <div className="flex items-center gap-1">
                {onApplyChanges && (
                  <button
                    type="button"
                    onClick={onApplyChanges}
                    disabled={!outputText || outputText === inputText}
                    className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                    title="Apply changes to replace original input text"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Apply</span>
                  </button>
                )}

                {onReset && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Reset to original text"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleCopy(outputText || inputText)}
                  disabled={!outputText && !inputText}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                  title="Copy output text to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Copied
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!outputText && !inputText}
                  className="px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                  title="Download output as text file"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                {extraOutputActions}
              </div>
            </div>

            <textarea
              id="writing-output-textarea"
              readOnly
              value={outputText}
              placeholder={outputPlaceholder}
              dir={isRtl ? 'rtl' : 'ltr'}
              className="w-full min-h-[260px] p-3.5 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900/50 resize-y focus:outline-hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
}
