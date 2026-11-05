import {
  Image as ImageIcon,
  FileText,
  PenTool,
  Calculator,
  GraduationCap,
  FolderClosed,
  ArrowLeft,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { NavSection } from '../types/index.ts';

interface ToolPlaceholderViewProps {
  section: NavSection;
  onNavigate: (section: NavSection) => void;
}

interface SectionConfig {
  title: string;
  subtitle: string;
  phase: string;
  icon: typeof ImageIcon;
  features: string[];
}

const SECTION_CONFIGS: Partial<Record<NavSection, SectionConfig>> = {
  'image-tools': {
    title: 'Image Tools',
    subtitle: 'Image conversion, compression, resizing, and preparation for student submissions.',
    phase: 'Phase 2 & 3',
    icon: ImageIcon,
    features: [
      'Image format conversions (PNG, JPG, WebP, SVG, AVIF)',
      'Coursework and assignment image compression without quality loss',
      'Batch image dimension resizing and cropping',
      'Document photo scanner and contrast enhancer',
    ],
  },
  'pdf-docs': {
    title: 'PDF & Documents',
    subtitle: 'Comprehensive PDF manipulation and document utilities for academic work.',
    phase: 'Phase 4 & 5',
    icon: FileText,
    features: [
      'Merge multiple PDF documents or lecture slides into a single file',
      'Split PDFs and extract specific page ranges for reading assignments',
      'Compress large academic PDFs to meet submission file size limits',
      'Convert between PDF, Markdown, and formatted student notes',
    ],
  },
  'writing-tools': {
    title: 'Writing Tools',
    subtitle: 'Academic writing aids, formatting helpers, and citation builders.',
    phase: 'Phase 6',
    icon: PenTool,
    features: [
      'Grammar and academic tone enhancement',
      'Citation generator (APA, MLA, Chicago, IEEE)',
      'Article summarizer and lecture notes condenser',
      'Word count, reading time, and thesis readability analytics',
    ],
  },
  'calculators': {
    title: 'Student Calculators',
    subtitle: 'Specialized calculators designed for school, college, and university students.',
    phase: 'Phase 7',
    icon: Calculator,
    features: [
      'Semester and cumulative GPA projection calculator',
      'Final exam score targets and grade weighting simulator',
      'Scientific math, statistics, and financial student loan estimators',
      'Unit, metrics, and scientific constant conversion tables',
    ],
  },
  'study-tools': {
    title: 'Study Tools',
    subtitle: 'Focus timers, active recall systems, and academic organization.',
    phase: 'Phase 8',
    icon: GraduationCap,
    features: [
      'Customizable Pomodoro timer with sound notification modes',
      'Spaced repetition flashcards with Firestore cloud sync',
      'Assignment and exam countdown scheduler',
      'Course progress and syllabus milestone tracker',
    ],
  },
  'my-files': {
    title: 'My Files',
    subtitle: 'Personal student cloud file manager isolated to your Google account.',
    phase: 'Phase 9',
    icon: FolderClosed,
    features: [
      'Private cloud file storage partitioned by Firebase UID',
      'Categorization by courses, semesters, and subjects',
      'Fast search and tag filtering for documents and media',
      'Zero cross-account data leakage with strict Firestore rules',
    ],
  },
};

export function ToolPlaceholderView({
  section,
  onNavigate,
}: ToolPlaceholderViewProps) {
  const config = SECTION_CONFIGS[section] || {
    title: 'Utility Section',
    subtitle: 'Upcoming student utility module.',
    phase: 'Future Phase',
    icon: Clock,
    features: [],
  };

  const Icon = config.icon;

  return (
    <div
      id={`placeholder-${section}`}
      className="max-w-3xl mx-auto py-6 space-y-6"
    >
      {/* Back button */}
      <button
        type="button"
        onClick={() => onNavigate('dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </button>

      {/* Main Card */}
      <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-5 border border-indigo-100 dark:border-indigo-900/60">
          <Icon className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold mb-3 border border-slate-200 dark:border-slate-700">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>Scheduled for {config.phase}</span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {config.title}
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          {config.subtitle}
        </p>

        {/* Feature roadmap preview */}
        <div className="mt-8 text-left max-w-md mx-auto p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
            Planned Capabilities for {config.phase}
          </h2>
          <ul className="space-y-2.5">
            {config.features.map((feature, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Foundation Notice */}
        <p className="mt-6 text-[11px] text-slate-600 dark:text-slate-400">
          In Phase 1, the cloud architecture, Google authentication, and security foundation are established. No mock or fake data is loaded.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
