'use client';

import { useState, useEffect } from 'react';

export function usePaymentRequirement() {
  const [requirePayments, setRequirePayments] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSetting = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const config = await response.json();
          // Default to false (payments not required) if not set
          setRequirePayments(config.settings?.requireX402Payments ?? false);
        }
      } catch (error) {
        console.error('Error loading payment requirement setting:', error);
        // Default to false on error
        setRequirePayments(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadSetting();
  }, []);

  return { requirePayments, isLoading };
}

