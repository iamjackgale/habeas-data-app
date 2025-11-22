'use client';

import { useGetHistorical } from '@/services/octav/loader';
import { useWidgetDefaults } from '@/hooks/use-widget-defaults';

export default function HistoricalSnapshot() {
  const { defaults, isLoading: defaultsLoading } = useWidgetDefaults();
  const date = defaults?.historic?.date || '2025-06-06';
  const targetAddress = defaults?.historic?.address || '0x3f5eddad52c665a4aa011cd11a21e1d5107d7862';
  
  const { data, isLoading, error } = useGetHistorical({
    address: targetAddress,
    date
  });

  if (defaultsLoading || isLoading) return <p>Loading...</p>;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  const netWorth = Object.values(data).reduce((acc, portfolio) => acc + parseFloat(portfolio.networth), 0);

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

