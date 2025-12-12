/**
 * Table CSV Data Extractor
 * Extracts table data from DOM elements for CSV export
 */

import { TableDataEntry } from '@/components/tables/table-base';
import { ComparisonTableDataEntry } from '@/components/tables/table-comparison';

/**
 * Extract table data from a rendered table DOM element
 */
export function extractTableDataFromDOM(element: HTMLElement): TableDataEntry[] | null {
  try {
    const rows = element.querySelectorAll('tbody tr');
    const data: TableDataEntry[] = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const name = cells[0].textContent?.trim() || '';
        const valueText = cells[1].textContent?.trim() || '';
        
        // Skip total row
        if (name.toLowerCase() === 'total') {
          return;
        }

        // Extract numeric value from currency string (e.g., "$1,234.56" -> 1234.56)
        const numericValue = parseFloat(
          valueText.replace(/[$,]/g, '')
        ) || 0;

        data.push({
          name,
          value: numericValue,
        });
      }
    });

    return data.length > 0 ? data : null;
  } catch (error) {
    console.error('Error extracting table data from DOM:', error);
    return null;
  }
}

/**
 * Extract comparison table data from a rendered table DOM element
 */
export function extractComparisonTableDataFromDOM(element: HTMLElement): {
  data: ComparisonTableDataEntry[];
  dates: string[];
} | null {
  try {
    const thead = element.querySelector('thead');
    const tbody = element.querySelector('tbody');
    
    if (!thead || !tbody) {
      return null;
    }

    // Extract dates from header
    const headerCells = thead.querySelectorAll('th');
    const dates: string[] = [];
    headerCells.forEach((cell, index) => {
      if (index > 0) { // Skip first column (Name)
        const dateText = cell.textContent?.trim() || '';
        if (dateText) {
          dates.push(dateText);
        }
      }
    });

    // Extract data from rows
    const rows = tbody.querySelectorAll('tr');
    const data: ComparisonTableDataEntry[] = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= dates.length + 1) {
        const name = cells[0].textContent?.trim() || '';
        
        // Skip total row
        if (name.toLowerCase() === 'total') {
          return;
        }

        const values: number[] = [];
        for (let i = 1; i < cells.length; i++) {
          const valueText = cells[i].textContent?.trim() || '';
          const numericValue = parseFloat(
            valueText.replace(/[$,]/g, '')
          ) || 0;
          values.push(numericValue);
        }

        data.push({
          name,
          values,
          dates,
        });
      }
    });

    return data.length > 0 ? { data, dates } : null;
  } catch (error) {
    console.error('Error extracting comparison table data from DOM:', error);
    return null;
  }
}

