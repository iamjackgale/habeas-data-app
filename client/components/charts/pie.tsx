'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from 'recharts';
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
  /** Whether animation is active (default: true) */
  isAnimationActive?: boolean;
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
 * Reusable Pie Chart component with hover tooltips
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
  isAnimationActive = true,
}: PieChartComponentProps) {

  return (
    <div className="w-full mx-auto" style={{ maxWidth: `${maxWidth}px` }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart style={{ transform: 'rotate(0deg)' }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="90%"
            cornerRadius="50%"
            paddingAngle={5}
            fill="#8884d8"
            dataKey="value"
            startAngle={0}
            isAnimationActive={isAnimationActive}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={colors[index % colors.length]}
                stroke="#ffffff"
                strokeWidth={1}
              />
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

