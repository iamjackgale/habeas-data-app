'use client';

import { useGetPortfolio } from '@/services/octav/loader';
import { Portfolio } from '@/types/portfolio';
import { getAssetValueDictionary } from '@/handlers/portfolio-handler';
import { processPieChartData } from '@/handlers/pie-chart-handler';
import PieChartComponent from '@/components/charts/pie';
import { useWidgetDefaults } from '@/hooks/use-widget-defaults';

export default function PieCurrentPortfolioByAssetSnapshot() {
  const { defaults, isLoading: defaultsLoading } = useWidgetDefaults();
  const targetAddress = defaults?.['pie-current-portfolio-by-asset']?.address || '0xc9c61194682a3a5f56bf9cd5b59ee63028ab6041';
  
  // Get current date for title
  const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  const { data, isLoading, error } = useGetPortfolio({
    address: targetAddress,
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
  const dataRecord = data as Record<string, Portfolio> | undefined;
  const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, Portfolio][] : [];
  const portfolio = dataRecord?.[targetAddress] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : null);

  if (!portfolio) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No portfolio data available for pie chart</p>
      </div>
    );
  }

  const assetDictionary = getAssetValueDictionary(portfolio);

  // Process asset dictionary into pie chart data using generic handler
  const { data: pieChartData, totalValue } = processPieChartData(assetDictionary, {
    aggregationThreshold: 0.005, // 0.5% threshold
    otherLegendThreshold: 0.00005, // 0.005% threshold
    otherCategoryName: 'other',
  });

  // Show message if no asset data
  if (pieChartData.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Asset Data</p>
        <p className="text-yellow-600">No asset data available to display in pie chart</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Portfolio Assets by Asset ({currentDate})</p>
      <div className="w-full mx-auto">
        <PieChartComponent
          data={pieChartData}
          totalValue={totalValue}
          labelThreshold={0.01} // 1% threshold for label visibility
          otherCategoryName="other"
          height={500}
          outerRadius={150}
          maxWidth={600}
        />
      </div>
    </div>
  );
}

