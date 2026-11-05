import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { saveUserDocument } from '../../services/userService.ts';
import {
  copyToClipboard,
  downloadTextFile,
  detectRTL,
  calculateReadability,
} from '../../utils/textUtils.ts';
import {
  Feather,
  Copy,
  Check,
  Download,
  Trash2,
  FileText,
  AlignLeft,
  AlignRight,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface QuickWritingPadProps {
  onNavigateToDocumentStudio?: () => void;
}

export function QuickWritingPad({ onNavigateToDocumentStudio }: QuickWritingPadProps) {
  const { user } = useAuth();
  const [text, setText] = useState(() => {
    // Load from active browser session storage if available
    try {
      return sessionStorage.getItem('studenthub_writing_pad') || '';
    } catch {
      return '';
    }
  });

  const [docTitle, setDocTitle] = useState('Draft Notes');
  const [direction, setDirection] = useState<'ltr' | 'rtl' | 'auto'>('auto');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Sync to sessionStorage for temporary active session persistence (NOT Firestore spam)
  useEffect(() => {
    try {
      sessionStorage.setItem('studenthub_writing_pad', text);
    } catch {
      // Ignore sessionStorage errors
    }
  }, [text]);

  const isRtl =
    direction === 'rtl' ||
    (direction === 'auto' && detectRTL(text));

  const metrics = calculateReadability(text);

  const handleCopy = async () => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!text) return;
    const sanitizedTitle = (docTitle || 'writing-draft')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    downloadTextFile(`${sanitizedTitle || 'writing-draft'}.txt`, text);
  };

  const handleSaveToFirestore = async () => {
    if (!user) {
      alert('Please sign in to save documents to your cloud workspace.');
      return;
    }
    if (!text.trim()) {
      alert('Please enter some text before saving.');
      return;
    }

    try {
      setSaving(true);
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Convert plain text paragraphs into HTML paragraphs for Document Studio
      const htmlContent = text
        .split(/\n\s*\n/)
        .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
        .join('');

      await saveUserDocument(user.uid, {
        id: docId,
        title: docTitle.trim() || 'Untitled Draft',
        content: htmlContent,
        category: 'Notes',
        pageSize: 'A4',
        orientation: 'portrait',
        margins: 'normal',
        wordCount: metrics.wordCount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setSaveSuccessMessage('Saved to your cloud workspace!');
      setTimeout(() => {
        setSaveSuccessMessage(null);
        if (onNavigateToDocumentStudio) {
          onNavigateToDocumentStudio();
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to save document:', error);
      alert('Could not save document to Firestore. Please check your network connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Feather className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Quick Writing Pad
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Distraction-Free Scratchpad
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Jot down rapid thoughts, essay outlines, or lecture points. Kept in session memory until you choose to save it.
          </p>
        </div>

        {/* Direction Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setDirection('ltr')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                direction === 'ltr'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
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
                  : 'text-slate-600 dark:text-slate-400'
              }`}
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
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Auto
            </button>
          </div>
        </div>
      </div>

      {/* Title & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Draft Title:</span>
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="Document title..."
            className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!text}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!text}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .TXT</span>
          </button>

          <button
            type="button"
            onClick={() => setText('')}
            disabled={!text}
            className="px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToFirestore}
            disabled={!text.trim() || saving}
            className="px-3.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveSuccessMessage ? 'Saved!' : saving ? 'Saving...' : 'Save as Document'}</span>
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{saveSuccessMessage} Redirecting to Document Studio...</span>
        </div>
      )}

      {/* Text Area */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <textarea
          id="quick-writing-pad-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing your rough notes, outline, lecture thoughts or brainstorm here..."
          dir={isRtl ? 'rtl' : 'ltr'}
          spellCheck={true}
          className="w-full min-h-[380px] p-5 text-sm font-sans leading-relaxed text-slate-800 dark:text-slate-200 bg-transparent resize-y focus:outline-hidden"
        />

        {/* Live Status Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-4">
            <span>{metrics.wordCount} words</span>
            <span>{text.length} characters</span>
            <span>{metrics.sentenceCount} sentences</span>
            <span>{metrics.paragraphCount} paragraphs</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>~{metrics.readingTimeMinutes} min reading time</span>
          </div>
        </div>
      </div>
    </div>
  );
}
