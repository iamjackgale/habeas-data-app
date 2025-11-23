'use client';

import { useGetTransactionsForDateRange } from '@/services/octav/loader';
import { useWidgetDefaults } from '@/hooks/use-widget-defaults';

export default function TransactionCountSnapshot() {
  const { defaults, isLoading: defaultsLoading } = useWidgetDefaults();
  const date = defaults?.historic?.date || '2025-06-06';
  const targetAddress = '0x008f84b4f7b625636dd3e75045704b077d8db445';
  
  const queryResult = useGetTransactionsForDateRange(
    [targetAddress],
    "2025-10-01",
    "2025-10-31"
  );
  const { data } = queryResult.data || { data: [] };
  const { isLoading, error } = queryResult;

  console.log('transaction data');
  console.log(data);

  if (defaultsLoading || isLoading) return <p>Loading...</p>;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }


  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md">
      <p className="font-semibold widget-text">Number of transactions in October for {targetAddress} is {data.length}</p>
    </div>
  );
}

