'use client';

import { useState, useEffect } from 'react';
import { DashboardFooter } from '@/components/dashboard-footer';
import PortfolioSnapshot from '@/components/widgets-snapshots/counter/portfolio-snapshot';
import HistoricalSnapshot from '@/components/widgets-snapshots/counter/historic-snapshot';
import TransactionCountSnapshot from '@/components/widgets-snapshots/counter/transaction-snapshot';
import TransactionValueSnapshot from '@/components/widgets-snapshots/counter/transaction-value';
import BarTransactionsByDaySnapshot from '@/components/widgets-snapshots/bar/bar-transactions-by-day-snapshot';
import PiesPortfolioByAssetSnapshot from '@/components/widgets-snapshots/pies/pies-portfolio-by-asset-snapshot';
import BarStackedNetworthByChainSnapshot from '@/components/widgets-snapshots/bar-stacked/bar-stacked-networth-by-chain-snapshot';
import PieCurrentPortfolioByAssetSnapshot from '@/components/widgets-snapshots/pie/pie-current-portfolio-by-asset-snapshot';
import BarStackedTransactionsByCategory from '@/components/widgets/bar-stacked/bar-stacked-transactions-by-category';
import { TimeInterval } from '@/components/query-dropdowns/time-interval-dropdown';

interface StoredWidgetParams {
  widgetKey: string;
  addresses: string[];
  dates: string[];
  chains?: string[];
  categories?: string[];
  timeInterval?: TimeInterval;
}

export default function DashboardPage() {
  const [organizationName, setOrganizationName] = useState<string>('');
  const [organizationDescription, setOrganizationDescription] = useState<string>('');
  const [logo, setLogo] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [storedWidget, setStoredWidget] = useState<React.ReactNode | null>(null);

  // Detect theme
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    // Check initial theme
    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Load organization name and logos
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load organization name and description
        const settingsResponse = await fetch('/api/settings');
        if (settingsResponse.ok) {
          const config = await settingsResponse.json();
          if (config.settings?.organizationName) {
            setOrganizationName(config.settings.organizationName);
          }
          if (config.settings?.organizationDescription) {
            setOrganizationDescription(config.settings.organizationDescription);
          }
        }

        // Load logos
        const logosResponse = await fetch('/api/logos');
        if (logosResponse.ok) {
          const logos = await logosResponse.json();
          // Use dark logo if dark mode, light logo if light mode
          setLogo(isDark ? logos.dark : logos.light);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, [isDark]);

  // Load stored widget from localStorage
  const loadStoredWidget = () => {
    try {
      const stored = localStorage.getItem('lastRenderedWidget');
      if (stored) {
        const params: StoredWidgetParams = JSON.parse(stored);
        
        // Only load if it's the bar-stacked-transactions-by-category widget
        if (params.widgetKey === 'bar-stacked-transactions-by-category') {
          if (params.addresses && params.addresses.length > 0 && 
              params.dates && params.dates.length >= 2 &&
              params.categories && params.categories.length > 0 &&
              params.timeInterval) {
            const sortedDates = [...params.dates].sort((a, b) => a.localeCompare(b));
            const startDate = sortedDates[0];
            const endDate = sortedDates[sortedDates.length - 1];
            
            setStoredWidget(
              <BarStackedTransactionsByCategory
                key={`${startDate}-${endDate}-${params.timeInterval}-${params.addresses.join(',')}-${params.categories.join(',')}`}
                addresses={params.addresses}
                startDate={startDate}
                endDate={endDate}
                timeInterval={params.timeInterval}
                selectedCategories={new Set(params.categories)}
              />
            );
          } else {
            // Clear widget if params are invalid
            setStoredWidget(null);
          }
        } else {
          // Clear widget if it's not the right type
          setStoredWidget(null);
        }
      } else {
        // Clear widget if nothing is stored
        setStoredWidget(null);
      }
    } catch (error) {
      console.error('Error loading stored widget:', error);
      setStoredWidget(null);
    }
  };

  useEffect(() => {
    // Load on mount
    loadStoredWidget();

    // Listen for storage changes (when query page updates the widget)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastRenderedWidget') {
        loadStoredWidget();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom storage events (for same-tab updates)
    const handleCustomStorageChange = () => {
      loadStoredWidget();
    };

    // Listen for custom event that query page might dispatch
    window.addEventListener('widgetUpdated', handleCustomStorageChange);

    // Also reload when page becomes visible (user navigates back from query page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadStoredWidget();
      }
    };

    // Reload when window gains focus (user switches back to this tab)
    const handleFocus = () => {
      loadStoredWidget();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('widgetUpdated', handleCustomStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col items-center gap-4">
        {logo && (
          <img
            src={logo}
            alt="Organization logo"
            className="h-16 w-auto object-contain"
          />
        )}
        <h1 className="text-2xl font-bold">Portfolio Dashboard</h1>
        {organizationDescription && (
          <div className="flex justify-center mt-4">
            <div className="w-[750px] p-4 border border-border rounded-lg bg-card">
              <p className="text-foreground text-center">{organizationDescription}</p>
            </div>
          </div>
        )}
      </div>

      {/* Key Stats Section */}
      <div className="mt-8 flex justify-center">
        <div id="key-stats" data-name="key-stats" className="w-[1000px] grid grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-card">
          <PortfolioSnapshot />
          <HistoricalSnapshot />
          <TransactionCountSnapshot />
          <TransactionValueSnapshot />
        </div>
      </div>

      {/* Key Widgets Section */}
      <div className="mt-8 flex justify-center">
        <div id="key-widgets" data-name="key-widgets" className="w-[1250px] grid grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-card">
          <div className="w-full flex flex-col gap-4">
            <BarStackedNetworthByChainSnapshot />
            <PieCurrentPortfolioByAssetSnapshot />
            {storedWidget}
          </div>
          <div className="w-full">
            <PiesPortfolioByAssetSnapshot />
            <BarTransactionsByDaySnapshot />
          </div>
        </div>
      </div>

      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

