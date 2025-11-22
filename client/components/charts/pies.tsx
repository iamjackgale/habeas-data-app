'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { PieChartDataEntry } from '@/handlers/pie-chart-handler';

export interface TwoLevelPieChartComponentProps {
  /** Inner pie chart data entries (center pie) - mutually exclusive with comparisonData */
  innerData?: PieChartDataEntry[];
  /** Outer pie chart data entries (ring) - mutually exclusive with comparisonData */
  outerData?: PieChartDataEntry[];
  /** Comparison dictionary format Record<string, [number, number]> - mutually exclusive with innerData/outerData */
  comparisonData?: Record<string, [number, number]>;
  /** Total value for inner data percentage calculations */
  innerTotalValue?: number;
  /** Total value for outer data percentage calculations */
  outerTotalValue?: number;
  /** Colors array for inner pie slices */
  innerColors?: string[];
  /** Colors array for outer pie slices */
  outerColors?: string[];
  /** Chart height (default: 500) */
  height?: number;
  /** Width constraint (default: 600px) */
  maxWidth?: number;
  /** Whether animation is active (default: true) */
  isAnimationActive?: boolean;
  /** Whether to show labels on outer pie (default: true) */
  showOuterLabels?: boolean;
}

const DEFAULT_COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#9c88ff',
  '#ff8c94',
];

/**
 * Two-Level Pie Chart component
 * Displays an inner pie chart (center) and an outer pie chart (ring)
 */
export default function TwoLevelPieChartComponent({
  innerData,
  outerData,
  comparisonData,
  innerTotalValue,
  outerTotalValue,
  innerColors = DEFAULT_COLORS,
  outerColors = DEFAULT_COLORS,
  height = 500,
  maxWidth = 600,
  isAnimationActive = true,
  showOuterLabels = true,
}: TwoLevelPieChartComponentProps) {
  // Convert comparison data to inner and outer data if provided
  let processedInnerData: PieChartDataEntry[] = innerData || [];
  let processedOuterData: PieChartDataEntry[] = outerData || [];

  if (comparisonData) {
    // Process comparison data to limit to 6 slices (5 largest + 1 "Other")
    const MAX_VISIBLE_SLICES = 5;
    const otherCategoryName = 'other';

    // Calculate total value for each key (sum of inner + outer values)
    const entries = Object.entries(comparisonData).map(([name, [innerVal, outerVal]]) => ({
      name,
      innerValue: innerVal || 0,
      outerValue: outerVal || 0,
      totalValue: (innerVal || 0) + (outerVal || 0),
    }));

    // Sort by total value descending (largest to smallest)
    const sortedEntries = [...entries].sort((a, b) => b.totalValue - a.totalValue);

    // Take top 5 and combine the rest into "Other"
    const visibleEntries = sortedEntries.slice(0, MAX_VISIBLE_SLICES);
    const remainingEntries = sortedEntries.slice(MAX_VISIBLE_SLICES);

    // Calculate "Other" values
    const otherInnerValue = remainingEntries.reduce((sum, entry) => sum + entry.innerValue, 0);
    const otherOuterValue = remainingEntries.reduce((sum, entry) => sum + entry.outerValue, 0);

    // Build final arrays: top 5 first, then "Other" always at the end
    processedInnerData = visibleEntries.map((entry) => ({
      name: entry.name,
      value: entry.innerValue,
    }));
    processedOuterData = visibleEntries.map((entry) => ({
      name: entry.name,
      value: entry.outerValue,
    }));

    // Add "Other" if it has any value
    if (otherInnerValue > 0 || otherOuterValue > 0) {
      processedInnerData.push({
        name: otherCategoryName,
        value: otherInnerValue,
      });
      processedOuterData.push({
        name: otherCategoryName,
        value: otherOuterValue,
      });
    }
  }

  // Calculate totals if not provided
  const innerTotal = innerTotalValue ?? processedInnerData.reduce((sum, item) => sum + item.value, 0);
  const outerTotal = outerTotalValue ?? processedOuterData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full mx-auto" style={{ maxWidth: `${maxWidth}px` }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart style={{ transform: 'rotate(0deg)' }}>
          {/* Inner pie chart (center) */}
          <Pie
            data={processedInnerData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius="30%"
            outerRadius="50%"
            fill="#8884d8"
            startAngle={90}
            endAngle={-270} 
            isAnimationActive={isAnimationActive}
          >
            {processedInnerData.map((entry, index) => (
              <Cell
                key={`inner-cell-${entry.name}`}
                fill={innerColors[index % innerColors.length]}
              />
            ))}
          </Pie>
          {/* Outer pie chart (ring) */}
          <Pie
            data={processedOuterData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            fill="#82ca9d"
            startAngle={90}
            endAngle={-270} 
            isAnimationActive={isAnimationActive}
          >
            {processedOuterData.map((entry, index) => (
              <Cell
                key={`outer-cell-${entry.name}`}
                fill={outerColors[index % outerColors.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Comparison table */}
      <div className="mt-4 w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {processedInnerData
              .map((entry, index) => {
                const innerPercent = innerTotal > 0 ? ((entry.value / innerTotal) * 100).toFixed(1) : '0';
                const outerEntry = processedOuterData.find((item) => item.name === entry.name);
                const outerPercent = outerEntry && outerTotal > 0 ? ((outerEntry.value / outerTotal) * 100).toFixed(1) : '0';
                const color = innerColors[index % innerColors.length];
                
                return {
                  entry,
                  innerPercent,
                  outerPercent,
                  color,
                  isOther: entry.name.toLowerCase() === 'other',
                };
              })
              .sort((a, b) => {
                // Sort so "other" always appears last (bottom of table)
                if (a.isOther && !b.isOther) return 1;
                if (!a.isOther && b.isOther) return -1;
                return 0; // Maintain original order for non-"other" items
              })
              .map(({ entry, innerPercent, outerPercent, color }) => (
                <tr key={entry.name} className="border-b border-gray-300">
                  <td className="p-2 widget-text">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span>{entry.name}</span>
                    </div>
                  </td>
                  <td className="text-right p-2 widget-text">{innerPercent}%</td>
                  <td className="text-right p-2 widget-text">{outerPercent}%</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
