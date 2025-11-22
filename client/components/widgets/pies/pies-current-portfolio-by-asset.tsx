'use client';

import { useGetHistorical } from '@/services/octav/loader';
import { Portfolio } from '@/types/portfolio';
import { getAssetValueDictionary, getComparisonAssetValueDictionary } from '@/handlers/portfolio-handler';
import TwoLevelPieChartComponent from '@/components/charts/pies';

export default function PiesCurrentPortfolioByAsset() {
  const targetAddress = '0x3f5eddad52c665a4aa011cd11a21e1d5107d7862';
  const date1 = '2025-06-06';
  const date2 = '2025-11-22';
  
  // Fetch historical data for both dates using separate hooks
  const { data: data1, isLoading: isLoading1, error: error1 } = useGetHistorical({
    address: targetAddress,
    date: date1,
  });

  const { data: data2, isLoading: isLoading2, error: error2 } = useGetHistorical({
    address: targetAddress,
    date: date2,
  });

  const isLoading = isLoading1 || isLoading2;
  const error = error1 || error2;

  if (isLoading) return <p>Loading...</p>;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  // Extract portfolios from Record structure
  const dataRecord1 = data1 as Record<string, Portfolio> | undefined;
  const portfolioEntries1 = dataRecord1 ? Object.entries(dataRecord1) as [string, Portfolio][] : [];
  const portfolio1 = dataRecord1?.[targetAddress] || (portfolioEntries1.length > 0 ? portfolioEntries1[0][1] : null);

  const dataRecord2 = data2 as Record<string, Portfolio> | undefined;
  const portfolioEntries2 = dataRecord2 ? Object.entries(dataRecord2) as [string, Portfolio][] : [];
  const portfolio2 = dataRecord2?.[targetAddress] || (portfolioEntries2.length > 0 ? portfolioEntries2[0][1] : null);

  if (!portfolio1 || !portfolio2) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">Historical portfolio data not available for comparison</p>
      </div>
    );
  }

  // Get asset dictionaries for both dates
  const assetDictionary1 = getAssetValueDictionary(portfolio1);
  const assetDictionary2 = getAssetValueDictionary(portfolio2);

  // Create comparison dictionary
  const comparisonDictionary = getComparisonAssetValueDictionary(assetDictionary1, assetDictionary2);

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
      <p className="font-semibold widget-text mb-4">Portfolio Comparison by Asset ({date1} vs {date2})</p>
      <div className="w-full mx-auto">
        <TwoLevelPieChartComponent
          comparisonData={comparisonDictionary}
          height={500}
          maxWidth={600}
        />
      </div>
    </div>
  );
}

