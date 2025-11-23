'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardFooter } from '@/components/dashboard-footer';
import { CategoryDropdown } from '@/components/query-dropdowns/category-dropdown';
import { TimePeriodDropdown, TimePeriodValue } from '@/components/query-dropdowns/time-period-dropdown';
import { SingleDateTimeDropdown } from '@/components/query-dropdowns/single-date-time-dropdown';
import { MultiDateTimeDropdown } from '@/components/query-dropdowns/multi-date-time-dropdown';
import { PayButton } from '@/components/query-dropdowns/pay-button';
import { WidgetSelectorDropdown } from '@/components/query-dropdowns/widget-selector-dropdown';
import { PortfolioTransactionsToggle } from '@/components/query-dropdowns/portfolio-transactions-toggle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getWidgetTimePeriodType, requiresAddresses, hasCategories, hasTableCategories } from '@/lib/widget-time-config';
import { AddressDropdown } from '@/components/query-dropdowns/address-dropdown';
import { renderWidget, WidgetRenderParams } from '@/lib/widget-renderer';
import { renderTable, TableRenderParams, TableRenderResult } from '@/lib/table-renderer';
import { renderData, DataRenderParams, DataRenderResult } from '@/lib/data-renderer';
import { convertTableToCSV, convertComparisonTableToCSV, downloadTableAsCSV } from '@/lib/table-download';
import { extractTableDataFromDOM, extractComparisonTableDataFromDOM } from '@/lib/table-csv-extractor';
import { getTableKeyFromWidgetKey } from '@/lib/widget-table-mapping';
import { downloadWidgetAsPNG } from '@/lib/widget-download';
import { TableSelectorDropdown } from '@/components/query-dropdowns/table-selector-dropdown';
import { PortfolioDownload } from '@/types/portfolio-download';
import { Transaction } from '@/types/transaction';
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

interface StoredTableParams {
  tableKey: string;
  addresses: string[];
  dates: string[];
  chains?: string[];
  categories?: string[];
}

interface StoredDataParams {
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
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
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
  // State to track rendered table (for Table tab)
  const [renderedTable, setRenderedTable] = useState<React.ReactNode | null>(null);
  const [tableData, setTableData] = useState<TableRenderResult | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  // Store the previous table to restore if error occurs
  const previousTableRef = useRef<React.ReactNode | null>(null);
  const previousTableDataRef = useRef<TableRenderResult | null>(null);
  // State to track rendered data (for Data tab)
  const [renderedData, setRenderedData] = useState<React.ReactNode | null>(null);
  const [dataDownload, setDataDownload] = useState<PortfolioDownload[] | Transaction[] | null>(null);
  const dataContainerRef = useRef<HTMLDivElement>(null);
  // Store the previous data to restore if error occurs
  const previousDataRef = useRef<React.ReactNode | null>(null);
  const previousDataDownloadRef = useRef<PortfolioDownload[] | Transaction[] | null>(null);

  // Load last rendered widget from localStorage on mount
  useEffect(() => {
    const loadStoredWidget = () => {
      try {
        const stored = localStorage.getItem('lastRenderedWidget');
        if (stored) {
          const params: StoredWidgetParams = JSON.parse(stored);
          
          // Sync singleDate state if this is a single-date widget with a stored date
          const widgetTimeType = getWidgetTimePeriodType(params.widgetKey);
          if (widgetTimeType === 'single' && params.dates && params.dates.length > 0) {
            const storedDateStr = params.dates[0];
            const storedDate = new Date(storedDateStr);
            if (!isNaN(storedDate.getTime())) {
              setSingleDate(storedDate);
              console.log('Synced singleDate from stored widget:', storedDateStr, storedDate);
            }
          }
          
          const widgetParams: WidgetRenderParams = {
            widgetKey: params.widgetKey,
            addresses: params.addresses,
            dates: params.dates,
            chains: params.chains || [],
            categories: params.categories || [],
          };
          
          // Debug: Log the dates being used
          if (params.widgetKey.includes('historical') || params.widgetKey === 'historic') {
            console.log('Loading historical widget with dates:', params.dates);
            if (params.dates && params.dates.length > 0) {
              const today = new Date().toISOString().split('T')[0];
              if (params.dates[0] === today) {
                console.warn('WARNING: Stored historical widget has today\'s date:', params.dates[0], '- This might be from a previous session where today was selected');
              }
            }
          }
          
          const widgetComponent = renderWidget(widgetParams);
          const storedWidget: RenderedWidget = {
            id: `${params.widgetKey}-stored`,
            widgetKey: params.widgetKey,
            component: widgetComponent,
          };
          setRenderedWidget(storedWidget);
          previousWidgetRef.current = storedWidget;
          
          // Also render the corresponding table in Table tab (this overrides any stored standalone table)
          const tableKey = getTableKeyFromWidgetKey(params.widgetKey);
          if (tableKey) {
            const tableParams: TableRenderParams = {
              tableKey: tableKey,
              addresses: params.addresses,
              dates: params.dates,
              chains: params.chains || [],
              categories: params.categories || [],
            };
            const tableResult = renderTable(tableParams);
            // Wrap in a div with a key to ensure React recognizes it as a new component
            const tableKeyUnique = `table-from-widget-stored-${params.widgetKey}-${Date.now()}`;
            setRenderedTable(
              <div key={tableKeyUnique}>
                {tableResult.component}
              </div>
            );
            setTableData(tableResult);
            previousTableRef.current = tableResult.component;
            previousTableDataRef.current = tableResult;
          }
        }
      } catch (error) {
        console.error('Error loading stored widget:', error);
      }
    };

    loadStoredWidget();
  }, []);

  // Load last rendered table from localStorage on mount (only if no widget was loaded)
  useEffect(() => {
    const loadStoredTable = () => {
      // Only load stored table if no widget was loaded (to avoid conflicts)
      const hasStoredWidget = localStorage.getItem('lastRenderedWidget');
      if (hasStoredWidget) {
        // Widget will handle rendering the Data tab table, so skip loading standalone table
        return;
      }
      
      try {
        const stored = localStorage.getItem('lastRenderedTable');
        if (stored) {
          const params: StoredTableParams = JSON.parse(stored);
          const tableParams: TableRenderParams = {
            tableKey: params.tableKey,
            addresses: params.addresses,
            dates: params.dates,
            chains: params.chains || [],
            categories: params.categories || [],
          };
          const tableResult = renderTable(tableParams);
          setRenderedTable(tableResult.component);
          setTableData(tableResult);
          previousTableRef.current = tableResult.component;
          previousTableDataRef.current = tableResult;
        }
      } catch (error) {
        console.error('Error loading stored table:', error);
      }
    };

    loadStoredTable();
  }, []);

  // Load last rendered data from localStorage on mount
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const stored = localStorage.getItem('lastRenderedData');
        if (stored) {
          const params: StoredDataParams = JSON.parse(stored);
          const dataParams: DataRenderParams = {
            addresses: params.addresses,
            dates: params.dates,
            chains: params.chains || [],
            categories: params.categories || [],
            mode: 'portfolio', // Stored data is from portfolio mode
            widgetKey: null,
            tableKey: null,
          };
          const dataResult = renderData(dataParams, (downloadData) => {
            setDataDownload(downloadData);
            previousDataDownloadRef.current = downloadData;
          });
          setRenderedData(dataResult.component);
          previousDataRef.current = dataResult.component;
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };

    loadStoredData();
  }, []);

  // Determine which time dropdown to show based on selected widget
  const widgetTimeType = getWidgetTimePeriodType(selectedWidget);
  const showAddresses = requiresAddresses(selectedWidget);
  const showCategories = hasCategories(selectedWidget, mode);

  // Determine table time type based on selected table
  const getTableTimeType = (tableKey: string | null, currentMode: Mode): 'single' | 'multi' | 'timescale' => {
    if (!tableKey) return 'single';
    // Transactions tables use date range (timescale)
    if (currentMode === 'transactions' && tableKey === 'transactions-by-day') return 'timescale';
    if (tableKey.startsWith('comparison-')) return 'multi';
    if (tableKey.startsWith('historical-')) return 'single';
    return 'single'; // Current portfolio tables use current date
  };

  const tableTimeType = getTableTimeType(selectedTable, mode);
  const showTableCategories = hasTableCategories(selectedTable, mode);

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
        // Format single date to ISO - this is the date selected by the user
        const year = singleDate.getFullYear();
        const month = String(singleDate.getMonth() + 1).padStart(2, '0');
        const day = String(singleDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        dates.push(formattedDate);
        // Debug: Log the date being used for historical widgets
        if (selectedWidget.includes('historical') || selectedWidget === 'historic') {
          console.log('Historical widget date:', formattedDate, 'from singleDate:', singleDate);
          const today = new Date().toISOString().split('T')[0];
          if (formattedDate === today) {
            console.warn('WARNING: Historical widget is using today\'s date:', formattedDate, '- Make sure this is intentional!');
          }
        }
      } else {
        // For historical widgets, we MUST have a date - don't default to today
        // This should have been caught by the validation below, but adding explicit check
        console.warn('Historical widget selected but no date provided. Widget:', selectedWidget);
      }
    } else if (widgetTimeType === 'multi') {
      // For transactions widgets, use timePeriod (date range)
      if (mode === 'transactions' && timePeriod.startDate && timePeriod.endDate) {
        const start = new Date(timePeriod.startDate);
        const end = new Date(timePeriod.endDate);
        
        // Format start and end dates
        const formatDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        dates.push(formatDate(start));
        dates.push(formatDate(end));
      } else if (mode === 'portfolio') {
        // For portfolio multi-date widgets, use multiDate
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
    }
    
    // For portfolio widget, it uses current date automatically
    // For other single date widgets, ensure we have a date
    if (widgetTimeType === 'single' && selectedWidget !== 'portfolio' && dates.length === 0) {
      alert('Please select a date');
      return;
    }

    // For multi date widgets, ensure we have dates
    if (widgetTimeType === 'multi' && dates.length === 0) {
      if (mode === 'transactions') {
        alert('Please select a date range (start and end date)');
      } else {
        alert('Please select at least one date');
      }
      return;
    }
    
    // For transactions widgets with date range, ensure we have both start and end dates
    if (widgetTimeType === 'multi' && mode === 'transactions' && dates.length < 2) {
      alert('Please select both start and end dates');
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
    
    // Debug: Log dates for historical widgets
    if (selectedWidget.includes('historical') || selectedWidget === 'historic') {
      console.log('Rendering historical widget:', selectedWidget);
      console.log('Dates array:', dates);
      console.log('singleDate state:', singleDate);
      console.log('widgetTimeType:', widgetTimeType);
      if (dates.length > 0) {
        console.log('Date being passed to widget:', dates[0]);
      } else {
        console.error('ERROR: No dates in array for historical widget!');
      }
    }

    // Store current widget as previous before rendering new one
    previousWidgetRef.current = renderedWidget;

    // Immediately render corresponding table in Table tab (before widget wrapper checks for errors)
    // This ensures the table is always updated when a widget is rendered
    // Store current table as previous before rendering new one
    previousTableRef.current = renderedTable;
    previousTableDataRef.current = tableData;
    
    const tableKey = getTableKeyFromWidgetKey(selectedWidget);
    if (tableKey) {
      const tableParams: TableRenderParams = {
        tableKey: tableKey,
        addresses: addresses,
        dates: dates,
        chains: chains,
        categories: categories,
      };
      const tableResult = renderTable(tableParams);
      
      // Use a unique key based on widget and timestamp to force React to recognize it as new
      const tableKeyUnique = `table-from-widget-${selectedWidget}-${Date.now()}`;
      const wrappedTable = (
        <div key={tableKeyUnique}>
          {tableResult.component}
        </div>
      );
      
      setRenderedTable(wrappedTable);
      setTableData(tableResult);
    }

    // Also render data in Data tab (this overrides any stored standalone data)
    const dataParams: DataRenderParams = {
      addresses: addresses,
      dates: dates,
      chains: chains,
      categories: categories,
      mode: mode,
      widgetKey: selectedWidget,
      tableKey: null,
    };
    const dataResult = renderData(dataParams, (downloadData) => {
      setDataDownload(downloadData);
      previousDataDownloadRef.current = downloadData;
    });
    setRenderedData(dataResult.component);
    previousDataRef.current = dataResult.component;

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
                
                // Also store data params for Data tab
                const dataParamsToStore: StoredDataParams = {
                  addresses: addrs,
                  dates: dts,
                  chains: chns.length > 0 ? chns : undefined,
                  categories: cats.length > 0 ? cats : undefined,
                };
                localStorage.setItem('lastRenderedData', JSON.stringify(dataParamsToStore));
                
                // Note: Table and Data are already rendered above in handlePay, so we don't need to render them again here
                // They were rendered immediately when the widget was requested, ensuring they're always in sync
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

  // Helper function to convert TimePeriodValue to dates array
  const convertTimePeriodToDates = (timePeriod: TimePeriodValue): string[] => {
    const dates: string[] = [];
    
    if (!timePeriod.startDate) {
      return dates; // No start date selected
    }
    
    const start = new Date(timePeriod.startDate);
    const end = timePeriod.endDate ? new Date(timePeriod.endDate) : new Date(); // If no end date, use today
    
    // Ensure start is before end
    if (start > end) {
      return dates; // Invalid range
    }
    
    // Generate dates based on granularity
    if (timePeriod.granularity === 'date') {
      // Single date or date range - generate daily dates
      const current = new Date(start);
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
      }
    } else if (timePeriod.granularity === 'week') {
      // Weekly - generate one date per week
      const current = new Date(start);
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 7);
      }
    } else if (timePeriod.granularity === 'month') {
      // Monthly - generate one date per month
      const current = new Date(start);
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        current.setMonth(current.getMonth() + 1);
      }
    } else if (timePeriod.granularity === 'quarter') {
      // Quarterly - generate one date per quarter
      const current = new Date(start);
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        current.setMonth(current.getMonth() + 3);
      }
    } else if (timePeriod.granularity === 'year') {
      // Yearly - generate one date per year
      const current = new Date(start);
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        current.setFullYear(current.getFullYear() + 1);
      }
    } else if (timePeriod.granularity === 'past') {
      // Past periods - if startDate is set, use it; otherwise generate based on end date
      if (timePeriod.endDate) {
        const year = timePeriod.endDate.getFullYear();
        const month = String(timePeriod.endDate.getMonth() + 1).padStart(2, '0');
        const day = String(timePeriod.endDate.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      } else if (timePeriod.startDate) {
        const year = timePeriod.startDate.getFullYear();
        const month = String(timePeriod.startDate.getMonth() + 1).padStart(2, '0');
        const day = String(timePeriod.startDate.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      }
    }
    
    // Limit to 12 dates max
    return dates.slice(0, 12);
  };

  // Handle data rendering (for Data tab)
  const handleDataRender = () => {
    const addresses = Array.from(selectedAddresses);
    if (addresses.length === 0) {
      alert('Please select at least one address');
      return;
    }

    // Extract dates from time period selection
    const dates = convertTimePeriodToDates(timePeriod);
    
    if (dates.length === 0) {
      alert('Please select a time period');
      return;
    }

    const chains = Array.from(selectedChains);
    const categories = Array.from(selectedCategories);

    const params: DataRenderParams = {
      addresses: addresses,
      dates: dates,
      chains: chains,
      categories: categories,
      mode: mode,
      widgetKey: null,
      tableKey: null,
    };

    // Store current data as previous before rendering new one
    previousDataRef.current = renderedData;
    previousDataDownloadRef.current = dataDownload;

    const dataResult = renderData(params, (downloadData) => {
      setDataDownload(downloadData);
      previousDataDownloadRef.current = downloadData;
    });
    setRenderedData(dataResult.component);
    previousDataRef.current = dataResult.component;

    // Store data params in localStorage
    try {
      const paramsToStore: StoredDataParams = {
        addresses: addresses,
        dates: dates,
        chains: chains.length > 0 ? chains : undefined,
        categories: categories.length > 0 ? categories : undefined,
      };
      localStorage.setItem('lastRenderedData', JSON.stringify(paramsToStore));
    } catch (err) {
      console.error('Error storing data params:', err);
    }
  };

  // Handle table rendering (similar to handlePay but for tables)
  const handleTableRender = () => {
    if (!selectedTable) {
      alert('Please select a table first');
      return;
    }

    const addresses = Array.from(selectedAddresses);
    if (addresses.length === 0) {
      alert('Please select at least one address');
      return;
    }

    // Extract dates based on table type
    const dates: string[] = [];
    
    if (tableTimeType === 'single') {
      if (selectedTable === 'portfolio-by-protocol' || selectedTable === 'portfolio-by-asset') {
        // Current portfolio tables use current date automatically
        dates.push(new Date().toISOString().split('T')[0]);
      } else if (singleDate) {
        const year = singleDate.getFullYear();
        const month = String(singleDate.getMonth() + 1).padStart(2, '0');
        const day = String(singleDate.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      }
    } else if (tableTimeType === 'timescale') {
      // For transactions tables, use timePeriod (date range)
      if (timePeriod.startDate && timePeriod.endDate) {
        const start = new Date(timePeriod.startDate);
        const end = new Date(timePeriod.endDate);
        
        // Format start and end dates
        const formatDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        dates.push(formatDate(start));
        dates.push(formatDate(end));
      }
    } else if (tableTimeType === 'multi') {
      // For portfolio multi-date tables, use multiDate
      if (multiDate.mode === 'list') {
        multiDate.dates.forEach(date => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dates.push(`${year}-${month}-${day}`);
        });
      } else if (multiDate.mode === 'interval' && multiDate.startDate) {
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
    
    if (tableTimeType === 'single' && !selectedTable.startsWith('portfolio-by-') && dates.length === 0) {
      alert('Please select a date');
      return;
    }

    if (tableTimeType === 'timescale' && dates.length < 2) {
      alert('Please select both start and end dates');
      return;
    }

    if (tableTimeType === 'multi' && dates.length === 0) {
      alert('Please select at least one date');
      return;
    }

    const chains = Array.from(selectedChains);
    const categories = Array.from(selectedCategories);

    const params: TableRenderParams = {
      tableKey: selectedTable,
      addresses: addresses,
      dates: dates,
      chains: chains,
      categories: categories,
    };

    // Store current table as previous before rendering new one
    previousTableRef.current = renderedTable;
    previousTableDataRef.current = tableData;

    const tableResult = renderTable(params);

    // Create a wrapper component that can detect errors after rendering
    const TableWrapper = ({ 
      children, 
      tableKey, 
      addresses: addrs, 
      dates: dts, 
      chains: chns, 
      categories: cats
    }: { 
      children: React.ReactNode; 
      tableKey: string;
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
        // to allow the table to fully render
        const timeoutId = setTimeout(() => {
          if (containerRef.current && !hasStoredRef.current && !errorCheckedRef.current) {
            const hasError = containerRef.current.querySelector('.border-red-300, .border-yellow-300') !== null;
            errorCheckedRef.current = true;
            
            // Only store if there's no error
            if (!hasError) {
              try {
                const paramsToStore: StoredTableParams = {
                  tableKey: tableKey,
                  addresses: addrs,
                  dates: dts,
                  chains: chns.length > 0 ? chns : undefined,
                  categories: cats.length > 0 ? cats : undefined,
                };
                localStorage.setItem('lastRenderedTable', JSON.stringify(paramsToStore));
                hasStoredRef.current = true;
                
                // Also store data params for Data tab
                const dataParamsToStore: StoredDataParams = {
                  addresses: addrs,
                  dates: dts,
                  chains: chns.length > 0 ? chns : undefined,
                  categories: cats.length > 0 ? cats : undefined,
                };
                localStorage.setItem('lastRenderedData', JSON.stringify(dataParamsToStore));
                
                // Also render data in Data tab
                const dataParams: DataRenderParams = {
                  addresses: addrs,
                  dates: dts,
                  chains: chns,
                  categories: cats,
                  mode: mode,
                  widgetKey: null,
                  tableKey: tableKey,
                };
                const dataResult = renderData(dataParams, (downloadData) => {
                  setDataDownload(downloadData);
                  previousDataDownloadRef.current = downloadData;
                });
                setRenderedData(dataResult.component);
                previousDataRef.current = dataResult.component;
              } catch (err) {
                console.error('Error storing table params:', err);
              }
            } else {
              // Error detected - restore previous table after 5 seconds
              if (previousTableRef.current && previousTableDataRef.current) {
                setTimeout(() => {
                  setRenderedTable(previousTableRef.current);
                  setTableData(previousTableDataRef.current);
                }, 5000); // Wait 5 seconds before restoring
              }
            }
          }
        }, 500); // Wait 500ms for table to render

        return () => clearTimeout(timeoutId);
      }, [children, tableKey, addrs, dts, chns, cats]);

      return <div ref={containerRef}>{children}</div>;
    };

    // Replace the existing table
    setRenderedTable(
      <TableWrapper
        tableKey={selectedTable}
        addresses={addresses}
        dates={dates}
        chains={chains}
        categories={categories}
      >
        {tableResult.component}
      </TableWrapper>
    );
    setTableData(tableResult);
  };

  // Handle CSV download
  const handleTableDownload = () => {
    if (!tableData || !tableContainerRef.current) {
      alert('No table data available to download');
      return;
    }

    try {
      // Find the table element in the container
      const tableElement = tableContainerRef.current.querySelector('table');
      if (!tableElement) {
        alert('Table not found. Please try rendering the table again.');
        return;
      }

      let csvContent: string;
      let filename: string;

      // Check if it's a comparison table (has multiple date columns)
      const headerCells = tableElement.querySelectorAll('thead th');
      const isComparisonTable = headerCells.length > 2; // More than Name + Value columns

      if (isComparisonTable) {
        // Extract comparison table data from DOM
        const extracted = extractComparisonTableDataFromDOM(tableElement);
        if (!extracted) {
          alert('Failed to extract comparison table data. Please try again.');
          return;
        }
        csvContent = convertComparisonTableToCSV(
          extracted.data,
          tableData.title,
          extracted.dates
        );
        filename = `${selectedTable || 'table'}-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        // Extract regular table data from DOM
        const extracted = extractTableDataFromDOM(tableElement);
        if (!extracted) {
          alert('Failed to extract table data. Please try again.');
          return;
        }
        csvContent = convertTableToCSV(
          extracted,
          tableData.title,
          tableData.showTransactions || false
        );
        filename = `${selectedTable || 'table'}-${new Date().toISOString().split('T')[0]}.csv`;
      }

      downloadTableAsCSV(csvContent, filename);
    } catch (error) {
      console.error('Error downloading table:', error);
      alert(`Failed to download table: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle data download button click
  const handleDataDownload = () => {
    if (!dataDownload || dataDownload.length === 0) {
      alert('No data available to download');
      return;
    }

    try {
      const jsonString = JSON.stringify(dataDownload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      // Determine filename based on data type
      const isTransactionData = dataDownload.length > 0 && 'hash' in dataDownload[0];
      const filename = isTransactionData 
        ? `transaction-data-${timestamp}.json`
        : `portfolio-data-${timestamp}.json`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading data:', error);
      alert(`Failed to download data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
                
                {/* For transactions widgets, use TimePeriodDropdown (date range) */}
                {selectedWidget && widgetTimeType === 'multi' && mode === 'transactions' && (
                  <div className="w-full max-w-md">
                    <TimePeriodDropdown value={timePeriod} onChange={setTimePeriod} />
                  </div>
                )}
                
                {/* For portfolio multi-date widgets, use MultiDateTimeDropdown */}
                {selectedWidget && widgetTimeType === 'multi' && mode === 'portfolio' && (
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
                
                {/* Show address selection for widgets - show for both portfolio and transactions mode */}
                {(mode === 'portfolio' || (mode === 'transactions' && showAddresses)) && (
                  <div className="w-full max-w-md">
                    <AddressDropdown value={selectedAddresses} onChange={setSelectedAddresses} />
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
            <div className="flex gap-6">
              {/* Parameters - 40% width */}
              <div className="flex flex-col gap-6 items-start w-[40%]">
                <PortfolioTransactionsToggle defaultMode={mode} onChange={setMode} />
                <TableSelectorDropdown mode={mode} value={selectedTable} onChange={setSelectedTable} />
                
                {/* Conditionally render time dropdown based on table type */}
                {selectedTable && tableTimeType === 'single' && (
                  <div className="w-full max-w-md">
                    <SingleDateTimeDropdown value={singleDate} onChange={setSingleDate} />
                  </div>
                )}
                
                {/* For transactions tables, use TimePeriodDropdown (date range) */}
                {selectedTable && tableTimeType === 'timescale' && (
                  <div className="w-full max-w-md">
                    <TimePeriodDropdown value={timePeriod} onChange={setTimePeriod} />
                  </div>
                )}
                
                {/* For portfolio multi-date tables, use MultiDateTimeDropdown */}
                {selectedTable && tableTimeType === 'multi' && mode === 'portfolio' && (
                  <div className="w-full max-w-md">
                    <MultiDateTimeDropdown value={multiDate} onChange={setMultiDate} />
                  </div>
                )}
                
                {!selectedTable && (
                  <div className="w-full max-w-md">
                    <TimePeriodDropdown value={timePeriod} onChange={setTimePeriod} />
                  </div>
                )}
                
                {/* Show addresses for portfolio mode */}
                {mode === 'portfolio' && (
                  <div className="w-full max-w-md">
                    <AddressDropdown value={selectedAddresses} onChange={setSelectedAddresses} />
                  </div>
                )}
                
                {/* Show addresses for transactions mode if table requires them */}
                {mode === 'transactions' && requiresAddresses(selectedTable) && (
                  <div className="w-full max-w-md">
                    <AddressDropdown value={selectedAddresses} onChange={setSelectedAddresses} />
                  </div>
                )}
                
                {/* Categories only shown for transactions mode and if table supports categories */}
                {mode === 'transactions' && showTableCategories && (
                  <div className="w-full max-w-md">
                    <CategoryDropdown value={selectedCategories} onChange={setSelectedCategories} />
                  </div>
                )}
                
                <div className="flex gap-3">
                  <PayButton fee="0.025" onClick={handleTableRender} />
                  {renderedTable && tableData && (
                    <button
                      onClick={handleTableDownload}
                      className="border-none cursor-pointer bg-[#347745] text-white px-5 py-2.5 rounded font-semibold hover:opacity-90 transition-opacity"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>

              {/* Rendered Table - 60% width */}
              <div className="w-[60%] flex flex-col gap-4 min-h-[713px] pb-6" ref={tableContainerRef}>
                {renderedTable ? (
                  <div className="w-full">
                    {renderedTable}
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-[713px] border border-border rounded-lg text-muted-foreground">
                    <p>Select Query Parameters And Pay To Generate Results</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="mt-0">
            <div className="flex gap-6 items-start">
              {/* Parameters - 40% width */}
              <div className="flex flex-col gap-6 items-start w-[40%]">
                <PortfolioTransactionsToggle defaultMode={mode} onChange={setMode} />
                
                {/* Time period dropdown - always use TimePeriodDropdown for data tab */}
                <div className="w-full max-w-md">
                  <TimePeriodDropdown value={timePeriod} onChange={setTimePeriod} />
                </div>
                
                {/* Address dropdown - shown for both portfolio and transactions mode */}
                <div className="w-full max-w-md">
                  <AddressDropdown value={selectedAddresses} onChange={setSelectedAddresses} />
                </div>
                
                {/* Categories only shown for transactions mode */}
                {mode === 'transactions' && (
                  <div className="w-full max-w-md">
                    <CategoryDropdown value={selectedCategories} onChange={setSelectedCategories} />
                  </div>
                )}
                
                <div className="flex gap-3">
                  <PayButton fee="0.025" onClick={handleDataRender} />
                  {renderedData && dataDownload && dataDownload.length > 0 && (
                    <button
                      onClick={handleDataDownload}
                      className="border-none cursor-pointer bg-[#347745] text-white px-5 py-2.5 rounded font-semibold hover:opacity-90 transition-opacity"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>

              {/* Rendered Data - 60% width */}
              <div className="w-[60%] flex flex-col gap-4 min-h-[713px] pb-6" ref={dataContainerRef}>
                {renderedData ? (
                  <div className="w-full">
                    {renderedData}
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-[713px] border border-border rounded-lg text-muted-foreground">
                    <p>Select Query Parameters And Pay To Generate Results</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

