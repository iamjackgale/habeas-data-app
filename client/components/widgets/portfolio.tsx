'use client';

import { useGetPortfolio } from '@/services/octav/loader';
import { Portfolio } from '@/types/portfolio';

interface PortfolioProps {
  address: string;
}

export default function Portfolio({ address }: PortfolioProps) {
  const { data, isLoading, error } = useGetPortfolio({
    address: address,
    includeImages: true,
    includeExplorerUrls: true,
    waitForSync: true,
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  // Extract portfolio from Record structure (data is Record<string, Portfolio>)
  const dataRecord = data as Record<string, Portfolio> | undefined;
  const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, Portfolio][] : [];
  const portfolio = dataRecord?.[address] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : null);

  if (!dataRecord || portfolioEntries.length === 0 || !portfolio) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No portfolio data available</p>
      </div>
    );
  }

  // Calculate networth from the portfolio
  const totalNetworth = parseFloat(portfolio.networth || '0') || 0;

  // Format net worth with 2 decimal places and comma separators
  const formattedNetworth = totalNetworth.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Get current date for title
  const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md">
      <p className="font-semibold widget-text">Portfolio Net Worth ({currentDate})</p>
      <p className="widget-text">${formattedNetworth}</p>
    </div>
  );
}
