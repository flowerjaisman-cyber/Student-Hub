import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListTodo,
  Indent,
  Outdent,
  Undo2,
  Redo2,
  Quote,
  Code,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Search,
  Type,
  Baseline,
  Highlighter,
  Minus,
  RemoveFormatting,
  Plus,
  Trash2,
  ListTree,
  Maximize2,
  Minimize2,
  FolderOpen,
  Upload,
} from 'lucide-react';

interface DocumentEditorToolbarProps {
  onExecuteCommand: (command: string, value?: string) => void;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertLink: (url: string, text?: string) => void;
  onInsertImage: (file: File) => void;
  onInsertImageFromMyFiles?: () => void;
  onToggleFindReplace: () => void;
  onAddTableRow: () => void;
  onDeleteTableRow: () => void;
  currentFontFamily: string;
  onFontFamilyChange: (font: string) => void;
  currentFontSize: string;
  onFontSizeChange: (size: string) => void;
  onToggleOutline?: () => void;
  isOutlineOpen?: boolean;
  onToggleFocusMode?: () => void;
  isFocusMode?: boolean;
}

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
];

const FONT_SIZES = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '32'];

const TEXT_COLORS = [
  { label: 'Black', value: '#0f172a' },
  { label: 'Slate', value: '#475569' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Purple', value: '#9333ea' },
];

const HIGHLIGHT_COLORS = [
  { label: 'None', value: 'transparent' },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Cyan', value: '#a5f3fc' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
  { label: 'Purple', value: '#e9d5ff' },
];

export function DocumentEditorToolbar({
  onExecuteCommand,
  onInsertTable,
  onInsertLink,
  onInsertImage,
  onInsertImageFromMyFiles,
  onToggleFindReplace,
  onAddTableRow,
  onDeleteTableRow,
  currentFontFamily,
  onFontFamilyChange,
  currentFontSize,
  onFontSizeChange,
  onToggleOutline,
  isOutlineOpen,
  onToggleFocusMode,
  isFocusMode,
}: DocumentEditorToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Link modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkError, setLinkError] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);
  const tablePickerRef = useRef<HTMLDivElement>(null);
  const imageDropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(e.target as Node)) {
        setShowHighlightPicker(false);
      }
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target as Node)) {
        setShowTablePicker(false);
      }
      if (imageDropdownRef.current && !imageDropdownRef.current.contains(e.target as Node)) {
        setShowImageDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = linkUrl.trim();
    if (!cleanUrl) {
      setLinkError('Please enter a valid web URL');
      return;
    }
    // Prevent dangerous schemes
    if (cleanUrl.toLowerCase().startsWith('javascript:') || cleanUrl.toLowerCase().startsWith('data:')) {
      setLinkError('JavaScript and Data URLs are not permitted for security');
      return;
    }

    const formattedUrl = cleanUrl.match(/^https?:\/\//i) ? cleanUrl : `https://${cleanUrl}`;
    onInsertLink(formattedUrl, linkText.trim());
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    setLinkError('');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onInsertImage(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div
      id="document-editor-toolbar"
      className="p-1.5 sm:p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1 text-xs select-none sticky top-16 z-20 shadow-2xs"
    >
      {/* 1. History (Undo / Redo) */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onExecuteCommand('undo')}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('redo')}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Font Controls */}
      <div className="flex items-center gap-1 px-1 border-r border-slate-200 dark:border-slate-800">
        {/* Font Family */}
        <select
          value={currentFontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          aria-label="Font Family"
          className="h-7 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[110px] sm:max-w-[130px] truncate"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          value={currentFontSize}
          onChange={(e) => onFontSizeChange(e.target.value)}
          aria-label="Font Size"
          className="h-7 px-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer w-14 text-center"
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Text Structure Dropdown */}
      <div className="px-1 border-r border-slate-200 dark:border-slate-800">
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') onExecuteCommand('formatBlock', '<p>');
            else if (val === 'h1') onExecuteCommand('formatBlock', '<h1>');
            else if (val === 'h2') onExecuteCommand('formatBlock', '<h2>');
            else if (val === 'h3') onExecuteCommand('formatBlock', '<h3>');
            else if (val === 'blockquote') onExecuteCommand('formatBlock', '<blockquote>');
            else if (val === 'pre') onExecuteCommand('formatBlock', '<pre>');
            e.target.value = 'default';
          }}
          defaultValue="default"
          aria-label="Text Structure"
          className="h-7 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[105px]"
        >
          <option value="default" disabled>
            Style...
          </option>
          <option value="p">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote block</option>
          <option value="pre">Code / Pre</option>
        </select>
      </div>

      {/* 4. Text Styling (Bold, Italic, Underline, Strike) */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onExecuteCommand('bold')}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('italic')}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('underline')}
          title="Underline (Ctrl+U)"
          aria-label="Underline"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('strikeThrough')}
          title="Strikethrough"
          aria-label="Strikethrough"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5. Colors (Text color & Highlight) */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-800 relative">
        {/* Text color picker */}
        <div className="relative" ref={colorPickerRef}>
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Text Color"
            aria-label="Text Color"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-0.5"
          >
            <Baseline className="w-3.5 h-3.5" />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 grid grid-cols-4 gap-1.5 w-36">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => {
                    onExecuteCommand('foreColor', c.value);
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded-md border border-slate-300 dark:border-slate-700 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight color picker */}
        <div className="relative" ref={highlightPickerRef}>
          <button
            type="button"
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            title="Highlight Color"
            aria-label="Highlight Color"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-0.5"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
          </button>

          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 grid grid-cols-4 gap-1.5 w-36">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => {
                    onExecuteCommand('hiliteColor', c.value);
                    setShowHighlightPicker(false);
                  }}
                  className="w-6 h-6 rounded-md border border-slate-300 dark:border-slate-700 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: c.value }}
                >
                  {c.value === 'transparent' ? '✕' : ''}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Alignment */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onExecuteCommand('justifyLeft')}
          title="Align Left"
          aria-label="Align Left"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('justifyCenter')}
          title="Align Center"
          aria-label="Align Center"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('justifyRight')}
          title="Align Right"
          aria-label="Align Right"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('justifyFull')}
          title="Justify"
          aria-label="Justify"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 7. Lists & Indentation */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onExecuteCommand('insertUnorderedList')}
          title="Bulleted List"
          aria-label="Bulleted List"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('insertOrderedList')}
          title="Numbered List"
          aria-label="Numbered List"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('outdent')}
          title="Decrease Indent"
          aria-label="Decrease Indent"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Outdent className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('indent')}
          title="Increase Indent"
          aria-label="Increase Indent"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Indent className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 8. Table & Inserts */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-800">
        {/* Table insert */}
        <div className="relative" ref={tablePickerRef}>
          <button
            type="button"
            onClick={() => setShowTablePicker(!showTablePicker)}
            title="Insert Table"
            aria-label="Insert Table"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>

          {showTablePicker && (
            <div className="absolute top-full left-0 mt-1 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 w-48 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                Insert Table
              </span>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Rows:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tableRows}
                    onChange={(e) => setTableRows(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                    className="w-14 px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Columns:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tableCols}
                    onChange={(e) => setTableCols(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                    className="w-14 px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onInsertTable(tableRows, tableCols);
                  setShowTablePicker(false);
                }}
                className="w-full py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
              >
                Create Table
              </button>
            </div>
          )}
        </div>

        {/* Add Row & Delete Row helpers */}
        <button
          type="button"
          onClick={onAddTableRow}
          title="Add Row to Selected Table"
          aria-label="Add Row"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDeleteTableRow}
          title="Delete Row from Selected Table"
          aria-label="Delete Row"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
        </button>

        {/* Link insert */}
        <button
          type="button"
          onClick={() => setShowLinkModal(true)}
          title="Insert Link"
          aria-label="Insert Link"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {/* Image insert with My Files option */}
        <div className="relative" ref={imageDropdownRef}>
          <button
            type="button"
            onClick={() => {
              if (onInsertImageFromMyFiles) {
                setShowImageDropdown(!showImageDropdown);
              } else {
                imageInputRef.current?.click();
              }
            }}
            title="Insert Image"
            aria-label="Insert Image"
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>

          {showImageDropdown && (
            <div className="absolute top-full left-0 mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-1 text-xs animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  setShowImageDropdown(false);
                  imageInputRef.current?.click();
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-500" />
                <span>Upload from Device</span>
              </button>
              {onInsertImageFromMyFiles && (
                <button
                  type="button"
                  onClick={() => {
                    setShowImageDropdown(false);
                    onInsertImageFromMyFiles();
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                  <span>Choose from My Files</span>
                </button>
              )}
            </div>
          )}
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileChange}
          className="hidden"
        />

        {/* Horizontal rule */}
        <button
          type="button"
          onClick={() => onExecuteCommand('insertHorizontalRule')}
          title="Insert Horizontal Divider"
          aria-label="Divider"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 9. Find & Replace + Outline + Focus Mode + Clear Formatting */}
      <div className="flex items-center gap-0.5 pl-1 ml-auto">
        {onToggleOutline && (
          <button
            type="button"
            onClick={onToggleOutline}
            title={isOutlineOpen ? 'Close Outline Drawer' : 'Open Outline Drawer'}
            aria-label="Document Outline"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isOutlineOpen
                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
          </button>
        )}

        {onToggleFocusMode && (
          <button
            type="button"
            onClick={onToggleFocusMode}
            title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
            aria-label="Focus Mode"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isFocusMode
                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        )}

        <button
          type="button"
          onClick={() => onExecuteCommand('removeFormat')}
          title="Clear Formatting"
          aria-label="Clear Formatting"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggleFindReplace}
          title="Find and Replace (Ctrl+F)"
          aria-label="Find & Replace"
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Insert Hyperlink
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Link URL *
                </label>
                <input
                  type="text"
                  placeholder="https://example.edu/paper.pdf"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                {linkError && <p className="text-[10px] text-rose-500 mt-1">{linkError}</p>}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Display Text (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Research Source"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
