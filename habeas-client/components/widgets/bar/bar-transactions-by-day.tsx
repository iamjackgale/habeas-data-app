'use client';

import { useGetTransactionsForDateRange } from '@/services/octav/loader';
import { Transaction } from '@/types/transaction';
import { processTransactionsByDate } from '@/handlers/bar-chart-handler';
import { BarChartDataEntry } from '@/handlers/bar-chart-handler';
import BarChartComponent from '@/components/charts/bar';
import { useWidgetColors } from '@/hooks/use-widget-colors';
import { LoadingSpinner } from '@/components/loading-spinner';

interface BarTransactionsByDayProps {
  address: string;
  startDate: string;
  endDate: string;
}

export default function BarTransactionsByDay({ address, startDate, endDate }: BarTransactionsByDayProps) {
  // Load colors from config
  const widgetColors = useWidgetColors();
  
  // Validate date range (max 30 days)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
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
  
  // Fetch transactions for the date range
  const queryResult = useGetTransactionsForDateRange(
    [address],
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

  // Extract transactions for the address
  const transactions: Transaction[] = dataByAddress?.[address] || [];

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
      <p className="font-semibold widget-text mb-4">Transactions per Day</p>
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

