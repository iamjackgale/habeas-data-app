import { TimeInterval } from '@/components/query-dropdowns/time-interval-dropdown';

/**
 * Get the start of a time interval period based on the interval type
 */
export function getIntervalStart(date: Date, interval: TimeInterval): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  
  switch (interval) {
    case 'daily':
      return d;
    case 'weekly':
      // Start of week (Monday)
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      const weekStart = new Date(d);
      weekStart.setDate(diff);
      return weekStart;
    case 'monthly':
      return new Date(d.getFullYear(), d.getMonth(), 1);
    case 'quarterly':
      const quarter = Math.floor(d.getMonth() / 3);
      return new Date(d.getFullYear(), quarter * 3, 1);
    case 'yearly':
      return new Date(d.getFullYear(), 0, 1);
    default:
      return d;
  }
}

/**
 * Format interval label based on interval type and date range
 */
export function formatIntervalLabel(start: Date, end: Date, interval: TimeInterval): string {
  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}/${date.getFullYear()}`;
  };

  switch (interval) {
    case 'daily':
      return formatDate(start);
    case 'weekly':
      return `${formatDate(start)} to ${formatDate(end)}`;
    case 'monthly':
      return `${start.toLocaleString('default', { month: 'short' })} ${start.getFullYear()}`;
    case 'quarterly':
      const quarter = Math.floor(start.getMonth() / 3) + 1;
      return `Q${quarter} ${start.getFullYear()}`;
    case 'yearly':
      return String(start.getFullYear());
    default:
      return formatDate(start);
  }
}

