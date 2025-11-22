/**
 * Table Renderer
 * Maps table keys to their actual React components and provides rendering logic
 */

'use client';

import React from 'react';

// Import all table components
import TablePortfolioByProtocol from '@/components/tables/table-portfolio-by-protocol';
import TablePortfolioByAsset from '@/components/tables/table-portfolio-by-asset';
import TableTransactionsByDay from '@/components/tables/table-transactions-by-day';
import { TableComparison, ComparisonTableDataEntry } from '@/components/tables/table-comparison';
import { useGetHistorical } from '@/services/octav/loader';
import { Portfolio } from '@/types/portfolio';
import { getProtocolValueDictionary, getComparisonProtocolValueDictionary } from '@/handlers/portfolio-handler';
import { getAssetValueDictionary, getComparisonAssetValueDictionary } from '@/handlers/portfolio-handler';
import { LoadingSpinner } from '@/components/loading-spinner';

import { TableDataEntry } from '@/components/tables/table-base';
import { ComparisonTableDataEntry } from '@/components/tables/table-comparison';

export interface TableRenderParams {
  tableKey: string;
  addresses: string[];
  dates: string[];
  chains?: string[];
  categories?: string[];
}

export interface TableRenderResult {
  component: React.ReactNode;
  title: string;
  data?: TableDataEntry[];
  comparisonData?: ComparisonTableDataEntry[];
  dates?: string[];
  showTransactions?: boolean;
}

// Table component that handles historical data
function TableHistoricalPortfolioByProtocol({ address, date: dateProp }: { address: string; date: string }) {
  const { data, isLoading, error } = useGetHistorical({
    address: address,
    date: dateProp,
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

  const dataRecord = data as Record<string, Portfolio> | undefined;
  const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, Portfolio][] : [];
  const portfolio = dataRecord?.[address] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : null);

  if (!portfolio) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No portfolio data available</p>
      </div>
    );
  }

  // Use the date prop that was passed to the Historical API call
  // This ensures we display the actual date used in the query, not a default
  const displayDate = dateProp;

  const protocolDictionary = getProtocolValueDictionary(portfolio);
  const tableData = Object.entries(protocolDictionary).map(([name, value]) => ({
    name,
    value: parseFloat(value) || 0,
  }));

  if (tableData.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Protocol Data</p>
        <p className="text-yellow-600">No protocol data available to display</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-border widget-bg rounded-md w-full">
      <h2 className="font-semibold widget-text mb-4 border-b border-border pb-2">
        Portfolio Assets by Protocol ({displayDate})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="p-3 text-left widget-text font-semibold">Name</th>
              <th className="p-3 text-right widget-text font-semibold">Total Value (USD)</th>
            </tr>
          </thead>
          <tbody>
            {tableData.sort((a, b) => b.value - a.value).map((entry) => (
              <tr key={entry.name} className="border-b border-border hover:bg-accent/50 transition-colors">
                <td className="p-3 widget-text">{entry.name}</td>
                <td className="p-3 text-right widget-text font-mono">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(entry.value)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-border bg-accent/30 font-bold">
              <td className="p-3 widget-text font-semibold">Total</td>
              <td className="p-3 text-right widget-text font-mono font-semibold">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(tableData.reduce((sum, e) => sum + e.value, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Table component that handles historical asset data
function TableHistoricalPortfolioByAsset({ address, date: dateProp }: { address: string; date: string }) {
  const { data, isLoading, error } = useGetHistorical({
    address: address,
    date: dateProp,
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

  const dataRecord = data as Record<string, Portfolio> | undefined;
  const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, Portfolio][] : [];
  const portfolio = dataRecord?.[address] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : null);

  if (!portfolio) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No portfolio data available</p>
      </div>
    );
  }

  // Use the date prop that was passed to the Historical API call
  // This ensures we display the actual date used in the query, not a default
  const displayDate = dateProp;

  const assetDictionary = getAssetValueDictionary(portfolio);
  const tableData = Object.entries(assetDictionary).map(([name, value]) => ({
    name,
    value: parseFloat(value) || 0,
  }));

  if (tableData.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Asset Data</p>
        <p className="text-yellow-600">No asset data available to display</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-border widget-bg rounded-md w-full">
      <h2 className="font-semibold widget-text mb-4 border-b border-border pb-2">
        Portfolio Assets by Asset ({displayDate})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="p-3 text-left widget-text font-semibold">Name</th>
              <th className="p-3 text-right widget-text font-semibold">Total Value (USD)</th>
            </tr>
          </thead>
          <tbody>
            {tableData.sort((a, b) => b.value - a.value).map((entry) => (
              <tr key={entry.name} className="border-b border-border hover:bg-accent/50 transition-colors">
                <td className="p-3 widget-text">{entry.name}</td>
                <td className="p-3 text-right widget-text font-mono">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(entry.value)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-border bg-accent/30 font-bold">
              <td className="p-3 widget-text font-semibold">Total</td>
              <td className="p-3 text-right widget-text font-mono font-semibold">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(tableData.reduce((sum, e) => sum + e.value, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Table component for comparison by protocol
function TableComparisonPortfolioByProtocol({ address, dates }: { address: string; dates: string[] }) {
  const sortedDates = [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const MAX_DATES = 12;
  
  if (sortedDates.length > MAX_DATES) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">
          Maximum {MAX_DATES} dates supported. Received {sortedDates.length} dates.
        </p>
      </div>
    );
  }

  // Always call exactly MAX_DATES hooks (12) in the same order for React's rules
  const DUMMY_DATE = '2025-01-01';
  const hook1 = useGetHistorical({ address, date: sortedDates[0] || DUMMY_DATE });
  const hook2 = useGetHistorical({ address, date: sortedDates[1] || DUMMY_DATE });
  const hook3 = useGetHistorical({ address, date: sortedDates[2] || DUMMY_DATE });
  const hook4 = useGetHistorical({ address, date: sortedDates[3] || DUMMY_DATE });
  const hook5 = useGetHistorical({ address, date: sortedDates[4] || DUMMY_DATE });
  const hook6 = useGetHistorical({ address, date: sortedDates[5] || DUMMY_DATE });
  const hook7 = useGetHistorical({ address, date: sortedDates[6] || DUMMY_DATE });
  const hook8 = useGetHistorical({ address, date: sortedDates[7] || DUMMY_DATE });
  const hook9 = useGetHistorical({ address, date: sortedDates[8] || DUMMY_DATE });
  const hook10 = useGetHistorical({ address, date: sortedDates[9] || DUMMY_DATE });
  const hook11 = useGetHistorical({ address, date: sortedDates[10] || DUMMY_DATE });
  const hook12 = useGetHistorical({ address, date: sortedDates[11] || DUMMY_DATE });

  const allHookResults = [hook1, hook2, hook3, hook4, hook5, hook6, hook7, hook8, hook9, hook10, hook11, hook12];
  const historicalData = allHookResults.slice(0, sortedDates.length);

  const isLoading = historicalData.some(result => result.isLoading);
  const error = historicalData.find(result => result.error)?.error;

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  const portfolios = historicalData.map((result) => {
    const dataRecord = result.data as Record<string, Portfolio> | undefined;
    const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, Portfolio][] : [];
    return dataRecord?.[address] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : undefined);
  });

  if (portfolios.some(portfolio => !portfolio)) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">Historical portfolio data not available</p>
      </div>
    );
  }

  const protocolDictionaries = portfolios
    .filter((portfolio): portfolio is Portfolio => portfolio !== undefined)
    .map(portfolio => getProtocolValueDictionary(portfolio));

  const comparisonDictionary = getComparisonProtocolValueDictionary(...protocolDictionaries);

  const tableData: ComparisonTableDataEntry[] = Object.entries(comparisonDictionary).map(([name, values]) => ({
    name,
    values: values.map(v => typeof v === 'number' ? v : parseFloat(String(v)) || 0),
    dates: sortedDates,
  }));

  if (tableData.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Protocol Data</p>
        <p className="text-yellow-600">No protocol data available to display</p>
      </div>
    );
  }

  return (
    <TableComparison
      title="Portfolio Comparison by Protocol"
      data={tableData}
      dates={sortedDates}
    />
  );
}

// Table component for comparison by asset
function TableComparisonPortfolioByAsset({ address, dates }: { address: string; dates: string[] }) {
  const sortedDates = [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const MAX_DATES = 12;
  
  if (sortedDates.length > MAX_DATES) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">
          Maximum {MAX_DATES} dates supported. Received {sortedDates.length} dates.
        </p>
      </div>
    );
  }

  // Always call exactly MAX_DATES hooks (12) in the same order for React's rules
  const DUMMY_DATE = '2025-01-01';
  const hook1 = useGetHistorical({ address, date: sortedDates[0] || DUMMY_DATE });
  const hook2 = useGetHistorical({ address, date: sortedDates[1] || DUMMY_DATE });
  const hook3 = useGetHistorical({ address, date: sortedDates[2] || DUMMY_DATE });
  const hook4 = useGetHistorical({ address, date: sortedDates[3] || DUMMY_DATE });
  const hook5 = useGetHistorical({ address, date: sortedDates[4] || DUMMY_DATE });
  const hook6 = useGetHistorical({ address, date: sortedDates[5] || DUMMY_DATE });
  const hook7 = useGetHistorical({ address, date: sortedDates[6] || DUMMY_DATE });
  const hook8 = useGetHistorical({ address, date: sortedDates[7] || DUMMY_DATE });
  const hook9 = useGetHistorical({ address, date: sortedDates[8] || DUMMY_DATE });
  const hook10 = useGetHistorical({ address, date: sortedDates[9] || DUMMY_DATE });
  const hook11 = useGetHistorical({ address, date: sortedDates[10] || DUMMY_DATE });
  const hook12 = useGetHistorical({ address, date: sortedDates[11] || DUMMY_DATE });

  const allHookResults = [hook1, hook2, hook3, hook4, hook5, hook6, hook7, hook8, hook9, hook10, hook11, hook12];
  const historicalData = allHookResults.slice(0, sortedDates.length);

  const isLoading = historicalData.some(result => result.isLoading);
  const error = historicalData.find(result => result.error)?.error;

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  const portfolios = historicalData.map((result) => {
    const dataRecord = result.data as Record<string, Portfolio> | undefined;
    const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, Portfolio][] : [];
    return dataRecord?.[address] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : undefined);
  });

  if (portfolios.some(portfolio => !portfolio)) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">Historical portfolio data not available</p>
      </div>
    );
  }

  const assetDictionaries = portfolios
    .filter((portfolio): portfolio is Portfolio => portfolio !== undefined)
    .map(portfolio => getAssetValueDictionary(portfolio));

  const comparisonDictionary = getComparisonAssetValueDictionary(...assetDictionaries);

  const tableData: ComparisonTableDataEntry[] = Object.entries(comparisonDictionary).map(([name, values]) => ({
    name,
    values: values.map(v => typeof v === 'number' ? v : parseFloat(String(v)) || 0),
    dates: sortedDates,
  }));

  if (tableData.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Asset Data</p>
        <p className="text-yellow-600">No asset data available to display</p>
      </div>
    );
  }

  return (
    <TableComparison
      title="Portfolio Comparison by Asset"
      data={tableData}
      dates={sortedDates}
    />
  );
}

/**
 * Render a table component based on the table key and parameters
 * Returns both the component and the data needed for CSV export
 */
export function renderTable(params: TableRenderParams): TableRenderResult {
  const { tableKey, addresses, dates, chains, categories } = params;

  // Get the first address (for now, tables only support single address)
  const address = addresses[0] || '';
  
  if (!address) {
    return {
      component: (
        <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
          <p className="font-semibold text-yellow-800">Error</p>
          <p className="text-yellow-600">No address selected</p>
        </div>
      ),
      title: 'Error',
    };
  }

  // Render table based on key
  // Note: For data extraction, we'll need to fetch the data separately
  // For now, we'll return the component and let the download handler extract data from DOM
  switch (tableKey) {
    case 'portfolio-by-protocol': {
      const currentDate = new Date().toISOString().split('T')[0];
      return {
        component: <TablePortfolioByProtocol address={address} />,
        title: `Portfolio Assets by Protocol (${currentDate})`,
        data: undefined, // Data will be extracted from DOM for CSV
      };
    }

    case 'portfolio-by-asset': {
      const currentDate = new Date().toISOString().split('T')[0];
      return {
        component: <TablePortfolioByAsset address={address} />,
        title: `Portfolio Assets by Asset (${currentDate})`,
        data: undefined, // Data will be extracted from DOM for CSV
      };
    }

    case 'historical-portfolio-by-protocol':
      if (!dates[0]) {
        return {
          component: (
            <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
              <p className="font-semibold text-yellow-800">Error</p>
              <p className="text-yellow-600">No date selected</p>
            </div>
          ),
          title: 'Error',
        };
      }
      return {
        component: <TableHistoricalPortfolioByProtocol address={address} date={dates[0]} />,
        title: `Portfolio Assets by Protocol (${dates[0]})`,
        data: undefined, // Will be extracted from component
      };

    case 'historical-portfolio-by-asset':
      if (!dates[0]) {
        return {
          component: (
            <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
              <p className="font-semibold text-yellow-800">Error</p>
              <p className="text-yellow-600">No date selected</p>
            </div>
          ),
          title: 'Error',
        };
      }
      return {
        component: <TableHistoricalPortfolioByAsset address={address} date={dates[0]} />,
        title: `Portfolio Assets by Asset (${dates[0]})`,
        data: undefined, // Will be extracted from component
      };

    case 'comparison-portfolio-by-protocol':
      if (dates.length === 0) {
        return {
          component: (
            <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
              <p className="font-semibold text-yellow-800">Error</p>
              <p className="text-yellow-600">No dates selected</p>
            </div>
          ),
          title: 'Error',
        };
      }
      return {
        component: <TableComparisonPortfolioByProtocol address={address} dates={dates} />,
        title: 'Portfolio Comparison by Protocol',
        comparisonData: undefined, // Will be extracted from component
        dates: dates,
      };

    case 'comparison-portfolio-by-asset':
      if (dates.length === 0) {
        return {
          component: (
            <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
              <p className="font-semibold text-yellow-800">Error</p>
              <p className="text-yellow-600">No dates selected</p>
            </div>
          ),
          title: 'Error',
        };
      }
      return {
        component: <TableComparisonPortfolioByAsset address={address} dates={dates} />,
        title: 'Portfolio Comparison by Asset',
        comparisonData: undefined, // Will be extracted from component
        dates: dates,
      };

    case 'transactions-by-day':
      if (dates.length < 2) {
        return {
          component: (
            <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
              <p className="font-semibold text-yellow-800">Error</p>
              <p className="text-yellow-600">Please select a date range (start and end date)</p>
            </div>
          ),
          title: 'Error',
        };
      }
      // Sort dates and use first as startDate, last as endDate
      const sortedDates = [...dates].sort((a, b) => a.localeCompare(b));
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];
      return {
        component: <TableTransactionsByDay address={address} startDate={startDate} endDate={endDate} />,
        title: `Transactions by Day (${startDate} to ${endDate})`,
        data: undefined, // Will be extracted from component
      };

    default:
      return {
        component: (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Unknown Table</p>
            <p className="text-yellow-600">Table type "{tableKey}" is not recognized</p>
          </div>
        ),
        title: 'Error',
      };
  }
}

