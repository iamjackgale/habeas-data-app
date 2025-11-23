'use client';

import { useGetHistorical } from '@/services/octav/loader';
import { TPortfolio } from '@/types/portfolio';
import { getProtocolValueDictionary, getComparisonProtocolValueDictionary } from '@/handlers/portfolio-handler';
import TwoLevelPieChartComponent from '@/components/charts/pies';
import { useWidgetColors } from '@/hooks/use-widget-colors';

interface PiesPortfolioByProtocolProps {
  address: string;
  dates: string[];
}

export default function PiesPortfolioByProtocol({ address, dates: rawDates }: PiesPortfolioByProtocolProps) {
  // Load colors from config
  const widgetColors = useWidgetColors();
  
  const MAX_DATES = 5;
  
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
  const historicalData = dates.map(date => 
    useGetHistorical({
      addresses: [address],
      date: date,
    })
  );

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

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Portfolio Comparison by Protocol</p>
      <div className="w-full mx-auto">
        <TwoLevelPieChartComponent
          comparisonData={comparisonDictionary}
          dates={dates}
          innerColors={widgetColors}
          outerColors={widgetColors}
          height={500}
          maxWidth={800}
        />
      </div>
    </div>
  );
}

