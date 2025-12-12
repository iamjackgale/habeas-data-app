/**
 * Table Download Utility
 * Converts table data to CSV format and triggers download
 */

import { TableDataEntry } from '@/components/tables/table-base';
import { ComparisonTableDataEntry } from '@/components/tables/table-comparison';

/**
 * Convert table data to CSV format
 */
export function convertTableToCSV(
  data: TableDataEntry[],
  title: string,
  showTransactions: boolean = false
): string {
  // CSV header
  const headers = ['Name', 'Total Value (USD)'];
  if (showTransactions) {
    headers.push('Transactions');
  }

  // Sort data by value (descending)
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Calculate total
  const total = sortedData.reduce((sum, entry) => sum + entry.value, 0);
  const totalTransactions = sortedData.reduce((sum, entry) => sum + (entry.transactions || 0), 0);

  // Format currency value
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Build CSV rows
  const rows: string[] = [];
  
  // Add title as first row
  rows.push(`"${title}"`);
  rows.push(''); // Empty row for spacing
  
  // Add headers
  rows.push(headers.map(h => `"${h}"`).join(','));

  // Add data rows
  sortedData.forEach(entry => {
    const row = [
      `"${entry.name}"`,
      `"${formatCurrency(entry.value)}"`,
    ];
    if (showTransactions) {
      row.push(`"${entry.transactions?.toLocaleString() || '0'}"`);
    }
    rows.push(row.join(','));
  });

  // Add total row
  const totalRow = [
    '"Total"',
    `"${formatCurrency(total)}"`,
  ];
  if (showTransactions) {
    totalRow.push(`"${totalTransactions.toLocaleString()}"`);
  }
  rows.push(totalRow.join(','));

  return rows.join('\n');
}

/**
 * Convert comparison table data to CSV format
 */
export function convertComparisonTableToCSV(
  data: ComparisonTableDataEntry[],
  title: string,
  dates: string[]
): string {
  // CSV header
  const headers = ['Name', ...dates];

  // Calculate totals for each date
  const dateTotals = dates.map((_, dateIndex) => {
    return data.reduce((sum, entry) => sum + (entry.values[dateIndex] || 0), 0);
  });

  // Format currency value
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Build CSV rows
  const rows: string[] = [];
  
  // Add title as first row
  rows.push(`"${title}"`);
  rows.push(''); // Empty row for spacing
  
  // Add headers
  rows.push(headers.map(h => `"${h}"`).join(','));

  // Add data rows
  data.forEach(entry => {
    const row = [
      `"${entry.name}"`,
      ...entry.values.map(value => `"${formatCurrency(value)}"`),
    ];
    rows.push(row.join(','));
  });

  // Add total row
  const totalRow = [
    '"Total"',
    ...dateTotals.map(total => `"${formatCurrency(total)}"`),
  ];
  rows.push(totalRow.join(','));

  return rows.join('\n');
}

/**
 * Download table as CSV file
 */
export function downloadTableAsCSV(
  csvContent: string,
  filename: string = 'table.csv'
): void {
  // Create blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

