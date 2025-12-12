'use client';

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChartDataEntry } from '@/handlers/bar-chart-handler';

export interface BarChartComponentProps {
  /** Bar chart data entries */
  data: BarChartDataEntry[];
  /** Total value for percentage calculations */
  totalValue: number;
  /** Colors array for bars (default: uses predefined 6 colors, then random) */
  colors?: string[];
  /** Data key name for the bar values (default: "value") */
  dataKey?: string;
  /** Chart height (default: 500) */
  height?: number;
  /** Width constraint (default: 600px) */
  maxWidth?: number;
  /** Whether animation is active (default: true) */
  isAnimationActive?: boolean;
  /** Whether to show responsive container (default: true) */
  responsive?: boolean;
  /** Custom Y axis formatter (default: dollar amounts) */
  formatYAxis?: (value: number) => string;
  /** Custom tooltip formatter (default: dollar amounts with percentage) */
  formatTooltip?: (value: number, name: string) => [string, string];
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
 * Generate a random color
 */
function getRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Reusable Bar Chart component
 */
export default function BarChartComponent({
  data,
  totalValue,
  colors = DEFAULT_COLORS,
  dataKey = 'value',
  height = 500,
  maxWidth = 600,
  isAnimationActive = true,
  responsive = true,
  formatYAxis: customFormatYAxis,
  formatTooltip: customFormatTooltip,
}: BarChartComponentProps) {
  // Format Y axis tick - default to dollar amounts, allow custom formatter
  const formatYAxis = customFormatYAxis || ((value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  });

  // Get color for each bar: use predefined colors first, then random colors
  // If only one color provided, use it for all bars
  const getBarColor = (index: number) => {
    if (colors.length === 1) {
      return colors[0];
    }
    if (index < colors.length) {
      return colors[index];
    }
    return getRandomColor();
  };

  // Format tooltip - default to dollar values with percentage, allow custom formatter
  const formatTooltip = customFormatTooltip || ((value: number, name: string) => {
    const percent = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0';
    const dollarValue = `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    return [`${dollarValue} (${percent}%)`, 'Value'];
  });

  // Custom tooltip label to show protocol name
  const renderTooltipLabel = (label: string) => {
    return label;
  };

  if (responsive) {
    return (
      <div className="w-full mx-auto bar-chart-wrapper" style={{ maxWidth: `${maxWidth}px` }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip 
              formatter={formatTooltip} 
              labelFormatter={renderTooltipLabel}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
            />
            <Bar dataKey={dataKey} isAnimationActive={isAnimationActive} activeBar={false}>
              {data.map((entry, index) => (
                <Cell key={`cell-${entry.name}`} fill={getBarColor(index)} />
              ))}
            </Bar>
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
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <XAxis dataKey="name" />
        <YAxis tickFormatter={formatYAxis} />
        <Tooltip 
          formatter={formatTooltip} 
          labelFormatter={renderTooltipLabel}
          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
        />
        <Bar dataKey={dataKey} isAnimationActive={isAnimationActive} activeBar={false}>
          {data.map((entry, index) => (
            <Cell key={`cell-${entry.name}`} fill={getBarColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </div>
  );
}
