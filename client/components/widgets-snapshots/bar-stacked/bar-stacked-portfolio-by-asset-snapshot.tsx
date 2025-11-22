'use client';

import { useGetHistorical } from '@/services/octav/loader';
import { Portfolio } from '@/types/portfolio';
import { getAssetValueDictionary, getComparisonAssetValueDictionary } from '@/handlers/portfolio-handler';
import { BarStackedChartDataEntry } from '@/handlers/bar-chart-handler';
import BarStackedChartComponent from '@/components/charts/bar-stacked';
import { useWidgetDefaults } from '@/hooks/use-widget-defaults';
import { useWidgetColors } from '@/hooks/use-widget-colors';

export default function BarStackedPortfolioByAssetSnapshot() {
  const { defaults, isLoading: defaultsLoading } = useWidgetDefaults();
  const widgetColors = useWidgetColors();
  const MAX_DATES = 5;
  // Get dates from config defaults
  const rawDates = defaults?.['bar-stacked-portfolio-by-asset']?.dates || ['2025-06-06', '2025-11-22', '2025-01-01', '2025-03-15', '2025-08-30'];
  const targetAddress = defaults?.['bar-stacked-portfolio-by-asset']?.address || '0x3f5eddad52c665a4aa011cd11a21e1d5107d7862';
  
  // Validate max 5 dates
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
  // Always call exactly MAX_DATES hooks (5) in the same order for React's rules
  // Use actual dates from the array, or use a dummy date for unused slots (results will be ignored)
  const DUMMY_DATE = '2025-01-01'; // Valid date, but unused results will be filtered out
  
  // Call hooks individually (always call MAX_DATES hooks in same order)
  const hook1 = useGetHistorical({
    address: targetAddress,
    date: dates[0] || DUMMY_DATE,
  });
  const hook2 = useGetHistorical({
    address: targetAddress,
    date: dates[1] || DUMMY_DATE,
  });
  const hook3 = useGetHistorical({
    address: targetAddress,
    date: dates[2] || DUMMY_DATE,
  });
  const hook4 = useGetHistorical({
    address: targetAddress,
    date: dates[3] || DUMMY_DATE,
  });
  const hook5 = useGetHistorical({
    address: targetAddress,
    date: dates[4] || DUMMY_DATE,
  });

  // Create array of hook results, but only use the ones corresponding to actual dates
  const allHookResults = [hook1, hook2, hook3, hook4, hook5];
  const historicalData = allHookResults.slice(0, dates.length);

  const isLoading = defaultsLoading || historicalData.some(result => result.isLoading);
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
    const dataRecord = result.data as Record<string, Portfolio> | undefined;
    const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, Portfolio][] : [];
    return dataRecord?.[targetAddress] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : undefined);
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

  // Get asset dictionaries for all dates (portfolios are guaranteed to be non-null at this point)
  const assetDictionaries = portfolios
    .filter((portfolio): portfolio is Portfolio => portfolio !== undefined)
    .map(portfolio => getAssetValueDictionary(portfolio));

  // Create comparison dictionary with all dictionaries
  // Format: Record<string, number[]> where key is asset name, value is array of values per date
  const comparisonDictionary = getComparisonAssetValueDictionary(...assetDictionaries);

  // Check if comparison data is empty
  if (Object.keys(comparisonDictionary).length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Asset Data</p>
        <p className="text-yellow-600">No asset data available to display in comparison chart</p>
      </div>
    );
  }

  // Transform comparison dictionary to stacked bar format
  // Input: { "beefy": [1000, 2000, 3000], "uniswap": [500, 600, 700] }
  // Output: [{ name: "2025-01-01", beefy: 1000, uniswap: 500 }, { name: "2025-06-06", beefy: 2000, uniswap: 600 }, ...]
  const stackedData: BarStackedChartDataEntry[] = dates.map((date, dateIndex) => {
    const entry: BarStackedChartDataEntry = { name: date };
    
    // For each asset, get its value for this date
    Object.entries(comparisonDictionary).forEach(([assetName, values]) => {
      entry[assetName] = values[dateIndex] || 0;
    });
    
    return entry;
  });

  // Calculate total value across all dates and assets
  const totalValue = stackedData.reduce((sum: number, entry) => {
    const entryTotal = Object.values(entry).reduce((entrySum: number, value) => {
      const numValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
      return entrySum + numValue;
    }, 0);
    return sum + entryTotal;
  }, 0);

  // Get all asset names (dataKeys for the stacks)
  const dataKeys = Object.keys(comparisonDictionary);

  // Limit to top 5 assets + "Other" (similar to other charts)
  const MAX_VISIBLE_ASSETS = 5;
  const otherCategoryName = 'other';
  
  // Calculate total value per asset across all dates
  const assetTotals = dataKeys.map(assetName => {
    const total = stackedData.reduce((sum, entry) => {
      const value = entry[assetName];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    return { assetName, total };
  });

  // Sort by total descending
  const sortedAssets = [...assetTotals].sort((a, b) => b.total - a.total);

  // Take top 5 assets
  const visibleAssets = sortedAssets.slice(0, MAX_VISIBLE_ASSETS);
  const remainingAssets = sortedAssets.slice(MAX_VISIBLE_ASSETS);

  // Build final stacked data with only visible assets
  const finalStackedData: BarStackedChartDataEntry[] = stackedData.map(entry => {
    const newEntry: BarStackedChartDataEntry = { name: entry.name };
    visibleAssets.forEach(({ assetName }) => {
      const value = entry[assetName];
      newEntry[assetName] = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
    });
    return newEntry;
  });

  // Calculate "Other" for each date
  const otherTotal = remainingAssets.reduce((sum, { assetName }) => {
    return sum + stackedData.reduce((dateSum, entry) => {
      const value = entry[assetName];
      return dateSum + (typeof value === 'number' ? value : 0);
    }, 0);
  }, 0);

  // Add "Other" if it has any value
  const otherPercentage = totalValue > 0 ? (otherTotal / totalValue) : 0;
  const OTHER_THRESHOLD = 0.00005; // 0.005%
  
  if (otherTotal > 0 && otherPercentage >= OTHER_THRESHOLD) {
    finalStackedData.forEach(entry => {
      const otherValue = remainingAssets.reduce((sum, { assetName }) => {
        const originalEntry = stackedData.find(e => e.name === entry.name);
        const value = originalEntry?.[assetName];
        return sum + (typeof value === 'number' ? value : 0);
      }, 0);
      entry[otherCategoryName] = otherValue;
    });
  }

  // Final data keys (visible assets + "Other" if applicable)
  const finalDataKeys = visibleAssets.map(({ assetName }) => assetName);
  if (otherTotal > 0 && otherPercentage >= OTHER_THRESHOLD) {
    finalDataKeys.push(otherCategoryName);
  }

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Portfolio Comparison by Asset</p>
      <div className="w-full mx-auto">
        <BarStackedChartComponent
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

