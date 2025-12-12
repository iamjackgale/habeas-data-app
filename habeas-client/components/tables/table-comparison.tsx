'use client';

import React from 'react';

export interface ComparisonTableDataEntry {
  name: string;
  values: number[];
  dates: string[];
}

export interface TableComparisonProps {
  title: string;
  data: ComparisonTableDataEntry[];
  dates: string[];
  className?: string;
}

/**
 * Comparison table component for displaying multi-date dictionary data
 * Shows values across multiple dates in columns
 */
export function TableComparison({
  title,
  data,
  dates,
  className = '',
}: TableComparisonProps) {
  // Format currency value
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate totals for each date
  const dateTotals = dates.map((_, dateIndex) => {
    return data.reduce((sum, entry) => sum + (entry.values[dateIndex] || 0), 0);
  });

  // Calculate grand total
  const grandTotal = dateTotals.reduce((sum, total) => sum + total, 0);

  return (
    <div className={`p-4 border border-border widget-bg rounded-md w-full ${className}`}>
      <h2 className="font-semibold widget-text mb-4 border-b border-border pb-2">
        {title}
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="p-3 text-left widget-text font-semibold"></th>
              {dates.map((date, index) => (
                <th key={index} className="p-3 text-right widget-text font-semibold whitespace-nowrap">
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((entry, index) => (
              <tr
                key={entry.name}
                className="border-b border-border hover:bg-accent/50 transition-colors"
              >
                <td className="p-3 widget-text">{entry.name}</td>
                {dates.map((_, dateIndex) => (
                  <td key={dateIndex} className="p-3 text-right widget-text font-mono">
                    {formatCurrency(entry.values[dateIndex] || 0)}
                  </td>
                ))}
              </tr>
            ))}
            {/* Total row */}
            <tr className="border-t-2 border-border bg-accent/30 font-bold">
              <td className="p-3 widget-text font-semibold">Total</td>
              {dates.map((_, dateIndex) => (
                <td key={dateIndex} className="p-3 text-right widget-text font-mono font-semibold">
                  {formatCurrency(dateTotals[dateIndex] || 0)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

