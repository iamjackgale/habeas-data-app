'use client';

import { useGetPortfolio } from '@/services/octav/loader';
import { TPortfolio } from '@/types/portfolio';
import { getAssetValueDictionary } from '@/handlers/portfolio-handler';
import { TableBase, TableDataEntry } from './table-base';
import { LoadingSpinner } from '@/components/loading-spinner';

interface TablePortfolioByAssetProps {
  address: string;
}

export default function TablePortfolioByAsset({ address }: TablePortfolioByAssetProps) {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const { data, isLoading, error } = useGetPortfolio({
    addresses: [address],
    includeImages: true,
    includeExplorerUrls: true,
    waitForSync: true,
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

  // Extract portfolio from Record structure
  const dataRecord = data as Record<string, TPortfolio> | undefined;
  const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, TPortfolio][] : [];
  const portfolio = dataRecord?.[address] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : null);

  if (!portfolio) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No portfolio data available</p>
      </div>
    );
  }

  // Get asset value dictionary
  const assetDictionary = getAssetValueDictionary(portfolio);

  // Convert dictionary to table data format
  const tableData: TableDataEntry[] = Object.entries(assetDictionary).map(([name, value]) => ({
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
    <TableBase
      title={`Portfolio Assets by Asset (${currentDate})`}
      data={tableData}
    />
  );
}

