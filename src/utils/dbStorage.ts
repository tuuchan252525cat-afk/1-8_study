// IndexedDB & localStorage hybrid storage helper with double-layer snapshot protection
// Ensures materials and user data survive app reloads, deployments, and browser updates.

const DB_NAME = 'IchihachiSiteDB_v2';
const STORE_NAME = 'appData';
const BACKUP_STORE_NAME = 'appDataBackup';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
        db.createObjectStore(BACKUP_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getPersistentItem<T>(key: string, defaultValue: T): Promise<T> {
  // 1. Try IndexedDB Primary Store
  try {
    const db = await openDB();
    const primaryResult = await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });

    if (primaryResult !== undefined && primaryResult !== null) {
      // If array and has items, return immediately
      if (Array.isArray(primaryResult) && primaryResult.length > 0) {
        return primaryResult;
      }
      // If object and non-empty, return
      if (!Array.isArray(primaryResult)) {
        return primaryResult;
      }
    }

    // 2. If primary store was empty array, check IndexedDB Backup Store
    const backupResult = await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(BACKUP_STORE_NAME, 'readonly');
      const store = tx.objectStore(BACKUP_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });

    if (backupResult !== undefined && backupResult !== null) {
      if (Array.isArray(backupResult) && backupResult.length > 0) {
        console.info(`[Storage] Restored ${key} from persistent backup snapshot (${backupResult.length} items)`);
        // Re-seed primary
        await setPersistentItem(key, backupResult);
        return backupResult;
      }
    }
  } catch (e) {
    console.warn(`IndexedDB read failed for ${key}, falling back to localStorage`, e);
  }

  // 3. Fallback to localStorage
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as T;
      if (parsed !== undefined && parsed !== null) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`localStorage read failed for ${key}`, e);
  }

  return defaultValue;
}

export async function setPersistentItem<T>(key: string, value: T): Promise<void> {
  const jsonStr = JSON.stringify(value);

  // Write to IndexedDB
  try {
    const db = await openDB();

    // Write to main store
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // If non-empty array or non-empty object, ALSO write to backup store
    const isNonEmpty =
      (Array.isArray(value) && value.length > 0) ||
      (!Array.isArray(value) && value && typeof value === 'object' && Object.keys(value).length > 0);

    if (isNonEmpty) {
      const txBackup = db.transaction(BACKUP_STORE_NAME, 'readwrite');
      const storeBackup = txBackup.objectStore(BACKUP_STORE_NAME);
      storeBackup.put(value, key);
    }
  } catch (e) {
    console.warn(`IndexedDB write failed for ${key}`, e);
  }

  // Also write to localStorage for quick synchronous reads when under quota
  try {
    localStorage.setItem(key, jsonStr);
  } catch (e) {
    console.warn(`localStorage quota exceeded for ${key}; value safely stored in IndexedDB`, e);
  }
}

// Compress uploaded base64 images before saving so they stay well under Firestore's 1MB document limit
export function compressImageBase64(
  dataUrl: string,
  maxWidth = 1100,
  maxHeight = 1500,
  initialQuality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    // If not an image (e.g. PDF or plain text), return as is
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, maxWidth / width, maxHeight / height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Draw white background so transparent PNGs/scans don't get black background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let quality = initialQuality;
      let compressed = canvas.toDataURL('image/jpeg', quality);

      // Firestore document hard limit is 1,048,576 bytes. Keep base64 safely under 650KB (~650,000 characters).
      if (compressed.length > 650000) {
        quality = 0.55;
        compressed = canvas.toDataURL('image/jpeg', quality);
      }
      if (compressed.length > 650000) {
        const halfCanvas = document.createElement('canvas');
        halfCanvas.width = Math.round(width * 0.75);
        halfCanvas.height = Math.round(height * 0.75);
        const hCtx = halfCanvas.getContext('2d');
        if (hCtx) {
          hCtx.fillStyle = '#ffffff';
          hCtx.fillRect(0, 0, halfCanvas.width, halfCanvas.height);
          hCtx.drawImage(canvas, 0, 0, halfCanvas.width, halfCanvas.height);
          compressed = halfCanvas.toDataURL('image/jpeg', 0.5);
        }
      }

      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
