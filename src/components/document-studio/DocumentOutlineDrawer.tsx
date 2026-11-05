import { ListTree, X, ArrowRight } from 'lucide-react';
import { DocumentHeadingItem } from '../../utils/documentUtils.ts';

interface DocumentOutlineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  headings: DocumentHeadingItem[];
  onSelectHeading: (heading: DocumentHeadingItem) => void;
}

export function DocumentOutlineDrawer({
  isOpen,
  onClose,
  headings,
  onSelectHeading,
}: DocumentOutlineDrawerProps) {
  if (!isOpen) return null;

  return (
    <aside
      id="document-outline-drawer"
      aria-label="Document Headings Outline"
      className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ListTree className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">Document Outline</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {headings.length} heading{headings.length === 1 ? '' : 's'} detected
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close outline drawer"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Headings List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
        {headings.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ListTree className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No Headings Found
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Add H1, H2, or H3 headings in your document to generate a clickable table of contents.
            </p>
          </div>
        ) : (
          headings.map((item) => {
            const indentClass =
              item.level === 1
                ? 'pl-2 font-bold text-slate-900 dark:text-white'
                : item.level === 2
                ? 'pl-5 font-medium text-slate-700 dark:text-slate-300'
                : 'pl-8 text-xs text-slate-600 dark:text-slate-400';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectHeading(item)}
                className={`w-full text-left py-2 pr-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs transition-colors flex items-center justify-between group cursor-pointer ${indentClass}`}
              >
                <span className="truncate">{item.text}</span>
                <ArrowRight className="w-3 h-3 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-950/40">
        Click any heading to jump directly to it in the editor.
      </div>
    </aside>
  );
}
