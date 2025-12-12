/**
 * Data Renderer
 * Fetches portfolio data and converts it to PortfolioDownload format for display and download
 */

'use client';

import React, { useMemo } from 'react';
import { useGetPortfolio, useGetHistorical, useGetTransactionsForDateRange } from '@/services/octav/loader';
import { Portfolio } from '@/types/portfolio';
import { Transaction } from '@/types/transaction';
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
  mode?: 'portfolio' | 'transactions';
  widgetKey?: string | null;
  tableKey?: string | null;
}

export interface DataRenderResult {
  component: React.ReactNode;
  data: PortfolioDownload[] | Transaction[];
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
 * Component that fetches and displays transaction data for a date range
 */
function DataDisplayTransactions({ 
  addresses,
  startDate,
  endDate,
  onDataReady 
}: { 
  addresses: string[];
  startDate: string;
  endDate: string;
  onDataReady?: (data: Transaction[]) => void;
}) {
  const { dataByAddress, isLoading, error } = useGetTransactionsForDateRange(
    addresses,
    startDate,
    endDate,
    {}
  );

  // Memoize transaction extraction - combine transactions from all addresses
  const transactions = useMemo(() => {
    if (isLoading) return null; // Still loading
    if (error) return null; // Error occurred
    // dataByAddress might be an empty object {} when no data, which is still truthy
    // So we check if it exists and then extract transactions
    if (!dataByAddress) return null;
    const allTransactions: Transaction[] = [];
    addresses.forEach(address => {
      const addressTransactions = dataByAddress[address] || [];
      allTransactions.push(...addressTransactions);
    });
    // Return empty array if no transactions found (not null, so we can distinguish from loading/error)
    return allTransactions;
  }, [dataByAddress, isLoading, error, addresses]);

  const jsonString = useMemo(() => {
    if (!transactions) return '';
    return JSON.stringify(transactions, null, 2);
  }, [transactions]);

  React.useEffect(() => {
    if (transactions && transactions.length > 0 && onDataReady) {
      onDataReady(transactions);
    }
  }, [transactions, onDataReady]);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No transaction data available for the selected date range</p>
      </div>
    );
  }

  const dateRange = `${startDate} to ${endDate}`;

  return (
    <div className="p-4 border border-border widget-bg rounded-md w-full">
      <h2 className="font-semibold widget-text mb-4 border-b border-border pb-2">
        Transaction Data ({dateRange})
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
 * Render portfolio or transaction data for download/display
 * This function determines which component to use based on the mode and dates provided
 */
export function renderData(
  params: DataRenderParams,
  onDataReady?: (data: PortfolioDownload[] | Transaction[]) => void
): DataRenderResult {
  const { addresses, dates, mode, widgetKey, tableKey } = params;
  const address = addresses[0] || ''; // For single-address widgets (portfolio)

  // For transaction requests, check if we have addresses
  const isTransactionRequest = mode === 'transactions' || 
    widgetKey === 'bar-transactions-by-day' || 
    widgetKey === 'bar-stacked-transactions-by-category' ||
    tableKey === 'transactions-by-day' ||
    tableKey === 'comparison-by-interval';

  if (isTransactionRequest) {
    if (addresses.length === 0) {
      return {
        component: (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No addresses selected</p>
          </div>
        ),
        data: [],
        title: 'No Data',
      };
    }
  } else {
    // For portfolio requests, check single address
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
  }


  // Handle transaction data
  if (isTransactionRequest) {
    // For transaction requests, we need at least 2 dates (start and end)
    if (dates.length < 2) {
      console.log('[DataRenderer] Transaction request but dates.length < 2:', {
        widgetKey,
        tableKey,
        mode,
        dates,
        addresses,
      });
      return {
        component: (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">No Date Range</p>
            <p className="text-yellow-600">Please select a date range (start and end date) for transaction data</p>
            <p className="text-xs text-yellow-500 mt-2">Debug: dates.length = {dates.length}, widgetKey = {widgetKey || 'null'}</p>
          </div>
        ),
        data: [],
        title: 'No Date Range',
      };
    }
    
    // Sort dates and use first as startDate, last as endDate
    const sortedDates = [...dates].sort((a, b) => a.localeCompare(b));
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];
    const dateRange = `${startDate} to ${endDate}`;
    
    console.log('[DataRenderer] Rendering transaction data:', {
      widgetKey,
      addresses,
      startDate,
      endDate,
      dateRange,
    });
    
    return {
      component: (
        <DataDisplayTransactions 
          addresses={addresses} 
          startDate={startDate} 
          endDate={endDate}
          onDataReady={onDataReady as ((data: Transaction[]) => void) | undefined}
        />
      ),
      data: [], // Will be populated via onDataReady callback
      title: `Transaction Data (${dateRange})`,
    };
  }

  // Handle portfolio data (existing logic)
  // Determine which component to use based on dates
  let component: React.ReactNode;
  let title: string;
  let initialData: PortfolioDownload[] = [];

  if (dates.length === 0) {
    // No dates - use current portfolio
    const currentDate = new Date().toISOString().split('T')[0];
    component = <DataDisplaySingle address={address} date={currentDate} onDataReady={onDataReady as ((data: PortfolioDownload[]) => void) | undefined} />;
    title = `Portfolio Data (${currentDate})`;
  } else if (dates.length === 1) {
    // Single date - check if it's current or historical
    const date = dates[0];
    const currentDate = new Date().toISOString().split('T')[0];
    
    if (date === currentDate) {
      component = <DataDisplaySingle address={address} date={date} onDataReady={onDataReady as ((data: PortfolioDownload[]) => void) | undefined} />;
    } else {
      component = <DataDisplayHistorical address={address} date={date} onDataReady={onDataReady as ((data: PortfolioDownload[]) => void) | undefined} />;
    }
    title = `Portfolio Data (${date})`;
  } else {
    // Multiple dates - use comparison component
    component = <DataDisplayMultiple address={address} dates={dates} onDataReady={onDataReady as ((data: PortfolioDownload[]) => void) | undefined} />;
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
