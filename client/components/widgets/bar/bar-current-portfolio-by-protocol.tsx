'use client';

import { useGetPortfolio } from '@/services/octav/loader';
import { Portfolio } from '@/types/portfolio';
import { getProtocolValueDictionary } from '@/handlers/portfolio-handler';
import { processBarChartData } from '@/handlers/bar-chart-handler';
import BarChartComponent from '@/components/charts/bar';
import { useWidgetColors } from '@/hooks/use-widget-colors';

interface BarCurrentPortfolioByProtocolProps {
  address: string;
}

export default function BarCurrentPortfolioByProtocol({ address }: BarCurrentPortfolioByProtocolProps) {
  // Get current date for title
  const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  // Load colors from config
  const widgetColors = useWidgetColors();
  
  const { data, isLoading, error } = useGetPortfolio({
    address: address,
    includeImages: true,
    includeExplorerUrls: true,
    waitForSync: true,
  });

  if (isLoading) return <p>Loading...</p>;

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
  const portfolio = dataRecord?.[address] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : null);

  if (!portfolio) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No portfolio data available for bar chart</p>
      </div>
    );
  }

  // Get protocol value dictionary
  const protocolDictionary = getProtocolValueDictionary(portfolio);

  // Process protocol dictionary into bar chart data using generic handler
  const { data: barChartData, totalValue } = processBarChartData(protocolDictionary, {
    aggregationThreshold: 0.005, // 0.5% threshold
    otherLegendThreshold: 0.00005, // 0.005% threshold
    otherCategoryName: 'other',
  });

  // Show message if no protocol data
  if (barChartData.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Protocol Data</p>
        <p className="text-yellow-600">No protocol data available to display in bar chart</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Portfolio Assets by Protocol ({currentDate})</p>
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