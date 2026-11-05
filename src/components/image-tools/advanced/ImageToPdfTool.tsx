import { useState, useEffect, useRef } from 'react';
import {
  ImageMetadata,
  downloadBlob,
  formatBytes,
  getSuggestedFilename,
} from '../../../utils/imageUtils.ts';
import {
  generateImagesPdf,
  PdfSettings,
  PdfPageItem,
  PdfPageSize,
  PdfOrientation,
  PdfMarginPreset,
  PdfImageScaling,
} from '../../../utils/imageToPdfUtils.ts';
import {
  FileText,
  Download,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Layers,
  Settings,
  CheckCircle2,
} from 'lucide-react';

interface ImageToPdfToolProps {
  initialFile: File;
  initialImg: HTMLImageElement;
  initialMetadata: ImageMetadata;
}

export function ImageToPdfTool({
  initialFile,
  initialImg,
  initialMetadata,
}: ImageToPdfToolProps) {
  // List of pages to convert
  const [pages, setPages] = useState<PdfPageItem[]>([
    {
      id: 'initial',
      file: initialFile,
      name: initialMetadata.name,
      img: initialImg,
      width: initialMetadata.width,
      height: initialMetadata.height,
    },
  ]);

  // PDF Configuration settings
  const [pageSize, setPageSize] = useState<PdfPageSize>('a4');
  const [orientation, setOrientation] = useState<PdfOrientation>('auto');
  const [marginPreset, setMarginPreset] = useState<PdfMarginPreset>('small');
  const [scaling, setScaling] = useState<PdfImageScaling>('fit');

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Add more images to the PDF queue
  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setPages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            file,
            name: file.name,
            img,
            width: img.naturalWidth,
            height: img.naturalHeight,
          },
        ]);
      };
    });
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === pages.length - 1) return;
    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleRemovePage = (index: number) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate PDF
  const handleGeneratePdf = async () => {
    if (pages.length === 0) return;
    setIsGenerating(true);
    try {
      const settings: PdfSettings = {
        pageSize,
        orientation,
        marginPreset,
        scaling,
      };

      const blob = await generateImagesPdf(pages, settings);
      setGeneratedPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate preview on settings change or page count change
  useEffect(() => {
    handleGeneratePdf();
  }, [pages.length, pageSize, orientation, marginPreset, scaling]);

  const handleDownload = () => {
    if (!generatedPdfBlob) return;
    const baseName = pages[0]?.name || 'document';
    const outputName = getSuggestedFilename(baseName, 'converted', 'pdf');
    downloadBlob(generatedPdfBlob, outputName);
  };

  return (
    <div id="image-to-pdf-tool" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pages List & Reordering */}
        <div className="lg:col-span-6 space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Document Pages ({pages.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Reorder, add lecture slides, or remove pages before compilation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Images</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAddFiles}
              className="hidden"
            />
          </div>

          {/* Pages Queue List */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>

                  <img
                    src={p.img.src}
                    alt={p.name}
                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                  />

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-[220px]">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {p.width} × {p.height} px
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveUp(idx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === pages.length - 1}
                    onClick={() => handleMoveDown(idx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={pages.length <= 1}
                    onClick={() => handleRemovePage(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Delete page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Layout Setup */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-indigo-500" />
              <span>PDF Layout &amp; Margins</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Page Format
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as PdfPageSize)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
                >
                  <option value="a4">A4 (Standard 210 × 297 mm)</option>
                  <option value="letter">US Letter (8.5 × 11 in)</option>
                  <option value="a5">A5 (Compact 148 × 210 mm)</option>
                  <option value="original">Original Image Aspect</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Orientation
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as PdfOrientation)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
                >
                  <option value="auto">Auto (Match Image Ratio)</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Page Margins
                </label>
                <select
                  value={marginPreset}
                  onChange={(e) => setMarginPreset(e.target.value as PdfMarginPreset)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
                >
                  <option value="none">Zero Margins (Edge-to-Edge)</option>
                  <option value="small">Small (8 mm)</option>
                  <option value="medium">Medium (15 mm)</option>
                  <option value="large">Large (25 mm)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Image Fit
                </label>
                <select
                  value={scaling}
                  onChange={(e) => setScaling(e.target.value as PdfImageScaling)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
                >
                  <option value="fit">Fit Page (Preserve Ratio)</option>
                  <option value="fill">Fill Entire Area</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: PDF Preview & Download */}
        <div className="lg:col-span-6 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" />
                Compiled PDF Output
              </h3>

              {isGenerating && (
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Compiling PDF...</span>
                </span>
              )}
            </div>

            {/* Document stats */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Document Size
                </span>
                <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  {generatedPdfBlob ? formatBytes(generatedPdfBlob.size) : 'Calculating...'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Pages Included
                </span>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
                </p>
              </div>
            </div>

            {/* Visual thumbnail gallery */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Page Sequence Preview
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 aspect-3/4 flex flex-col items-center justify-center p-1 shadow-2xs"
                  >
                    <img
                      src={p.img.src}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                      p.{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Ready for assignment and application submission</span>
            </div>
          </div>

          <button
            type="button"
            id="download-images-pdf-btn"
            disabled={!generatedPdfBlob || isGenerating}
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-rose-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              Download PDF ({generatedPdfBlob ? formatBytes(generatedPdfBlob.size) : '...'})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
