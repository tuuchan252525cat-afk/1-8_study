import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist/types/src/display/api';
import { Loader2, AlertTriangle, Download, FileText } from 'lucide-react';
import { decodeDataUrlToBytes } from '../utils/pdfUtils';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfCanvasViewerProps {
  source: string;
  title: string;
  blobUrl?: string;
  zoomPercent?: number;
  fitContainer?: boolean;
  darkSurface?: boolean;
  className?: string;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  source,
  title,
  blobUrl,
  zoomPercent = 100,
  fitContainer = true,
  darkSurface = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMapRef = useRef<Map<number, HTMLCanvasElement>>(new Map());

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageNumbers, setPageNumbers] = useState<number[]>([]);
  const [status, setStatus] = useState<'loading' | 'rendering' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Measure available container width responsively (debounced threshold to avoid scroll jitter)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const measured = Math.max(240, Math.floor(el.clientWidth - 16));
      setContainerWidth((prev) => (Math.abs(measured - prev) > 8 ? measured : prev));
    };

    updateWidth();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateWidth);
      observer.observe(el);
    }
    window.addEventListener('resize', updateWidth);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Load PDF document from Uint8Array (Base64) or external/Blob URL
  useEffect(() => {
    if (!source) {
      setStatus('error');
      setErrorMessage('PDFデータが見つかりません。');
      return;
    }

    let cancelled = false;
    let activeDoc: PDFDocumentProxy | null = null;

    setStatus('loading');
    setErrorMessage(null);
    setPdfDoc(null);
    setPageNumbers([]);

    const bytes = source.startsWith('data:') ? decodeDataUrlToBytes(source) : null;
    if (source.startsWith('data:') && !bytes) {
      setStatus('error');
      setErrorMessage('PDFデータの読み込みに失敗しました。端末に保存してご確認ください。');
      return;
    }

    const loadingTask = bytes
      ? pdfjsLib.getDocument({ data: bytes.slice() })
      : pdfjsLib.getDocument({ url: source });

    loadingTask.promise
      .then((doc) => {
        if (cancelled) {
          doc.cleanup().catch(() => {});
          return;
        }
        activeDoc = doc;
        setPdfDoc(doc);
        setPageNumbers(Array.from({ length: doc.numPages }, (_, idx) => idx + 1));
        setStatus('rendering');
      })
      .catch((err: any) => {
        if (cancelled) return;
        console.error('[PDF.js] Failed to load PDF:', err);
        setStatus('error');
        setErrorMessage('PDFを表示できませんでした。「保存」ボタンから端末にダウンロードして開けます。');
      });

    return () => {
      cancelled = true;
      if (activeDoc) {
        activeDoc.cleanup().catch(() => {});
      }
      loadingTask.destroy().catch(() => {});
    };
  }, [source]);

  // Render all PDF pages to <canvas> with devicePixelRatio sharpness
  useEffect(() => {
    if (!pdfDoc || pageNumbers.length === 0 || containerWidth <= 0) return;

    let cancelled = false;
    const activeTasks: RenderTask[] = [];

    const renderAllPages = async () => {
      setStatus('rendering');
      try {
        const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        const dpr = Math.min(Math.max(rawDpr, 1), 3);

        for (const pageNum of pageNumbers) {
          if (cancelled) break;
          const page = await pdfDoc.getPage(pageNum);
          if (cancelled) break;

          const canvas = canvasMapRef.current.get(pageNum);
          if (!canvas) continue;

          const unscaledViewport = page.getViewport({ scale: 1 });
          const baseWidth = Math.max(240, containerWidth);
          const cssWidth = fitContainer
            ? baseWidth
            : Math.max(220, Math.round(baseWidth * (zoomPercent / 100)));
          const cssScale = cssWidth / Math.max(1, unscaledViewport.width);

          // Cap pixel count per canvas (~12MP) to prevent mobile Safari memory crashes
          const maxScaleByPixels = Math.sqrt(
            12_000_000 / Math.max(1, unscaledViewport.width * unscaledViewport.height)
          );
          const renderScale = Math.min(cssScale * dpr, maxScaleByPixels);
          const renderViewport = page.getViewport({ scale: renderScale });

          canvas.width = Math.max(1, Math.floor(renderViewport.width));
          canvas.height = Math.max(1, Math.floor(renderViewport.height));

          if (fitContainer) {
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
          } else {
            const cssHeight = Math.max(1, Math.round(unscaledViewport.height * cssScale));
            canvas.style.width = `${cssWidth}px`;
            canvas.style.height = `${cssHeight}px`;
          }

          const renderTask = page.render({
            canvas,
            viewport: renderViewport,
          });
          activeTasks.push(renderTask);
          await renderTask.promise;
        }

        if (!cancelled) {
          setStatus('ready');
        }
      } catch (err: any) {
        if (cancelled || err?.name === 'RenderingCancelledException') return;
        console.error('[PDF.js] Page render error:', err);
        setStatus('error');
        setErrorMessage('PDFページの描画中にエラーが発生しました。保存ボタンからお試しください。');
      }
    };

    renderAllPages();

    return () => {
      cancelled = true;
      activeTasks.forEach((task) => {
        try {
          task.cancel();
        } catch {
          // ignore cancelled task cleanup
        }
      });
    };
  }, [pdfDoc, pageNumbers, containerWidth, zoomPercent, fitContainer]);

  return (
    <div
      ref={containerRef}
      className={`w-full min-w-0 ${className}`}
    >
      {/* Loading / Rendering Banner */}
      {(status === 'loading' || status === 'rendering') && (
        <div
          className={`flex items-center justify-center gap-2.5 py-6 px-4 text-xs font-black ${
            darkSurface ? 'text-stone-200' : 'text-slate-700'
          }`}
        >
          <Loader2 className="w-4 h-4 animate-spin text-[#1c603a]" />
          <span>
            {status === 'loading'
              ? 'PDFを読み込み中...'
              : `PDFを描画中...（全${pageNumbers.length}ページ）`}
          </span>
        </div>
      )}

      {/* Error State with Direct Save Button */}
      {status === 'error' ? (
        <div
          className={`p-6 sm:p-8 text-center rounded-2xl border space-y-3 my-2 ${
            darkSurface
              ? 'bg-neutral-900 border-white/15 text-white'
              : 'bg-[#fdfbf7] border-stone-200 text-slate-800'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black">PDFをプレビュー表示できませんでした</h4>
            <p className={`text-xs ${darkSurface ? 'text-stone-400' : 'text-stone-500'}`}>
              {errorMessage || '通信環境をご確認のうえ、保存ボタンから端末で開いてください。'}
            </p>
          </div>
          {blobUrl && (
            <div className="pt-1 flex justify-center">
              <a
                href={blobUrl}
                download={`${title}.pdf`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1c603a] hover:bg-[#154a2c] text-white text-xs font-black shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>PDFを端末に保存</span>
              </a>
            </div>
          )}
        </div>
      ) : (
        /* Rendered PDF Pages Stack */
        <div
          className={`flex flex-col items-center gap-3 p-2 sm:p-3 ${
            fitContainer ? 'w-full' : 'w-fit min-w-full'
          }`}
        >
          {pageNumbers.map((pageNum) => (
            <div
              key={pageNum}
              className={`rounded-2xl overflow-hidden shadow-md border ${
                fitContainer ? 'w-full' : 'w-fit max-w-none'
              } ${
                darkSurface
                  ? 'border-white/15 bg-neutral-900'
                  : 'border-stone-200 bg-white'
              }`}
            >
              <div
                className={`px-3 py-1.5 text-[10px] font-black flex items-center justify-between border-b ${
                  darkSurface
                    ? 'bg-neutral-900 text-stone-400 border-white/10'
                    : 'bg-stone-50 text-stone-500 border-stone-100'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <FileText className="w-3 h-3 text-rose-500" />
                  <span>ページ {pageNum} / {pageNumbers.length}</span>
                </span>
              </div>
              <canvas
                ref={(el) => {
                  if (el) {
                    canvasMapRef.current.set(pageNum, el);
                  } else {
                    canvasMapRef.current.delete(pageNum);
                  }
                }}
                className="block bg-white touch-auto select-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
