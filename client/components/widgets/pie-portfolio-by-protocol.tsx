'use client';

import { useGetPortfolio } from '@/services/octav/loader';
import { Portfolio } from '@/types/portfolio';
import { getProtocolValueDictionary } from '@/handlers/portfolio-handler';
import { Cell, Legend, Pie, PieChart, PieLabelRenderProps, ResponsiveContainer } from 'recharts';

export default function PiePortfolioByProtocol() {
  const targetAddress = '0xc9c61194682a3a5f56bf9cd5b59ee63028ab6041';
  
  const { data, isLoading, error } = useGetPortfolio({
    address: targetAddress,
    includeImages: true,
    includeExplorerUrls: true,
    waitForSync: true,
  });

  if (isLoading) return <p>Loading...</p>;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  // Extract portfolio from Record structure (data is Record<string, Portfolio>)
  const dataRecord = data as Record<string, Portfolio> | undefined;
  const portfolioEntries = dataRecord ? Object.entries(dataRecord) as [string, Portfolio][] : [];
  const portfolio = dataRecord?.[targetAddress] || (portfolioEntries.length > 0 ? portfolioEntries[0][1] : null);

  console.log('PieChart - Portfolio data:', portfolio);

  if (!portfolio) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Data</p>
        <p className="text-yellow-600">No portfolio data available for pie chart</p>
      </div>
    );
  }

  const protocolDictionary = getProtocolValueDictionary(portfolio);
  
  // Transform dictionary to pie chart data format
  const allData = Object.entries(protocolDictionary).map(([key, value]) => ({
    name: key,
    value: parseFloat(value) || 0,
  }));

  // Calculate total value
  const totalValue = allData.reduce((sum, item) => sum + item.value, 0);

  // Separate slices into main (>= 0.5%) and other (< 0.5%)
  const threshold = totalValue * 0.005; // 0.5% threshold
  const mainSlices = allData.filter(item => item.value >= threshold);
  const otherSlices = allData.filter(item => item.value < threshold);
  const otherValue = otherSlices.reduce((sum, item) => sum + item.value, 0);

  // Build final pie chart data (main slices + "other" if needed)
  // Sort main slices by value descending (largest to smallest)
  const sortedMainSlices = [...mainSlices].sort((a, b) => b.value - a.value);
  
  // Build final array: sorted main slices first, then "other" always at the end
  // Only show "other" in legend if it's >= 0.005% of total
  const pieChartData = [...sortedMainSlices];
  const otherPercentage = totalValue > 0 ? (otherValue / totalValue) : 0;
  const otherThreshold = 0.00005; // 0.005% as decimal
  if (otherValue > 0 && otherPercentage >= otherThreshold) {
    pieChartData.push({
      name: 'other',
      value: otherValue,
    });
  }

  const RADIAN = Math.PI / 180;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#9c88ff', '#ff8c94'];
  
  // 1% threshold for label visibility
  const labelThreshold = 0.01; // 1% as decimal

  const renderCustomizedLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;
    
    // Check if this slice is less than 1% of the total value
    const sliceValue = Number(value) || 0;
    const percentageOfTotal = (sliceValue / totalValue);
    
    // Don't show label if slice is less than 1% of total
    if (percentageOfTotal < labelThreshold) {
      return null;
    }
    
    if (cx == null || cy == null || innerRadius == null || outerRadius == null) {
      return null;
    }
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const ncx = Number(cx);
    const x = ncx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
    const ncy = Number(cy);
    const y = ncy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor={x > ncx ? 'start' : 'end'} dominantBaseline="central">
        {`${((percent ?? 0) * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Show message if no protocol data
  if (pieChartData.length === 0) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">No Protocol Data</p>
        <p className="text-yellow-600">No protocol data available to display in pie chart</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md w-full max-w-full">
      <p className="font-semibold widget-text mb-4">Portfolio Assets by Protocol</p>
      <div className="w-full max-w-[600px] mx-auto">
        <ResponsiveContainer width="100%" height={500}>
          <PieChart>
            <Pie
              data={pieChartData}
              labelLine={false}
              label={renderCustomizedLabel}
              fill="#8884d8"
              dataKey="value"
              isAnimationActive={true}
              cx="50%"
              cy="50%"
              outerRadius={150}
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              itemSorter={(item) => {
                // Sort so "other" always appears last
                if (item.value === 'other') {
                  return 9999; // Always last
                }
                // Find index in pieChartData to preserve original order
                const index = pieChartData.findIndex(d => d.name === item.value);
                return index === -1 ? 9998 : index;
              }}
              formatter={(value, entry) => {
                const dataItem = pieChartData.find(item => item.name === value);
                const percent = dataItem ? ((dataItem.value / totalValue) * 100).toFixed(2) : '0';
                return `${value} (${percent}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

