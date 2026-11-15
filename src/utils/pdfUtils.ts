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
 * (`blob:...`) while passing through external `https://` URLs unchanged.
 * Automatically revokes created Blob URLs on change or unmount.
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

/**
 * Reliably downloads both `blob:`/`data:` URLs and cross-origin `https://` URLs
 * (such as Supabase Storage public URLs) with a clean filename.
 */
export async function downloadUrlAsFile(url: string, filename: string): Promise<void> {
  if (!url) return;

  const triggerDownload = (href: string) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (url.startsWith('blob:') || url.startsWith('data:')) {
    triggerDownload(url);
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      triggerDownload(objectUrl);
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    }
  } catch {
    // Fallback if cross-origin fetch is blocked: open in new tab without window.open popup blocking issues
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
