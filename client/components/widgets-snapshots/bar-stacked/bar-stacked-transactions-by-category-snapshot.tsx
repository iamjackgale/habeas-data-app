'use client';

import { useMemo } from 'react';
import { useGetTransactionsForDateRange } from '@/services/octav/loader';
import { Transaction } from '@/types/transaction';
import BarStackedBySignChartComponent from '@/components/charts/bar-stacked-by-sign';
import { BarStackedChartDataEntry } from '@/handlers/bar-chart-handler';
import { useWidgetColors } from '@/hooks/use-widget-colors';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useCategories, getCategoryDisplayName } from '@/hooks/use-categories';
import { TimeInterval } from '@/components/query-dropdowns/time-interval-dropdown';
import { formatIntervalLabel } from '@/lib/time-interval-utils';
import { aggregateTransactionsByIntervalAndCategory } from '@/handlers/category-handler';
import { useWidgetDefaults } from '@/hooks/use-widget-defaults';

export default function BarStackedTransactionsByCategorySnapshot() {
  const { defaults, isLoading: defaultsLoading } = useWidgetDefaults();
  const widgetColors = useWidgetColors();
  const categoriesConfig = useCategories();
  
  // Get defaults from config
  const targetAddress = useMemo(() => {
    if (defaults?.['bar-stacked-transactions-by-category']?.address) {
      return defaults['bar-stacked-transactions-by-category'].address;
    }
    return '0xc9c61194682a3a5f56bf9cd5b59ee63028ab6041';
  }, [defaults?.['bar-stacked-transactions-by-category']?.address]);
  
  const startDate = useMemo(() => {
    return defaults?.['bar-stacked-transactions-by-category']?.startDate || '2025-10-01';
  }, [defaults?.['bar-stacked-transactions-by-category']?.startDate]);
  
  const endDate = useMemo(() => {
    return defaults?.['bar-stacked-transactions-by-category']?.endDate || '2025-10-31';
  }, [defaults?.['bar-stacked-transactions-by-category']?.endDate]);

  const timeInterval = useMemo(() => {
    return (defaults?.['bar-stacked-transactions-by-category']?.timeInterval || 'weekly') as TimeInterval;
  }, [defaults?.['bar-stacked-transactions-by-category']?.timeInterval]);

  const selectedCategories = useMemo(() => {
    const categories = defaults?.['bar-stacked-transactions-by-category']?.categories || [];
    return new Set(categories);
  }, [defaults?.['bar-stacked-transactions-by-category']?.categories]);

  // Memoize the addresses array to prevent creating new queries
  const addressesArray = useMemo(() => {
    if (defaultsLoading) {
      return [];
    }
    return [targetAddress];
  }, [defaultsLoading, targetAddress]);

  // Validate date range (max 365 days)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // ALWAYS call the hook - hooks must be called in the same order every render
  const shouldFetch = !defaultsLoading && daysDiff <= 365 && addressesArray.length > 0 && selectedCategories.size > 0;
  const queryResult = useGetTransactionsForDateRange(
    shouldFetch ? addressesArray : [],
    startDate,
    endDate
  );
  const { dataByAddress = {} } = queryResult.data || { dataByAddress: {} as Record<string, Transaction[]> };
  const { isLoading, error } = queryResult;

  // Early returns after all hooks are called
  if (defaultsLoading) {
    return <LoadingSpinner />;
  }
  
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

  if (selectedCategories.size === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Categories Selected</p>
        <p className="text-yellow-600">Please configure categories in widget defaults</p>
      </div>
    );
  }

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
  addressesArray.forEach(address => {
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

  // Build chart data: each interval is a bar, categories are stacks
  const chartData: BarStackedChartDataEntry[] = sortedIntervals.map(intervalKey => {
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
    
    const label = formatIntervalLabel(intervalStart, intervalEnd, timeInterval);
    const categoryData = intervalCategoryData[intervalKey] || {};
    
    // Create entry with all selected categories
    const entry: BarStackedChartDataEntry = {
      name: label,
    };
    
    // Add each category that has data as a data key
    Array.from(allCategories).forEach(category => {
      const displayName = getCategoryDisplayName(category, categoriesConfig);
      entry[displayName] = categoryData[category] || 0;
    });
    
    return entry;
  });

  // Get data keys (category display names) for the chart
  const dataKeys = Array.from(allCategories).map((cat: string) => 
    getCategoryDisplayName(cat, categoriesConfig)
  );

  // Calculate total value for percentage calculations
  const totalValue = chartData.reduce((sum, entry) => {
    return sum + dataKeys.reduce((entrySum: number, key: string) => {
      return entrySum + (entry[key] as number || 0);
    }, 0);
  }, 0);

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Transactions Comparison by Category</p>
      <div className="w-full mx-auto">
        <BarStackedBySignChartComponent
          data={chartData}
          dataKeys={dataKeys}
          totalValue={totalValue}
          colors={widgetColors}
          height={500}
          maxWidth={800}
        />
      </div>
    </div>
  );
}

