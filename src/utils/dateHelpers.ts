/**
 * Date utility functions for Smoof
 */

/**
 * All day keys in the app are LOCAL calendar dates (YYYY-MM-DD).
 * Never use toISOString() for day keys: it is UTC, so in Türkiye (UTC+3)
 * entries made between 00:00 and 03:00 would land on the previous day.
 */

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Get local date key (YYYY-MM-DD) for a Date
 */
export function getDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get today's local date key (YYYY-MM-DD)
 */
export function getTodayString(): string {
  return getDateString(new Date());
}

/**
 * Normalize a stored date (date key or full ISO timestamp) to a local date key
 */
export function toDateKey(value: string): string {
  if (DATE_KEY_RE.test(value)) return value;
  return getDateString(new Date(value));
}

/**
 * Parse a date key (or ISO timestamp) into a Date at local midnight
 */
export function parseDateKey(value: string): Date {
  const [y, m, d] = toDateKey(value).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Add days to a date key, returns a new date key
 */
export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return getDateString(date);
}

/**
 * Calculate days between two dates
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate current streak from quit date
 * Returns number of complete smoke-free days
 */
export function calculateStreakFromQuitDate(quitDate: string): number {
  const quit = parseDateKey(quitDate);
  const now = parseDateKey(getTodayString());
  
  // If quit date is in the future, streak is 0
  if (quit > now) return 0;
  
  // Calculate days since quit date (round: DST shifts make days 23/25h)
  const diffTime = now.getTime() - quit.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return days;
}

/**
 * Check if a date string is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayString();
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = parseDateKey(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get time since quit for display (e.g., "42 gün 5 saat")
 */
export function getTimeSinceQuit(quitDate: string): {
  days: number;
  hours: number;
  minutes: number;
} {
  const quit = new Date(quitDate);
  const now = new Date();
  
  const diffMs = now.getTime() - quit.getTime();
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
}
