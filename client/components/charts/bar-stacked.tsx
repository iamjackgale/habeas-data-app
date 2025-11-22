'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BarStackedChartDataEntry } from '@/handlers/bar-chart-handler';

export interface BarStackedChartComponentProps {
  /** Bar stacked chart data entries */
  data: BarStackedChartDataEntry[];
  /** Data keys for each stack (e.g., ['pv', 'uv']) */
  dataKeys: string[];
  /** Labels for each stack (optional, uses dataKeys if not provided) */
  stackLabels?: string[];
  /** Total value for percentage calculations */
  totalValue: number;
  /** Colors array for stacks (default: uses predefined 6 colors) */
  colors?: string[];
  /** Chart height (default: 500) */
  height?: number;
  /** Width constraint (default: 700px) */
  maxWidth?: number;
  /** Whether animation is active (default: true) */
  isAnimationActive?: boolean;
  /** Whether to show responsive container (default: true) */
  responsive?: boolean;
}

const DEFAULT_COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#EA3B4C',
];

/**
 * Reusable Bar Stacked Chart component
 */
export default function BarStackedChartComponent({
  data,
  dataKeys,
  stackLabels,
  totalValue,
  colors = DEFAULT_COLORS,
  height = 500,
  maxWidth = 700,
  isAnimationActive = true,
  responsive = true,
}: BarStackedChartComponentProps) {
  // Format Y axis tick to show dollar amounts with commas and no decimal places
  const formatYAxis = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Get color for each stack: use predefined colors first, then repeat
  const getStackColor = (index: number) => {
    return colors[index % colors.length];
  };

  // Format tooltip to show comma-separated dollar values
  // Calculate percentage relative to the current bar's total, not global total
  const formatTooltip = (value: number, name: string, entry: any) => {
    // Get the full entry for this bar (entry.payload contains the data entry)
    const payload = entry?.payload || entry;
    if (payload) {
      // Calculate total for this specific bar (sum of all stack values)
      const barTotal = dataKeys.reduce((sum, key) => {
        const val = payload[key];
        const numVal = typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) || 0 : 0);
        return sum + numVal;
      }, 0);
      // Calculate percentage relative to this bar's total
      const percent = barTotal > 0 ? ((value / barTotal) * 100).toFixed(1) : '0';
      const dollarValue = `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      return [`${dollarValue} (${percent}%)`, name];
    }
    // Fallback if payload not available
    const percent = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0';
    const dollarValue = `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    return [`${dollarValue} (${percent}%)`, name];
  };

  // Custom tooltip label to show category name
  const renderTooltipLabel = (label: string) => {
    return label;
  };

  // Use stackLabels if provided, otherwise use dataKeys
  const labels = stackLabels && stackLabels.length === dataKeys.length ? stackLabels : dataKeys;

  if (responsive) {
    return (
      <div className="w-full mx-auto bar-chart-wrapper" style={{ maxWidth: `${maxWidth}px` }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 0,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis width="auto" tickFormatter={formatYAxis} />
            <Tooltip
              formatter={(value: number, name: string, entry: any) => formatTooltip(value, name, entry)}
              labelFormatter={renderTooltipLabel}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
            />
            <Legend />
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={getStackColor(index)}
                isAnimationActive={isAnimationActive}
                activeBar={false}
              >
                {data.map((entry, entryIndex) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={getStackColor(index)} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bar-chart-wrapper" style={{ maxWidth: `${maxWidth}px` }}>
      <BarChart
        data={data}
        style={{
          width: '100%',
          maxWidth: `${maxWidth}px`,
          height: `${height}px`,
        }}
        margin={{
          top: 20,
          right: 0,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis width="auto" tickFormatter={formatYAxis} />
        <Tooltip
          formatter={(value: number, name: string, entry: any) => formatTooltip(value, name, entry)}
          labelFormatter={renderTooltipLabel}
          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
        />
        <Legend />
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={getStackColor(index)}
            isAnimationActive={isAnimationActive}
            activeBar={false}
          >
            {data.map((entry, entryIndex) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={getStackColor(index)} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </div>
  );
}

