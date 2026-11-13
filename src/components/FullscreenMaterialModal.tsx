import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Plus,
  Minus,
  RotateCcw,
  Download,
  FileText,
  AlertTriangle,
  ZoomIn,
} from 'lucide-react';
import { StudyMaterial } from '../types';

interface FullscreenMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: StudyMaterial | null | undefined;
}

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200, 250, 300] as const;

export const FullscreenMaterialModal: React.FC<FullscreenMaterialModalProps> = ({
  isOpen,
  onClose,
  material,
}) => {
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [imgError, setImgError] = useState<boolean>(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [viewportSize, setViewportSize] = useState<{ w: number; h: number } | null>(null);
  const [blobPdfUrl, setBlobPdfUrl] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isPdf = Boolean(
    material &&
      (material.fileType === 'pdf' ||
        Boolean(material.pdfUrl) ||
        material.imageUrl?.startsWith('data:application/pdf') ||
        material.imageUrl?.toLowerCase().endsWith('.pdf'))
  );

  const rawPdfSource = material?.pdfUrl || material?.imageUrl || '';
  const imageSource = !isPdf ? material?.imageUrl || '' : '';

  // Reset zoom and image state when opening or changing material
  useEffect(() => {
    if (isOpen) {
      setZoomPercent(100);
      setImgError(false);
      setNaturalSize(null);
    }
  }, [isOpen, material?.id]);

  // Convert Base64 PDF data URLs to Blob URLs so browsers render them reliably without data-URI length/sandbox blocks
  useEffect(() => {
    if (!isOpen || !isPdf || !rawPdfSource) {
      setBlobPdfUrl(null);
      return;
    }

    if (!rawPdfSource.startsWith('data:application/pdf')) {
      setBlobPdfUrl(rawPdfSource);
      return;
    }

    let createdUrl: string | null = null;
    try {
      const commaIndex = rawPdfSource.indexOf(',');
      if (commaIndex !== -1) {
        const meta = rawPdfSource.slice(0, commaIndex);
        const dataPart = rawPdfSource.slice(commaIndex + 1);
        if (meta.includes(';base64')) {
          const binaryString = atob(dataPart);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          createdUrl = URL.createObjectURL(blob);
          setBlobPdfUrl(createdUrl);
        } else {
          setBlobPdfUrl(rawPdfSource);
        }
      } else {
        setBlobPdfUrl(rawPdfSource);
      }
    } catch (err) {
      console.error('PDF Blob URL conversion failed, falling back to raw source:', err);
      setBlobPdfUrl(rawPdfSource);
    }

    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, isPdf, rawPdfSource]);

  // Track scrollable viewport dimensions for responsive zoom calculation
  useEffect(() => {
    if (!isOpen) return;

    const updateSize = () => {
      const el = scrollContainerRef.current;
      if (!el) return;
      setViewportSize({
        w: Math.max(240, el.clientWidth - 24),
        h: Math.max(240, el.clientHeight - 24),
      });
    };

    updateSize();
    const el = scrollContainerRef.current;
    let observer: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateSize);
      observer.observe(el);
    }
    window.addEventListener('resize', updateSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [isOpen]);

  // Keyboard shortcuts: Escape to close, +/- to zoom, 0 to reset
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoomPercent((prev) => {
          const next = ZOOM_STEPS.find((z) => z > prev);
          return next ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
        });
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoomPercent((prev) => {
          const reversed = [...ZOOM_STEPS].reverse();
          const next = reversed.find((z) => z < prev);
          return next ?? ZOOM_STEPS[0];
        });
      } else if (e.key === '0') {
        e.preventDefault();
        setZoomPercent(100);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  const displayDimensions = useMemo(() => {
    if (!naturalSize || !viewportSize) return null;
    const fitScale = Math.min(
      viewportSize.w / naturalSize.w,
      viewportSize.h / naturalSize.h,
      3
    );
    const baseW = naturalSize.w * fitScale;
    const baseH = naturalSize.h * fitScale;
    return {
      width: Math.max(80, Math.round(baseW * (zoomPercent / 100))),
      height: Math.max(80, Math.round(baseH * (zoomPercent / 100))),
    };
  }, [naturalSize, viewportSize, zoomPercent]);

  const pdfDimensions = useMemo(() => {
    if (!viewportSize) return null;
    return {
      width: Math.max(280, Math.round(viewportSize.w * (zoomPercent / 100))),
      height: Math.max(360, Math.round(viewportSize.h * (zoomPercent / 100))),
    };
  }, [viewportSize, zoomPercent]);

  if (!isOpen || !material) return null;

  const canZoomOut = zoomPercent > ZOOM_STEPS[0];
  const canZoomIn = zoomPercent < ZOOM_STEPS[ZOOM_STEPS.length - 1];

  const handleZoomOut = () => {
    const reversed = [...ZOOM_STEPS].reverse();
    const prev = reversed.find((z) => z < zoomPercent);
    if (prev !== undefined) setZoomPercent(prev);
  };

  const handleZoomIn = () => {
    const next = ZOOM_STEPS.find((z) => z > zoomPercent);
    if (next !== undefined) setZoomPercent(next);
  };

  const handleResetZoom = () => {
    setZoomPercent(100);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const handleImageDoubleClick = () => {
    setZoomPercent((prev) => (prev === 100 ? 200 : 100));
  };

  const downloadHref = isPdf ? (blobPdfUrl || rawPdfSource) : imageSource;
  const downloadFilename = isPdf ? `${material.title}.pdf` : material.title;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col pinch-zoom-surface animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`${material.title} 全画面プレビュー`}
    >
      {/* Fixed Top Control Bar */}
      <div className="shrink-0 bg-neutral-950/95 backdrop-blur-md border-b border-white/15 px-3 sm:px-5 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        {/* Title & Close on Mobile Row */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-black text-white truncate">
              {material.title}
            </h3>
            <div className="text-[11px] font-semibold text-stone-400 flex items-center gap-1.5">
              <span>{material.fileType.toUpperCase()}</span>
              <span aria-hidden="true">·</span>
              <span>{material.fileSize}</span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="hidden sm:inline text-emerald-400">
                指2本（ピンチアウト）やボタンで拡大できます
              </span>
            </div>
          </div>

          {/* Mobile Close Button (also shown inline at far right on desktop) */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-stone-200 text-slate-950 text-xs font-black flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-md"
            aria-label="全画面プレビューを閉じる"
          >
            <X className="w-4 h-4" />
            <span>閉じる</span>
          </button>
        </div>

        {/* Zoom Controls & Desktop Close */}
        <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={!canZoomOut}
              className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-35 text-white text-xs font-black flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed transition-colors"
              aria-label="縮小"
            >
              <Minus className="w-4 h-4" />
              <span>縮小</span>
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black flex items-center gap-1.5 whitespace-nowrap shrink-0 tabular-nums cursor-pointer transition-colors"
              aria-label="100%に戻す"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>{zoomPercent === 100 ? '100%' : `100%に戻す (${zoomPercent}%)`}</span>
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={!canZoomIn}
              className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-[#1c603a] hover:bg-[#237748] disabled:opacity-35 text-white text-xs font-black flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed transition-colors shadow-xs"
              aria-label="拡大"
            >
              <Plus className="w-4 h-4" />
              <span>拡大</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {downloadHref && (
              <a
                href={downloadHref}
                download={downloadFilename}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                title="ファイルを保存"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">保存</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="hidden md:flex min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-stone-200 text-slate-950 text-xs font-black items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-md transition-colors"
              aria-label="全画面プレビューを閉じる"
            >
              <X className="w-4 h-4" />
              <span>閉じる</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable + Pinch-Zoomable Media Viewport */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-auto overscroll-contain pinch-zoom-surface flex p-2 sm:p-4"
      >
        {isPdf && (blobPdfUrl || rawPdfSource) ? (
          <div className="m-auto flex flex-col items-center justify-center gap-3 w-fit h-fit">
            <iframe
              src={blobPdfUrl || rawPdfSource}
              title={material.title}
              width={pdfDimensions?.width}
              height={pdfDimensions?.height}
              className={`border-0 rounded-xl bg-white shadow-2xl touch-auto max-w-none shrink-0 ${
                pdfDimensions ? '' : 'w-[94vw] h-[78dvh]'
              }`}
            />
            <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-stone-400 pb-2">
              <span>表示されない端末では右上の「保存」からPDFを開けます</span>
            </div>
          </div>
        ) : imgError ? (
          <div className="m-auto max-w-md w-full bg-neutral-900 border border-white/15 rounded-3xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-white">
              画像を拡大表示できませんでした
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              ファイル形式がブラウザ非対応（HEIC等）またはデータ破損の可能性があります。ファイルを端末に保存してご確認ください。
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              {downloadHref && (
                <a
                  href={downloadHref}
                  download={downloadFilename}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1c603a] hover:bg-[#237748] text-white text-xs font-black flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>ファイルを保存</span>
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-black cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        ) : imageSource ? (
          <div className="m-auto flex items-center justify-center w-fit h-fit">
            <img
              src={imageSource}
              alt={material.title}
              referrerPolicy="no-referrer"
              width={displayDimensions?.width}
              height={displayDimensions?.height}
              onDoubleClick={handleImageDoubleClick}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                }
              }}
              onError={() => setImgError(true)}
              className={`rounded-lg shadow-2xl bg-white touch-auto select-none shrink-0 ${
                displayDimensions
                  ? 'max-w-none h-auto'
                  : 'max-w-full max-h-[calc(100dvh-9rem)] w-auto h-auto object-contain'
              }`}
            />
          </div>
        ) : (
          <div className="m-auto max-w-xl w-full bg-neutral-900 border border-white/15 rounded-3xl p-6 sm:p-8 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">{material.title}</h4>
                <p className="text-xs text-stone-400">{material.description}</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-stone-200 whitespace-pre-wrap leading-relaxed">
              {material.documentSections?.[0]?.content || material.contentPreview}
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>画像・PDFが添付されていないテキスト教材です</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-black cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
