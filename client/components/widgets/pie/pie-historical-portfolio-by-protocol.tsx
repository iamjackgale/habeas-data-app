'use client';

import { useGetHistorical } from '@/services/octav/loader';
import { TPortfolio } from '@/types/portfolio';
import { getProtocolValueDictionary } from '@/handlers/portfolio-handler';
import { processPieChartData } from '@/handlers/pie-chart-handler';
import PieChartComponent from '@/components/charts/pie';

interface PieHistoricalPortfolioByProtocolProps {
  address: string;
  date: string;
}

export default function PieHistoricalPortfolioByProtocol({ address, date }: PieHistoricalPortfolioByProtocolProps) {
  const { data, isLoading, error } = useGetHistorical({
    addresses: [address],
    date: date
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
  const dataRecord = data as Record<string, TPortfolio> | undefined;
  const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, TPortfolio][] : [];
  const portfolio = dataRecord?.[address] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : null);

  if (!portfolio) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No historical portfolio data available for pie chart</p>
      </div>
    );
  }

  const protocolDictionary = getProtocolValueDictionary(portfolio);

  // Process protocol dictionary into pie chart data using generic handler
  const { data: pieChartData, totalValue } = processPieChartData(protocolDictionary, {
    aggregationThreshold: 0.005, // 0.5% threshold
    otherLegendThreshold: 0.00005, // 0.005% threshold
    otherCategoryName: 'other',
  });

  // Show message if no protocol data
  if (pieChartData.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Protocol Data</p>
        <p className="text-yellow-600">No protocol data available to display in pie chart</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Portfolio Assets by Protocol ({date})</p>
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

