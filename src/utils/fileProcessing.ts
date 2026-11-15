export const MAX_UPLOAD_FILE_BYTES = 5 * 1024 * 1024; // 5MB
export const FIRESTORE_CHUNK_SIZE = 700_000; // 700,000 chars (~700KB, safely under Firestore 1MB limit)
export const MAX_IMAGE_LONG_EDGE_PX = 1600;
export const JPEG_COMPRESSION_QUALITY = 0.75;

export function formatFileSizeLabel(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Splits a large string (such as a Base64 Data URL) into fixed-size chunks
 * of `chunkSize` characters so each chunk fits safely inside a 1MB Firestore doc.
 */
export function splitStringIntoChunks(
  content: string,
  chunkSize: number = FIRESTORE_CHUNK_SIZE
): string[] {
  if (!content) return [];
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Estimates decoded byte length of a Base64 Data URL.
 */
export function estimateDataUrlBytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl.length;
  const base64Part = dataUrl.slice(commaIdx + 1);
  return Math.round((base64Part.length * 3) / 4);
}

/**
 * Compresses an image file via `<canvas>` to a JPEG Data URL
 * (longest side max 1600px, quality 0.75).
 */
export async function compressImageFileToBase64(
  file: File,
  maxLongEdge: number = MAX_IMAGE_LONG_EDGE_PX,
  quality: number = JPEG_COMPRESSION_QUALITY
): Promise<{ dataUrl: string; approxBytes: number; sizeLabel: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error('画像の読み込みに失敗しました。別の画像ファイルでお試しください。'));
      el.src = objectUrl;
    });

    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    if (!srcW || !srcH) {
      throw new Error('画像のサイズを取得できませんでした。');
    }

    const longestSide = Math.max(srcW, srcH);
    const scale = longestSide > maxLongEdge ? maxLongEdge / longestSide : 1;
    const targetW = Math.max(1, Math.round(srcW * scale));
    const targetH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('画像圧縮用のCanvasコンテキストを初期化できませんでした。');
    }

    // Fill white background so transparent PNGs convert cleanly to JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const approxBytes = estimateDataUrlBytes(dataUrl);
    return {
      dataUrl,
      approxBytes,
      sizeLabel: formatFileSizeLabel(approxBytes),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Reads a File (such as a PDF) directly into a Base64 Data URL without compression.
 */
export function readFileAsBase64DataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('ファイルの読み込みに失敗しました。'));
      }
    };
    reader.onerror = () => reject(new Error('ファイルの読み込み中にエラーが発生しました。'));
    reader.readAsDataURL(file);
  });
}

export interface PreparedFirestoreFile {
  dataUrl: string;
  fileType: 'pdf' | 'image';
  mimeType: string;
  fileSizeLabel: string;
  isChunked: boolean;
  totalChunks: number;
}

/**
 * Prepares an image or PDF file (<= 5MB) for Firestore storage:
 * - Images: compressed via <canvas> (longest edge max 1600px, JPEG quality 0.75)
 * - PDFs: converted directly to Base64 Data URL
 * - Calculates whether 700,000-char chunk splitting is needed.
 */
export async function prepareFileForFirestore(
  file: File
): Promise<PreparedFirestoreFile> {
  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    throw new Error('ファイルサイズが大きすぎます（最大5MBまで）');
  }

  const pdf = isPdfFile(file);
  if (pdf) {
    const dataUrl = await readFileAsBase64DataUrl(file);
    const chunksNeeded = dataUrl.length > FIRESTORE_CHUNK_SIZE;
    const totalChunks = chunksNeeded
      ? Math.ceil(dataUrl.length / FIRESTORE_CHUNK_SIZE)
      : 0;
    return {
      dataUrl,
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSizeLabel: formatFileSizeLabel(file.size),
      isChunked: chunksNeeded,
      totalChunks,
    };
  }

  const compressed = await compressImageFileToBase64(
    file,
    MAX_IMAGE_LONG_EDGE_PX,
    JPEG_COMPRESSION_QUALITY
  );
  const chunksNeeded = compressed.dataUrl.length > FIRESTORE_CHUNK_SIZE;
  const totalChunks = chunksNeeded
    ? Math.ceil(compressed.dataUrl.length / FIRESTORE_CHUNK_SIZE)
    : 0;

  return {
    dataUrl: compressed.dataUrl,
    fileType: 'image',
    mimeType: 'image/jpeg',
    fileSizeLabel: compressed.sizeLabel,
    isChunked: chunksNeeded,
    totalChunks,
  };
}
