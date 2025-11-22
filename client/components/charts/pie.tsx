'use client';

import { Cell, Legend, Pie, PieChart, PieLabelRenderProps, ResponsiveContainer } from 'recharts';
import { PieChartDataEntry } from '@/handlers/pie-chart-handler';

export interface PieChartComponentProps {
  /** Pie chart data entries */
  data: PieChartDataEntry[];
  /** Total value for percentage calculations */
  totalValue: number;
  /** Colors array for slices */
  colors?: string[];
  /** Threshold for showing labels (default: 0.01 = 1%) */
  labelThreshold?: number;
  /** Name of the "other" category (default: "other") */
  otherCategoryName?: string;
  /** Chart height (default: 500) */
  height?: number;
  /** Outer radius of the pie (default: 150) */
  outerRadius?: number;
  /** Width constraint (default: 600px) */
  maxWidth?: number;
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

const RADIAN = Math.PI / 180;

/**
 * Reusable Pie Chart component
 */
export default function PieChartComponent({
  data,
  totalValue,
  colors = DEFAULT_COLORS,
  labelThreshold = 0.01, // 1% as decimal
  otherCategoryName = 'other',
  height = 500,
  outerRadius = 150,
  maxWidth = 600,
}: PieChartComponentProps) {
  const renderCustomizedLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius: radius, percent, value } = props;

    // Check if this slice is less than the label threshold
    const sliceValue = Number(value) || 0;
    const percentageOfTotal = totalValue > 0 ? sliceValue / totalValue : 0;

    // Don't show label if slice is less than threshold
    if (percentageOfTotal < labelThreshold) {
      return null;
    }

    if (cx == null || cy == null || innerRadius == null || radius == null) {
      return null;
    }

    const labelRadius = innerRadius + (radius - innerRadius) * 0.5;
    const ncx = Number(cx);
    const x = ncx + labelRadius * Math.cos(-(midAngle ?? 0) * RADIAN);
    const ncy = Number(cy);
    const y = ncy + labelRadius * Math.sin(-(midAngle ?? 0) * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > ncx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${((percent ?? 0) * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full mx-auto" style={{ maxWidth: `${maxWidth}px` }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            labelLine={false}
            label={renderCustomizedLabel}
            fill="#8884d8"
            dataKey="value"
            isAnimationActive={true}
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            itemSorter={(item) => {
              // Sort so "other" category always appears last
              if (item.value === otherCategoryName) {
                return 9999; // Always last
              }
              // Find index in data to preserve original order
              const index = data.findIndex((d) => d.name === item.value);
              return index === -1 ? 9998 : index;
            }}
            formatter={(value) => {
              const dataItem = data.find((item) => item.name === value);
              const percent = dataItem ? ((dataItem.value / totalValue) * 100).toFixed(2) : '0';
              return `${value} (${percent}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

