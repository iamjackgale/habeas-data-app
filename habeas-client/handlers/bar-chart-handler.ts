/**
 * Configuration options for bar chart data processing
 */
export interface BarChartConfig {
  /** Threshold for aggregating small values into "other" (default: 0.5%) */
  aggregationThreshold?: number;
  /** Threshold for showing "other" in legend (default: 0.005%) */
  otherLegendThreshold?: number;
  /** Custom name for the "other" category (default: "other") */
  otherCategoryName?: string;
}

/**
 * Bar chart data entry (compatible with Recharts)
 */
export type BarChartDataEntry = {
  name: string;
  value: number;
} & Record<string, string | number>;

/**
 * Process a data record into bar chart data with aggregation
 * 
 * @param dataRecord - Record of key-value pairs (values can be string or number)
 * @param config - Configuration options for processing
 * @returns Object containing processed bar chart data and total value
 */
export function processBarChartData(
  dataRecord: Record<string, string | number> | undefined,
  config: BarChartConfig = {}
): { data: BarChartDataEntry[]; totalValue: number } {
  // Default configuration
  const {
    aggregationThreshold = 0.005, // 0.5% as decimal
    otherLegendThreshold = 0.00005, // 0.005% as decimal
    otherCategoryName = 'other',
  } = config;

  // Handle undefined or empty data
  if (!dataRecord || Object.keys(dataRecord).length === 0) {
    return { data: [], totalValue: 0 };
  }

  // Transform dictionary to bar chart data format
  const allData: BarChartDataEntry[] = Object.entries(dataRecord).map(([key, value]) => ({
    name: key,
    value: typeof value === 'string' ? parseFloat(value) || 0 : value || 0,
  }));

  // Calculate total value
  const totalValue = allData.reduce((sum, item) => sum + item.value, 0);

  if (totalValue === 0) {
    return { data: [], totalValue: 0 };
  }

  // Separate values into main (>= threshold) and other (< threshold)
  const threshold = totalValue * aggregationThreshold;
  const mainBars = allData.filter(item => item.value >= threshold);
  const otherBars = allData.filter(item => item.value < threshold);
  const otherValue = otherBars.reduce((sum, item) => sum + item.value, 0);

  // Sort main bars by value descending (largest to smallest)
  const sortedMainBars = [...mainBars].sort((a, b) => b.value - a.value);

  // Limit to maximum 6 bars: 5 largest + 1 "Other"
  const MAX_VISIBLE_BARS = 5;
  const visibleBars = sortedMainBars.slice(0, MAX_VISIBLE_BARS);
  const remainingBars = sortedMainBars.slice(MAX_VISIBLE_BARS);
  
  // Calculate the "other" value from both small bars and remaining large bars
  const remainingLargeValue = remainingBars.reduce((sum, item) => sum + item.value, 0);
  const totalOtherValue = otherValue + remainingLargeValue;

  // Build final array: top 5 bars first, then "other" always at the end
  const barChartData: BarChartDataEntry[] = [...visibleBars];

  // Show "other" if:
  // 1. We have more than 5 main bars (we're limiting to top 5), OR
  // 2. We have small bars aggregated (< threshold), OR  
  // 3. The "other" value is >= otherLegendThreshold of total (for very small aggregations)
  const hasMoreThanFiveMainBars = sortedMainBars.length > MAX_VISIBLE_BARS;
  const hasSmallBars = otherBars.length > 0;
  const otherPercentage = totalValue > 0 ? (totalOtherValue / totalValue) : 0;
  
  // Always show "Other" if we're limiting to 5 bars or have aggregated small bars
  // Otherwise, only show if it meets the percentage threshold
  if (totalOtherValue > 0 && (hasMoreThanFiveMainBars || hasSmallBars || otherPercentage >= otherLegendThreshold)) {
    barChartData.push({
      name: otherCategoryName,
      value: totalOtherValue,
    });
  }

  return { data: barChartData, totalValue };
}

/**
 * Bar stacked chart data entry (compatible with Recharts stacked bars)
 */
export type BarStackedChartDataEntry = {
  name: string;
  [key: string]: string | number;
};

/**
 * Configuration options for bar stacked chart data processing
 */
export interface BarStackedChartConfig {
  /** Threshold for aggregating small values into "other" (default: 0.5%) */
  aggregationThreshold?: number;
  /** Threshold for showing "other" in legend (default: 0.005%) */
  otherLegendThreshold?: number;
  /** Custom name for the "other" category (default: "other") */
  otherCategoryName?: string;
  /** Labels for each stack (optional, uses keys if not provided) */
  stackLabels?: string[];
}

/**
 * Process multiple data records into bar stacked chart data
 * Each record becomes a stack segment
 * 
 * @param dataRecords - Array of records (each record becomes a stack segment)
 * @param config - Configuration options for processing
 * @returns Object containing processed bar stacked chart data, total value, and data keys
 */
export function processBarStackedChartData(
  dataRecords: Record<string, string | number>[],
  config: BarStackedChartConfig = {}
): { data: BarStackedChartDataEntry[]; totalValue: number; dataKeys: string[] } {
  // Default configuration
  const {
    aggregationThreshold = 0.005, // 0.5% as decimal
    otherLegendThreshold = 0.00005, // 0.005% as decimal
    otherCategoryName = 'other',
    stackLabels = [],
  } = config;

  // Handle empty data
  if (!dataRecords || dataRecords.length === 0) {
    return { data: [], totalValue: 0, dataKeys: [] };
  }

  // Generate data keys (stack labels) if not provided
  const dataKeys = stackLabels.length > 0 
    ? stackLabels 
    : dataRecords.map((_, index) => `stack${index + 1}`);

  // Collect all unique keys across all records
  const allKeys = new Set<string>();
  dataRecords.forEach(record => {
    Object.keys(record).forEach(key => allKeys.add(key));
  });

  // Build stacked data entries
  const stackedData: BarStackedChartDataEntry[] = [];

  allKeys.forEach(key => {
    const entry: BarStackedChartDataEntry = { name: key };
    
    // Get values from each record for this key
    dataRecords.forEach((record, index) => {
      const value = record[key];
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
      entry[dataKeys[index]] = numValue;
    });

    stackedData.push(entry);
  });

  // Calculate total value (sum of all stacks)
  const totalValue = stackedData.reduce((sum, entry) => {
    const entryTotal = dataKeys.reduce((entrySum, key) => {
      const value = entry[key];
      const numValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
      return entrySum + numValue;
    }, 0);
    return sum + entryTotal;
  }, 0);

  if (totalValue === 0) {
    return { data: [], totalValue: 0, dataKeys };
  }

  // Process each key to limit to top 5 + "other"
  const MAX_VISIBLE_BARS = 5;
  
  // Calculate total value per key (sum across all stacks)
  const keyTotals = stackedData.map(entry => {
    const total = dataKeys.reduce((sum, key) => {
      const value = entry[key];
      const numValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
      return sum + numValue;
    }, 0);
    return {
      name: entry.name,
      total,
      entry,
    };
  });

  // Sort by total descending
  const sortedKeys = [...keyTotals].sort((a, b) => b.total - a.total);

  // Take top 5
  const visibleEntries = sortedKeys.slice(0, MAX_VISIBLE_BARS);
  const remainingEntries = sortedKeys.slice(MAX_VISIBLE_BARS);

  // Calculate "Other" for each stack
  const otherEntry: BarStackedChartDataEntry = { name: otherCategoryName };
  dataKeys.forEach((key, index) => {
    const otherValue = remainingEntries.reduce((sum, item) => {
      const value = item.entry[key];
      const numValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
      return sum + numValue;
    }, 0);
    otherEntry[key] = otherValue;
  });

  // Build final array
  const finalData: BarStackedChartDataEntry[] = visibleEntries.map(item => item.entry);

  // Add "Other" if it has any value
  const otherTotal = dataKeys.reduce((sum, key) => {
    const value = otherEntry[key];
    const numValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
    return sum + numValue;
  }, 0);
  
  const otherPercentage = totalValue > 0 ? (otherTotal / totalValue) : 0;
  if (otherTotal > 0 && otherPercentage >= otherLegendThreshold) {
    finalData.push(otherEntry);
  }

  return { data: finalData, totalValue, dataKeys };
}

/**
 * Process transactions into a dictionary of date:transaction_count
 * Groups transactions by date (YYYY-MM-DD format) and counts them
 * 
 * @param transactions - Array of transactions with timestamp field
 * @param startDate - Start date of the range (YYYY-MM-DD)
 * @param endDate - End date of the range (YYYY-MM-DD)
 * @returns Dictionary with date as key and transaction count as value
 */
export function processTransactionsByDate(
  transactions: Array<{ timestamp: string }>,
  startDate: string,
  endDate: string
): Record<string, number> {
  // Initialize dictionary with all dates in range set to 0
  const dateCounts: Record<string, number> = {};
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Generate all dates in the range
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    dateCounts[dateStr] = 0;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Count transactions by date
  transactions.forEach(transaction => {
    if (transaction.timestamp) {
      console.log('transaction.timestamp ' + transaction.timestamp);
      const txDate = new Date(Number(transaction.timestamp) * 1000);
      console.log('txDate ' + txDate);
      console.log('isNaN(txDate.getTime()) ' + isNaN(txDate.getTime()));
      
      // Validate the date is valid before using it
      if (isNaN(txDate.getTime())) {
        console.log('NaN date');
        // Invalid date, skip this transaction
        return;
      }
      
      const dateStr = txDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Only count if date is within range
      if (dateStr >= startDate && dateStr <= endDate) {
        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
      }
    }
  });
  
  return dateCounts;
}

