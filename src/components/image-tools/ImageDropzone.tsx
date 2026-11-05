import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, AlertCircle, FileImage, ShieldCheck } from 'lucide-react';
import { validateImageFile } from '../../utils/imageUtils.ts';

interface ImageDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
}

export function ImageDropzone({
  onFilesSelected,
  multiple = false,
  title = 'Upload an image to get started',
  subtitle = 'Drag & drop your file here, or click to browse from your device.',
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setValidationError(null);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      processFiles(selected);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = (files: File[]) => {
    if (files.length === 0) return;

    const validFiles: File[] = [];
    let firstError: string | null = null;

    for (const f of files) {
      const result = validateImageFile(f);
      if (result.valid) {
        validFiles.push(f);
      } else if (!firstError && result.error) {
        firstError = result.error;
      }
    }

    if (validFiles.length > 0) {
      onFilesSelected(multiple ? validFiles : [validFiles[0]]);
    } else if (firstError) {
      setValidationError(firstError);
    }
  };

  return (
    <div className="w-full space-y-3">
      {validationError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300 animate-in fade-in duration-150"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}

      <div
        id="image-dropzone-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none text-center ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-4 ring-indigo-600/20 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-900/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          aria-label="Upload image file"
        />

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200 ${
            isDragging
              ? 'bg-indigo-600 text-white scale-110 shadow-md shadow-indigo-600/30'
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40'
          }`}
        >
          {isDragging ? (
            <UploadCloud className="w-7 h-7 animate-bounce" />
          ) : (
            <FileImage className="w-7 h-7" />
          )}
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h3>

        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
          {subtitle}
        </p>

        {/* Format Tags */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {['JPG / JPEG', 'PNG', 'WebP'].map((fmt) => (
            <span
              key={fmt}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
            >
              {fmt}
            </span>
          ))}
          <span className="text-[11px] text-slate-600 dark:text-slate-400">
            • Safe client-side processing up to 50MB
          </span>
        </div>

        {/* Privacy notice badge */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Private &amp; local — files never leave your browser</span>
        </div>
      </div>
    </div>
  );
}
