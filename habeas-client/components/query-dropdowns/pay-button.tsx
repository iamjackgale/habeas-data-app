'use client';

import { useState, useEffect } from 'react';
import { useIsSignedIn, useCurrentUser } from '@coinbase/cdp-hooks';
import { usePaymentRequirement } from '@/hooks/use-payment-requirement';

interface PayButtonProps {
  fee?: string;
  className?: string;
  onClick?: () => Promise<void> | void;
}

export function PayButton({ fee = '0.025', className = '', onClick }: PayButtonProps) {
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { requirePayments, isLoading: paymentSettingLoading } = usePaymentRequirement();
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Check USDC balance when button mounts or user changes (only if payments are required)
  useEffect(() => {
    async function checkBalance() {
      // Skip balance check if payments are not required
      if (!requirePayments) {
        setBalance(null);
        return;
      }

      if (!isSignedIn || !currentUser?.evmAccounts?.[0]) {
        setBalance(null);
        return;
      }

      setBalanceLoading(true);
      try {
        const address = currentUser.evmAccounts[0];
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cdp/balance/${address}`);
        if (response.ok) {
          const data = await response.json();
          setBalance(parseFloat(data.balance || '0'));
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setBalanceLoading(false);
      }
    }

    checkBalance();
  }, [isSignedIn, currentUser, requirePayments]);

  const feeAmount = parseFloat(fee);
  const hasBalance = balance !== null && balance >= feeAmount;
  
  // If payments are not required, show Query button instead
  if (!requirePayments) {
    const handleQueryClick = async () => {
      if (isProcessing || !onClick) return;

      setIsProcessing(true);
      try {
        await onClick();
      } catch (error) {
        console.error('Query error:', error);
        alert('Query failed. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <button
        onClick={handleQueryClick}
        disabled={isProcessing || paymentSettingLoading}
        className={`border-none cursor-pointer bg-[#347745] text-white px-5 py-2.5 rounded font-semibold transition-opacity ${
          isProcessing || paymentSettingLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
        } ${className}`}
      >
        {isProcessing ? 'Querying...' : 'Query'}
      </button>
    );
  }

  // Payments are required - show payment button
  const isDisabled = !isSignedIn || !hasBalance || isProcessing || balanceLoading || paymentSettingLoading;

  const handleClick = async () => {
    if (isDisabled || !onClick) return;

    setIsProcessing(true);
    try {
      await onClick();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (isProcessing) return 'Processing...';
    if (paymentSettingLoading) return 'Loading...';
    if (!isSignedIn) return `Sign In to Pay ${fee} USDC`;
    if (balanceLoading) return 'Checking Balance...';
    if (!hasBalance) return `Insufficient Balance (${fee} USDC required)`;
    return `Pay ${fee} USDC`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`border-none cursor-pointer bg-[#347745] text-white px-5 py-2.5 rounded font-semibold transition-opacity ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
      } ${className}`}
    >
      {getButtonText()}
    </button>
  );
}

