'use client';

import { useState, useEffect } from 'react';
import { useGetPortfolio } from '@/services/octav/loader';
import { TPortfolio } from '@/types/portfolio';
import { useWidgetDefaults } from '@/hooks/use-widget-defaults';
import { useMemo } from 'react';

export default function PortfolioSnapshot() {
  const { defaults, isLoading: defaultsLoading } = useWidgetDefaults();

  // Memoize the target address to prevent unnecessary re-renders
  const targetAddress = useMemo(
    () => defaults?.portfolio?.address || '0xc9c61194682a3a5f56bf9cd5b59ee63028ab6041',
    [defaults?.portfolio?.address]
  );
  
  const [addressLabel, setAddressLabel] = useState<string>(targetAddress);

  // Fetch address label from config
  useEffect(() => {
    const fetchAddressLabel = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const config = await response.json();
          const addresses = config.settings?.addresses || {};
          
          // Find the address in the config and get its label
          for (const [key, entry] of Object.entries(addresses)) {
            const addressEntry = entry as { address: string; label: string };
            if (addressEntry?.address?.toLowerCase() === targetAddress.toLowerCase()) {
              setAddressLabel(addressEntry.label || targetAddress);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching address label:', error);
      }
    };
    
    fetchAddressLabel();
  }, [targetAddress]);
  
  const { data, isLoading, error } = useGetPortfolio({
    addresses: [targetAddress],
    includeImages: true,
    includeExplorerUrls: true,
    waitForSync: false,
  });

  if (defaultsLoading || isLoading) {
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
  const dataRecord = data as Record<string, TPortfolio> | undefined;
  const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, TPortfolio][] : [];

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
      <p className="widget-text italic">(for {addressLabel})</p>
    </div>
  );
}

