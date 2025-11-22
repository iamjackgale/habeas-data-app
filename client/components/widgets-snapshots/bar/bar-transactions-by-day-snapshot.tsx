'use client';

import { useMemo } from 'react';
import { useGetTransactionsForDateRange } from '@/services/octav/loader';
import { Transaction } from '@/types/transaction';
import { processTransactionsByDate } from '@/handlers/bar-chart-handler';
import { BarChartDataEntry } from '@/handlers/bar-chart-handler';
import BarChartComponent from '@/components/charts/bar';
import { useWidgetDefaults } from '@/hooks/use-widget-defaults';
import { useWidgetColors } from '@/hooks/use-widget-colors';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function BarTransactionsByDaySnapshot() {
  const { defaults, isLoading: defaultsLoading } = useWidgetDefaults();
  const widgetColors = useWidgetColors();
  
  // Wait for defaults to load before determining the address to prevent multiple queries
  // Use a stable address that doesn't change once defaults are loaded
  const targetAddress = useMemo(() => {
    // Once defaults have loaded, use the config value or fallback
    // This ensures the address is stable and won't change
    if (defaults?.['bar-transactions-by-day']?.address) {
      return defaults['bar-transactions-by-day'].address;
    }
    // Use fallback only if defaults have loaded (to avoid address change)
    return '0xc9c61194682a3a5f56bf9cd5b59ee63028ab6041';
  }, [defaults?.['bar-transactions-by-day']?.address]);
  
  const startDate = useMemo(() => {
    return defaults?.['bar-transactions-by-day']?.startDate || '2025-10-01';
  }, [defaults?.['bar-transactions-by-day']?.startDate]);
  
  const endDate = useMemo(() => {
    return defaults?.['bar-transactions-by-day']?.endDate || '2025-10-30';
  }, [defaults?.['bar-transactions-by-day']?.endDate]);

  // Memoize the addresses array to prevent creating new queries
  // Use empty array while loading to prevent queries, but always call the hook
  const addressesArray = useMemo(() => {
    // Return empty array while loading to prevent queries
    if (defaultsLoading) {
      return [];
    }
    return [targetAddress];
  }, [defaultsLoading, targetAddress]);

  // Validate date range (max 30 days) - do this before hook call
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // ALWAYS call the hook - hooks must be called in the same order every render
  // Pass empty array if loading or invalid to prevent actual API calls
  const shouldFetch = !defaultsLoading && daysDiff <= 30 && addressesArray.length > 0;
  const { data, dataByAddress, isLoading, error } = useGetTransactionsForDateRange(
    shouldFetch ? addressesArray : [],
    startDate,
    endDate,
    {}
  );

  // Now we can do early returns after all hooks are called
  if (defaultsLoading) {
    return <LoadingSpinner />;
  }
  
  if (daysDiff > 30) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">
          Maximum 30 days supported. Date range is {daysDiff} days.
        </p>
      </div>
    );
  }

  // Debug logging
  console.log('BarTransactionsByDaySnapshot render:', {
    targetAddress,
    addressesArray,
    defaultsLoading,
    isLoading,
    dataByAddressKeys: dataByAddress ? Object.keys(dataByAddress) : null,
  });

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }


  console.log('data');
  console.log(data);
  console.log('dataByAddress');
  console.log(dataByAddress);
  console.log('targetAddress');
  console.log(targetAddress);

  // Extract transactions for the address
  const transactions: Transaction[] = dataByAddress?.[targetAddress] || [];

  console.log('transactions');
  console.log(transactions);

  if (transactions.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No transaction data available for the selected date range</p>
      </div>
    );
  }

  // Process transactions into date:count dictionary
  const transactionsByDate = processTransactionsByDate(transactions, startDate, endDate);

  console.log('transactionsByDate');
  console.log(transactionsByDate);

  // Transform into bar chart data format, sorted by date
  const barChartData: BarChartDataEntry[] = Object.entries(transactionsByDate)
    .sort((a, b) => a[0].localeCompare(b[0])) // Sort by date ascending
    .map(([date, count]) => ({
      name: date,
      value: count,
    }));

  // Calculate total transactions
  const totalValue = barChartData.reduce((sum, entry) => sum + entry.value, 0);

  // Use a single color for all bars (first color from widget colors)
  const singleColor = widgetColors.length > 0 ? widgetColors[0] : '#0088FE';

  // Custom formatters for transaction counts (not dollar amounts)
  const formatYAxis = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatTooltip = (value: number, name: string): [string, string] => {
    return [`${value.toLocaleString('en-US')} transactions`, 'Count'];
  };

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Transactions by Day</p>
      <div className="w-full mx-auto">
        <BarChartComponent
          data={barChartData}
          totalValue={totalValue}
          colors={[singleColor]} // Single color for all bars
          height={500}
          maxWidth={600}
          formatYAxis={formatYAxis}
          formatTooltip={formatTooltip}
        />
      </div>
    </div>
  );
}

