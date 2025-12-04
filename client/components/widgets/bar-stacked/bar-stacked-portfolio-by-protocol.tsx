'use client';

import { useGetHistorical } from '@/services/octav/loader';
import { TPortfolio } from '@/types/portfolio';
import { getProtocolValueDictionary, getComparisonProtocolValueDictionary } from '@/handlers/portfolio-handler';
import { BarStackedChartDataEntry } from '@/handlers/bar-chart-handler';
import BarStackedBySignChartComponent from '@/components/charts/bar-stacked-by-sign';
import { useWidgetColors } from '@/hooks/use-widget-colors';

interface BarStackedPortfolioByProtocolProps {
  address: string;
  dates: string[];
}

export default function BarStackedPortfolioByProtocol({ address, dates: rawDates }: BarStackedPortfolioByProtocolProps) {
  // Load colors from config
  const widgetColors = useWidgetColors();
  
  const MAX_DATES = 12;
  
  // Validate max 12 dates
  if (rawDates.length > MAX_DATES) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">
          Maximum {MAX_DATES} dates supported. Received {rawDates.length} dates.
        </p>
      </div>
    );
  }
  
  // Sort dates in ascending order (earliest to latest)
  const dates = [...rawDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  // Fetch historical data for all dates using hooks
  // Hooks must be called unconditionally at the top level, so we call them individually
  // Always call exactly MAX_DATES hooks (12) in the same order for React's rules
  // Use actual dates from the array, or use a dummy date for unused slots (results will be ignored)
  const DUMMY_DATE = '2025-01-01'; // Valid date, but unused results will be filtered out
  
  // Call hooks individually (always call MAX_DATES hooks in same order)
  const hook1 = useGetHistorical({
    addresses: [address],
    date: dates[0] || DUMMY_DATE,
  });
  const hook2 = useGetHistorical({
    addresses: [address]  ,
    date: dates[1] || DUMMY_DATE,
  });
  const hook3 = useGetHistorical({
    addresses: [address],
    date: dates[2] || DUMMY_DATE,
  });
  const hook4 = useGetHistorical({
    addresses: [address],
    date: dates[3] || DUMMY_DATE,
  });
  const hook5 = useGetHistorical({
    addresses: [address],
    date: dates[4] || DUMMY_DATE,
  });
  const hook6 = useGetHistorical({
    addresses: [address],
    date: dates[5] || DUMMY_DATE,
  });
  const hook7 = useGetHistorical({
    addresses: [address],
    date: dates[6] || DUMMY_DATE,
  });
  const hook8 = useGetHistorical({
    addresses: [address],
    date: dates[7] || DUMMY_DATE,
  });
  const hook9 = useGetHistorical({
    addresses: [address],
    date: dates[8] || DUMMY_DATE,
  });
  const hook10 = useGetHistorical({
    addresses: [address],
    date: dates[9] || DUMMY_DATE,
  });
  const hook11 = useGetHistorical({
    addresses: [address],
    date: dates[10] || DUMMY_DATE,
  });
  const hook12 = useGetHistorical({
    addresses: [address],
    date: dates[11] || DUMMY_DATE,
  });

  // Create array of hook results, but only use the ones corresponding to actual dates
  const allHookResults = [hook1, hook2, hook3, hook4, hook5, hook6, hook7, hook8, hook9, hook10, hook11, hook12];
  const historicalData = allHookResults.slice(0, dates.length);

  const isLoading = historicalData.some(result => result.isLoading);
  const error = historicalData.find(result => result.error)?.error;

  if (isLoading) return <p>Loading...</p>;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  // Extract portfolios from Record structure for all dates
  const portfolios = historicalData.map((result, index) => {
    const dataRecord = result.data as Record<string, TPortfolio> | undefined;
    const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, TPortfolio][] : [];
    return dataRecord?.[address] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : undefined);
  });

  // Check if all portfolios are available
  if (portfolios.some(portfolio => !portfolio)) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">Historical portfolio data not available for comparison</p>
      </div>
    );
  }

  // Get protocol dictionaries for all dates (portfolios are guaranteed to be non-null at this point)
  const protocolDictionaries = portfolios
    .filter((portfolio): portfolio is TPortfolio => portfolio !== undefined)
    .map(portfolio => getProtocolValueDictionary(portfolio));

  // Create comparison dictionary with all dictionaries
  // Format: Record<string, number[]> where key is protocol name, value is array of values per date
  const comparisonDictionary = getComparisonProtocolValueDictionary(...protocolDictionaries);

  // Check if comparison data is empty
  if (Object.keys(comparisonDictionary).length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Protocol Data</p>
        <p className="text-yellow-600">No protocol data available to display in comparison chart</p>
      </div>
    );
  }

  // Transform comparison dictionary to stacked bar format
  // Input: { "beefy": [1000, 2000, 3000], "uniswap": [500, 600, 700] }
  // Output: [{ name: "2025-01-01", beefy: 1000, uniswap: 500 }, { name: "2025-06-06", beefy: 2000, uniswap: 600 }, ...]
  const stackedData: BarStackedChartDataEntry[] = dates.map((date, dateIndex) => {
    const entry: BarStackedChartDataEntry = { name: date };
    
    // For each protocol, get its value for this date
    Object.entries(comparisonDictionary).forEach(([protocolName, values]) => {
      entry[protocolName] = values[dateIndex] || 0;
    });
    
    return entry;
  });

  // Calculate total value across all dates and protocols
  const totalValue = stackedData.reduce((sum: number, entry) => {
    const entryTotal = Object.values(entry).reduce((entrySum: number, value) => {
      const numValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
      return entrySum + numValue;
    }, 0);
    return sum + entryTotal;
  }, 0);

  // Get all protocol names (dataKeys for the stacks)
  const dataKeys = Object.keys(comparisonDictionary);

  // Limit to top 5 protocols + "Other" (similar to other charts)
  const MAX_VISIBLE_PROTOCOLS = 5;
  const otherCategoryName = 'other';
  
  // Calculate total value per protocol across all dates
  const protocolTotals = dataKeys.map(protocolName => {
    const total = stackedData.reduce((sum, entry) => {
      const value = entry[protocolName];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    return { protocolName, total };
  });

  // Sort by total descending
  const sortedProtocols = [...protocolTotals].sort((a, b) => b.total - a.total);

  // Take top 5 protocols
  const visibleProtocols = sortedProtocols.slice(0, MAX_VISIBLE_PROTOCOLS);
  const remainingProtocols = sortedProtocols.slice(MAX_VISIBLE_PROTOCOLS);

  // Build final stacked data with only visible protocols
  const finalStackedData: BarStackedChartDataEntry[] = stackedData.map(entry => {
    const newEntry: BarStackedChartDataEntry = { name: entry.name };
    visibleProtocols.forEach(({ protocolName }) => {
      const value = entry[protocolName];
      newEntry[protocolName] = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
    });
    return newEntry;
  });

  // Calculate "Other" for each date
  const otherTotal = remainingProtocols.reduce((sum, { protocolName }) => {
    return sum + stackedData.reduce((dateSum, entry) => {
      const value = entry[protocolName];
      return dateSum + (typeof value === 'number' ? value : 0);
    }, 0);
  }, 0);

  // Add "Other" if it has any value
  const otherPercentage = totalValue > 0 ? (otherTotal / totalValue) : 0;
  const OTHER_THRESHOLD = 0.00005; // 0.005%
  
  if (otherTotal > 0 && otherPercentage >= OTHER_THRESHOLD) {
    finalStackedData.forEach(entry => {
      const otherValue = remainingProtocols.reduce((sum, { protocolName }) => {
        const originalEntry = stackedData.find(e => e.name === entry.name);
        const value = originalEntry?.[protocolName];
        return sum + (typeof value === 'number' ? value : 0);
      }, 0);
      entry[otherCategoryName] = otherValue;
    });
  }

  // Final data keys (visible protocols + "Other" if applicable)
  const finalDataKeys = visibleProtocols.map(({ protocolName }) => protocolName);
  if (otherTotal > 0 && otherPercentage >= OTHER_THRESHOLD) {
    finalDataKeys.push(otherCategoryName);
  }

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Portfolio Comparison by Protocol</p>
      <div className="w-full mx-auto">
        <BarStackedBySignChartComponent
          data={finalStackedData}
          dataKeys={finalDataKeys}
          totalValue={totalValue}
          colors={widgetColors}
          height={500}
          maxWidth={700}
        />
      </div>
    </div>
  );
}

