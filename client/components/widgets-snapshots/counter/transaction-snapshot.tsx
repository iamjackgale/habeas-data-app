'use client';

import { useState, useEffect } from 'react';
import { useGetTransactionsForDateRange } from '@/services/octav/loader';
import { useWidgetDefaults } from '@/hooks/use-widget-defaults';

export default function TransactionCountSnapshot() {
  const { defaults, isLoading: defaultsLoading } = useWidgetDefaults();
  const targetAddress = defaults?.['transaction-count']?.address || '0x008f84b4f7b625636dd3e75045704b077d8db445';
  const startDate = defaults?.['transaction-count']?.startDate || "2025-10-01";
  const endDate = defaults?.['transaction-count']?.endDate || "2025-10-31";
  
  const [addressLabel, setAddressLabel] = useState<string>(targetAddress);

  // Fetch address label from config
  useEffect(() => {
    const fetchAddressLabel = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const config = await response.json();
          const addresses = config.settings?.addresses || {};
          
          // Find the address in the config and get its label
          for (const [key, entry] of Object.entries(addresses)) {
            const addressEntry = entry as { address: string; label: string };
            if (addressEntry?.address?.toLowerCase() === targetAddress.toLowerCase()) {
              setAddressLabel(addressEntry.label || targetAddress);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching address label:', error);
      }
    };
    
    fetchAddressLabel();
  }, [targetAddress]);
  
  const queryResult = useGetTransactionsForDateRange(
    [targetAddress],
    startDate,
    endDate
  );
  const { data } = queryResult.data || { data: [] };
  const { isLoading, error } = queryResult;

  if (defaultsLoading || isLoading) return <p>Loading...</p>;

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-300 widget-bg rounded-md">
      <p className="font-semibold widget-text">Number of Transactions</p>
      <p className="widget-text">{data.length} Transactions</p>
      <p className="widget-text italic">(in period {startDate} to {endDate} for {addressLabel})</p>
    </div>
  );
}

