export type NewBadgeSection = 'materials' | 'student_predictions' | 'forum';

export const NEW_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

const LAST_SEEN_STORAGE_KEYS: Record<NewBadgeSection, string> = {
  materials: 'ichihachi_last_seen_materials_v1',
  student_predictions: 'ichihachi_last_seen_student_predictions_v1',
  forum: 'ichihachi_last_seen_forum_v1',
};

export interface TimestampedItem {
  createdAt?: string;
  createdAtMs?: number;
}

export function getItemTimestampMs(item: TimestampedItem, now = Date.now()): number {
  if (typeof item.createdAtMs === 'number' && Number.isFinite(item.createdAtMs) && item.createdAtMs > 0) {
    return item.createdAtMs;
  }

  const raw = item.createdAt?.trim();
  if (!raw) return 0;

  // Date-only string YYYY-MM-DD (used by legacy materials & studentPredictions)
  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999).getTime();
    return Math.min(endOfDay, now);
  }

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isItemRecent(item: TimestampedItem, now = Date.now()): boolean {
  const ts = getItemTimestampMs(item, now);
  if (ts <= 0) return false;
  const age = now - ts;
  return age >= -60_000 && age <= NEW_WINDOW_MS;
}

export function getLastSeenAt(section: NewBadgeSection): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(LAST_SEEN_STORAGE_KEYS[section]);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function markSectionSeen(section: NewBadgeSection, timestampMs = Date.now()): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_SEEN_STORAGE_KEYS[section], String(timestampMs));
  } catch {
    // Ignore storage quota errors
  }
}

export function isItemUnseenNew(
  item: TimestampedItem,
  lastSeenAt: number,
  now = Date.now()
): boolean {
  const ts = getItemTimestampMs(item, now);
  if (ts <= 0) return false;
  const isRecent = now - ts <= NEW_WINDOW_MS;
  if (!isRecent) return false;
  return ts > lastSeenAt;
}

export function countUnseenNew(
  items: TimestampedItem[],
  section: NewBadgeSection,
  now = Date.now()
): number {
  const lastSeenAt = getLastSeenAt(section);
  return items.reduce((count, item) => (isItemUnseenNew(item, lastSeenAt, now) ? count + 1 : count), 0);
}
