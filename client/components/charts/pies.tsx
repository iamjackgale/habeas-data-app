'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { PieChartDataEntry } from '@/handlers/pie-chart-handler';

export interface TwoLevelPieChartComponentProps {
  /** Inner pie chart data entries (center pie) - mutually exclusive with comparisonData */
  innerData?: PieChartDataEntry[];
  /** Outer pie chart data entries (ring) - mutually exclusive with comparisonData */
  outerData?: PieChartDataEntry[];
  /** Comparison dictionary format Record<string, number[]> - mutually exclusive with innerData/outerData. Supports up to 4 levels. */
  comparisonData?: Record<string, number[]>;
  /** Dates array for table headers - should match the order of values in comparisonData arrays */
  dates?: string[];
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
  '#EA3B4C',
  '#ffc658',
  '#ff7300',
  '#9c88ff',
  '#ff8c94',
];

/**
 * Multi-Level Pie Chart component
 * Displays up to 4 concentric pie charts (levels)
 */
export default function TwoLevelPieChartComponent({
  innerData,
  outerData,
  comparisonData,
  dates = [],
  innerTotalValue,
  outerTotalValue,
  innerColors = DEFAULT_COLORS,
  outerColors = DEFAULT_COLORS,
  height = 500,
  maxWidth = 600,
  isAnimationActive = true,
  showOuterLabels = true,
}: TwoLevelPieChartComponentProps) {
  const MAX_LEVELS = 4;
  const MAX_VISIBLE_SLICES = 5;
  const otherCategoryName = 'other';

  // Determine number of levels from comparisonData
  let numLevels = 0;
  if (comparisonData) {
    // Find the maximum array length in comparisonData to determine number of levels
    const allLengths = Object.values(comparisonData).map((values) => 
      Array.isArray(values) ? values.length : 0
    );
    numLevels = Math.max(...allLengths, 0);
    
    // Validate max 4 levels
    if (numLevels > MAX_LEVELS) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <p className="font-semibold text-red-800">Error</p>
          <p className="text-red-600">
            Maximum {MAX_LEVELS} levels supported. Received {numLevels} levels.
          </p>
        </div>
      );
    }
  } else if (innerData && outerData) {
    // Fallback to 2 levels if using innerData/outerData
    numLevels = 2;
  }

  // Process comparison data if provided
  let processedDataByLevel: PieChartDataEntry[][] = [];
  let totalsByLevel: number[] = [];

  if (comparisonData && numLevels > 0) {
    // Calculate total value for each key (sum across all levels)
    const entries = Object.entries(comparisonData).map(([name, values]) => {
      const levelValues = Array.isArray(values) ? values : [];
      const totalValue = levelValues.reduce((sum, val) => sum + (val || 0), 0);
      return {
        name,
        levelValues,
        totalValue,
      };
    });

    // Sort by total value descending (largest to smallest)
    const sortedEntries = [...entries].sort((a, b) => b.totalValue - a.totalValue);

    // Take top 5 and combine the rest into "Other"
    const visibleEntries = sortedEntries.slice(0, MAX_VISIBLE_SLICES);
    const remainingEntries = sortedEntries.slice(MAX_VISIBLE_SLICES);

    // Process each level
    for (let level = 0; level < numLevels; level++) {
      const levelData: PieChartDataEntry[] = visibleEntries.map((entry) => ({
        name: entry.name,
        value: entry.levelValues[level] || 0,
      }));

      // Calculate "Other" value for this level
      const otherValue = remainingEntries.reduce(
        (sum, entry) => sum + (entry.levelValues[level] || 0),
        0
      );

      // Calculate visible entries total for this level
      const visibleTotal = levelData.reduce((sum, item) => sum + item.value, 0);
      // Calculate full total (visible + other)
      const fullTotal = visibleTotal + otherValue;
      
      // Only add "Other" if it's >= 0.05% of the total
      const otherPercentage = fullTotal > 0 ? (otherValue / fullTotal) : 0;
      const OTHER_THRESHOLD = 0.0005; // 0.05%
      
      if (otherValue > 0 && otherPercentage >= OTHER_THRESHOLD) {
        levelData.push({
          name: otherCategoryName,
          value: otherValue,
        });
      }

      processedDataByLevel.push(levelData);
      
      // Calculate total for this level (will be visibleTotal + otherValue if Other was added, otherwise just visibleTotal)
      const total = levelData.reduce((sum, item) => sum + item.value, 0);
      totalsByLevel.push(total);
    }
  } else if (innerData && outerData) {
    // Fallback to innerData/outerData for 2 levels
    processedDataByLevel = [innerData, outerData];
    totalsByLevel = [
      innerTotalValue ?? innerData.reduce((sum, item) => sum + item.value, 0),
      outerTotalValue ?? outerData.reduce((sum, item) => sum + item.value, 0),
    ];
  }

  // Define radii for each level (up to 4 levels)
  const levelRadii = [
    { inner: '15%', outer: '30%' }, // Level 1 (innermost)
    { inner: '35%', outer: '50%' }, // Level 2
    { inner: '55%', outer: '70%' }, // Level 3
    { inner: '75%', outer: '90%' }, // Level 4 (outermost)
  ];

  return (
    <div className="w-full mx-auto" style={{ maxWidth: `${maxWidth}px` }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart style={{ transform: 'rotate(0deg)' }}>
          {processedDataByLevel.map((levelData, levelIndex) => {
            const radii = levelRadii[levelIndex];
            const colors = levelIndex === 0 ? innerColors : outerColors;
            
            return (
              <Pie
                key={`pie-level-${levelIndex}`}
                data={levelData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={radii.inner}
                outerRadius={radii.outer}
                fill="#8884d8"
                startAngle={90}
                endAngle={-270}
                isAnimationActive={isAnimationActive}
              >
                {levelData.map((entry, index) => (
                  <Cell
                    key={`cell-level-${levelIndex}-${entry.name}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
            );
          })}
        </PieChart>
      </ResponsiveContainer>
      {/* Comparison table */}
      <div className="mt-4 w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="p-2 text-left widget-text font-semibold"></th>
              {dates.length > 0 ? (
                dates.map((date, idx) => (
                  <th key={`header-${idx}`} className="text-right p-2 widget-text font-semibold">
                    {date}
                  </th>
                ))
              ) : (
                processedDataByLevel.map((_, idx) => (
                  <th key={`header-${idx}`} className="text-right p-2 widget-text font-semibold">
                    Level {idx + 1}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {(processedDataByLevel[0] || [])
              .map((entry, index) => {
                const percentages = processedDataByLevel.map((levelData, levelIdx) => {
                  const levelEntry = levelData.find((item) => item.name === entry.name);
                  const total = totalsByLevel[levelIdx] || 1;
                  return total > 0 
                    ? (((levelEntry?.value || 0) / total) * 100).toFixed(1)
                    : '0';
                });
                
                const color = innerColors[index % innerColors.length];
                const isOther = entry.name.toLowerCase() === 'other';
                
                return {
                  entry,
                  percentages,
                  color,
                  isOther,
                };
              })
              .sort((a, b) => {
                // Sort so "other" always appears last (bottom of table)
                if (a.isOther && !b.isOther) return 1;
                if (!a.isOther && b.isOther) return -1;
                return 0; // Maintain original order for non-"other" items
              })
              .map(({ entry, percentages, color }) => (
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
                  {percentages.map((percent, idx) => (
                    <td key={`percent-${idx}`} className="text-right p-2 widget-text">
                      {percent}%
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
