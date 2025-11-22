'use client';

import { useGetHistoricalRange } from '@/services/octav/loader';
import { LoadingSpinner } from '@/components/loading-spinner';

interface HistoricalRangeProps {
  address: string;
  dates: string[];
}

export default function HistoricalRange({ address, dates }: HistoricalRangeProps) {
  const { data, isLoading, error } = useGetHistoricalRange({
    addresses: [address],
    dates: dates
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

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No historical portfolio data available</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md">
      <p className="font-semibold widget-text mb-4">Historical Net Worth</p>
      <div className="space-y-2">
        {Object.entries(data.data).map(([date, portfolios]) => {
          const totalNetWorth = Object.values(portfolios).reduce(
            (acc, portfolio: any) => acc + parseFloat(portfolio.networth || '0'),
            0
          );
          const formattedNetWorth = totalNetWorth.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          
          return (
            <div key={date} className="flex justify-between items-center">
              <span className="widget-text">{date}</span>
              <span className="widget-text font-medium">${formattedNetWorth}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
