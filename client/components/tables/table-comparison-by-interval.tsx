'use client';

import { useGetTransactionsForDateRange } from '@/services/octav/loader';
import { Transaction } from '@/types/transaction';
import { LoadingSpinner } from '@/components/loading-spinner';
import { aggregateTransactionsByIntervalAndCategory } from '@/handlers/category-handler';
import { formatIntervalLabel } from '@/lib/time-interval-utils';
import { useCategories, getCategoryDisplayName } from '@/hooks/use-categories';
import { TimeInterval } from '@/components/query-dropdowns/time-interval-dropdown';

interface TableComparisonByIntervalProps {
  addresses: string[];
  startDate: string;
  endDate: string;
  timeInterval: TimeInterval;
  selectedCategories: Set<string>;
}

export default function TableComparisonByInterval({
  addresses,
  startDate,
  endDate,
  timeInterval,
  selectedCategories,
}: TableComparisonByIntervalProps) {
  // Load categories config for display names
  const categoriesConfig = useCategories();

  // Validate date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  if (daysDiff > 365) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">
          Maximum 365 days supported. Date range is {daysDiff} days.
        </p>
      </div>
    );
  }

  // Validate inputs
  if (addresses.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Addresses Selected</p>
        <p className="text-yellow-600">Please select at least one address</p>
      </div>
    );
  }

  if (selectedCategories.size === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Categories Selected</p>
        <p className="text-yellow-600">Please select at least one category</p>
      </div>
    );
  }
  
  // Fetch transactions for the date range
  const queryResult = useGetTransactionsForDateRange(
    addresses,
    startDate,
    endDate
  );
  const { dataByAddress = {} } = queryResult.data || { dataByAddress: {} as Record<string, Transaction[]> };
  const { isLoading, error } = queryResult;

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  // Combine transactions from all addresses
  const allTransactions: Transaction[] = [];
  addresses.forEach(address => {
    const transactions = dataByAddress[address] || [];
    allTransactions.push(...transactions);
  });

  if (allTransactions.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No transaction data available for the selected date range</p>
      </div>
    );
  }

  // Group transactions by interval and category (same logic as widget)
  const intervalCategoryData = aggregateTransactionsByIntervalAndCategory(
    allTransactions,
    startDate,
    endDate,
    timeInterval,
    selectedCategories,
    'valueFiat'
  );

  // Get all unique categories from the aggregated data (only categories with actual values)
  const allCategories = new Set<string>();
  Object.values(intervalCategoryData).forEach(categoryData => {
    Object.keys(categoryData).forEach(category => {
      // Only include categories that have non-zero values
      if (categoryData[category] !== 0) {
        allCategories.add(category);
      }
    });
  });

  if (allCategories.size === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No transactions found with the selected categories</p>
      </div>
    );
  }

  // Sort intervals chronologically
  const sortedIntervals = Object.keys(intervalCategoryData).sort();

  // Format interval labels for display
  const intervalLabels = sortedIntervals.map(intervalKey => {
    const intervalStart = new Date(intervalKey);
    const intervalEnd = new Date(intervalStart);
    
    // Calculate interval end based on interval type
    switch (timeInterval) {
      case 'daily':
        intervalEnd.setDate(intervalEnd.getDate() + 1);
        break;
      case 'weekly':
        intervalEnd.setDate(intervalEnd.getDate() + 6);
        break;
      case 'monthly':
        intervalEnd.setMonth(intervalEnd.getMonth() + 1);
        break;
      case 'quarterly':
        intervalEnd.setMonth(intervalEnd.getMonth() + 3);
        break;
      case 'yearly':
        intervalEnd.setFullYear(intervalEnd.getFullYear() + 1);
        break;
    }
    
    return formatIntervalLabel(intervalStart, intervalEnd, timeInterval);
  });

  // Convert to table data format: categories as rows, intervals as columns
  const categoryArray = Array.from(allCategories).sort();
  const tableData = categoryArray.map(category => {
    const displayName = getCategoryDisplayName(category, categoriesConfig);
    const values = sortedIntervals.map(intervalKey => {
      const categoryData = intervalCategoryData[intervalKey] || {};
      return categoryData[category] || 0;
    });
    return {
      category,
      displayName,
      values,
    };
  });

  // Calculate totals for each interval (column totals)
  const intervalTotals = sortedIntervals.map(intervalKey => {
    return categoryArray.reduce((sum, category) => {
      const categoryData = intervalCategoryData[intervalKey] || {};
      return sum + (categoryData[category] || 0);
    }, 0);
  });

  // Calculate grand total
  const grandTotal = intervalTotals.reduce((sum, total) => sum + total, 0);

  // Format currency value
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format date range for title
  const dateRange = `${startDate} to ${endDate}`;

  return (
    <div className="p-4 border border-border widget-bg rounded-md w-full">
      <h2 className="font-semibold widget-text mb-4 border-b border-border pb-2">
        Transactions Comparison by Category ({dateRange})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="p-3 text-left widget-text font-semibold">Category</th>
              {intervalLabels.map((label, index) => (
                <th key={index} className="p-3 text-right widget-text font-semibold whitespace-nowrap">
                  {label}
                </th>
              ))}
              <th className="p-3 text-right widget-text font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((entry) => {
              const rowTotal = entry.values.reduce((sum, val) => sum + val, 0);
              return (
                <tr
                  key={entry.category}
                  className="border-b border-border hover:bg-accent/50 transition-colors"
                >
                  <td className="p-3 widget-text">{entry.displayName}</td>
                  {entry.values.map((value, index) => (
                    <td key={index} className="p-3 text-right widget-text font-mono">
                      {formatCurrency(value)}
                    </td>
                  ))}
                  <td className="p-3 text-right widget-text font-mono font-semibold">
                    {formatCurrency(rowTotal)}
                  </td>
                </tr>
              );
            })}
            {/* Total row */}
            <tr className="border-t-2 border-border bg-accent/30 font-bold">
              <td className="p-3 widget-text font-semibold">Total</td>
              {intervalTotals.map((total, index) => (
                <td key={index} className="p-3 text-right widget-text font-mono font-semibold">
                  {formatCurrency(total)}
                </td>
              ))}
              <td className="p-3 text-right widget-text font-mono font-semibold">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

