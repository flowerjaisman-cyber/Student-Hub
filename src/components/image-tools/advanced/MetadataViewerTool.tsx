import { useState, useEffect } from 'react';
import { ImageMetadata, downloadBlob, formatBytes, getSuggestedFilename } from '../../../utils/imageUtils.ts';
import {
  extractImageMetadata,
  stripImageMetadata,
  ComprehensiveMetadata,
} from '../../../utils/metadataUtils.ts';
import {
  FileSearch,
  ShieldCheck,
  Download,
  Info,
  Calendar,
  Camera,
  Cpu,
  MapPin,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface MetadataViewerToolProps {
  file: File;
  img: HTMLImageElement;
  metadata: ImageMetadata;
}

export function MetadataViewerTool({ file, img, metadata }: MetadataViewerToolProps) {
  const [data, setData] = useState<ComprehensiveMetadata | null>(null);
  const [isStripping, setIsStripping] = useState<boolean>(false);
  const [strippedBlob, setStrippedBlob] = useState<Blob | null>(null);
  const [strippedFormat, setStrippedFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');

  useEffect(() => {
    extractImageMetadata(file, img).then((res) => {
      setData(res);
      setStrippedFormat(file.type === 'image/png' ? 'image/png' : 'image/jpeg');
    });
  }, [file, img]);

  const handleStripMetadata = async () => {
    setIsStripping(true);
    try {
      const cleanBlob = await stripImageMetadata(img, strippedFormat, 0.94);
      setStrippedBlob(cleanBlob);
    } catch (err) {
      console.error(err);
    } finally {
      setIsStripping(false);
    }
  };

  const handleDownloadClean = () => {
    if (!strippedBlob) return;
    const ext = strippedFormat === 'image/png' ? 'png' : 'jpg';
    const outputName = getSuggestedFilename(metadata.name, 'metadata-removed', ext);
    downloadBlob(strippedBlob, outputName);
  };

  return (
    <div id="metadata-viewer-tool" className="space-y-6">
      {/* Privacy Notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <p className="font-bold">
            Metadata &amp; Digital Privacy
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Digital camera photos frequently encode EXIF data, including camera serial numbers, lens info, software, timestamps, and GPS coordinates. Re-encoding via canvas discards all embedded header segments, producing a clean file safe for online student submissions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Real Metadata Readout */}
        <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-indigo-500" />
              File &amp; Image Inspection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified physical properties parsed from your uploaded image.
            </p>
          </div>

          {data ? (
            <div className="space-y-4">
              {/* File details list */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Filename:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {data.fileName}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">MIME Type:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{data.mimeType}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">File Size:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatBytes(data.fileSize)} ({data.fileSize.toLocaleString()} bytes)
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Dimensions:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {data.width} × {data.height} px
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Megapixels:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{data.megapixels}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Aspect Ratio:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{data.aspectRatio}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Color Model:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{data.colorDepth}</span>
                </div>
              </div>

              {/* EXIF Data Section */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Camera &amp; EXIF Markers
                </span>

                {data.exif.hasExif ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    {data.exif.make && (
                      <div className="flex items-center gap-2">
                        <Camera className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-slate-500">Camera:</span>
                        <span className="font-semibold">
                          {data.exif.make} {data.exif.model || ''}
                        </span>
                      </div>
                    )}
                    {data.exif.dateTime && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-slate-500">Date Taken:</span>
                        <span className="font-mono">{data.exif.dateTime}</span>
                      </div>
                    )}
                    {data.exif.software && (
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-slate-500">Software:</span>
                        <span>{data.exif.software}</span>
                      </div>
                    )}
                    {data.exif.hasGps && (
                      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>GPS Coordinates Found in File</span>
                      </div>
                    )}
                    {!data.exif.make && !data.exif.dateTime && !data.exif.software && (
                      <p className="text-slate-500">
                        EXIF segment present (standard header tags detected).
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    No EXIF or camera header tags detected in this image.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
            </div>
          )}
        </div>

        {/* Right Column: Metadata Removal Action */}
        <div className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Sanitize &amp; Remove Metadata
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate a clean, privacy-hardened copy of your image.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Target Clean Output Format
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStrippedFormat('image/jpeg')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-colors ${
                    strippedFormat === 'image/jpeg'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Clean JPEG
                </button>
                <button
                  type="button"
                  onClick={() => setStrippedFormat('image/png')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-colors ${
                    strippedFormat === 'image/png'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Clean PNG
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                The image pixels are decoded and rendered into a pure canvas buffer, stripping camera serials, GPS geotags, timestamp stamps, and software signatures.
              </p>
            </div>

            {strippedBlob && (
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Metadata Successfully Stripped</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Clean output size: <strong>{formatBytes(strippedBlob.size)}</strong>. Ready to download without hidden tracking markers.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {!strippedBlob ? (
              <button
                type="button"
                disabled={isStripping}
                onClick={handleStripMetadata}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
              >
                {isStripping ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sanitizing image...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Strip All Metadata Now</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadClean}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Sanitized Image ({formatBytes(strippedBlob.size)})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
