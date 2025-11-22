/**
 * Configuration options for pie chart data processing
 */
export interface PieChartConfig {
  /** Threshold for aggregating small slices into "other" (default: 0.5%) */
  aggregationThreshold?: number;
  /** Threshold for showing "other" in legend (default: 0.005%) */
  otherLegendThreshold?: number;
  /** Custom name for the "other" category (default: "other") */
  otherCategoryName?: string;
}

/**
 * Pie chart data entry (compatible with Recharts)
 */
export type PieChartDataEntry = {
  name: string;
  value: number;
} & Record<string, string | number>;

/**
 * Process a data record into pie chart data with aggregation
 * 
 * @param dataRecord - Record of key-value pairs (values can be string or number)
 * @param config - Configuration options for processing
 * @returns Object containing processed pie chart data and total value
 */
export function processPieChartData(
  dataRecord: Record<string, string | number> | undefined,
  config: PieChartConfig = {}
): { data: PieChartDataEntry[]; totalValue: number } {
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

  // Transform dictionary to pie chart data format
  const allData: PieChartDataEntry[] = Object.entries(dataRecord).map(([key, value]) => ({
    name: key,
    value: typeof value === 'string' ? parseFloat(value) || 0 : value || 0,
  }));

  // Calculate total value
  const totalValue = allData.reduce((sum, item) => sum + item.value, 0);

  if (totalValue === 0) {
    return { data: [], totalValue: 0 };
  }

  // Separate slices into main (>= threshold) and other (< threshold)
  const threshold = totalValue * aggregationThreshold;
  const mainSlices = allData.filter(item => item.value >= threshold);
  const otherSlices = allData.filter(item => item.value < threshold);
  const otherValue = otherSlices.reduce((sum, item) => sum + item.value, 0);

  // Sort main slices by value descending (largest to smallest)
  const sortedMainSlices = [...mainSlices].sort((a, b) => b.value - a.value);

  // Limit to maximum 6 slices: 5 largest + 1 "Other"
  const MAX_VISIBLE_SLICES = 5;
  const visibleSlices = sortedMainSlices.slice(0, MAX_VISIBLE_SLICES);
  const remainingSlices = sortedMainSlices.slice(MAX_VISIBLE_SLICES);
  
  // Calculate the "other" value from both small slices and remaining large slices
  const remainingLargeValue = remainingSlices.reduce((sum, item) => sum + item.value, 0);
  const totalOtherValue = otherValue + remainingLargeValue;

  // Build final array: top 5 slices first, then "other" always at the end
  const pieChartData: PieChartDataEntry[] = [...visibleSlices];

  // Only show "other" in legend if it's >= otherLegendThreshold of total
  const otherPercentage = totalValue > 0 ? (totalOtherValue / totalValue) : 0;
  if (totalOtherValue > 0 && otherPercentage >= otherLegendThreshold) {
    pieChartData.push({
      name: otherCategoryName,
      value: totalOtherValue,
    });
  }

  return { data: pieChartData, totalValue };
}

