import { BarStackedChartDataEntry } from "@/handlers/bar-chart-handler";
import { useWidgetColors } from "@/hooks/use-widget-colors";
import { useGetHistoricalRange } from "@/services/octav/loader";
import BarStackedChartComponent from '@/components/charts/bar-stacked';


interface BarStackedNetworthByChainProps {
  addresses: string[];
  dates: string[];
}

export default function BarStackedNetworthByChain({ addresses, dates: rawDates }: BarStackedNetworthByChainProps) {
  // Load colors from config
  const widgetColors = useWidgetColors();
  
  const MAX_DATES = 12;
  
  // Validate max 12 dates
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
  
  const {data, isLoading, error} = useGetHistoricalRange({
    addresses,
    dates
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

  if (!data) {
    return null
  };

  /* Prepare data for stacked bar chart, aggregate chain balances amongst all wallets by date
  we should end with an array of objects like:
  [
    { 
      date: date0, 
      chain0: chain0NetworthAggregatedAmongstAllWallets,
      chain1: chain1NetworthAggregatedAmongstAllWallets,
      ...
    },
    {
      date: date1,
      chain0: chain0NetworthAggregatedAmongstAllWallets,
      chain1: chain1NetworthAggregatedAmongstAllWallets,
      ...
    },
    ...
  ]
  */
  
  // Build a comparison dictionary: { chainKey: [value_date0, value_date1, ...] }
  const comparisonDictionary: Record<string, number[]> = {};
  
  dates.forEach((date, dateIndex) => {
    const dateData = data[date];
    if (!dateData) return;
    
    // Aggregate chain balances across all addresses for this date
    const chainTotals: Record<string, number> = {};
    
    Object.values(dateData).forEach((portfolio) => {
      if (!portfolio.chains) return;
      
      Object.entries(portfolio.chains).forEach(([chainKey, chainData]) => {
        const chainValue = parseFloat(chainData.value) || 0;
        chainTotals[chainKey] = (chainTotals[chainKey] || 0) + chainValue;
      });
    });
    
    // For each chain in the dictionary, add its value for this date (or 0 if missing)
    Object.keys(comparisonDictionary).forEach((chainKey) => {
      comparisonDictionary[chainKey].push(chainTotals[chainKey] || 0);
    });
    
    // Add any new chains that appeared for the first time on this date
    Object.entries(chainTotals).forEach(([chainKey, total]) => {
      if (!comparisonDictionary[chainKey]) {
        // Initialize with zeros for all previous dates
        comparisonDictionary[chainKey] = new Array(dateIndex).fill(0);
        // Add the current date's value
        comparisonDictionary[chainKey].push(total);
      }
    });
  });

  // Transform comparison dictionary to stacked bar format
  // Input: { "ethereum": [1000, 2000, 3000], "arbitrum": [500, 600, 700] }
  // Output: [{ name: "2025-01-01", ethereum: 1000, arbitrum: 500 }, { name: "2025-06-06", ethereum: 2000, arbitrum: 600 }, ...]
  const stackedData: BarStackedChartDataEntry[] = dates.map((date, dateIndex) => {
    const entry: BarStackedChartDataEntry = { name: date };
    
    // For each chain, get its value for this date
    Object.entries(comparisonDictionary).forEach(([chainName, values]) => {
      entry[chainName] = values[dateIndex] || 0;
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

  // Get all chain names (dataKeys for the stacks)
  const dataKeys = Object.keys(comparisonDictionary);

  // Limit to top 10 chains + "Other" (similar to other charts)
  const MAX_VISIBLE_CHAINS = 10;
  const otherCategoryName = 'other';
  
  // Calculate total value per chain across all dates
  const chainTotals = dataKeys.map(chainName => {
    const total = stackedData.reduce((sum, entry) => {
      const value = entry[chainName];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    return { chainName, total };
  });

  // Sort by total descending
  const sortedChains = [...chainTotals].sort((a, b) => b.total - a.total);

  // Take top 5 chains
  const visibleChains = sortedChains.slice(0, MAX_VISIBLE_CHAINS);
  const remainingChains = sortedChains.slice(MAX_VISIBLE_CHAINS);

  // Build final stacked data with only visible chains
  const finalStackedData: BarStackedChartDataEntry[] = stackedData.map(entry => {
    const newEntry: BarStackedChartDataEntry = { name: entry.name };
    visibleChains.forEach(({ chainName }) => {
      const value = entry[chainName];
      newEntry[chainName] = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
    });
    return newEntry;
  });

  // Calculate "Other" for each date
  const otherTotal = remainingChains.reduce((sum, { chainName }) => {
    return sum + stackedData.reduce((dateSum, entry) => {
      const value = entry[chainName];
      return dateSum + (typeof value === 'number' ? value : 0);
    }, 0);
  }, 0);

  // Add "Other" if it has any value
  const otherPercentage = totalValue > 0 ? (otherTotal / totalValue) : 0;
  const OTHER_THRESHOLD = 0.00005; // 0.005%
  
  if (otherTotal > 0 && otherPercentage >= OTHER_THRESHOLD) {
    finalStackedData.forEach(entry => {
      const otherValue = remainingChains.reduce((sum, { chainName }) => {
        const originalEntry = stackedData.find(e => e.name === entry.name);
        const value = originalEntry?.[chainName];
        return sum + (typeof value === 'number' ? value : 0);
      }, 0);
      entry[otherCategoryName] = otherValue;
    });
  }

  // Final data keys (visible chains + "Other" if applicable)
  const finalDataKeys = visibleChains.map(({ chainName }) => chainName);
  if (otherTotal > 0 && otherPercentage >= OTHER_THRESHOLD) {
    finalDataKeys.push(otherCategoryName);
  }

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Portfolio Comparison by Chain</p>
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