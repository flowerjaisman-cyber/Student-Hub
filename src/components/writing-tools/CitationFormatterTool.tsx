import { useState } from 'react';
import {
  CitationSource,
  CitationStyle,
  CitationSourceType,
} from '../../types/index.ts';
import {
  formatCitation,
  copyToClipboard,
  downloadTextFile,
} from '../../utils/textUtils.ts';
import {
  BookMarked,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  AlertCircle,
  ArrowDownAZ,
  ExternalLink,
  BookOpen,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { saveUserDocument } from '../../services/userService.ts';

const SAMPLE_INITIAL_SOURCE: CitationSource = {
  id: 'cit_1',
  sourceType: 'journal',
  authors: 'Einstein, Albert',
  title: 'On the Electrodynamics of Moving Bodies',
  publicationTitle: 'Annalen der Physik',
  volume: '17',
  issue: '10',
  year: '1905',
  pages: '891-921',
  doi: '10.1002/andp.19053221004',
};

export function CitationFormatterTool({
  onNavigateToDocumentStudio,
}: {
  onNavigateToDocumentStudio?: () => void;
}) {
  const { user } = useAuth();
  const [sources, setSources] = useState<CitationSource[]>([SAMPLE_INITIAL_SOURCE]);
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>('apa7');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state for creating / editing a citation
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CitationSource>({
    id: '',
    sourceType: 'journal',
    authors: '',
    title: '',
    publicationTitle: '',
    publisher: '',
    volume: '',
    issue: '',
    edition: '',
    year: '',
    pages: '',
    url: '',
    accessDate: '',
    doi: '',
  });

  const handleStartAdd = () => {
    setEditingId('new');
    setFormData({
      id: `cit_${Date.now()}`,
      sourceType: 'journal',
      authors: '',
      title: '',
      publicationTitle: '',
      publisher: '',
      volume: '',
      issue: '',
      edition: '',
      year: new Date().getFullYear().toString(),
      pages: '',
      url: '',
      accessDate: '',
      doi: '',
    });
  };

  const handleStartEdit = (source: CitationSource) => {
    setEditingId(source.id);
    setFormData({ ...source });
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title && !formData.authors) {
      alert('Please enter at least an author or a title for the citation.');
      return;
    }

    if (editingId === 'new') {
      setSources((prev) => [...prev, { ...formData, id: `cit_${Date.now()}` }]);
    } else {
      setSources((prev) =>
        prev.map((s) => (s.id === editingId ? { ...formData } : s))
      );
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDuplicate = (source: CitationSource) => {
    const copy: CitationSource = {
      ...source,
      id: `cit_${Date.now()}`,
      title: `${source.title} (Copy)`,
    };
    setSources((prev) => [...prev, copy]);
  };

  const handleCopySingle = async (source: CitationSource) => {
    const { formattedText } = formatCitation(source, selectedStyle);
    const ok = await copyToClipboard(formattedText);
    if (ok) {
      setCopiedId(source.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleAlphabetize = () => {
    setSources((prev) => {
      const sorted = [...prev];
      sorted.sort((a, b) => {
        const keyA = (a.authors || a.title || '').toLowerCase();
        const keyB = (b.authors || b.title || '').toLowerCase();
        return keyA.localeCompare(keyB);
      });
      return sorted;
    });
  };

  // Compile full bibliography
  const fullBibliographyText = sources
    .map((s) => formatCitation(s, selectedStyle).formattedText)
    .join('\n\n');

  const handleCopyAll = async () => {
    if (!fullBibliographyText) return;
    const ok = await copyToClipboard(fullBibliographyText);
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleDownloadAll = () => {
    if (!fullBibliographyText) return;
    const styleLabel = selectedStyle.toUpperCase();
    downloadTextFile(
      `bibliography-${selectedStyle}.txt`,
      `BIBLIOGRAPHY (${styleLabel})\n\n${fullBibliographyText}`
    );
  };

  const handleSaveToDocumentStudio = async () => {
    if (!user || !fullBibliographyText) return;
    try {
      setSavingDoc(true);
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const htmlContent = `<h1>Bibliography (${selectedStyle.toUpperCase()})</h1><div style="margin-top: 1.5rem;">${sources
        .map(
          (s) =>
            `<p style="padding-left: 2rem; text-indent: -2rem; margin-bottom: 1rem;">${formatCitation(s, selectedStyle).formattedText}</p>`
        )
        .join('')}</div>`;

      await saveUserDocument(user.uid, {
        id: docId,
        title: `Bibliography (${selectedStyle.toUpperCase()})`,
        content: htmlContent,
        category: 'Assignment',
        pageSize: 'A4',
        orientation: 'portrait',
        margins: 'normal',
        wordCount: fullBibliographyText.split(/\s+/).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onNavigateToDocumentStudio) {
          onNavigateToDocumentStudio();
        }
      }, 1500);
    } catch (err) {
      console.error('Failed to save bibliography as document:', err);
      alert('Could not save to Document Studio. Please verify connection.');
    } finally {
      setSavingDoc(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Citation Formatter & Bibliography Helper
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              APA, MLA, Chicago, Harvard
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Format academic source references accurately without inventing fake citations or phantom dates.
          </p>
        </div>

        {/* Style Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Style:
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            {(['apa7', 'mla9', 'chicago', 'harvard'] as CitationStyle[]).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setSelectedStyle(style)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                  selectedStyle === style
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {style === 'apa7'
                  ? 'APA 7'
                  : style === 'mla9'
                  ? 'MLA 9'
                  : style === 'chicago'
                  ? 'Chicago'
                  : 'Harvard'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartAdd}
            className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Citation</span>
          </button>

          <button
            type="button"
            onClick={handleAlphabetize}
            disabled={sources.length < 2}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <ArrowDownAZ className="w-3.5 h-3.5 text-indigo-500" />
            <span>Alphabetize (A-Z)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={sources.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 font-semibold">Copied Bibliography</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={sources.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .TXT</span>
          </button>

          {user && (
            <button
              type="button"
              onClick={handleSaveToDocumentStudio}
              disabled={sources.length === 0 || savingDoc}
              className="px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              title="Save bibliography as an editable document in Document Studio"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{saveSuccess ? 'Saved & Opening...' : savingDoc ? 'Saving...' : 'Save as Document'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Add / Edit Citation Modal or Drawer */}
      {editingId && (
        <form
          onSubmit={handleSaveForm}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800/80 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {editingId === 'new' ? 'New Citation Source' : 'Edit Citation Source'}
            </span>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Source Type */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Source Type *
              </label>
              <select
                value={formData.sourceType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sourceType: e.target.value as CitationSourceType,
                  }))
                }
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
              >
                <option value="journal">Journal Article</option>
                <option value="book">Book</option>
                <option value="website">Website / Web Page</option>
                <option value="chapter">Book Chapter / Anthological Work</option>
                <option value="conference">Conference Proceeding</option>
              </select>
            </div>

            {/* Author(s) */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Author(s) (e.g. Last, First) *
              </label>
              <input
                type="text"
                value={formData.authors}
                onChange={(e) => setFormData((prev) => ({ ...prev, authors: e.target.value }))}
                placeholder="Einstein, Albert"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
              />
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Title of Work *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Article or book title"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
              />
            </div>

            {/* Publication / Journal / Site */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Publication / Journal / Website
              </label>
              <input
                type="text"
                value={formData.publicationTitle || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, publicationTitle: e.target.value }))
                }
                placeholder="Annalen der Physik"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
              />
            </div>

            {/* Publisher */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Publisher
              </label>
              <input
                type="text"
                value={formData.publisher || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, publisher: e.target.value }))
                }
                placeholder="Oxford University Press"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
              />
            </div>

            {/* Year */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Year / Date *
              </label>
              <input
                type="text"
                value={formData.year || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                placeholder="1905"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
              />
            </div>

            {/* Volume / Issue */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Volume & Issue
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.volume || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, volume: e.target.value }))}
                  placeholder="Vol (17)"
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
                />
                <input
                  type="text"
                  value={formData.issue || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, issue: e.target.value }))}
                  placeholder="Issue (10)"
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
                />
              </div>
            </div>

            {/* Pages */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Pages (e.g. 100-115)
              </label>
              <input
                type="text"
                value={formData.pages || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, pages: e.target.value }))}
                placeholder="891-921"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
              />
            </div>

            {/* DOI */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                DOI (Digital Object Identifier)
              </label>
              <input
                type="text"
                value={formData.doi || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, doi: e.target.value }))}
                placeholder="10.1002/andp.19053221004"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
              />
            </div>

            {/* URL */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Safe URL (https://...)
              </label>
              <input
                type="url"
                value={formData.url || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.edu/article"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
              />
            </div>

            {/* Access Date */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Access Date (for websites)
              </label>
              <input
                type="text"
                value={formData.accessDate || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, accessDate: e.target.value }))
                }
                placeholder="15 Oct. 2026"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
            >
              Save Citation
            </button>
          </div>
        </form>
      )}

      {/* Bibliography Source List */}
      <div className="space-y-3">
        {sources.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
            <BookMarked className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No citations entered yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Click &quot;Add Citation&quot; above to add your first book, journal article, or website reference.
            </p>
          </div>
        ) : (
          sources.map((source, index) => {
            const { formattedText, missingFields } = formatCitation(source, selectedStyle);
            return (
              <div
                key={source.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                        [{index + 1}]
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {source.sourceType}
                      </span>
                    </div>

                    {/* Formatted Citation with Hanging Indent */}
                    <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-serif pl-6 -indent-6">
                      {formattedText}
                    </div>

                    {/* Missing Fields Badge (No fake data policy) */}
                    {missingFields.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Missing fields: {missingFields.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Item Actions */}
                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleCopySingle(source)}
                      className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copy citation to clipboard"
                    >
                      {copiedId === source.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 font-semibold">Copied</span>
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
                      onClick={() => handleStartEdit(source)}
                      className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(source)}
                      className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      Duplicate
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(source.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Delete citation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
