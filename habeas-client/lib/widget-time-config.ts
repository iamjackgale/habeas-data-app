/**
 * Widget Time Period Configuration
 * Maps each widget to its time period selection type, chain/address options, and category options
 */

export type WidgetTimePeriodType = 'single' | 'multi' | 'timescale';
export type WidgetSelectionType = 'chains' | 'addresses' | 'both';

/**
 * Widgets that make a single call to Portfolio() or Historical()
 * Need: Single date selection
 */
const SINGLE_DATE_WIDGETS: string[] = [
  'portfolio', // Current portfolio (no date needed, but treated as single date)
  'historic', // Historical portfolio with one date
  'pie-current-portfolio-by-asset',
  'pie-current-portfolio-by-protocol',
  'pie-historical-portfolio-by-asset',
  'pie-historical-portfolio-by-protocol',
  'bar-current-portfolio-by-asset',
  'bar-current-portfolio-by-protocol',
  'bar-historical-portfolio-by-asset',
  'bar-historical-portfolio-by-protocol',
];

/**
 * Widgets that make multiple calls to Portfolio() or Historical()
 * Need: Either list up to 12 dates OR select daily/weekly/monthly for up to 12 entries
 */
const MULTI_DATE_WIDGETS: string[] = [
  'pies-portfolio-by-asset', // MAX_DATES = 4
  'pies-portfolio-by-protocol', // MAX_DATES = 4
  'bar-stacked-portfolio-by-asset', // MAX_DATES = 5
  'bar-stacked-portfolio-by-protocol', // MAX_DATES = 5
  'bar-stacked-networth-by-chain', // MAX_DATES = 12
  'bar-portfolio-by-networth', // MAX_DATES = 5
  'bar-transactions-by-day', // Needs startDate and endDate (2 dates, max 30 days range)
  'bar-stacked-transactions-by-category', // Needs startDate and endDate (date range) with categories
];

/**
 * Widgets that use time ranges (to be implemented later)
 * Need: Current time range bar
 */
const TIMESCALE_WIDGETS: string[] = [
  // To be added later
];

/**
 * Get the time period type for a widget
 */
export function getWidgetTimePeriodType(widgetKey: string | null): WidgetTimePeriodType {
  if (!widgetKey) return 'single'; // Default to single
  
  if (SINGLE_DATE_WIDGETS.includes(widgetKey)) {
    return 'single';
  }
  
  if (MULTI_DATE_WIDGETS.includes(widgetKey)) {
    return 'multi';
  }
  
  if (TIMESCALE_WIDGETS.includes(widgetKey)) {
    return 'timescale';
  }
  
  // Default to single if widget not found in mapping
  return 'single';
}

/**
 * Check if a widget requires single date selection
 */
export function requiresSingleDate(widgetKey: string | null): boolean {
  return getWidgetTimePeriodType(widgetKey) === 'single';
}

/**
 * Check if a widget requires multi date selection
 */
export function requiresMultiDate(widgetKey: string | null): boolean {
  return getWidgetTimePeriodType(widgetKey) === 'multi';
}

/**
 * Check if a widget requires timescale selection
 */
export function requiresTimescale(widgetKey: string | null): boolean {
  return getWidgetTimePeriodType(widgetKey) === 'timescale';
}

/**
 * Widget configuration interface
 */
export interface WidgetConfig {
  timePeriodType: WidgetTimePeriodType;
  selectionType: WidgetSelectionType;
  hasCategories: boolean;
}

/**
 * Complete widget configuration mapping
 */
const WIDGET_CONFIG: Record<string, WidgetConfig> = {
  // Single date widgets - addresses only, no categories
  'portfolio': { timePeriodType: 'single', selectionType: 'addresses', hasCategories: false },
  'historic': { timePeriodType: 'single', selectionType: 'addresses', hasCategories: false },
  'pie-current-portfolio-by-asset': { timePeriodType: 'single', selectionType: 'addresses', hasCategories: false },
  'pie-current-portfolio-by-protocol': { timePeriodType: 'single', selectionType: 'addresses', hasCategories: false },
  'pie-historical-portfolio-by-asset': { timePeriodType: 'single', selectionType: 'addresses', hasCategories: false },
  'pie-historical-portfolio-by-protocol': { timePeriodType: 'single', selectionType: 'addresses', hasCategories: false },
  'bar-current-portfolio-by-asset': { timePeriodType: 'single', selectionType: 'addresses', hasCategories: false },
  'bar-current-portfolio-by-protocol': { timePeriodType: 'single', selectionType: 'addresses', hasCategories: false },
  'bar-historical-portfolio-by-asset': { timePeriodType: 'single', selectionType: 'addresses', hasCategories: false },
  'bar-historical-portfolio-by-protocol': { timePeriodType: 'single', selectionType: 'addresses', hasCategories: false },
  
  // Multi date widgets - addresses only, no categories
  'pies-portfolio-by-asset': { timePeriodType: 'multi', selectionType: 'addresses', hasCategories: false },
  'pies-portfolio-by-protocol': { timePeriodType: 'multi', selectionType: 'addresses', hasCategories: false },
  'bar-stacked-portfolio-by-asset': { timePeriodType: 'multi', selectionType: 'addresses', hasCategories: false },
  'bar-stacked-portfolio-by-protocol': { timePeriodType: 'multi', selectionType: 'addresses', hasCategories: false },
  'bar-stacked-networth-by-chain': { timePeriodType: 'multi', selectionType: 'addresses', hasCategories: false },
  'bar-portfolio-by-networth': { timePeriodType: 'multi', selectionType: 'addresses', hasCategories: false },
  'bar-transactions-by-day': { timePeriodType: 'multi', selectionType: 'addresses', hasCategories: false },
  'bar-stacked-transactions-by-category': { timePeriodType: 'multi', selectionType: 'addresses', hasCategories: true },
};

/**
 * Get complete widget configuration
 */
export function getWidgetConfig(widgetKey: string | null): WidgetConfig {
  if (!widgetKey) {
    return { timePeriodType: 'single', selectionType: 'addresses', hasCategories: false };
  }
  
  return WIDGET_CONFIG[widgetKey] || { timePeriodType: 'single', selectionType: 'addresses', hasCategories: false };
}

/**
 * Get the selection type for a widget
 */
export function getWidgetSelectionType(widgetKey: string | null): WidgetSelectionType {
  return getWidgetConfig(widgetKey).selectionType;
}

/**
 * Check if a widget requires chain selection
 */
export function requiresChains(widgetKey: string | null): boolean {
  const selectionType = getWidgetSelectionType(widgetKey);
  return selectionType === 'chains' || selectionType === 'both';
}

/**
 * Check if a widget requires address selection
 */
export function requiresAddresses(widgetKey: string | null): boolean {
  const selectionType = getWidgetSelectionType(widgetKey);
  return selectionType === 'addresses' || selectionType === 'both';
}

/**
 * Check if a widget has category options
 */
export function hasCategories(widgetKey: string | null, mode: 'portfolio' | 'transactions'): boolean {
  // Categories are only available for transactions mode
  if (mode === 'transactions') {
    // Check the widget config to see if it has categories enabled
    return getWidgetConfig(widgetKey).hasCategories;
  }
  return getWidgetConfig(widgetKey).hasCategories;
}

/**
 * Check if a table has category options
 */
export function hasTableCategories(tableKey: string | null, mode: 'portfolio' | 'transactions'): boolean {
  // Categories are only available for transactions mode
  if (mode === 'transactions') {
    // Transactions-by-day table does not require categories
    if (tableKey === 'transactions-by-day') {
      return false;
    }
    // Default to true for other transactions tables (can be extended later)
    return true;
  }
  // Portfolio tables don't have categories
  return false;
}

