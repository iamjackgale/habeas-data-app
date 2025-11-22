'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChartDataEntry } from '@/handlers/bar-chart-handler';

export interface BarChartComponentProps {
  /** Bar chart data entries */
  data: BarChartDataEntry[];
  /** Total value for percentage calculations */
  totalValue: number;
  /** Color for bars (default: "#8884d8") */
  color?: string;
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
}

/**
 * Reusable Bar Chart component
 */
export default function BarChartComponent({
  data,
  totalValue,
  color = '#8884d8',
  dataKey = 'value',
  height = 500,
  maxWidth = 600,
  isAnimationActive = true,
  responsive = true,
}: BarChartComponentProps) {
  if (responsive) {
    return (
      <div className="w-full mx-auto" style={{ maxWidth: `${maxWidth}px` }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => {
                const percent = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0';
                return [`${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percent}%)`, 'Value'];
              }}
            />
            <Legend />
            <Bar dataKey={dataKey} fill={color} isAnimationActive={isAnimationActive} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto" style={{ maxWidth: `${maxWidth}px` }}>
      <BarChart
        data={data}
        style={{
          width: '100%',
          maxWidth: `${maxWidth}px`,
          height: `${height}px`,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value: number) => {
            const percent = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0';
            return [`${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percent}%)`, 'Value'];
          }}
        />
        <Legend />
        <Bar dataKey={dataKey} fill={color} isAnimationActive={isAnimationActive} />
      </BarChart>
    </div>
  );
}
