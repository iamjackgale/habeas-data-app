'use client';

import React from 'react';

export interface TableDataEntry {
  name: string;
  value: number;
  transactions?: number;
}

export interface TableBaseProps {
  title: string;
  data: TableDataEntry[];
  totalValue?: number;
  totalTransactions?: number;
  showTransactions?: boolean;
  className?: string;
}

/**
 * Base table component for displaying dictionary data
 * Matches the structure from the example but uses theme-aware styling
 */
export function TableBase({
  title,
  data,
  totalValue,
  totalTransactions,
  showTransactions = false,
  className = '',
}: TableBaseProps) {
  // Sort data by value (descending)
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Calculate total if not provided
  const calculatedTotal = totalValue ?? sortedData.reduce((sum, entry) => sum + entry.value, 0);
  const calculatedTotalTransactions = totalTransactions ?? sortedData.reduce((sum, entry) => sum + (entry.transactions || 0), 0);

  // Format currency value
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className={`p-4 border border-border widget-bg rounded-md w-full ${className}`}>
      <h2 className="font-semibold widget-text mb-4 border-b border-border pb-2">
        {title}
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="p-3 text-left widget-text font-semibold">Name</th>
              <th className="p-3 text-right widget-text font-semibold">Total Value (USD)</th>
              {showTransactions && (
                <th className="p-3 text-right widget-text font-semibold">Transactions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((entry, index) => (
              <tr
                key={entry.name}
                className={`border-b border-border hover:bg-accent/50 transition-colors ${
                  index === sortedData.length - 1 ? 'border-t-2 border-border' : ''
                }`}
              >
                <td className="p-3 widget-text">{entry.name}</td>
                <td className="p-3 text-right widget-text font-mono">
                  {formatCurrency(entry.value)}
                </td>
                {showTransactions && (
                  <td className="p-3 text-right widget-text font-mono">
                    {entry.transactions?.toLocaleString() || '0'}
                  </td>
                )}
              </tr>
            ))}
            {/* Total row */}
            <tr className="border-t-2 border-border bg-accent/30 font-bold">
              <td className="p-3 widget-text font-semibold">Total</td>
              <td className="p-3 text-right widget-text font-mono font-semibold">
                {formatCurrency(calculatedTotal)}
              </td>
              {showTransactions && (
                <td className="p-3 text-right widget-text font-mono font-semibold">
                  {calculatedTotalTransactions.toLocaleString()}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

