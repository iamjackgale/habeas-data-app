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

  // Only show "other" in legend if it's >= otherLegendThreshold of total
  const otherPercentage = totalValue > 0 ? (totalOtherValue / totalValue) : 0;
  if (totalOtherValue > 0 && otherPercentage >= otherLegendThreshold) {
    barChartData.push({
      name: otherCategoryName,
      value: totalOtherValue,
    });
  }

  return { data: barChartData, totalValue };
}

