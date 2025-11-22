'use client';

import { useGetHistorical } from '@/services/octav/loader';
import { TPortfolio } from '@/types/portfolio';
import { getAssetValueDictionary, getComparisonAssetValueDictionary } from '@/handlers/portfolio-handler';
import TwoLevelPieChartComponent from '@/components/charts/pies';
import { useWidgetDefaults } from '@/hooks/use-widget-defaults';

export default function PiesPortfolioByAssetSnapshot() {
  const { defaults, isLoading: defaultsLoading } = useWidgetDefaults();
  const MAX_DATES = 4;
  // Get dates from config defaults
  const rawDates = defaults?.['pies-portfolio-by-asset']?.dates || ['2025-06-06', '2025-11-22', '2025-01-01'];
  const targetAddress = defaults?.['pies-portfolio-by-asset']?.address || '0x3f5eddad52c665a4aa011cd11a21e1d5107d7862';
  
  // Validate max 4 dates
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
  const historicalData = dates.map(date => 
    useGetHistorical({
      addresses: [targetAddress],
      date: date,
    })
  );

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
    const dataRecord = result.data as Record<string, TPortfolio> | undefined;
    const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, TPortfolio][] : [];
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
    .filter((portfolio): portfolio is TPortfolio => portfolio !== undefined)
    .map(portfolio => getAssetValueDictionary(portfolio));

  // Create comparison dictionary with all dictionaries
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

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Portfolio Comparison by Asset</p>
      <div className="w-full mx-auto">
        <TwoLevelPieChartComponent
          comparisonData={comparisonDictionary}
          dates={dates}
          height={500}
          maxWidth={600}
        />
      </div>
    </div>
  );
}

