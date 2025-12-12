'use client';

import { useGetPortfolio } from '@/services/octav/loader';
import { TPortfolio } from '@/types/portfolio';
import { getAssetValueDictionary } from '@/handlers/portfolio-handler';
import { processBarChartData } from '@/handlers/bar-chart-handler';
import BarChartComponent from '@/components/charts/bar';
import { useWidgetDefaults } from '@/hooks/use-widget-defaults';
import { useWidgetColors } from '@/hooks/use-widget-colors';

export default function BarCurrentPortfolioByAssetSnapshot() {
  const { defaults, isLoading: defaultsLoading } = useWidgetDefaults();
  const widgetColors = useWidgetColors();
  const targetAddress = defaults?.['bar-current-portfolio-by-asset']?.address || '0xc9c61194682a3a5f56bf9cd5b59ee63028ab6041';
  
  // Get current date for title
  const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  const { data, isLoading, error } = useGetPortfolio({
    addresses: [targetAddress],
    includeImages: true,
    includeExplorerUrls: true,
    waitForSync: true,
  });

  if (defaultsLoading || isLoading) return <p>Loading...</p>;

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
  const portfolio = dataRecord?.[targetAddress] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : null);

  if (!portfolio) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No portfolio data available for bar chart</p>
      </div>
    );
  }

  // Get asset value dictionary
  const assetDictionary = getAssetValueDictionary(portfolio);

  // Process asset dictionary into bar chart data using generic handler
  const { data: barChartData, totalValue } = processBarChartData(assetDictionary, {
    aggregationThreshold: 0.005, // 0.5% threshold
    otherLegendThreshold: 0.00005, // 0.005% threshold
    otherCategoryName: 'other',
  });

  // Show message if no asset data
  if (barChartData.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Asset Data</p>
        <p className="text-yellow-600">No asset data available to display in bar chart</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Portfolio Assets by Asset ({currentDate})</p>
      <div className="w-full mx-auto">
        <BarChartComponent
          data={barChartData}
          totalValue={totalValue}
          colors={widgetColors}
          height={500}
          maxWidth={600}
        />
      </div>
    </div>
  );
}

