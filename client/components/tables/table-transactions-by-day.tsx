'use client';

import { useGetTransactionsForDateRange } from '@/services/octav/loader';
import { Transaction } from '@/types/transaction';
import { processTransactionsByDate } from '@/handlers/bar-chart-handler';
import { LoadingSpinner } from '@/components/loading-spinner';

interface TableTransactionsByDayProps {
  address: string;
  startDate: string;
  endDate: string;
}

export default function TableTransactionsByDay({ address, startDate, endDate }: TableTransactionsByDayProps) {
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

  // Convert to table data format, sorted by date
  const tableData = Object.entries(transactionsByDate)
    .sort((a, b) => a[0].localeCompare(b[0])) // Sort by date ascending
    .map(([date, count]) => ({
      name: date,
      value: count, // Count of transactions, not a dollar amount
    }));

  if (tableData.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Transaction Data</p>
        <p className="text-yellow-600">No transaction data available to display</p>
      </div>
    );
  }

  // Format date range for title
  const dateRange = `${startDate} to ${endDate}`;
  const totalTransactions = tableData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="p-4 border border-border widget-bg rounded-md w-full">
      <h2 className="font-semibold widget-text mb-4 border-b border-border pb-2">
        Transactions by Day ({dateRange})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="p-3 text-left widget-text font-semibold">Date</th>
              <th className="p-3 text-right widget-text font-semibold">Transaction Count</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((entry) => (
              <tr key={entry.name} className="border-b border-border hover:bg-accent/50 transition-colors">
                <td className="p-3 widget-text">{entry.name}</td>
                <td className="p-3 text-right widget-text font-mono">
                  {entry.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-border bg-accent/30 font-bold">
              <td className="p-3 widget-text font-semibold">Total</td>
              <td className="p-3 text-right widget-text font-mono font-semibold">
                {totalTransactions.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

