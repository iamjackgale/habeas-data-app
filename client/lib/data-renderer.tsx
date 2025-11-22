/**
 * Data Renderer
 * Fetches portfolio data and converts it to PortfolioDownload format for display and download
 */

'use client';

import React, { useMemo } from 'react';
import { useGetPortfolio, useGetHistorical } from '@/services/octav/loader';
import { Portfolio } from '@/types/portfolio';
import { PortfolioDownload, convertToPortfolioDownload } from '@/types/portfolio-download';
import { LoadingSpinner } from '@/components/loading-spinner';

/**
 * Helper function to extract portfolio from data record
 */
function extractPortfolio(
  data: unknown,
  address: string
): Portfolio | null {
  const dataRecord = data as Record<string, Portfolio> | undefined;
  if (!dataRecord) return null;
  
  const portfolioEntries = Object.entries(dataRecord) as [string, Portfolio][];
  return dataRecord[address] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : null);
}

export interface DataRenderParams {
  addresses: string[];
  dates: string[];
  chains?: string[];
  categories?: string[];
}

export interface DataRenderResult {
  component: React.ReactNode;
  data: PortfolioDownload[];
  title: string;
}

/**
 * Component that fetches and displays portfolio data for a single address and date
 */
function DataDisplaySingle({ 
  address, 
  date,
  onDataReady 
}: { 
  address: string; 
  date: string;
  onDataReady?: (data: PortfolioDownload[]) => void;
}) {
  const { data, isLoading, error } = useGetPortfolio({
    addresses: [address],
    includeImages: false,
    includeExplorerUrls: false,
    waitForSync: false,
  });

  // Memoize portfolio extraction and conversion
  const portfolio = useMemo(() => {
    if (!data || isLoading || error) return null;
    return extractPortfolio(data, address);
  }, [data, isLoading, error, address]);

  const downloadData = useMemo(() => {
    if (!portfolio) return null;
    return convertToPortfolioDownload(portfolio);
  }, [portfolio]);

  const jsonString = useMemo(() => {
    if (!downloadData) return '';
    return JSON.stringify([downloadData], null, 2);
  }, [downloadData]);

  React.useEffect(() => {
    if (downloadData && onDataReady) {
      onDataReady([downloadData]);
    }
  }, [downloadData, onDataReady]);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  if (!portfolio || !downloadData) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No portfolio data available</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-border widget-bg rounded-md w-full">
      <h2 className="font-semibold widget-text mb-4 border-b border-border pb-2">
        Portfolio Data ({date})
      </h2>
      <div className="overflow-auto max-h-[600px]">
        <pre className="text-xs widget-text font-mono whitespace-pre-wrap break-words">
          {jsonString}
        </pre>
      </div>
    </div>
  );
}

/**
 * Component that fetches and displays portfolio data for a specific date
 */
function DataDisplayHistorical({ 
  address, 
  date,
  onDataReady 
}: { 
  address: string; 
  date: string;
  onDataReady?: (data: PortfolioDownload[]) => void;
}) {
  const { data, isLoading, error } = useGetHistorical({
    addresses: [address],
    date: date,
  });

  // Memoize portfolio extraction and conversion
  const portfolio = useMemo(() => {
    if (!data || isLoading || error) return null;
    return extractPortfolio(data, address);
  }, [data, isLoading, error, address]);

  const downloadData = useMemo(() => {
    if (!portfolio) return null;
    return convertToPortfolioDownload(portfolio);
  }, [portfolio]);

  const jsonString = useMemo(() => {
    if (!downloadData) return '';
    return JSON.stringify([downloadData], null, 2);
  }, [downloadData]);

  React.useEffect(() => {
    if (downloadData && onDataReady) {
      onDataReady([downloadData]);
    }
  }, [downloadData, onDataReady]);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  if (!portfolio || !downloadData) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No portfolio data available</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-border widget-bg rounded-md w-full">
      <h2 className="font-semibold widget-text mb-4 border-b border-border pb-2">
        Portfolio Data ({date})
      </h2>
      <div className="overflow-auto max-h-[600px]">
        <pre className="text-xs widget-text font-mono whitespace-pre-wrap break-words">
          {jsonString}
        </pre>
      </div>
    </div>
  );
}

/**
 * Component that fetches and displays multiple portfolio data entries for comparison
 */
function DataDisplayMultiple({ 
  address, 
  dates,
  onDataReady 
}: { 
  address: string; 
  dates: string[];
  onDataReady?: (data: PortfolioDownload[]) => void;
}) {
  // Fetch portfolio data for all dates - use useQueries pattern
  const historicalData = dates.map(date => 
    useGetHistorical({
      addresses: [address],
      date: date,
    })
  );

  const isLoading = historicalData.some(result => result.isLoading);
  const error = historicalData.find(result => result.error)?.error;

  // Memoize portfolio extraction
  const portfolios = useMemo(() => {
    if (isLoading || error || !historicalData.every(result => result.data)) {
      return [];
    }
    const extracted: Portfolio[] = [];
    for (const result of historicalData) {
      const portfolio = extractPortfolio(result.data, address);
      if (portfolio) {
        extracted.push(portfolio);
      }
    }
    return extracted;
  }, [isLoading, error, historicalData, address]);

  // Memoize conversion
  const downloadDataArray = useMemo(() => {
    return portfolios.map(portfolio => convertToPortfolioDownload(portfolio));
  }, [portfolios]);

  const jsonString = useMemo(() => {
    if (downloadDataArray.length === 0) return '';
    return JSON.stringify(downloadDataArray, null, 2);
  }, [downloadDataArray]);

  React.useEffect(() => {
    if (downloadDataArray.length > 0 && onDataReady) {
      onDataReady(downloadDataArray);
    }
  }, [downloadDataArray, onDataReady]);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No portfolio data available</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-border widget-bg rounded-md w-full">
      <h2 className="font-semibold widget-text mb-4 border-b border-border pb-2">
        Portfolio Comparison Data ({dates.length} dates)
      </h2>
      <div className="overflow-auto max-h-[600px]">
        <pre className="text-xs widget-text font-mono whitespace-pre-wrap break-words">
          {jsonString}
        </pre>
      </div>
    </div>
  );
}

/**
 * Render portfolio data for download/display
 * This function determines which component to use based on the dates provided
 */
export function renderData(
  params: DataRenderParams,
  onDataReady?: (data: PortfolioDownload[]) => void
): DataRenderResult {
  const { addresses, dates } = params;
  const address = addresses[0] || '';

  if (!address) {
    return {
      component: (
        <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
          <p className="font-semibold text-yellow-800">Error</p>
          <p className="text-yellow-600">No address selected</p>
        </div>
      ),
      data: [],
      title: 'No Data',
    };
  }

  // Determine which component to use based on dates
  let component: React.ReactNode;
  let title: string;
  let initialData: PortfolioDownload[] = [];

  if (dates.length === 0) {
    // No dates - use current portfolio
    const currentDate = new Date().toISOString().split('T')[0];
    component = <DataDisplaySingle address={address} date={currentDate} onDataReady={onDataReady} />;
    title = `Portfolio Data (${currentDate})`;
  } else if (dates.length === 1) {
    // Single date - check if it's current or historical
    const date = dates[0];
    const currentDate = new Date().toISOString().split('T')[0];
    
    if (date === currentDate) {
      component = <DataDisplaySingle address={address} date={date} onDataReady={onDataReady} />;
    } else {
      component = <DataDisplayHistorical address={address} date={date} onDataReady={onDataReady} />;
    }
    title = `Portfolio Data (${date})`;
  } else {
    // Multiple dates - use comparison component
    component = <DataDisplayMultiple address={address} dates={dates} onDataReady={onDataReady} />;
    title = `Portfolio Comparison Data (${dates.length} dates)`;
  }

  return {
    component,
    data: initialData, // Will be populated via onDataReady callback
    title,
  };
}

/**
 * Fetch portfolio data and convert to download format
 * This is used to get the actual data for download/storage
 */
export async function fetchPortfolioDataForDownload(
  address: string,
  date: string
): Promise<PortfolioDownload | null> {
  // This would need to be implemented to fetch data server-side or use a different approach
  // For now, we'll return null and handle it in the component
  return null;
}
