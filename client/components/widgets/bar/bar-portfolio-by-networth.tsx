'use client';

import { useGetHistorical } from '@/services/octav/loader';
import { TPortfolio } from '@/types/portfolio';
import { getComparisonNetWorthDictionary } from '@/handlers/portfolio-handler';
import { BarChartDataEntry } from '@/handlers/bar-chart-handler';
import BarChartComponent from '@/components/charts/bar';

interface BarPortfolioByNetWorthProps {
  address: string;
  dates: string[];
}

export default function BarPortfolioByNetWorth({ address, dates: rawDates }: BarPortfolioByNetWorthProps) {
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
  // Hooks must be called unconditionally at the top level, so we call them individually
  // Always call exactly MAX_DATES hooks (5) in the same order for React's rules
  // Use actual dates from the array, or use a dummy date for unused slots (results will be ignored)
  const DUMMY_DATE = '2025-01-01'; // Valid date, but unused results will be filtered out
  
  // Call hooks individually (always call MAX_DATES hooks in same order)
  const hook1 = useGetHistorical({
    addresses: [address],
    date: dates[0] || DUMMY_DATE,
  });
  const hook2 = useGetHistorical({
    addresses: [address],
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

  // Create array of hook results, but only use the ones corresponding to actual dates
  const allHookResults = [hook1, hook2, hook3, hook4, hook5];
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

  // Get net worth dictionary using getComparisonNetWorthDictionary
  const netWorthDictionary = getComparisonNetWorthDictionary(dates, portfolios);

  // Check if net worth data is empty
  if (Object.keys(netWorthDictionary).length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Net Worth Data</p>
        <p className="text-yellow-600">No net worth data available to display in bar chart</p>
      </div>
    );
  }

  // Transform net worth dictionary into bar chart data format
  // Format: [{ name: '2025-01-01', value: 1000000 }, { name: '2025-06-06', value: 1500000 }, ...]
  const barChartData: BarChartDataEntry[] = dates.map((date) => ({
    name: date,
    value: netWorthDictionary[date] || 0,
  }));

  // Calculate total value for percentage calculations
  const totalValue = barChartData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Portfolio Net Worth by Date</p>
      <div className="w-full mx-auto">
        <BarChartComponent
          data={barChartData}
          totalValue={totalValue}
          height={500}
          maxWidth={600}
        />
      </div>
    </div>
  );
}

