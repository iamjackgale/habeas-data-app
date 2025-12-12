'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGetTransactionsForDateRange } from '@/services/octav/loader';
import { useWidgetDefaults } from '@/hooks/use-widget-defaults';
import { Transaction } from '@/types/transaction';

export default function TransactionValueSnapshot() {
  const { defaults, isLoading: defaultsLoading } = useWidgetDefaults();
  const targetAddress = defaults?.['transaction-value']?.address || '0x008f84b4f7b625636dd3e75045704b077d8db445';
  const startDate = defaults?.['transaction-value']?.startDate || "2025-10-01";
  const endDate = defaults?.['transaction-value']?.endDate || "2025-10-31";
  
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


  // Calculate total transaction value in USD
  const totalValue = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return 0;
    }
    
    return data.reduce((sum: number, transaction: Transaction) => {
      let transactionValue = 0;
      
      // Sum values from assetsIn
      if (transaction.assetsIn && Array.isArray(transaction.assetsIn)) {
        const assetsInValue = transaction.assetsIn.reduce((assetSum: number, asset) => {
          const assetValue = parseFloat(asset.value || '0') || 0;
          return assetSum + assetValue;
        }, 0);
        transactionValue += assetsInValue;
      }
      
      // Sum values from assetsOut
      if (transaction.assetsOut && Array.isArray(transaction.assetsOut)) {
        const assetsOutValue = transaction.assetsOut.reduce((assetSum: number, asset) => {
          const assetValue = parseFloat(asset.value || '0') || 0;
          return assetSum + assetValue;
        }, 0);
        transactionValue += assetsOutValue;
      }
      
      return sum + transactionValue;
    }, 0);
  }, [data]);

  // Format value as USD with commas
  const formattedValue = useMemo(() => {
    return totalValue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [totalValue]);

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
      <p className="font-semibold widget-text">Value of Transactions</p>
      <p className="widget-text">{formattedValue}</p>
      <p className="widget-text italic">(in period {startDate} to {endDate} on {addressLabel})</p>
    </div>
  );
}

