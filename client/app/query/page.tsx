'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { renderWidget, WidgetRenderParams } from '@/lib/widget-renderer';
import { downloadWidgetAsPNG } from '@/lib/widget-download';
import Link from 'next/link';

type Mode = 'portfolio' | 'transactions';

interface RenderedWidget {
  id: string;
  widgetKey: string;
  component: React.ReactNode;
}

interface StoredWidgetParams {
  widgetKey: string;
  addresses: string[];
  dates: string[];
  chains?: string[];
  categories?: string[];
}

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

  // State to track rendered widget (single widget, replaces on each render)
  const [renderedWidget, setRenderedWidget] = useState<RenderedWidget | null>(null);
  // Store the previous widget to restore if error occurs
  const previousWidgetRef = useRef<RenderedWidget | null>(null);
  // Ref for the widget container to capture for download
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  // Load last rendered widget from localStorage on mount
  useEffect(() => {
    const loadStoredWidget = () => {
      try {
        const stored = localStorage.getItem('lastRenderedWidget');
        if (stored) {
          const params: StoredWidgetParams = JSON.parse(stored);
          const widgetParams: WidgetRenderParams = {
            widgetKey: params.widgetKey,
            addresses: params.addresses,
            dates: params.dates,
            chains: params.chains || [],
            categories: params.categories || [],
          };
          const widgetComponent = renderWidget(widgetParams);
          const storedWidget: RenderedWidget = {
            id: `${params.widgetKey}-stored`,
            widgetKey: params.widgetKey,
            component: widgetComponent,
          };
          setRenderedWidget(storedWidget);
          previousWidgetRef.current = storedWidget;
        }
      } catch (error) {
        console.error('Error loading stored widget:', error);
      }
    };

    loadStoredWidget();
  }, []);

  // Determine which time dropdown to show based on selected widget
  const widgetTimeType = getWidgetTimePeriodType(selectedWidget);
  const showChains = requiresChains(selectedWidget);
  const showAddresses = requiresAddresses(selectedWidget);
  const showCategories = hasCategories(selectedWidget, mode);

  // Handle Pay button click - render the widget
  const handlePay = () => {
    if (!selectedWidget) {
      alert('Please select a widget first');
      return;
    }

    // Extract addresses from Set
    const addresses = Array.from(selectedAddresses);
    if (addresses.length === 0) {
      alert('Please select at least one address');
      return;
    }

    // Extract dates based on widget type
    // Format dates to ISO strings (YYYY-MM-DD)
    const dates: string[] = [];
    
    if (widgetTimeType === 'single') {
      if (selectedWidget === 'portfolio') {
        // Portfolio widget uses current date automatically
        dates.push(new Date().toISOString().split('T')[0]);
      } else if (singleDate) {
        // Format single date to ISO
        const year = singleDate.getFullYear();
        const month = String(singleDate.getMonth() + 1).padStart(2, '0');
        const day = String(singleDate.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      }
    } else if (widgetTimeType === 'multi') {
      if (multiDate.mode === 'list') {
        // Format dates array to ISO strings
        multiDate.dates.forEach(date => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dates.push(`${year}-${month}-${day}`);
        });
      } else if (multiDate.mode === 'interval' && multiDate.startDate) {
        // Generate dates based on interval
        const start = new Date(multiDate.startDate);
        const count = Math.min(multiDate.intervalCount || 12, 12);
        const type = multiDate.intervalType || 'daily';

        for (let i = 0; i < count; i++) {
          const date = new Date(start);
          if (type === 'daily') {
            date.setDate(date.getDate() + i);
          } else if (type === 'weekly') {
            date.setDate(date.getDate() + (i * 7));
          } else if (type === 'monthly') {
            date.setMonth(date.getMonth() + i);
          }
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dates.push(`${year}-${month}-${day}`);
        }
      }
    }
    
    // For portfolio widget, it uses current date automatically
    // For other single date widgets, ensure we have a date
    if (widgetTimeType === 'single' && selectedWidget !== 'portfolio' && dates.length === 0) {
      alert('Please select a date');
      return;
    }

    // For multi date widgets, ensure we have dates
    if (widgetTimeType === 'multi' && dates.length === 0) {
      alert('Please select at least one date');
      return;
    }

    // Extract chains and categories (for future use)
    const chains = Array.from(selectedChains);
    const categories = Array.from(selectedCategories);

    // Create widget render params
    const params: WidgetRenderParams = {
      widgetKey: selectedWidget,
      addresses: addresses,
      dates: dates,
      chains: chains,
      categories: categories,
    };

    // Store current widget as previous before rendering new one
    previousWidgetRef.current = renderedWidget;

    // Render the widget
    const widgetComponent = renderWidget(params);

    // Create a wrapper component that can detect errors after rendering
    const WidgetWrapper = ({ 
      children, 
      widgetKey, 
      addresses: addrs, 
      dates: dts, 
      chains: chns, 
      categories: cats
    }: { 
      children: React.ReactNode; 
      widgetKey: string;
      addresses: string[];
      dates: string[];
      chains: string[];
      categories: string[];
    }) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const hasStoredRef = useRef(false);
      const errorCheckedRef = useRef(false);

      useEffect(() => {
        // Check if the rendered content contains error indicators after a short delay
        // to allow the widget to fully render
        const timeoutId = setTimeout(() => {
          if (containerRef.current && !hasStoredRef.current && !errorCheckedRef.current) {
            const hasError = containerRef.current.querySelector('.border-red-300, .border-yellow-300') !== null;
            errorCheckedRef.current = true;
            
            // Only store if there's no error
            if (!hasError) {
              try {
                const paramsToStore: StoredWidgetParams = {
                  widgetKey: widgetKey,
                  addresses: addrs,
                  dates: dts,
                  chains: chns.length > 0 ? chns : undefined,
                  categories: cats.length > 0 ? cats : undefined,
                };
                localStorage.setItem('lastRenderedWidget', JSON.stringify(paramsToStore));
                hasStoredRef.current = true;
              } catch (err) {
                console.error('Error storing widget params:', err);
              }
            } else {
              // Error detected - restore previous widget after 5 seconds
              if (previousWidgetRef.current) {
                setTimeout(() => {
                  setRenderedWidget(previousWidgetRef.current);
                }, 5000); // Wait 5 seconds before restoring
              }
            }
          }
        }, 500); // Wait 500ms for widget to render

        return () => clearTimeout(timeoutId);
      }, [children, widgetKey, addrs, dts, chns, cats]);

      return <div ref={containerRef}>{children}</div>;
    };

    // Replace the existing widget
    const newWidget: RenderedWidget = {
      id: `${selectedWidget}-${Date.now()}`,
      widgetKey: selectedWidget,
      component: (
        <WidgetWrapper
          widgetKey={selectedWidget}
          addresses={addresses}
          dates={dates}
          chains={chains}
          categories={categories}
        >
          {widgetComponent}
        </WidgetWrapper>
      ),
    };

    setRenderedWidget(newWidget);
  };

  // Handle download button click
  const handleDownload = async () => {
    if (!renderedWidget) {
      console.error('No widget rendered');
      alert('No widget to download. Please render a widget first.');
      return;
    }

    // Try to get the element by ref first, then by ID as fallback
    let element: HTMLElement | null = widgetContainerRef.current;
    
    if (!element) {
      // Fallback: try to find by ID
      const elementById = document.getElementById(`widget-container-${renderedWidget.id}`);
      if (elementById) {
        element = elementById;
        console.log('Found widget container by ID');
      }
    }

    if (!element) {
      console.error('Widget container not found');
      alert('Widget container not found. Please try again.');
      return;
    }

    // Double-check the element is in the DOM
    if (!element.isConnected) {
      console.error('Widget container is not in the DOM');
      alert('Widget is not ready. Please wait a moment and try again.');
      return;
    }

    try {
      // Generate filename based on widget key and timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${renderedWidget.widgetKey || 'widget'}-${timestamp}.png`;
      
      console.log('Starting download for:', filename, 'Element:', element);
      await downloadWidgetAsPNG(element, filename);
      console.log('Download completed successfully');
    } catch (error) {
      console.error('Error downloading widget:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to download widget: ${errorMessage}`);
    }
  };

  return (
    <div className="flex flex-col gap-[9.6px] p-4">
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
      
      <div className="bg-sidebar rounded-lg border border-border p-6 min-h-[810px]">
        <Tabs defaultValue="widget" className="w-full">
          <TabsList className="mb-6 justify-start">
            <TabsTrigger value="widget">Widget</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="widget" className="mt-0">
            <div className="flex gap-6 items-start">
              {/* Parameters - 40% width */}
              <div className="flex flex-col gap-6 items-start w-[40%]">
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
                
                <div className="flex gap-3">
                  <PayButton fee="0.025" onClick={handlePay} />
                  {renderedWidget && (
                    <button
                      onClick={handleDownload}
                      className="border-none cursor-pointer bg-[#347745] text-white px-5 py-2.5 rounded font-semibold hover:opacity-90 transition-opacity"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>

              {/* Rendered Widget - 60% width (replaces on each render) */}
              <div className="w-[60%] flex flex-col gap-4 min-h-[713px] pb-6">
                {renderedWidget ? (
                  <div 
                    key={renderedWidget.id} 
                    ref={widgetContainerRef} 
                    className="w-full"
                    id={`widget-container-${renderedWidget.id}`}
                  >
                    {renderedWidget.component}
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-[713px] border border-border rounded-lg text-muted-foreground">
                    <p>Select Query Parameters To Generate Results</p>
                  </div>
                )}
              </div>
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

