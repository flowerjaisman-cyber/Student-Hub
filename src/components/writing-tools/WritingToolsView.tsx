import { useState, useEffect, useMemo } from 'react';
import { WritingToolId } from '../../types/index.ts';
import { TextFormatterTool } from './TextFormatterTool.tsx';
import { CaseConverterTool } from './CaseConverterTool.tsx';
import { TextCleanerTool } from './TextCleanerTool.tsx';
import { DuplicateLineRemoverTool } from './DuplicateLineRemoverTool.tsx';
import { FindReplaceTool } from './FindReplaceTool.tsx';
import { TextCompareTool } from './TextCompareTool.tsx';
import { ReadabilityCheckerTool } from './ReadabilityCheckerTool.tsx';
import { SentenceParagraphTool } from './SentenceParagraphTool.tsx';
import { ListNumberingTool } from './ListNumberingTool.tsx';
import { CitationFormatterTool } from './CitationFormatterTool.tsx';
import { QuickWritingPad } from './QuickWritingPad.tsx';
import { SpellcheckAssistantTool } from './SpellcheckAssistantTool.tsx';
import {
  SlidersHorizontal,
  Type,
  Sparkles,
  CopySlash,
  Search,
  GitCompare,
  BarChart3,
  Split,
  ListOrdered,
  BookMarked,
  Feather,
  SpellCheck,
  Star,
  Clock,
  ShieldCheck,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface WritingToolsViewProps {
  initialToolId?: WritingToolId;
  onNavigateToDocumentStudio?: () => void;
}

interface ToolDefinition {
  id: WritingToolId;
  name: string;
  shortDesc: string;
  category: 'formatting' | 'structure' | 'analysis' | 'citations';
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
}

const TOOLS_CONFIG: ToolDefinition[] = [
  {
    id: 'formatter',
    name: 'Text Formatter',
    shortDesc: 'Trim spacing, normalize breaks, wrap text, and convert tabs.',
    category: 'formatting',
    icon: SlidersHorizontal,
    tags: ['spaces', 'tabs', 'wrap', 'indent', 'breaks', 'trim'],
  },
  {
    id: 'case-converter',
    name: 'Case Converter',
    shortDesc: 'Sentence case, Title Case, UPPERCASE, camelCase, with acronym safety.',
    category: 'formatting',
    icon: Type,
    tags: ['case', 'uppercase', 'lowercase', 'title', 'sentence', 'camel', 'acronym'],
  },
  {
    id: 'cleaner',
    name: 'Text Cleaner',
    shortDesc: 'Strip smart quotes, zero-width characters, and irregular spaces.',
    category: 'formatting',
    icon: Sparkles,
    tags: ['clean', 'smart quotes', 'zero width', 'unicode', 'normalize', 'dashes'],
  },
  {
    id: 'duplicate-remover',
    name: 'Duplicate Line Remover',
    shortDesc: 'Filter out repeat lines with case and whitespace matching.',
    category: 'structure',
    icon: CopySlash,
    tags: ['duplicates', 'dedup', 'lines', 'unique', 'filter'],
  },
  {
    id: 'find-replace',
    name: 'Find & Replace',
    shortDesc: 'Match whole words, case-sensitive terms, and replace occurrences.',
    category: 'formatting',
    icon: Search,
    tags: ['search', 'find', 'replace', 'regex', 'substitute'],
  },
  {
    id: 'compare',
    name: 'Text Compare (Diff)',
    shortDesc: 'Compare two essay drafts word-by-word or line-by-line.',
    category: 'analysis',
    icon: GitCompare,
    tags: ['diff', 'compare', 'revisions', 'drafts', 'changes'],
  },
  {
    id: 'readability',
    name: 'Readability Checker',
    shortDesc: 'Real word counts, Flesch scores, and syllable density statistics.',
    category: 'analysis',
    icon: BarChart3,
    tags: ['readability', 'flesch', 'grade level', 'reading time', 'words'],
  },
  {
    id: 'sentence-paragraph',
    name: 'Sentence & Paragraphs',
    shortDesc: 'Split into sentences, combine broken lines, and format paragraphs.',
    category: 'structure',
    icon: Split,
    tags: ['sentence', 'paragraph', 'combine', 'split', 'restructure'],
  },
  {
    id: 'list-numbering',
    name: 'List & Numbering',
    shortDesc: 'Number lists, sort lines alphabetically (A-Z), and reorder references.',
    category: 'structure',
    icon: ListOrdered,
    tags: ['list', 'numbering', 'bullets', 'alphabetize', 'sort', 'roman'],
  },
  {
    id: 'citation',
    name: 'Citation Formatter',
    shortDesc: 'Generate APA 7, MLA 9, Chicago, and Harvard bibliographies.',
    category: 'citations',
    icon: BookMarked,
    tags: ['citation', 'apa', 'mla', 'chicago', 'harvard', 'bibliography', 'references'],
  },
  {
    id: 'writing-pad',
    name: 'Quick Writing Pad',
    shortDesc: 'Distraction-free scratchpad with direct save to Document Studio.',
    category: 'citations',
    icon: Feather,
    tags: ['pad', 'scratchpad', 'notes', 'draft', 'save'],
  },
  {
    id: 'spellcheck',
    name: 'Spellcheck & Assistant',
    shortDesc: 'Native browser spellcheck and conciseness proofreading checks.',
    category: 'analysis',
    icon: SpellCheck,
    tags: ['spellcheck', 'grammar', 'proofread', 'conciseness', 'fillers'],
  },
];

export function WritingToolsView({
  initialToolId = 'formatter',
  onNavigateToDocumentStudio,
}: WritingToolsViewProps) {
  const [activeTool, setActiveTool] = useState<WritingToolId>(initialToolId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'formatting' | 'structure' | 'analysis' | 'citations'>('all');

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('studenthub_writing_tool_favs');
      return saved ? JSON.parse(saved) : ['formatter', 'case-converter', 'citation', 'readability'];
    } catch {
      return ['formatter', 'case-converter', 'citation', 'readability'];
    }
  });

  // Recently used tools history
  const [recentTools, setRecentTools] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('studenthub_writing_tool_recents');
      return saved ? JSON.parse(saved) : ['formatter'];
    } catch {
      return ['formatter'];
    }
  });

  // Handle switching tools and recording recents
  const handleSelectTool = (id: WritingToolId) => {
    setActiveTool(id);
    setRecentTools((prev) => {
      const filtered = prev.filter((t) => t !== id);
      const updated = [id, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('studenthub_writing_tool_recents', JSON.stringify(updated));
      } catch {
        // Ignore storage error
      }
      return updated;
    });
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('studenthub_writing_tool_favs', JSON.stringify(updated));
      } catch {
        // Ignore storage error
      }
      return updated;
    });
  };

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    return TOOLS_CONFIG.filter((tool) => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const inName = tool.name.toLowerCase().includes(q);
      const inDesc = tool.shortDesc.toLowerCase().includes(q);
      const inTags = tool.tags.some((tag) => tag.toLowerCase().includes(q));

      return inName || inDesc || inTags;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md relative overflow-hidden border border-slate-700/60">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Phase 6 &bull; Writing Studio
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <Lock className="w-3 h-3" />
                100% Client-Side Privacy
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Writing & Academic Tools
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Clean, format, analyze and prepare your text for assignments, notes, and academic publications. No external AI services, no fake metrics, strictly deterministic client-side operations.
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-72 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 12 academic tools..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-600/70 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tools Quick Selector Grid */}
      <div className="space-y-3">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
            {(
              [
                { id: 'all', label: 'All 12 Tools' },
                { id: 'formatting', label: 'Formatting & Cleaning' },
                { id: 'structure', label: 'Structure & Lists' },
                { id: 'analysis', label: 'Analysis & Diffs' },
                { id: 'citations', label: 'Citations & Notes' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick info tag */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            Showing {filteredTools.length} tool{filteredTools.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Tools Horizontal Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            const isFav = favorites.includes(tool.id);

            return (
              <div
                key={tool.id}
                onClick={() => handleSelectTool(tool.id)}
                className={`group relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-indigo-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(tool.id, e)}
                      className="p-1 text-slate-300 dark:text-slate-600 hover:text-amber-500 transition-colors"
                      title={isFav ? 'Remove from favorites' : 'Pin to favorites'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isFav ? 'fill-amber-400 text-amber-500' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <h3
                    className={`text-xs font-bold truncate ${
                      isActive
                        ? 'text-indigo-950 dark:text-indigo-200'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {tool.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    {tool.shortDesc}
                  </p>
                </div>

                {isActive && (
                  <div className="mt-2 pt-1 border-t border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    <span>Active Workspace</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Tool Main Container */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {activeTool === 'formatter' && <TextFormatterTool />}
        {activeTool === 'case-converter' && <CaseConverterTool />}
        {activeTool === 'cleaner' && <TextCleanerTool />}
        {activeTool === 'duplicate-remover' && <DuplicateLineRemoverTool />}
        {activeTool === 'find-replace' && <FindReplaceTool />}
        {activeTool === 'compare' && <TextCompareTool />}
        {activeTool === 'readability' && <ReadabilityCheckerTool />}
        {activeTool === 'sentence-paragraph' && <SentenceParagraphTool />}
        {activeTool === 'list-numbering' && <ListNumberingTool />}
        {activeTool === 'citation' && (
          <CitationFormatterTool
            onNavigateToDocumentStudio={onNavigateToDocumentStudio}
          />
        )}
        {activeTool === 'writing-pad' && (
          <QuickWritingPad
            onNavigateToDocumentStudio={onNavigateToDocumentStudio}
          />
        )}
        {activeTool === 'spellcheck' && <SpellcheckAssistantTool />}
      </div>
    </div>
  );
}
