/**
 * Widget Renderer
 * Maps widget keys to their actual React components and provides rendering logic
 */

import React from 'react';

// Import all widget components
import Portfolio from '@/components/widgets/counter/portfolio';
import Historical from '@/components/widgets/counter/historic';
import PieCurrentPortfolioByAsset from '@/components/widgets/pie/pie-current-portfolio-by-asset';
import PieCurrentPortfolioByProtocol from '@/components/widgets/pie/pie-current-portfolio-by-protocol';
import PieHistoricalPortfolioByAsset from '@/components/widgets/pie/pie-historical-portfolio-by-asset';
import PieHistoricalPortfolioByProtocol from '@/components/widgets/pie/pie-historical-portfolio-by-protocol';
import PiesPortfolioByAsset from '@/components/widgets/pies/pies-portfolio-by-asset';
import PiesPortfolioByProtocol from '@/components/widgets/pies/pies-portfolio-by-protocol';
import BarCurrentPortfolioByAsset from '@/components/widgets/bar/bar-current-portfolio-by-asset';
import BarCurrentPortfolioByProtocol from '@/components/widgets/bar/bar-current-portfolio-by-protocol';
import BarHistoricalPortfolioByAsset from '@/components/widgets/bar/bar-historical-portfolio-by-asset';
import BarHistoricalPortfolioByProtocol from '@/components/widgets/bar/bar-historical-portfolio-by-protocol';
import BarPortfolioByNetWorth from '@/components/widgets/bar/bar-portfolio-by-networth';
import BarTransactionsByDay from '@/components/widgets/bar/bar-transactions-by-day';
import BarStackedPortfolioByAsset from '@/components/widgets/bar-stacked/bar-stacked-portfolio-by-asset';
import BarStackedPortfolioByProtocol from '@/components/widgets/bar-stacked/bar-stacked-portfolio-by-protocol';
import BarStackedNetworthByChain from '@/components/widgets/bar-stacked/bar-stacked-networth-by-chain';
import BarStackedTransactionsByCategory from '@/components/widgets/bar-stacked/bar-stacked-transactions-by-category';
import { TimeInterval } from '@/components/query-dropdowns/time-interval-dropdown';

export interface WidgetRenderParams {
  widgetKey: string;
  addresses: string[];
  dates: string[];
  chains?: string[];
  categories?: string[];
  timeInterval?: TimeInterval;
}

/**
 * Convert Date objects to ISO date strings (YYYY-MM-DD)
 */
function formatDateToISO(date: Date | null): string | null {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert Date objects array to ISO date strings array
 */
function formatDatesToISO(dates: Date[]): string[] {
  return dates.map(date => formatDateToISO(date) || '').filter(Boolean) as string[];
}

/**
 * Render a widget component based on the widget key and parameters
 */
export function renderWidget(params: WidgetRenderParams): React.ReactNode {
  const { widgetKey, addresses, dates, chains, categories, timeInterval } = params;

  // Get the first address (for now, widgets only support single address)
  const address = addresses[0] || '';
  
  if (!address) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="font-semibold text-yellow-800">Error</p>
        <p className="text-yellow-600">No address selected</p>
      </div>
    );
  }

  // Render widget based on key
  switch (widgetKey) {
    case 'portfolio':
      return <Portfolio address={address} />;

    case 'historic':
      if (!dates[0]) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No date selected</p>
          </div>
        );
      }
      const date5 = dates[0];
      const today5 = new Date().toISOString().split('T')[0];
      if (date5 === today5) {
        console.warn('WARNING: Historical widget received today\'s date:', date5, '- This might be incorrect!');
      }
      console.log('Historical - date prop:', date5);
      return <Historical address={address} date={date5} />;

    case 'pie-current-portfolio-by-asset':
      return <PieCurrentPortfolioByAsset address={address} />;

    case 'pie-current-portfolio-by-protocol':
      return <PieCurrentPortfolioByProtocol address={address} />;

    case 'pie-historical-portfolio-by-asset':
      if (!dates[0]) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No date selected</p>
          </div>
        );
      }
      const date1 = dates[0];
      const today = new Date().toISOString().split('T')[0];
      if (date1 === today) {
        console.warn('WARNING: PieHistoricalPortfolioByAsset received today\'s date:', date1, '- This might be incorrect!');
      }
      console.log('PieHistoricalPortfolioByAsset - date prop:', date1);
      return <PieHistoricalPortfolioByAsset address={address} date={date1} />;

    case 'pie-historical-portfolio-by-protocol':
      if (!dates[0]) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No date selected</p>
          </div>
        );
      }
      const date2 = dates[0];
      const today2 = new Date().toISOString().split('T')[0];
      if (date2 === today2) {
        console.warn('WARNING: PieHistoricalPortfolioByProtocol received today\'s date:', date2, '- This might be incorrect!');
      }
      console.log('PieHistoricalPortfolioByProtocol - date prop:', date2);
      return <PieHistoricalPortfolioByProtocol address={address} date={date2} />;

    case 'pies-portfolio-by-asset':
      if (dates.length === 0) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No dates selected</p>
          </div>
        );
      }
      return <PiesPortfolioByAsset address={address} dates={dates} />;

    case 'pies-portfolio-by-protocol':
      if (dates.length === 0) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No dates selected</p>
          </div>
        );
      }
      return <PiesPortfolioByProtocol address={address} dates={dates} />;

    case 'bar-current-portfolio-by-asset':
      return <BarCurrentPortfolioByAsset address={address} />;

    case 'bar-current-portfolio-by-protocol':
      return <BarCurrentPortfolioByProtocol address={address} />;

    case 'bar-historical-portfolio-by-asset':
      if (!dates[0]) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No date selected</p>
          </div>
        );
      }
      const date3 = dates[0];
      const today3 = new Date().toISOString().split('T')[0];
      if (date3 === today3) {
        console.warn('WARNING: BarHistoricalPortfolioByAsset received today\'s date:', date3, '- This might be incorrect!');
      }
      console.log('BarHistoricalPortfolioByAsset - date prop:', date3);
      return <BarHistoricalPortfolioByAsset address={address} date={date3} />;

    case 'bar-historical-portfolio-by-protocol':
      if (!dates[0]) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No date selected</p>
          </div>
        );
      }
      const date4 = dates[0];
      const today4 = new Date().toISOString().split('T')[0];
      if (date4 === today4) {
        console.warn('WARNING: BarHistoricalPortfolioByProtocol received today\'s date:', date4, '- This might be incorrect!');
      }
      console.log('BarHistoricalPortfolioByProtocol - date prop:', date4);
      return <BarHistoricalPortfolioByProtocol address={address} date={date4} />;

    case 'bar-portfolio-by-networth':
      if (dates.length === 0) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No dates selected</p>
          </div>
        );
      }
      return <BarPortfolioByNetWorth address={address} dates={dates} />;

    case 'bar-transactions-by-day':
      if (dates.length < 2) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">Please select a date range (start and end date)</p>
          </div>
        );
      }
      // Sort dates and use first as startDate, last as endDate
      const sortedDates = [...dates].sort((a, b) => a.localeCompare(b));
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];
      return <BarTransactionsByDay address={address} startDate={startDate} endDate={endDate} />;

    case 'bar-stacked-portfolio-by-asset':
      if (dates.length === 0) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No dates selected</p>
          </div>
        );
      }
      return <BarStackedPortfolioByAsset address={address} dates={dates} />;

    case 'bar-stacked-portfolio-by-protocol':
      if (dates.length === 0) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No dates selected</p>
          </div>
        );
      }
      return <BarStackedPortfolioByProtocol address={address} dates={dates} />;

    case 'bar-stacked-networth-by-chain':
      if (dates.length === 0) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No dates selected</p>
          </div>
        );
      }
      if (addresses.length === 0) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">No addresses selected</p>
          </div>
        );
      }
      return <BarStackedNetworthByChain addresses={addresses} dates={dates} />;

    case 'bar-stacked-transactions-by-category':
      if (dates.length < 2) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">Please select a date range (start and end date)</p>
          </div>
        );
      }
      if (addresses.length === 0) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">Please select at least one address</p>
          </div>
        );
      }
      if (!categories || categories.length === 0) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">Please select at least one category</p>
          </div>
        );
      }
      if (!timeInterval) {
        return (
          <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="font-semibold text-yellow-800">Error</p>
            <p className="text-yellow-600">Please select a time interval</p>
          </div>
        );
      }
      // Sort dates and use first as startDate, last as endDate
      const sortedDatesForCategory = [...dates].sort((a, b) => a.localeCompare(b));
      const startDateForCategory = sortedDatesForCategory[0];
      const endDateForCategory = sortedDatesForCategory[sortedDatesForCategory.length - 1];
      return (
        <BarStackedTransactionsByCategory
          addresses={addresses}
          startDate={startDateForCategory}
          endDate={endDateForCategory}
          timeInterval={timeInterval}
          selectedCategories={new Set(categories)}
        />
      );

    default:
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <p className="font-semibold text-red-800">Error</p>
          <p className="text-red-600">Unknown widget: {widgetKey}</p>
        </div>
      );
  }
}

/**
 * Extract dates from single date, multi date, or time period selections
 */
export function extractDates(
  widgetKey: string | null,
  singleDate: Date | null,
  multiDate: { mode: 'list' | 'interval'; dates: Date[]; intervalType?: 'daily' | 'weekly' | 'monthly'; intervalCount?: number; startDate?: Date },
  timePeriod: { startDate: Date | null; endDate: Date | null; granularity: string }
): string[] {
  if (!widgetKey) return [];

  // Import the widget config to determine date type
  const { getWidgetTimePeriodType } = require('@/lib/widget-time-config');
  const timeType = getWidgetTimePeriodType(widgetKey);

  if (timeType === 'single') {
    // For single date widgets, use current date if no date selected (for portfolio)
    if (widgetKey === 'portfolio') {
      return [new Date().toISOString().split('T')[0]]; // Current date
    }
    const dateStr = formatDateToISO(singleDate);
    return dateStr ? [dateStr] : [];
  }

  if (timeType === 'multi') {
    // For multi date widgets
    if (multiDate.mode === 'list') {
      return formatDatesToISO(multiDate.dates);
    } else if (multiDate.mode === 'interval' && multiDate.startDate) {
      // Generate dates based on interval
      const dates: string[] = [];
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
        const dateStr = formatDateToISO(date);
        if (dateStr) dates.push(dateStr);
      }
      return dates;
    }
    return [];
  }

  // For timescale widgets (future implementation)
  if (timeType === 'timescale') {
    // TODO: Implement timescale date extraction
    return [];
  }

  return [];
}

