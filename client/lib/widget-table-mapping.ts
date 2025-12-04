/**
 * Widget to Table Mapping
 * Maps widget keys to their corresponding table keys
 */

export function getTableKeyFromWidgetKey(widgetKey: string): string | null {
  const mapping: Record<string, string> = {
    // Current portfolio widgets -> current portfolio tables
    'portfolio': null, // No direct table equivalent (just net worth)
    'pie-current-portfolio-by-asset': 'portfolio-by-asset',
    'pie-current-portfolio-by-protocol': 'portfolio-by-protocol',
    'bar-current-portfolio-by-asset': 'portfolio-by-asset',
    'bar-current-portfolio-by-protocol': 'portfolio-by-protocol',
    
    // Historical portfolio widgets -> historical portfolio tables
    'historic': null, // No direct table equivalent (just net worth)
    'pie-historical-portfolio-by-asset': 'historical-portfolio-by-asset',
    'pie-historical-portfolio-by-protocol': 'historical-portfolio-by-protocol',
    'bar-historical-portfolio-by-asset': 'historical-portfolio-by-asset',
    'bar-historical-portfolio-by-protocol': 'historical-portfolio-by-protocol',
    
    // Comparison widgets -> comparison tables
    'pies-portfolio-by-asset': 'comparison-portfolio-by-asset',
    'pies-portfolio-by-protocol': 'comparison-portfolio-by-protocol',
    'bar-stacked-portfolio-by-asset': 'comparison-portfolio-by-asset',
    'bar-stacked-portfolio-by-protocol': 'comparison-portfolio-by-protocol',
    'bar-stacked-networth-by-chain': 'comparison-networth-by-chain',
    'bar-portfolio-by-networth': null, // No direct table equivalent (net worth is different)
    
    // Transactions widgets -> transactions tables
    'bar-transactions-by-day': 'transactions-by-day',
  };

  return mapping[widgetKey] || null;
}

