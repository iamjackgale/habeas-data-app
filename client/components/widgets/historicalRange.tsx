'use client';

import { useGetHistorical, useGetHistoricalRange } from '@/services/octav/loader';
import { LoadingSpinner } from '../loading-spinner';

export default function HistoricalRange() {
  const dates = ['2025-03-01', '2025-06-01', '2025-09-01'];

  const { data, isLoading, error, progress } = useGetHistoricalRange({
    address: '0x3f5eddad52c665a4aa011cd11a21e1d5107d7862',
    dates
  });

  if (isLoading) return <LoadingSpinner/>;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        {/* <p className="text-red-600">{error?.message}</p> */}
      </div>
    );
  }
  console.log(data);

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md">
      <p className="font-semibold widget-text mb-4">Historical Net Worth</p>
      <div className="space-y-2">
        {Object.entries(data).map(([date, portfolios]) => {
          const totalNetWorth = Object.values(portfolios).reduce(
            (acc, portfolio) => acc + parseFloat(portfolio.networth),
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
