'use client';

import { useGetTransactionsForDateRange } from '@/services/octav/loader';
import { Transaction } from '@/types/transaction';
import BarStackedBySignChartComponent from '@/components/charts/bar-stacked-by-sign';
import { BarStackedChartDataEntry } from '@/handlers/bar-chart-handler';
import { useWidgetColors } from '@/hooks/use-widget-colors';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useCategories, getCategoryDisplayName } from '@/hooks/use-categories';
import { TimeInterval } from '@/components/query-dropdowns/time-interval-dropdown';
import { aggregateTransactionsByIntervalAndCategory } from '@/handlers/category-handler';

interface BarStackedTransactionsByCategoryProps {
  addresses: string[];
  startDate: string;
  endDate: string;
  timeInterval: TimeInterval;
  selectedCategories: Set<string>;
}


export default function BarStackedTransactionsByCategory({
  addresses,
  startDate,
  endDate,
  timeInterval,
  selectedCategories,
}: BarStackedTransactionsByCategoryProps) {
  // Load colors from config
  const widgetColors = useWidgetColors();
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

  // Group transactions by interval and category
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

  // Format date as MM/DD/YYYY
  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}/${date.getFullYear()}`;
  };

  // Build chart data: each interval is a bar, categories are stacks
  const chartData: BarStackedChartDataEntry[] = sortedIntervals.map(intervalKey => {
    const intervalStart = new Date(intervalKey);
    
    // Use only the start date for the label
    const label = formatDate(intervalStart);
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
          xAxisLabel="Period Starting"
          yAxisLabel="Category Value ($USD)"
        />
      </div>
    </div>
  );
}

