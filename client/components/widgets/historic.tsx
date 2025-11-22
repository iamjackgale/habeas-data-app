'use client';

import { useGetHistorical } from '@/services/octav/loader';
import { LoadingSpinner } from '@/components/loading-spinner';

interface HistoricalProps {
  address: string;
  date: string;
}

export default function Historical({ address, date }: HistoricalProps) {
  const { data, isLoading, error, progress } = useGetHistorical({
    address: address,
    date: date
  });

  if (isLoading) return <LoadingSpinner/>;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }
  
  const netWorth = Object.values(data || {}).reduce((acc, portfolio: any) => acc + parseFloat(portfolio.networth || '0'), 0);

  // Format net worth with 2 decimal places and comma separators
  const formattedNetWorth = netWorth.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md">
      <p className="font-semibold widget-text">Portfolio Net Worth ({date})</p>
      <p className="widget-text">${formattedNetWorth}</p>
    </div>
  );
}
