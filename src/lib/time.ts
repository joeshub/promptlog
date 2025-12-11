/**
 * Format a date as relative time or short date.
 *
 * Rules:
 * - < 1 hour: "X minutes ago"
 * - < 24 hours: "X hours ago"
 * - < 7 days: "X days ago"
 * - Same year: "Dec 4"
 * - Different year: "Dec 4, 2024"
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  const sameYear = now.getFullYear() === then.getFullYear();
  const month = then.toLocaleString('en-US', { month: 'short' });
  const day = then.getDate();

  if (sameYear) {
    return `${month} ${day}`;
  } else {
    return `${month} ${day}, ${then.getFullYear()}`;
  }
}
