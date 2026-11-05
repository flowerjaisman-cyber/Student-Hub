import { useState } from 'react';
import {
  ImageMetadata,
  loadImageFromFile,
} from '../../utils/imageUtils.ts';
import { MyFilesPickerModal } from '../files/MyFilesPickerModal.tsx';
import { ImageDropzone } from './ImageDropzone.tsx';
import { ImageMetaBar } from './ImageMetaBar.tsx';
import { FormatConverterTab } from './FormatConverterTab.tsx';
import { ImageResizerTab } from './ImageResizerTab.tsx';
import { ImageCompressorTab } from './ImageCompressorTab.tsx';
import { TargetSizeTab } from './TargetSizeTab.tsx';
import { ImageCropTab } from './ImageCropTab.tsx';
import { RotateFlipTab } from './RotateFlipTab.tsx';
import { BatchProcessorTab } from './BatchProcessorTab.tsx';

// Phase 3 Advanced Tools
import { BackgroundRemoverTool } from './advanced/BackgroundRemoverTool.tsx';
import { PassportPhotoTool } from './advanced/PassportPhotoTool.tsx';
import { DimensionsDpiTool } from './advanced/DimensionsDpiTool.tsx';
import { MetadataViewerTool } from './advanced/MetadataViewerTool.tsx';
import { ImageToPdfTool } from './advanced/ImageToPdfTool.tsx';
import { WatermarkTool } from './advanced/WatermarkTool.tsx';
import { AdjustmentsTool } from './advanced/AdjustmentsTool.tsx';

import {
  RefreshCw,
  Maximize2,
  Minimize2,
  Target,
  Crop,
  RotateCw,
  Layers,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  IdCard,
  Ruler,
  FileSearch,
  FileText,
  Stamp,
  SlidersHorizontal,
  Wand2,
} from 'lucide-react';

export type StandardToolTab =
  | 'convert'
  | 'resize'
  | 'compress'
  | 'target-size'
  | 'crop'
  | 'rotate'
  | 'batch';

export type AdvancedToolTab =
  | 'bg-remover'
  | 'passport'
  | 'dpi'
  | 'metadata'
  | 'image-pdf'
  | 'watermark'
  | 'adjustments';

export type ToolMode = 'standard' | 'advanced';

export function ImageToolsView() {
  const [toolMode, setToolMode] = useState<ToolMode>('advanced'); // Default to highlighting Phase 3 Advanced Tools!
  const [standardTab, setStandardTab] = useState<StandardToolTab>('convert');
  const [advancedTab, setAdvancedTab] = useState<AdvancedToolTab>('bg-remover');

  const [currentImage, setCurrentImage] = useState<{
    file: File;
    img: HTMLImageElement;
    metadata: ImageMetadata;
  } | null>(null);

  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCloudPicker, setShowCloudPicker] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setIsLoadingFile(true);
    setLoadError(null);

    try {
      const loaded = await loadImageFromFile(files[0]);
      setCurrentImage({
        file: files[0],
        img: loaded.img,
        metadata: loaded.metadata,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to decode image file.';
      setLoadError(msg);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleClearImage = () => {
    if (currentImage?.metadata.objectUrl) {
      URL.revokeObjectURL(currentImage.metadata.objectUrl);
    }
    setCurrentImage(null);
    setLoadError(null);
  };

  const standardTabs = [
    { id: 'convert' as StandardToolTab, label: 'Convert Format', icon: RefreshCw },
    { id: 'resize' as StandardToolTab, label: 'Resize', icon: Maximize2 },
    { id: 'compress' as StandardToolTab, label: 'Compress', icon: Minimize2 },
    { id: 'target-size' as StandardToolTab, label: 'Target Size', icon: Target },
    { id: 'crop' as StandardToolTab, label: 'Crop', icon: Crop },
    { id: 'rotate' as StandardToolTab, label: 'Rotate & Flip', icon: RotateCw },
    { id: 'batch' as StandardToolTab, label: 'Batch Processing', icon: Layers },
  ];

  const advancedTabs = [
    { id: 'bg-remover' as AdvancedToolTab, label: 'Background Remover', icon: Sparkles },
    { id: 'passport' as AdvancedToolTab, label: 'Passport Photo Maker', icon: IdCard },
    { id: 'dpi' as AdvancedToolTab, label: 'Dimensions & DPI', icon: Ruler },
    { id: 'metadata' as AdvancedToolTab, label: 'Image Metadata', icon: FileSearch },
    { id: 'image-pdf' as AdvancedToolTab, label: 'Image to PDF', icon: FileText },
    { id: 'watermark' as AdvancedToolTab, label: 'Watermark', icon: Stamp },
    { id: 'adjustments' as AdvancedToolTab, label: 'Image Adjustments', icon: SlidersHorizontal },
  ];

  const isAdvanced = toolMode === 'advanced';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isAdvanced ? 'Advanced Image Tools' : 'Image Tools'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3" />
              100% Client-Side Privacy
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isAdvanced
              ? 'Prepare images for assignments, forms, applications, printing and online submissions.'
              : 'Convert, resize, compress, and edit images for coursework and submissions.'}
          </p>
        </div>

        {/* Section Toggle Pill */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              id="switch-to-advanced-btn"
              onClick={() => setToolMode('advanced')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isAdvanced
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Advanced Tools</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold">
                Phase 3
              </span>
            </button>

            <button
              type="button"
              id="switch-to-standard-btn"
              onClick={() => setToolMode('standard')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isAdvanced
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Standard Utilities</span>
            </button>
          </div>

          {currentImage && (
            <button
              type="button"
              onClick={handleClearImage}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900 transition-colors cursor-pointer"
            >
              Change Image
            </button>
          )}
        </div>
      </div>

      {/* Tool Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {isAdvanced
          ? advancedTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = advancedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  type="button"
                  onClick={() => setAdvancedTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })
          : standardTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = standardTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  type="button"
                  onClick={() => setStandardTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
      </div>

      {/* Body Area */}
      {!isAdvanced && standardTab === 'batch' ? (
        <BatchProcessorTab />
      ) : (
        <div className="space-y-6">
          {loadError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {loadError}
            </div>
          )}

          {!currentImage ? (
            <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
              <div className="max-w-xl mx-auto text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Select an image to use with{' '}
                  {isAdvanced
                    ? advancedTabs.find((t) => t.id === advancedTab)?.label
                    : standardTabs.find((t) => t.id === standardTab)?.label}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Your files remain private on your device. Operations run locally inside your browser memory without uploading to any external servers.
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                {isLoadingFile ? (
                  <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Decoding image...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <ImageDropzone onFilesSelected={handleFilesSelected} />
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setShowCloudPicker(true)}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
                      >
                        <ImageIcon className="w-4 h-4 text-indigo-500" />
                        <span>Choose from My Files</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cloud File Picker Modal */}
              <MyFilesPickerModal
                isOpen={showCloudPicker}
                onClose={() => setShowCloudPicker(false)}
                allowedCategories={['images']}
                title="Select an Image from My Files"
                onSelectFile={(userFile, blob) => {
                  const file = new File([blob], userFile.name, {
                    type: userFile.mimeType || 'image/jpeg',
                  });
                  handleFilesSelected([file]);
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Image Metadata Bar */}
              <ImageMetaBar
                metadata={currentImage.metadata}
                onClear={handleClearImage}
              />

              {/* Advanced Tools View Components */}
              {isAdvanced && advancedTab === 'bg-remover' && (
                <BackgroundRemoverTool
                  img={currentImage.img}
                  metadata={currentImage.metadata}
                />
              )}

              {isAdvanced && advancedTab === 'passport' && (
                <PassportPhotoTool
                  img={currentImage.img}
                  metadata={currentImage.metadata}
                />
              )}

              {isAdvanced && advancedTab === 'dpi' && (
                <DimensionsDpiTool
                  img={currentImage.img}
                  metadata={currentImage.metadata}
                />
              )}

              {isAdvanced && advancedTab === 'metadata' && (
                <MetadataViewerTool
                  file={currentImage.file}
                  img={currentImage.img}
                  metadata={currentImage.metadata}
                />
              )}

              {isAdvanced && advancedTab === 'image-pdf' && (
                <ImageToPdfTool
                  initialFile={currentImage.file}
                  initialImg={currentImage.img}
                  initialMetadata={currentImage.metadata}
                />
              )}

              {isAdvanced && advancedTab === 'watermark' && (
                <WatermarkTool
                  img={currentImage.img}
                  metadata={currentImage.metadata}
                />
              )}

              {isAdvanced && advancedTab === 'adjustments' && (
                <AdjustmentsTool
                  img={currentImage.img}
                  metadata={currentImage.metadata}
                />
              )}

              {/* Standard Tools View Components */}
              {!isAdvanced && standardTab === 'convert' && (
                <FormatConverterTab
                  img={currentImage.img}
                  metadata={currentImage.metadata}
                />
              )}

              {!isAdvanced && standardTab === 'resize' && (
                <ImageResizerTab
                  img={currentImage.img}
                  metadata={currentImage.metadata}
                />
              )}

              {!isAdvanced && standardTab === 'compress' && (
                <ImageCompressorTab
                  img={currentImage.img}
                  metadata={currentImage.metadata}
                />
              )}

              {!isAdvanced && standardTab === 'target-size' && (
                <TargetSizeTab
                  img={currentImage.img}
                  metadata={currentImage.metadata}
                />
              )}

              {!isAdvanced && standardTab === 'crop' && (
                <ImageCropTab
                  img={currentImage.img}
                  metadata={currentImage.metadata}
                />
              )}

              {!isAdvanced && standardTab === 'rotate' && (
                <RotateFlipTab
                  img={currentImage.img}
                  metadata={currentImage.metadata}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
