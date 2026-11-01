/**
 * Date utility functions for Smoof
 */

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date string in YYYY-MM-DD format
 */
export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate days between two dates
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate current streak from quit date
 * Returns number of complete smoke-free days
 */
export function calculateStreakFromQuitDate(quitDate: string): number {
  const today = getTodayString();
  const quit = new Date(quitDate);
  const now = new Date(today);
  
  // If quit date is in the future, streak is 0
  if (quit > now) return 0;
  
  // Calculate days since quit date
  const diffTime = now.getTime() - quit.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
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
  const date = new Date(dateString);
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
