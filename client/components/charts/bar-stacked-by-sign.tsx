'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { BarStackedChartDataEntry } from '@/handlers/bar-chart-handler';

export interface BarStackedBySignChartComponentProps {
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
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
}

const DEFAULT_COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#EA3B4C',
];

export default function BarStackedBySignChartComponent({
  data,
  dataKeys,
  stackLabels,
  totalValue,
  colors = DEFAULT_COLORS,
  height = 500,
  maxWidth = 700,
  isAnimationActive = true,
  responsive = true,
  xAxisLabel,
  yAxisLabel,
}: BarStackedBySignChartComponentProps) {
  // Format Y axis tick to show dollar amounts with commas and no decimal places
  // Handles negative values properly
  const formatYAxis = (value: number) => {
    const sign = value < 0 ? '-' : '';
    const absValue = Math.abs(value);
    return `${sign}$${absValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
      const absBarTotal = Math.abs(barTotal);
      const percent = absBarTotal > 0 ? ((Math.abs(value) / absBarTotal) * 100).toFixed(1) : '0';
      const sign = value < 0 ? '-' : '';
      const absValue = Math.abs(value);
      const dollarValue = `${sign}$${absValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      return [`${dollarValue} (${percent}%)`, name];
    }
    // Fallback if payload not available
    const absTotalValue = Math.abs(totalValue);
    const percent = absTotalValue > 0 ? ((Math.abs(value) / absTotalValue) * 100).toFixed(1) : '0';
    const sign = value < 0 ? '-' : '';
    const absValue = Math.abs(value);
    const dollarValue = `${sign}$${absValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
      <div className="w-full mx-auto bar-chart-wrapper bar-stacked-by-sign-chart-wrapper" style={{ maxWidth: `${maxWidth}px` }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            stackOffset="sign"
            margin={{
              top: 25,
              right: 0,
              left: yAxisLabel ? 20 : 0,
              bottom: xAxisLabel ? 30 : 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, style: { textAnchor: 'middle' } } : undefined}
            />
            <YAxis 
              width="auto" 
              tickFormatter={formatYAxis}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } } : undefined}
            />
            <Tooltip
              formatter={(value: number, name: string, entry: any) => formatTooltip(value, name, entry)}
              labelFormatter={renderTooltipLabel}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
            />
            <Legend
              formatter={(value) => {
                return <span className="text-foreground">{value}</span>;
              }}
              wrapperStyle={{ paddingTop: '20px' }}
              iconSize={12}
            />
            <ReferenceLine y={0} stroke="#000" />
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="stack"
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
    <div className="w-full mx-auto bar-chart-wrapper bar-stacked-by-sign-chart-wrapper" style={{ maxWidth: `${maxWidth}px` }}>
      <BarChart
        data={data}
        stackOffset="sign"
        style={{
          width: '100%',
          maxWidth: `${maxWidth}px`,
          height: `${height}px`,
        }}
        margin={{
          top: 25,
          right: 0,
          left: yAxisLabel ? 20 : 0,
          bottom: xAxisLabel ? 30 : 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, style: { textAnchor: 'middle' } } : undefined}
        />
        <YAxis 
          width="auto" 
          tickFormatter={formatYAxis}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } } : undefined}
        />
        <Tooltip
          formatter={(value: number, name: string, entry: any) => formatTooltip(value, name, entry)}
          labelFormatter={renderTooltipLabel}
          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
        />
        <Legend
          formatter={(value) => {
            return <span className="text-foreground">{value}</span>;
          }}
          wrapperStyle={{ paddingTop: '20px' }}
          iconSize={12}
        />
        <ReferenceLine y={0} stroke="#000" />
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="stack"
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

