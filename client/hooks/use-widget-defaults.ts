import { useState, useEffect } from 'react';

interface WidgetDefaults {
  portfolio?: {
    address: string;
  };
  historic?: {
    address: string;
    date: string;
  };
  'pie-current-portfolio-by-asset'?: {
    address: string;
  };
  'pies-portfolio-by-asset'?: {
    address: string;
    dates: string[];
  };
  'bar-current-portfolio-by-asset'?: {
    address: string;
  };
  'bar-stacked-portfolio-by-asset'?: {
    address: string;
    dates: string[];
  };
}

export function useWidgetDefaults() {
  const [defaults, setDefaults] = useState<WidgetDefaults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const config = await response.json();
          setDefaults(config.settings?.widgetDefaults || {});
        }
      } catch (error) {
        console.error('Error loading widget defaults:', error);
        setDefaults({});
      } finally {
        setIsLoading(false);
      }
    };
    loadDefaults();
  }, []);

  return { defaults, isLoading };
}

