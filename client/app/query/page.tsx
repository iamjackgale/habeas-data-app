'use client';

import { useState } from 'react';
import { DashboardFooter } from '@/components/dashboard-footer';
import { CategoryDropdown } from '@/components/query-dropdowns/category-dropdown';
import { TimePeriodDropdown, TimePeriodValue } from '@/components/query-dropdowns/time-period-dropdown';
import { SingleDateTimeDropdown } from '@/components/query-dropdowns/single-date-time-dropdown';
import { MultiDateTimeDropdown } from '@/components/query-dropdowns/multi-date-time-dropdown';
import { ChainDropdown } from '@/components/query-dropdowns/chain-dropdown';
import { PayButton } from '@/components/query-dropdowns/pay-button';
import { WidgetSelectorDropdown } from '@/components/query-dropdowns/widget-selector-dropdown';
import { PortfolioTransactionsToggle } from '@/components/query-dropdowns/portfolio-transactions-toggle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getWidgetTimePeriodType, requiresChains, requiresAddresses, hasCategories } from '@/lib/widget-time-config';
import { AddressDropdown } from '@/components/query-dropdowns/address-dropdown';
import Link from 'next/link';

type Mode = 'portfolio' | 'transactions';

export default function QueryPage() {
  const [mode, setMode] = useState<Mode>('portfolio');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedChains, setSelectedChains] = useState<Set<string>>(new Set());
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set());
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriodValue>({
    startDate: null,
    endDate: null,
    granularity: 'date',
  });
  
  // New time selection states
  const [singleDate, setSingleDate] = useState<Date | null>(null);
  const [multiDate, setMultiDate] = useState<{
    mode: 'list' | 'interval';
    dates: Date[];
    intervalType?: 'daily' | 'weekly' | 'monthly';
    intervalCount?: number;
    startDate?: Date;
  }>({
    mode: 'list',
    dates: [],
  });

  // Determine which time dropdown to show based on selected widget
  const widgetTimeType = getWidgetTimePeriodType(selectedWidget);
  const showChains = requiresChains(selectedWidget);
  const showAddresses = requiresAddresses(selectedWidget);
  const showCategories = hasCategories(selectedWidget, mode);

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Query</h1>
      <div className="flex flex-col gap-2 mb-6">
        <p className="text-foreground">
          Build custom data queries to generate widgets, tables or data reflecting portfolio performance and operations.
        </p>
        <p className="text-foreground">
          Browse available{' '}
          <Link href="/widget" className="text-primary underline hover:text-primary/80">
            widgets
          </Link>
          {' '}to explore visualisation options for building your query.
        </p>
      </div>
      
      <div className="bg-sidebar rounded-lg border border-border p-6">
        <Tabs defaultValue="widget" className="w-full">
          <TabsList className="mb-6 justify-start">
            <TabsTrigger value="widget">Widget</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="widget" className="mt-0">
            <div className="flex flex-col gap-6 items-start">
              <PortfolioTransactionsToggle defaultMode={mode} onChange={setMode} />
              <WidgetSelectorDropdown mode={mode} value={selectedWidget} onChange={setSelectedWidget} />
              
              {/* Conditionally render time dropdown based on widget type */}
              {selectedWidget && widgetTimeType === 'single' && (
                <div className="w-full max-w-md">
                  <SingleDateTimeDropdown value={singleDate} onChange={setSingleDate} />
                </div>
              )}
              
              {selectedWidget && widgetTimeType === 'multi' && (
                <div className="w-full max-w-md">
                  <MultiDateTimeDropdown value={multiDate} onChange={setMultiDate} />
                </div>
              )}
              
              {selectedWidget && widgetTimeType === 'timescale' && (
                <div className="w-full max-w-md">
                  <TimePeriodDropdown value={timePeriod} onChange={setTimePeriod} />
                </div>
              )}
              
              {!selectedWidget && (
                <div className="w-full max-w-md">
                  <TimePeriodDropdown value={timePeriod} onChange={setTimePeriod} />
                </div>
              )}
              
              {/* Conditionally render chain/address selection based on widget config */}
              {showAddresses && (
                <div className="w-full max-w-md">
                  <AddressDropdown value={selectedAddresses} onChange={setSelectedAddresses} />
                </div>
              )}
              
              {showChains && (
                <div className="w-full max-w-md">
                  <ChainDropdown value={selectedChains} onChange={setSelectedChains} />
                </div>
              )}
              
              {/* Categories only shown if widget supports it OR if in transactions mode */}
              {showCategories && (
                <div className="w-full max-w-md">
                  <CategoryDropdown value={selectedCategories} onChange={setSelectedCategories} />
                </div>
              )}
              
              <PayButton fee="0.025" />
            </div>
          </TabsContent>
          
          <TabsContent value="table" className="mt-0">
            <div className="flex flex-col gap-6 items-start">
              <PortfolioTransactionsToggle defaultMode={mode} onChange={setMode} />
              <TimePeriodDropdown value={timePeriod} onChange={setTimePeriod} />
              
              {/* Show addresses for portfolio mode, chains for transactions mode (or both) */}
              {mode === 'portfolio' && (
                <div className="w-full max-w-md">
                  <AddressDropdown value={selectedAddresses} onChange={setSelectedAddresses} />
                </div>
              )}
              
              {(mode === 'transactions' || showChains) && (
                <div className="w-full max-w-md">
                  <ChainDropdown value={selectedChains} onChange={setSelectedChains} />
                </div>
              )}
              
              {/* Categories only shown for transactions mode */}
              {mode === 'transactions' && (
                <div className="w-full max-w-md">
                  <CategoryDropdown value={selectedCategories} onChange={setSelectedCategories} />
                </div>
              )}
              
              <PayButton fee="0.025" />
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="mt-0">
            <div className="flex flex-col gap-6 items-start">
              <PortfolioTransactionsToggle defaultMode={mode} onChange={setMode} />
              <TimePeriodDropdown value={timePeriod} onChange={setTimePeriod} />
              
              {/* Show addresses for portfolio mode, chains for transactions mode (or both) */}
              {mode === 'portfolio' && (
                <div className="w-full max-w-md">
                  <AddressDropdown value={selectedAddresses} onChange={setSelectedAddresses} />
                </div>
              )}
              
              {(mode === 'transactions' || showChains) && (
                <div className="w-full max-w-md">
                  <ChainDropdown value={selectedChains} onChange={setSelectedChains} />
                </div>
              )}
              
              {/* Categories only shown for transactions mode */}
              {mode === 'transactions' && (
                <div className="w-full max-w-md">
                  <CategoryDropdown value={selectedCategories} onChange={setSelectedCategories} />
                </div>
              )}
              
              <PayButton fee="0.025" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

