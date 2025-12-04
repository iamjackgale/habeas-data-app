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

export default function ReportsPage() {
  const [organizationName, setOrganizationName] = useState<string>('');
  const [organizationDescription, setOrganizationDescription] = useState<string>('');
  const [logo, setLogo] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

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
        console.error('Error loading reports data:', error);
      }
    };

    loadData();
  }, [isDark]);

  return (
    <div className="flex flex-col gap-[9.6px] p-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="flex flex-col gap-2 mb-6">
        <p className="text-foreground">
          Generate custom reports for deeper analyses of particular areas of activity.
        </p>
        <p className="text-foreground">
          Apply custom parameters to tweak existing report templates to suit your need.
        </p>
      </div>

      {/* Report Inputs Section */}

      {/* Report Output Section */}

      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

