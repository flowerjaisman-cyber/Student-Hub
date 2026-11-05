import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FileText,
  Plus,
  Upload,
  FolderOpen,
  Save,
  Download,
  Printer,
  Settings,
  BarChart2,
  Copy,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
  LayoutTemplate,
  FileCode,
  FileType,
  Sparkles,
  ExternalLink,
  Minimize2,
  Maximize2,
  ListTree,
  Folder,
  Trash2,
  Star,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  UserDocument,
  DocumentCategory,
  PageSize,
  PageOrientation,
  PageMarginPreset,
  PageMargins,
  NavSection,
  UserFile,
  CloudFolder,
} from '../../types/index.ts';
import {
  subscribeUserDocuments,
  saveUserDocument,
  trashUserDocument,
  restoreUserDocument,
  permanentDeleteUserDocument,
  emptyUserDocumentTrash,
  duplicateUserDocument,
  renameUserDocument,
  toggleStarUserDocument,
  moveUserDocumentToFolder,
} from '../../services/documentService.ts';
import {
  subscribeUserFiles,
  subscribeUserFolders,
} from '../../services/fileManagerService.ts';
import { recordUserActivity } from '../../services/userService.ts';
import {
  calculateDocumentStats,
  printDocument,
  extractDocumentHeadings,
  DOCUMENT_TEMPLATES,
  DocumentTemplate,
  DocumentHeadingItem,
} from '../../utils/documentUtils.ts';

import { DocumentListView } from './DocumentListView.tsx';
import { DocumentEditorToolbar } from './DocumentEditorToolbar.tsx';
import { DocumentSettingsModal } from './DocumentSettingsModal.tsx';
import { DocumentTemplatesModal } from './DocumentTemplatesModal.tsx';
import { DocumentStatsDrawer } from './DocumentStatsDrawer.tsx';
import { DocumentOutlineDrawer } from './DocumentOutlineDrawer.tsx';
import { DocumentExportModal } from './DocumentExportModal.tsx';
import { DocumentImportModal } from './DocumentImportModal.tsx';
import { MoveDocumentModal } from './MoveDocumentModal.tsx';
import { DocumentAIToolsModal } from './DocumentAIToolsModal.tsx';
import { PdfWorkspace } from './PdfWorkspace.tsx';
import { MyFilesPickerModal } from '../files/MyFilesPickerModal.tsx';
import { FindReplaceBar } from './FindReplaceBar.tsx';

interface DocumentStudioViewProps {
  onNavigate?: (section: NavSection) => void;
  initialDocumentId?: string;
  onLaunchAIWithDoc?: (doc: UserDocument) => void;
}

type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved';

export function DocumentStudioView({ onNavigate, initialDocumentId, onLaunchAIWithDoc }: DocumentStudioViewProps) {
  const { user } = useAuth();

  // Studio Mode: 'documents' | 'pdf'
  const [activeStudioTab, setActiveStudioTab] = useState<'documents' | 'pdf'>('documents');

  // Documents list state
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // My Files cloud storage integration (files & folders)
  const [files, setFiles] = useState<UserFile[]>([]);
  const [folders, setFolders] = useState<CloudFolder[]>([]);

  // Active view mode: 'list' | 'editor'
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');

  // Currently opened document
  const [activeDoc, setActiveDoc] = useState<UserDocument | null>(null);

  // Focus Mode
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Local editing states
  const [docTitle, setDocTitle] = useState('Untitled Document');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('Study Notes');
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [margins, setMargins] = useState<PageMarginPreset>('normal');
  const [customMargins, setCustomMargins] = useState<PageMargins | undefined>(undefined);
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const [fontSize, setFontSize] = useState('14');

  // Save status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

  // Modals & Panels
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const [showOutlineDrawer, setShowOutlineDrawer] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);

  // Export / Import / Move / My Files Image Picker Modals
  const [exportModalDoc, setExportModalDoc] = useState<UserDocument | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [moveModalDoc, setMoveModalDoc] = useState<UserDocument | null>(null);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [showAIToolsModal, setShowAIToolsModal] = useState(false);
  const [selectedEditorText, setSelectedEditorText] = useState('');

  // Find & Replace match state
  const [findMatches, setFindMatches] = useState<HTMLElement[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const editorRef = useRef<HTMLDivElement>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeDocRef = useRef<UserDocument | null>(null);
  activeDocRef.current = activeDoc;

  // Real-time calculated stats
  const [stats, setStats] = useState(() => calculateDocumentStats(''));

  // 1. Subscribe to Firestore documents
  useEffect(() => {
    if (!user?.uid) {
      setDocuments([]);
      setIsLoadingDocs(false);
      return;
    }

    setIsLoadingDocs(true);
    const unsubscribe = subscribeUserDocuments(
      user.uid,
      (docs) => {
        setDocuments(docs);
        setIsLoadingDocs(false);

        // If an initial document ID was requested and we're not editing yet
        if (initialDocumentId && !activeDocRef.current) {
          const matched = docs.find((d) => d.id === initialDocumentId);
          if (matched) {
            handleOpenDocument(matched);
          }
        }
      },
      (err) => {
        console.error('Failed to subscribe to documents:', err);
        setIsLoadingDocs(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, initialDocumentId]);

  // 2. Subscribe to My Files (files & folders for Cloud Save and PDF Workspace)
  useEffect(() => {
    if (!user?.uid) {
      setFiles([]);
      setFolders([]);
      return;
    }

    const unsubFiles = subscribeUserFiles(
      user.uid,
      (f) => setFiles(f),
      (err) => console.error('Failed to subscribe to files:', err)
    );

    const unsubFolders = subscribeUserFolders(
      user.uid,
      (fd) => setFolders(fd),
      (err) => console.error('Failed to subscribe to folders:', err)
    );

    return () => {
      unsubFiles();
      unsubFolders();
    };
  }, [user?.uid]);

  // Keyboard shortcut listener (Ctrl+S for save, Escape for focus mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (viewMode === 'editor') {
          e.preventDefault();
          handleManualSave();
        }
      }
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, isFocusMode, docTitle, docCategory, pageSize, orientation, margins, customMargins, fontFamily, fontSize]);

  // Update stats whenever active content changes
  const updateStatsFromDom = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const calculated = calculateDocumentStats(html);
      setStats(calculated);
      return { html, wordCount: calculated.words, readingTimeMinutes: calculated.readingTimeMinutes };
    }
    return { html: '', wordCount: 0, readingTimeMinutes: 0 };
  }, []);

  // 3. Perform Autosave to Firestore (debounced 1500ms)
  const triggerAutosave = useCallback(() => {
    if (!user?.uid || !activeDocRef.current) return;

    setSaveStatus('unsaved');
    setSaveErrorMessage('');

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      if (!user?.uid || !activeDocRef.current) return;
      setSaveStatus('saving');
      try {
        const { html, wordCount, readingTimeMinutes } = updateStatsFromDom();
        const updatedDoc: UserDocument = {
          ...activeDocRef.current,
          title: docTitle.trim() || 'Untitled Document',
          content: html,
          category: docCategory,
          pageSize,
          orientation,
          margins,
          customMargins,
          fontFamily,
          fontSize: `${fontSize}px`,
          wordCount,
          readingTimeMinutes,
          updatedAt: new Date().toISOString(),
        };

        await saveUserDocument(user.uid, updatedDoc);
        setActiveDoc(updatedDoc);
        setSaveStatus('saved');
      } catch (err: any) {
        console.error('Autosave failed:', err);
        setSaveStatus('error');
        setSaveErrorMessage('Changes could not be saved. Please check your connection.');
      }
    }, 1500);
  }, [
    user?.uid,
    docTitle,
    docCategory,
    pageSize,
    orientation,
    margins,
    customMargins,
    fontFamily,
    fontSize,
    updateStatsFromDom,
  ]);

  // Manual immediate save
  const handleManualSave = async () => {
    if (!user?.uid || !activeDoc) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    setSaveStatus('saving');
    try {
      const { html, wordCount, readingTimeMinutes } = updateStatsFromDom();
      const updatedDoc: UserDocument = {
        ...activeDoc,
        title: docTitle.trim() || 'Untitled Document',
        content: html,
        category: docCategory,
        pageSize,
        orientation,
        margins,
        customMargins,
        fontFamily,
        fontSize: `${fontSize}px`,
        wordCount,
        readingTimeMinutes,
        updatedAt: new Date().toISOString(),
      };

      await saveUserDocument(user.uid, updatedDoc);
      setActiveDoc(updatedDoc);
      setSaveStatus('saved');

      // Record activity
      await recordUserActivity(user.uid, {
        title: 'Saved Document',
        description: `Saved "${updatedDoc.title}" (${wordCount} words)`,
        category: 'document',
      });
    } catch (err: any) {
      setSaveStatus('error');
      setSaveErrorMessage('Save failed. Please check your connection and try again.');
    }
  };

  // Open Document in Editor
  const handleOpenDocument = (doc: UserDocument) => {
    setActiveDoc(doc);
    setDocTitle(doc.title || 'Untitled Document');
    setDocCategory((doc.category as DocumentCategory) || 'Study Notes');
    setPageSize(doc.pageSize || 'A4');
    setOrientation(doc.orientation || 'portrait');
    setMargins(doc.margins || 'normal');
    setCustomMargins(doc.customMargins);
    setFontFamily(doc.fontFamily || 'Arial, sans-serif');
    setFontSize(doc.fontSize ? doc.fontSize.replace('px', '') : '14');
    setViewMode('editor');
    setSaveStatus('saved');

    // Populate editor DOM after render
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = doc.content || '<p></p>';
        const calculated = calculateDocumentStats(doc.content || '');
        setStats(calculated);
      }
    }, 50);
  };

  // Handle Back to List (with unsaved changes check)
  const handleBackToList = () => {
    if (saveStatus === 'unsaved' || saveStatus === 'saving') {
      const proceed = window.confirm(
        'You have unsaved changes. Do you want to save before leaving?'
      );
      if (proceed) {
        handleManualSave().then(() => {
          setViewMode('list');
          setActiveDoc(null);
          setIsFocusMode(false);
        });
        return;
      }
    }
    setViewMode('list');
    setActiveDoc(null);
    setIsFocusMode(false);
  };

  // Create New Document
  const handleCreateDocument = async (template?: DocumentTemplate) => {
    if (!user?.uid) return;

    const newDocId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const title = template ? template.defaultTitle : 'Untitled Document';
    const content = template ? template.content : '<p></p>';
    const category = template ? template.category : 'Study Notes';

    const calculated = calculateDocumentStats(content);

    const newDoc: UserDocument = {
      id: newDocId,
      title,
      content,
      category,
      docType: 'Student Document',
      pageSize: 'A4',
      orientation: 'portrait',
      margins: 'normal',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      wordCount: calculated.words,
      readingTimeMinutes: calculated.readingTimeMinutes,
      createdAt: now,
      updatedAt: now,
    };

    setSaveStatus('saving');
    try {
      await saveUserDocument(user.uid, newDoc);
      handleOpenDocument(newDoc);
      setSaveStatus('saved');

      await recordUserActivity(user.uid, {
        title: 'Created Document',
        description: `Created new ${category} document "${title}"`,
        category: 'document',
      });
    } catch (err) {
      console.error('Failed to create document:', err);
      setSaveStatus('error');
    }
  };

  // Duplicate Document
  const handleDuplicate = async (docToDup: UserDocument) => {
    if (!user?.uid) return;
    try {
      const duplicated = await duplicateUserDocument(user.uid, docToDup);
      await recordUserActivity(user.uid, {
        title: 'Duplicated Document',
        description: `Duplicated "${docToDup.title}" as "${duplicated.title}"`,
        category: 'document',
      });
    } catch (err) {
      console.error('Failed to duplicate document:', err);
    }
  };

  // Trash Document (soft delete)
  const handleTrashDocument = async (docId: string) => {
    if (!user?.uid) return;
    await trashUserDocument(user.uid, docId);
    if (activeDoc?.id === docId) {
      setActiveDoc(null);
      setViewMode('list');
    }
  };

  // Restore Document
  const handleRestoreDocument = async (docId: string) => {
    if (!user?.uid) return;
    await restoreUserDocument(user.uid, docId);
  };

  // Permanent Delete
  const handlePermanentDelete = async (docId: string) => {
    if (!user?.uid) return;
    await permanentDeleteUserDocument(user.uid, docId);
    if (activeDoc?.id === docId) {
      setActiveDoc(null);
      setViewMode('list');
    }
  };

  // Empty Trash
  const handleEmptyTrash = async () => {
    if (!user?.uid) return;
    await emptyUserDocumentTrash(user.uid);
  };

  // Toggle Star
  const handleToggleStar = async (docToStar: UserDocument) => {
    if (!user?.uid) return;
    await toggleStarUserDocument(user.uid, docToStar.id, !(docToStar.starred || docToStar.isStarred));
  };

  // Rename Document
  const handleRename = async (docToRename: UserDocument, newTitle: string) => {
    if (!user?.uid) return;
    await renameUserDocument(user.uid, docToRename.id, newTitle);
    if (activeDoc?.id === docToRename.id) {
      setDocTitle(newTitle);
      setActiveDoc({ ...activeDoc, title: newTitle });
    }
  };

  // Editor Input Listener
  const handleEditorInput = () => {
    updateStatsFromDom();
    triggerAutosave();
  };

  // Execute standard DOM formatting command
  const handleExecuteCommand = (cmd: string, val: string = '') => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(cmd, false, val);
    updateStatsFromDom();
    triggerAutosave();
  };

  // Insert Table
  const handleInsertTable = (rows: number, cols: number) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 1em 0;"><tbody>';
    for (let r = 0; r < rows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < cols; c++) {
        const isHeader = r === 0;
        const cellTag = isHeader ? 'th' : 'td';
        const bg = isHeader ? 'background-color: #f1f5f9; font-weight: bold;' : '';
        tableHtml += `<${cellTag} style="border: 1px solid #cbd5e1; padding: 8px 12px; ${bg} min-width: 60px;">${
          isHeader ? `Header ${c + 1}` : 'Cell'
        }</${cellTag}>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br/></p>';

    document.execCommand('insertHTML', false, tableHtml);
    updateStatsFromDom();
    triggerAutosave();
  };

  // Add Table Row
  const handleAddTableRow = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return;
    let node: Node | null = sel.anchorNode;
    let tr: HTMLTableRowElement | null = null;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TR') {
        tr = node as HTMLTableRowElement;
        break;
      }
      node = node.parentNode;
    }

    if (tr && tr.parentNode) {
      const newTr = document.createElement('tr');
      const cellsCount = tr.cells.length;
      for (let i = 0; i < cellsCount; i++) {
        const td = document.createElement('td');
        td.style.border = '1px solid #cbd5e1';
        td.style.padding = '8px 12px';
        td.innerHTML = '<br/>';
        newTr.appendChild(td);
      }
      tr.parentNode.insertBefore(newTr, tr.nextSibling);
      updateStatsFromDom();
      triggerAutosave();
    }
  };

  // Delete Table Row
  const handleDeleteTableRow = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return;
    let node: Node | null = sel.anchorNode;
    let tr: HTMLTableRowElement | null = null;
    let table: HTMLTableElement | null = null;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TR') tr = node as HTMLTableRowElement;
      if (node.nodeName === 'TABLE') table = node as HTMLTableElement;
      node = node.parentNode;
    }

    if (tr && table) {
      if (table.rows.length <= 1) {
        table.remove();
      } else {
        tr.remove();
      }
      updateStatsFromDom();
      triggerAutosave();
    }
  };

  // Insert Link
  const handleInsertLink = (url: string, text?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (text) {
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline;">${text}</a>`;
      document.execCommand('insertHTML', false, linkHtml);
    } else {
      document.execCommand('createLink', false, url);
    }
    updateStatsFromDom();
    triggerAutosave();
  };

  // Insert Local Image
  const handleInsertImage = (file: File) => {
    if (!editorRef.current) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) {
        editorRef.current?.focus();
        const imgHtml = `<p><img src="${src}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; display: inline-block;" /></p><p><br/></p>`;
        document.execCommand('insertHTML', false, imgHtml);
        updateStatsFromDom();
        triggerAutosave();
      }
    };
    reader.readAsDataURL(file);
  };

  // Insert Image from My Files
  const handleInsertImageFromMyFiles = (file: UserFile, blob?: Blob) => {
    if (!editorRef.current) return;
    const src = file.downloadUrl || (blob ? URL.createObjectURL(blob) : '');
    if (!src) return;
    setShowImagePickerModal(false);
    editorRef.current.focus();
    const imgHtml = `<p><img src="${src}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; display: inline-block;" /></p><p><br/></p>`;
    document.execCommand('insertHTML', false, imgHtml);
    updateStatsFromDom();
    triggerAutosave();
  };

  // Headings outline extracted from editor DOM
  const documentHeadings = useMemo(() => {
    if (viewMode !== 'editor' || !editorRef.current) return [];
    return extractDocumentHeadings(editorRef.current.innerHTML || '');
  }, [viewMode, stats]);

  // Navigate to heading
  const handleSelectHeading = (heading: DocumentHeadingItem) => {
    if (!editorRef.current) return;
    const el = editorRef.current.querySelector(`#${heading.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Document Intelligence AI Tools
  const handleOpenAITools = () => {
    const sel = window.getSelection()?.toString() || '';
    setSelectedEditorText(sel);
    setShowAIToolsModal(true);
  };

  const handleInsertAIText = (text: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const html = text
      .split('\n\n')
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    document.execCommand('insertHTML', false, html);
    updateStatsFromDom();
    triggerAutosave();
  };

  const handleReplaceSelectedAIText = (text: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const html = text
      .split('\n\n')
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    document.execCommand('insertHTML', false, html);
    updateStatsFromDom();
    triggerAutosave();
  };

  // Find & Replace Handlers
  const handleFind = (query: string, matchCase: boolean) => {
    clearFindHighlights();

    if (!query || !editorRef.current) {
      setFindMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const matches: HTMLElement[] = [];
    const walkTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        const text = node.nodeValue;
        const flags = matchCase ? 'g' : 'gi';
        const regex = new RegExp(escapeRegExp(query), flags);

        if (regex.test(text)) {
          const span = document.createElement('span');
          span.innerHTML = text.replace(
            regex,
            (m) =>
              `<mark class="doc-search-match" style="background-color: #fef08a; color: #000; border-radius: 2px;">${m}</mark>`
          );
          if (node.parentNode) {
            node.parentNode.replaceChild(span, node);
            span
              .querySelectorAll('mark.doc-search-match')
              .forEach((m) => matches.push(m as HTMLElement));
          }
        }
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as HTMLElement).tagName !== 'MARK'
      ) {
        Array.from(node.childNodes).forEach(walkTextNodes);
      }
    };

    walkTextNodes(editorRef.current);
    setFindMatches(matches);
    setCurrentMatchIndex(0);

    if (matches.length > 0) {
      matches[0].style.backgroundColor = '#f97316';
      matches[0].style.color = '#fff';
      matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const clearFindHighlights = () => {
    if (!editorRef.current) return;
    const marks = editorRef.current.querySelectorAll('mark.doc-search-match');
    marks.forEach((m) => {
      const parent = m.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(m.textContent || ''), m);
        parent.normalize();
      }
    });
  };

  const handleFindNext = () => {
    if (findMatches.length === 0) return;
    findMatches[currentMatchIndex].style.backgroundColor = '#fef08a';
    findMatches[currentMatchIndex].style.color = '#000';

    const nextIndex = (currentMatchIndex + 1) % findMatches.length;
    setCurrentMatchIndex(nextIndex);
    findMatches[nextIndex].style.backgroundColor = '#f97316';
    findMatches[nextIndex].style.color = '#fff';
    findMatches[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFindPrev = () => {
    if (findMatches.length === 0) return;
    findMatches[currentMatchIndex].style.backgroundColor = '#fef08a';
    findMatches[currentMatchIndex].style.color = '#000';

    const prevIndex = (currentMatchIndex - 1 + findMatches.length) % findMatches.length;
    setCurrentMatchIndex(prevIndex);
    findMatches[prevIndex].style.backgroundColor = '#f97316';
    findMatches[prevIndex].style.color = '#fff';
    findMatches[prevIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleReplace = (replacement: string) => {
    if (findMatches.length === 0) return;
    const current = findMatches[currentMatchIndex];
    if (current && current.parentNode) {
      const textNode = document.createTextNode(replacement);
      current.parentNode.replaceChild(textNode, current);
      current.parentNode.normalize();

      const newMatches = findMatches.filter((_, idx) => idx !== currentMatchIndex);
      setFindMatches(newMatches);
      if (newMatches.length > 0) {
        const nextIdx = currentMatchIndex % newMatches.length;
        setCurrentMatchIndex(nextIdx);
        newMatches[nextIdx].style.backgroundColor = '#f97316';
        newMatches[nextIdx].style.color = '#fff';
        newMatches[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      updateStatsFromDom();
      triggerAutosave();
    }
  };

  const handleReplaceAll = (query: string, replacement: string, matchCase: boolean) => {
    if (!editorRef.current || !query) return;
    clearFindHighlights();

    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(escapeRegExp(query), flags);
    const html = editorRef.current.innerHTML;
    editorRef.current.innerHTML = html.replace(regex, replacement);

    setFindMatches([]);
    setCurrentMatchIndex(0);
    updateStatsFromDom();
    triggerAutosave();
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Dynamic Page Container Styles
  const getPageContainerStyle = (): React.CSSProperties => {
    let maxWidth = '800px';
    let minHeight = '1050px';

    if (pageSize === 'Letter') {
      maxWidth = orientation === 'portrait' ? '816px' : '1056px';
      minHeight = orientation === 'portrait' ? '1056px' : '816px';
    } else if (pageSize === 'Legal') {
      maxWidth = orientation === 'portrait' ? '816px' : '1344px';
      minHeight = orientation === 'portrait' ? '1344px' : '816px';
    } else if (pageSize === 'A5') {
      maxWidth = orientation === 'portrait' ? '560px' : '790px';
      minHeight = orientation === 'portrait' ? '790px' : '560px';
    } else {
      // A4 default
      maxWidth = orientation === 'portrait' ? '794px' : '1123px';
      minHeight = orientation === 'portrait' ? '1123px' : '794px';
    }

    let padding = '48px';
    if (margins === 'narrow') padding = '24px';
    if (margins === 'wide') padding = '72px';
    if (margins === 'custom' && customMargins) {
      padding = `${customMargins.top}px ${customMargins.right}px ${customMargins.bottom}px ${customMargins.left}px`;
    }

    return {
      maxWidth,
      minHeight,
      padding,
    };
  };

  // Count active PDFs from My Files
  const pdfCount = useMemo(() => {
    return files.filter((f) => {
      if (f.deleted) return false;
      const ext = (f.extension || f.name.split('.').pop() || '').toLowerCase();
      return f.mimeType === 'application/pdf' || ext === 'pdf';
    }).length;
  }, [files]);

  return (
    <div
      id="document-studio-container"
      className={`space-y-4 ${
        isFocusMode ? 'fixed inset-0 z-50 bg-slate-900 overflow-y-auto p-4 sm:p-8 space-y-0' : ''
      }`}
    >
      {/* 1. Header (hidden in focus mode) */}
      {!isFocusMode && viewMode === 'list' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Document Studio
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Create, organize, and format student notes, coursework drafts, and PDF documents.
            </p>
          </div>

          {/* Navigation to My Files & Action Buttons */}
          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('my-files')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Go to My Files cloud storage"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">My Files</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowTemplatesModal(true)}
              className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Templates</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Import</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateDocument()}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Document</span>
            </button>
          </div>
        </div>
      )}

      {/* Studio Mode Selector (Documents vs PDF Workspace) */}
      {!isFocusMode && viewMode === 'list' && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveStudioTab('documents')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeStudioTab === 'documents'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents ({documents.filter((d) => !d.deleted && !d.isTrashed).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStudioTab('pdf')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeStudioTab === 'pdf'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileType className="w-3.5 h-3.5" />
            <span>PDF Workspace ({pdfCount})</span>
          </button>
        </div>
      )}

      {/* MAIN VIEW: LIST vs EDITOR */}
      {viewMode === 'list' ? (
        activeStudioTab === 'documents' ? (
          <DocumentListView
            documents={documents}
            folders={folders}
            isLoading={isLoadingDocs}
            onOpenDocument={handleOpenDocument}
            onNewDocument={() => handleCreateDocument()}
            onImportClick={() => setShowImportModal(true)}
            onRenameDocument={handleRename}
            onDuplicateDocument={handleDuplicate}
            onToggleStarDocument={handleToggleStar}
            onMoveDocumentClick={(doc) => setMoveModalDoc(doc)}
            onExportDocumentClick={(doc) => setExportModalDoc(doc)}
            onTrashDocument={handleTrashDocument}
            onRestoreDocument={handleRestoreDocument}
            onPermanentDeleteDocument={handlePermanentDelete}
            onEmptyTrash={handleEmptyTrash}
          />
        ) : (
          <PdfWorkspace
            userId={user?.uid || ''}
            files={files}
            folders={folders}
          />
        )
      ) : (
        /* ==================== RICH TEXT EDITOR VIEW ==================== */
        <div id="document-editor-view" className="space-y-3">
          {/* Floating Exit Button in Focus Mode */}
          {isFocusMode && (
            <div className="fixed top-4 right-6 z-50 animate-in fade-in">
              <button
                type="button"
                onClick={() => setIsFocusMode(false)}
                className="px-3.5 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Focus Mode (Esc)</span>
              </button>
            </div>
          )}

          {/* Editor Header Bar (hidden in focus mode) */}
          {!isFocusMode && (
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              {/* Left: Back button & Document Title */}
              <div className="flex items-center gap-3 min-w-[200px] flex-1">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Back to Document list"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => {
                        setDocTitle(e.target.value);
                        triggerAutosave();
                      }}
                      placeholder="Untitled Document"
                      className="font-bold text-sm text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-full max-w-sm px-1 py-0.5"
                    />
                  </div>

                  {/* Save Status Indicator & Category Badge */}
                  <div className="flex items-center gap-2 text-[11px] mt-0.5 px-1">
                    <span className="text-slate-400 font-semibold">{docCategory}</span>
                    <span className="text-slate-300 dark:text-slate-700">&bull;</span>

                    {saveStatus === 'saved' && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check className="w-3 h-3" />
                        <span>Saved to cloud</span>
                      </span>
                    )}
                    {saveStatus === 'saving' && (
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Saving...</span>
                      </span>
                    )}
                    {saveStatus === 'unsaved' && (
                      <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Unsaved changes</span>
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        <span>Save failed</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Quick Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* AI Tools Button (Phase 11) */}
                <button
                  type="button"
                  onClick={handleOpenAITools}
                  title="Document & Selected Text AI Tools"
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shadow-indigo-600/30 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Tools</span>
                </button>

                {/* Stats Button */}
                <button
                  type="button"
                  onClick={() => setShowStatsDrawer(!showStatsDrawer)}
                  title="Document Statistics"
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showStatsDrawer
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>{stats.words.toLocaleString()} words</span>
                </button>

                {/* Outline Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => setShowOutlineDrawer(!showOutlineDrawer)}
                  title="Table of Contents Outline"
                  className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    showOutlineDrawer
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <ListTree className="w-4 h-4" />
                </button>

                {/* Focus Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFocusMode(true)}
                  title="Distraction-Free Focus Mode"
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Move to Folder */}
                <button
                  type="button"
                  onClick={() => activeDoc && setMoveModalDoc(activeDoc)}
                  title="Move to Folder"
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                >
                  <Folder className="w-4 h-4 text-amber-500" />
                </button>

                {/* Page & Document Settings */}
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  title="Page & Document Settings"
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Manual Save */}
                <button
                  type="button"
                  onClick={handleManualSave}
                  title="Save Now (Ctrl+S)"
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Save</span>
                </button>

                {/* Print */}
                <button
                  type="button"
                  onClick={() => {
                    if (editorRef.current) {
                      printDocument(docTitle, editorRef.current.innerHTML, {
                        fontFamily,
                        fontSize: `${fontSize}px`,
                        pageSize,
                        orientation,
                        margins,
                      });
                    }
                  }}
                  title="Print Document"
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                </button>

                {/* Export Button (opens DocumentExportModal) */}
                <button
                  type="button"
                  onClick={() => {
                    if (activeDoc && editorRef.current) {
                      setExportModalDoc({
                        ...activeDoc,
                        title: docTitle,
                        content: editorRef.current.innerHTML,
                        pageSize,
                        orientation,
                        margins,
                        customMargins,
                        fontFamily,
                        fontSize: `${fontSize}px`,
                      });
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          )}

          {/* Statistics Collapsible Drawer */}
          <DocumentStatsDrawer
            stats={stats}
            isOpen={showStatsDrawer}
            onClose={() => setShowStatsDrawer(false)}
          />

          {/* Outline Drawer */}
          <DocumentOutlineDrawer
            isOpen={showOutlineDrawer}
            onClose={() => setShowOutlineDrawer(false)}
            headings={documentHeadings}
            onSelectHeading={handleSelectHeading}
          />

          {/* Find & Replace Bar */}
          {showFindReplace && (
            <FindReplaceBar
              onFind={handleFind}
              onFindNext={handleFindNext}
              onFindPrev={handleFindPrev}
              onReplace={handleReplace}
              onReplaceAll={handleReplaceAll}
              matchCount={findMatches.length}
              currentMatchIndex={currentMatchIndex}
              onClose={() => {
                clearFindHighlights();
                setShowFindReplace(false);
              }}
            />
          )}

          {/* Offline / Save Error Banner */}
          {saveStatus === 'error' && saveErrorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{saveErrorMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleManualSave}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer text-[11px]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Editor Toolbar & Page Canvas Container */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
            <DocumentEditorToolbar
              onExecuteCommand={handleExecuteCommand}
              onInsertTable={handleInsertTable}
              onInsertLink={handleInsertLink}
              onInsertImage={handleInsertImage}
              onInsertImageFromMyFiles={() => setShowImagePickerModal(true)}
              onToggleFindReplace={() => setShowFindReplace(!showFindReplace)}
              onAddTableRow={handleAddTableRow}
              onDeleteTableRow={handleDeleteTableRow}
              currentFontFamily={fontFamily}
              onFontFamilyChange={(f) => {
                setFontFamily(f);
                triggerAutosave();
              }}
              currentFontSize={fontSize}
              onFontSizeChange={(s) => {
                setFontSize(s);
                triggerAutosave();
              }}
              onToggleOutline={() => setShowOutlineDrawer(!showOutlineDrawer)}
              isOutlineOpen={showOutlineDrawer}
              onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
              isFocusMode={isFocusMode}
            />

            {/* Document Page Surface */}
            <div className="p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 flex justify-center min-h-[650px] overflow-x-auto">
              <div
                id="document-page-canvas"
                style={getPageContainerStyle()}
                className="w-full bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md transition-all duration-150 text-slate-800 dark:text-slate-100"
              >
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  className="w-full h-full min-h-[550px] outline-none focus:outline-none doc-editor-content leading-relaxed"
                  style={{
                    fontFamily,
                    fontSize: `${fontSize}px`,
                  }}
                />
              </div>
            </div>

            {/* Bottom Real-time Statistics Bar */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span>{stats.words.toLocaleString()} words</span>
                <span>&bull;</span>
                <span>{stats.charactersWithSpaces.toLocaleString()} characters</span>
                <span>&bull;</span>
                <span>{stats.paragraphs} paragraphs</span>
              </div>
              <div>
                <span>Estimated reading: ~{stats.readingTimeMinutes} min</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <DocumentSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        pageSize={pageSize}
        orientation={orientation}
        margins={margins}
        customMargins={customMargins}
        category={docCategory}
        onSave={(newSettings) => {
          setPageSize(newSettings.pageSize);
          setOrientation(newSettings.orientation);
          setMargins(newSettings.margins);
          setCustomMargins(newSettings.customMargins);
          setDocCategory(newSettings.category);
          triggerAutosave();
        }}
      />

      {/* Templates Modal */}
      <DocumentTemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={(template) => handleCreateDocument(template)}
      />

      {/* Export Modal */}
      {exportModalDoc && (
        <DocumentExportModal
          isOpen={!!exportModalDoc}
          onClose={() => setExportModalDoc(null)}
          document={exportModalDoc}
          userId={user?.uid || ''}
          folders={folders}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <DocumentImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          userId={user?.uid || ''}
          files={files}
          folders={folders}
          onImportSuccess={(newDocId) => {
            const imported = documents.find((d) => d.id === newDocId);
            if (imported) {
              handleOpenDocument(imported);
            }
          }}
        />
      )}

      {/* Move Document Modal */}
      {moveModalDoc && (
        <MoveDocumentModal
          isOpen={!!moveModalDoc}
          onClose={() => setMoveModalDoc(null)}
          document={moveModalDoc}
          folders={folders}
          onConfirmMove={async (docId, folderId) => {
            if (!user?.uid) return;
            await moveUserDocumentToFolder(user.uid, docId, folderId);
            setMoveModalDoc(null);
          }}
        />
      )}

      {/* My Files Image Picker Modal */}
      {showImagePickerModal && (
        <MyFilesPickerModal
          isOpen={showImagePickerModal}
          onClose={() => setShowImagePickerModal(false)}
          onSelectFile={handleInsertImageFromMyFiles}
          allowedCategories={['images']}
          title="Select Image from My Files"
        />
      )}

      {/* Document Intelligence AI Tools Modal */}
      {showAIToolsModal && (
        <DocumentAIToolsModal
          isOpen={showAIToolsModal}
          onClose={() => setShowAIToolsModal(false)}
          docTitle={docTitle}
          docContent={editorRef.current ? editorRef.current.innerHTML : ''}
          selectedText={selectedEditorText}
          onInsertText={handleInsertAIText}
          onReplaceSelectedText={handleReplaceSelectedAIText}
          onOpenInAIStudy={() => {
            if (activeDoc && onLaunchAIWithDoc) {
              onLaunchAIWithDoc(activeDoc);
            }
          }}
        />
      )}
    </div>
  );
}
