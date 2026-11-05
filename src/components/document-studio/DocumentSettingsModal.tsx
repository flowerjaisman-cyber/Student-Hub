import { useState } from 'react';
import { Settings, X, Check, FileText, Info } from 'lucide-react';
import {
  PageSize,
  PageOrientation,
  PageMarginPreset,
  DocumentCategory,
  PageMargins,
} from '../../types/index.ts';

interface DocumentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageSize: PageSize;
  orientation: PageOrientation;
  margins: PageMarginPreset;
  customMargins?: PageMargins;
  category?: DocumentCategory | string;
  onSave: (settings: {
    pageSize: PageSize;
    orientation: PageOrientation;
    margins: PageMarginPreset;
    customMargins?: PageMargins;
    category: DocumentCategory;
  }) => void;
}

const CATEGORIES: DocumentCategory[] = [
  'Assignment',
  'Notes',
  'Report',
  'Application',
  'Resume',
  'Letter',
  'Project',
  'Other',
];

export function DocumentSettingsModal({
  isOpen,
  onClose,
  pageSize: initialPageSize,
  orientation: initialOrientation,
  margins: initialMargins,
  customMargins: initialCustomMargins,
  category: initialCategory,
  onSave,
}: DocumentSettingsModalProps) {
  const [pageSize, setPageSize] = useState<PageSize>(initialPageSize || 'A4');
  const [orientation, setOrientation] = useState<PageOrientation>(initialOrientation || 'portrait');
  const [margins, setMargins] = useState<PageMarginPreset>(initialMargins || 'normal');
  const [customMargins, setCustomMargins] = useState<PageMargins>(
    initialCustomMargins || { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 }
  );
  const [category, setCategory] = useState<DocumentCategory>(
    (initialCategory as DocumentCategory) || 'Assignment'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      pageSize,
      orientation,
      margins,
      customMargins: margins === 'custom' ? customMargins : undefined,
      category,
    });
    onClose();
  };

  return (
    <div
      id="document-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Document &amp; Page Settings
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure layout geometry, category, and print dimensions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Note Banner */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p>
              Page size, orientation, and margin settings directly determine your PDF export and printable sheet layout. Browser screen rendering adapts to the chosen proportion.
            </p>
          </div>

          {/* 1. Category */}
          <div>
            <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-2">
              Academic Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left flex items-center justify-between ${
                    category === cat
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {category === cat && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Page Size */}
          <div>
            <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-2">
              Page Size
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['A4', 'A5', 'Letter', 'Legal'] as PageSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPageSize(size)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    pageSize === size
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Orientation */}
          <div>
            <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-2">
              Orientation
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['portrait', 'landscape'] as PageOrientation[]).map((orient) => (
                <button
                  key={orient}
                  type="button"
                  onClick={() => setOrientation(orient)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer text-center ${
                    orientation === orient
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {orient}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Margins */}
          <div>
            <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-2">
              Margins Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'normal', label: 'Normal (1 in)' },
                { id: 'narrow', label: 'Narrow (0.5 in)' },
                { id: 'wide', label: 'Wide (1.5 in)' },
                { id: 'custom', label: 'Custom' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMargins(m.id as PageMarginPreset)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    margins === m.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {margins === 'custom' && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                    Top (mm)
                  </span>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={customMargins.top}
                    onChange={(e) =>
                      setCustomMargins({ ...customMargins, top: Number(e.target.value) || 25.4 })
                    }
                    className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                    Right (mm)
                  </span>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={customMargins.right}
                    onChange={(e) =>
                      setCustomMargins({ ...customMargins, right: Number(e.target.value) || 25.4 })
                    }
                    className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                    Bottom (mm)
                  </span>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={customMargins.bottom}
                    onChange={(e) =>
                      setCustomMargins({ ...customMargins, bottom: Number(e.target.value) || 25.4 })
                    }
                    className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                    Left (mm)
                  </span>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={customMargins.left}
                    onChange={(e) =>
                      setCustomMargins({ ...customMargins, left: Number(e.target.value) || 25.4 })
                    }
                    className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              Apply Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
