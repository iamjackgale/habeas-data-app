'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from 'recharts';
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
    processedInnerData = Object.entries(comparisonData).map(([name, [value]]) => ({
      name,
      value,
    }));
    processedOuterData = Object.entries(comparisonData).map(([name, [, value]]) => ({
      name,
      value,
    }));
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
            outerRadius="50%"
            fill="#8884d8"
            startAngle={0}
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
            label={showOuterLabels}
            startAngle={0}
            isAnimationActive={isAnimationActive}
          >
            {processedOuterData.map((entry, index) => (
              <Cell
                key={`outer-cell-${entry.name}`}
                fill={outerColors[index % outerColors.length]}
              />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => {
              // Check if it's an inner data item
              const innerItem = processedInnerData.find((item) => item.name === value);
              if (innerItem) {
                const percent = innerTotal > 0 ? ((innerItem.value / innerTotal) * 100).toFixed(2) : '0';
                return `${value} (${percent}%)`;
              }
              // Check if it's an outer data item
              const outerItem = processedOuterData.find((item) => item.name === value);
              if (outerItem) {
                const percent = outerTotal > 0 ? ((outerItem.value / outerTotal) * 100).toFixed(2) : '0';
                return `${value} (${percent}%)`;
              }
              return value;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
