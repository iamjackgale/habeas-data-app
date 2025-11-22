'use client';

import { useGetPortfolio } from '@/services/octav/loader';
import { Portfolio } from '@/types/portfolio';

export default function Portfolio() {
  const targetAddress = '0xc9c61194682a3a5f56bf9cd5b59ee63028ab6041';
  
  const { data, isLoading, error } = useGetPortfolio({
    address: targetAddress,
    includeImages: true,
    includeExplorerUrls: true,
    waitForSync: true,
  });

  // Debug logging
  console.log('=== Portfolio Component Debug ===');
  console.log('isLoading:', isLoading);
  console.log('error:', error);
  console.log('data:', data);
  console.log('data type:', typeof data);
  console.log('data?.address:', data?.address);
  console.log('data?.networth:', data?.networth);
  console.log('data?.networth type:', typeof data?.networth);
  if (data) {
    console.log('Full data object:', JSON.stringify(data, null, 2));
  }
  console.log('================================');

  if (isLoading) {
    console.log('Rendering: Loading state');
    return <p>Loading...</p>;
  }

  if (error) {
    console.log('Rendering: Error state', error);
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  console.log('Rendering: Portfolio data display');
  console.log('Address value:', data?.address);
  console.log('Networth value:', data?.networth);

  // Extract portfolio from Record structure (data is Record<string, Portfolio>)
  const dataRecord = data as Record<string, Portfolio> | undefined;
  const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, Portfolio][] : [];
  const firstPortfolio = portfolioEntries.length > 0 ? portfolioEntries[0][1] : null;
  const firstAddress = portfolioEntries.length > 0 ? portfolioEntries[0][0] : null;

  console.log('First portfolio:', firstPortfolio);
  console.log('First address:', firstAddress);

  if (!dataRecord || portfolioEntries.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No portfolio data available</p>
      </div>
    );
  }

  // Calculate total networth (sum of all portfolios)
  const totalNetworth = portfolioEntries.reduce((sum, [, portfolio]) => {
    const networth = parseFloat(portfolio.networth || '0');
    return sum + (isNaN(networth) ? 0 : networth);
  }, 0);

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md">
      <p className="font-semibold widget-text">Net Worth for {firstAddress || 'N/A'}</p>
      <p className="widget-text">${totalNetworth.toFixed(2)}</p>
    </div>
  );
}
