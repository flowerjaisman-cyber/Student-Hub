import { useState, useRef } from 'react';
import {
  SupportedFormat,
  convertImageCanvas,
  createZipArchive,
  downloadBlob,
  formatBytes,
  getSuggestedFilename,
  loadImageFromFile,
  validateImageFile,
} from '../../utils/imageUtils.ts';
import {
  Layers,
  Upload,
  Download,
  Archive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Sliders,
  FileImage,
} from 'lucide-react';

interface BatchItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  outputBlob?: Blob;
  outputSize?: number;
  outputName?: string;
}

export function BatchProcessorTab() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [batchAction, setBatchAction] = useState<'convert' | 'compress' | 'resize'>('convert');
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.8);
  const [maxDimension, setMaxDimension] = useState<number>(1280);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [completedCount, setCompletedCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    const validItems: BatchItem[] = [];
    for (const f of newFiles) {
      const v = validateImageFile(f);
      if (v.valid) {
        validItems.push({
          id: `${f.name}-${Date.now()}-${Math.random()}`,
          file: f,
          name: f.name,
          originalSize: f.size,
          status: 'pending',
        });
      }
    }

    setItems((prev) => [...prev, ...validItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
    setCompletedCount(0);
  };

  const processSingleItem = async (item: BatchItem): Promise<BatchItem> => {
    try {
      const { img } = await loadImageFromFile(item.file);

      let targetW = img.naturalWidth;
      let targetH = img.naturalHeight;

      if (batchAction === 'resize') {
        if (img.naturalWidth > maxDimension || img.naturalHeight > maxDimension) {
          if (img.naturalWidth > img.naturalHeight) {
            targetW = maxDimension;
            targetH = Math.round((img.naturalHeight / img.naturalWidth) * maxDimension);
          } else {
            targetH = maxDimension;
            targetW = Math.round((img.naturalWidth / img.naturalHeight) * maxDimension);
          }
        }
      }

      const formatToUse: SupportedFormat =
        batchAction === 'convert'
          ? targetFormat
          : item.file.type === 'image/png'
          ? 'image/png'
          : 'image/jpeg';

      const blob = await convertImageCanvas(img, {
        targetFormat: formatToUse,
        quality,
        backgroundColor: '#ffffff',
        width: targetW,
        height: targetH,
      });

      const ext =
        formatToUse === 'image/png'
          ? 'png'
          : formatToUse === 'image/webp'
          ? 'webp'
          : 'jpg';

      const suffix =
        batchAction === 'convert'
          ? ''
          : batchAction === 'compress'
          ? 'compressed'
          : 'resized';

      const outputName = getSuggestedFilename(item.name, suffix, ext);

      return {
        ...item,
        status: 'done',
        outputBlob: blob,
        outputSize: blob.size,
        outputName,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing failed';
      return {
        ...item,
        status: 'error',
        errorMessage: msg,
      };
    }
  };

  const handleRunBatch = async () => {
    if (items.length === 0 || isProcessingAll) return;
    setIsProcessingAll(true);
    setCompletedCount(0);

    const updated = [...items];
    let doneCounter = 0;

    for (let i = 0; i < updated.length; i++) {
      // Mark active
      updated[i] = { ...updated[i], status: 'processing' };
      setItems([...updated]);

      // Run process
      const resultItem = await processSingleItem(updated[i]);
      updated[i] = resultItem;
      if (resultItem.status === 'done') {
        doneCounter++;
        setCompletedCount(doneCounter);
      }
      setItems([...updated]);
    }

    setIsProcessingAll(false);
  };

  const handleDownloadAllZip = async () => {
    const finishedBlobs = items
      .filter((i) => i.status === 'done' && i.outputBlob && i.outputName)
      .map((i) => ({
        name: i.outputName!,
        blob: i.outputBlob!,
      }));

    if (finishedBlobs.length === 0) return;

    setIsZipping(true);
    try {
      const zipBlob = await createZipArchive(finishedBlobs);
      downloadBlob(zipBlob, `StudentHub-BatchImages-${Date.now()}.zip`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsZipping(false);
    }
  };

  const doneItems = items.filter((i) => i.status === 'done');

  return (
    <div id="batch-processor-tab" className="space-y-6">
      {/* Top Banner & Mode Selection */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Batch Image Operations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select multiple slide images, lecture photos, or screenshots to process in bulk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              onChange={handleAddFiles}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Images</span>
            </button>

            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Type Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            {
              id: 'convert' as const,
              label: 'Batch Convert',
              desc: 'Convert all files to JPG, PNG, or WebP',
            },
            {
              id: 'compress' as const,
              label: 'Batch Compress',
              desc: 'Reduce file size across all images',
            },
            {
              id: 'resize' as const,
              label: 'Batch Resize',
              desc: 'Constrain max width/height dimensions',
            },
          ].map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => setBatchAction(act.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                batchAction === act.id
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20 text-indigo-950 dark:text-indigo-200'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <p className="text-xs font-bold">{act.label}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{act.desc}</p>
            </button>
          ))}
        </div>

        {/* Configuration Row */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs">
          {batchAction === 'convert' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Target Format:</span>
              <div className="flex items-center gap-1.5">
                {(['image/jpeg', 'image/png', 'image/webp'] as SupportedFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setTargetFormat(fmt)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                      targetFormat === fmt
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {fmt.replace('image/', '').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {batchAction === 'compress' && (
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                Compression Quality: {Math.round(quality * 100)}%
              </span>
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          )}

          {batchAction === 'resize' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Max Dimension:</span>
              <select
                value={maxDimension}
                onChange={(e) => setMaxDimension(parseInt(e.target.value))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value={800}>800 px (Thumbnail/Compact)</option>
                <option value={1280}>1280 px (Standard HD)</option>
                <option value={1920}>1920 px (Full HD)</option>
                <option value={2560}>2560 px (2K Quad HD)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* File Queue List */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Queue ({items.length} {items.length === 1 ? 'file' : 'files'})
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={items.length === 0 || isProcessingAll}
              onClick={handleRunBatch}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {isProcessingAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing {completedCount}/{items.length}...</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span>Start Batch Processing</span>
                </>
              )}
            </button>

            {doneItems.length > 1 && (
              <button
                type="button"
                disabled={isZipping}
                onClick={handleDownloadAllZip}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
              >
                {isZipping ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating ZIP...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Download All (ZIP)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
          >
            <FileImage className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No images in batch queue
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Click &quot;Add Images&quot; above to select multiple files at once.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileImage className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-sm">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Original: {formatBytes(item.originalSize)}
                      {item.outputSize && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-2">
                          → Output: {formatBytes(item.outputSize)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'processing' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Processing...</span>
                    </span>
                  )}

                  {item.status === 'done' && (
                    <>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </span>
                      {item.outputBlob && item.outputName && (
                        <button
                          type="button"
                          onClick={() => downloadBlob(item.outputBlob!, item.outputName!)}
                          title="Download this processed image"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}

                  {item.status === 'error' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{item.errorMessage || 'Failed'}</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove from batch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
