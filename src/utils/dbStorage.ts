// IndexedDB & localStorage hybrid storage helper for persistent app data

const DB_NAME = 'IchihachiSiteDB';
const STORE_NAME = 'appData';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getPersistentItem<T>(key: string, defaultValue: T): Promise<T> {
  // Try IndexedDB first
  try {
    const db = await openDB();
    const result = await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
    if (result !== undefined && result !== null) {
      return result;
    }
  } catch (e) {
    console.warn(`IndexedDB read failed for ${key}, falling back to localStorage`, e);
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (e) {
    console.warn(`localStorage read failed for ${key}`, e);
  }

  return defaultValue;
}

export async function setPersistentItem<T>(key: string, value: T): Promise<void> {
  const jsonStr = JSON.stringify(value);

  // Always write to IndexedDB (no 5MB quota limit)
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn(`IndexedDB write failed for ${key}`, e);
  }

  // Also write to localStorage if it fits
  try {
    localStorage.setItem(key, jsonStr);
  } catch (e) {
    console.warn(`localStorage quota exceeded for ${key}; value safely stored in IndexedDB`, e);
  }
}

// Compress uploaded base64 images before saving to keep memory and storage light
export function compressImageBase64(
  dataUrl: string,
  maxWidth = 1200,
  maxHeight = 1600,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    // If not an image (e.g. PDF or plain text), return as is
    if (!dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
