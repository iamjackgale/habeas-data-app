'use client';

import { useGetHistorical } from '@/services/octav/loader';

export default function Historical() {
  const date = '2025-06-06';
  const { data, isLoading, error } = useGetHistorical({
    address: '0x3f5eddad52c665a4aa011cd11a21e1d5107d7862',
    date
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
  console.log(data);
  const netWorth = Object.values(data).reduce((acc, portfolio) => acc + parseFloat(portfolio.networth), 0);

  return (
    <div className="p-4 border border-gray-300 bg-gray-50 rounded-md">
      <p className="font-semibold text-gray-800">Net Worth at {date}</p>
      <p className="text-gray-600">${netWorth}</p>
    </div>
  );
}
