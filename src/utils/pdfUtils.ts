import { useEffect, useState } from 'react';

/**
 * Decodes a Base64 or URL-encoded `data:` URI into raw bytes (`Uint8Array`).
 * Returns `null` if the source is not a `data:` URI or cannot be decoded.
 */
export function decodeDataUrlToBytes(dataUrl: string): Uint8Array | null {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;

  try {
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex === -1) return null;

    const meta = dataUrl.slice(0, commaIndex).toLowerCase();
    const rawData = dataUrl.slice(commaIndex + 1);

    if (meta.includes(';base64')) {
      const cleanedBase64 = rawData.replace(/\s+/g, '');
      const binaryString = atob(cleanedBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    const decoded = decodeURIComponent(rawData);
    return new TextEncoder().encode(decoded);
  } catch (err) {
    console.error('[PDF] Failed to decode Data URL to Uint8Array:', err);
    return null;
  }
}

/**
 * React hook that converts a Base64 PDF Data URL into a memory-managed Blob URL
 * (`blob:...`) so mobile browsers (iOS Safari / Android Chrome) can save or open
 * PDFs without being blocked by `data:` URI security restrictions.
 * Automatically revokes the previous Blob URL on change or unmount.
 */
export function usePdfBlobUrl(source?: string | null): string | undefined {
  const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!source) {
      setBlobUrl(undefined);
      return;
    }

    if (!source.startsWith('data:')) {
      setBlobUrl(source);
      return;
    }

    const bytes = decodeDataUrlToBytes(source);
    if (!bytes) {
      setBlobUrl(undefined);
      return;
    }

    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);
    setBlobUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  return blobUrl;
}
