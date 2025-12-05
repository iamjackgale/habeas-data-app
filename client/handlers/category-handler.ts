import { Transaction } from '@/types/transaction';
import { CategoriesConfig } from '@/hooks/use-categories';
import { TimeInterval } from '@/components/query-dropdowns/time-interval-dropdown';
import { getIntervalStart } from '@/lib/time-interval-utils';

/**
 * Get the category type from config
 * 
 * @param category - Category name
 * @param categoriesConfig - Categories configuration from config.json
 * @returns Category type: 'revenue', 'cost', or 'none' (defaults to 'none' if not found)
 */
export function getCategoryType(
  category: string,
  categoriesConfig: CategoriesConfig
): 'revenue' | 'cost' | 'none' {
  const categoryConfig = categoriesConfig[category];
  if (!categoryConfig) {
    return 'none';
  }
  const type = categoryConfig.category_type?.toLowerCase();
  if (type === 'revenue') return 'revenue';
  if (type === 'cost') return 'cost';
  return 'none';
}

/**
 * Extract category name from either a string or an object with a label property
 */
export function extractCategoryName(category: any): string | null {
  // Handle string categories
  if (typeof category === 'string') {
    const trimmed = category.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  // Handle object categories with label property
  if (category && typeof category === 'object' && !Array.isArray(category)) {
    // Check if it has a label property
    if (category.label && typeof category.label === 'string') {
      const trimmed = category.label.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }

  return null;
}

/**
 * Aggregate transactions by category
 * Returns a dictionary with category as key and aggregated value as value
 * 
 * @param transactions - Array of transactions to aggregate
 * @param valueField - Field to use for aggregation ('value', 'valueFiat', 'fees', 'feesFiat')
 * @param selectedCategories - Optional set of categories to filter by
 * @returns Dictionary with category as key and total value as value
 */
export function aggregateTransactionsByCategory(
  transactions: Transaction[],
  valueField: 'value' | 'valueFiat' | 'fees' | 'feesFiat' = 'valueFiat',
  selectedCategories?: Set<string>
): Record<string, number> {
  const categoryTotals: Record<string, number> = {};

  transactions.forEach(transaction => {
    // Get the value to aggregate
    const value = parseFloat(transaction[valueField] || '0') || 0;
    
    // If transaction has no categories, skip it
    if (!transaction.categories || transaction.categories.length === 0) {
      return;
    }

    // Process each category in the transaction
    transaction.categories.forEach(category => {
      // Extract category name (handles both string and object formats)
      const categoryName = extractCategoryName(category);
      if (!categoryName) {
        return; // Skip invalid categories
      }

      // Filter by selected categories if provided
      if (selectedCategories && !selectedCategories.has(categoryName)) {
        return;
      }

      // Aggregate the value for this category
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + value;
    });
  });

  return categoryTotals;
}

/**
 * Aggregate transactions by category and date
 * Returns a nested dictionary: date -> category -> value
 * 
 * @param transactions - Array of transactions to aggregate
 * @param valueField - Field to use for aggregation
 * @param selectedCategories - Optional set of categories to filter by
 * @returns Nested dictionary with date as outer key, category as inner key, and value as value
 */
export function aggregateTransactionsByCategoryAndDate(
  transactions: Transaction[],
  valueField: 'value' | 'valueFiat' | 'fees' | 'feesFiat' = 'valueFiat',
  selectedCategories?: Set<string>
): Record<string, Record<string, number>> {
  const dateCategoryTotals: Record<string, Record<string, number>> = {};

  transactions.forEach(transaction => {
    // Get the value to aggregate
    const value = parseFloat(transaction[valueField] || '0') || 0;
    
    // Get date from timestamp (YYYY-MM-DD format)
    if (!transaction.timestamp) {
      return;
    }

    const txDate = new Date(Number(transaction.timestamp) * 1000);
    if (isNaN(txDate.getTime())) {
      return;
    }
    
    const dateStr = txDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // If transaction has no categories, skip it
    if (!transaction.categories || transaction.categories.length === 0) {
      return;
    }

    // Initialize date entry if it doesn't exist
    if (!dateCategoryTotals[dateStr]) {
      dateCategoryTotals[dateStr] = {};
    }

    // Process each category in the transaction
    transaction.categories.forEach(category => {
      // Extract category name (handles both string and object formats)
      const categoryName = extractCategoryName(category);
      if (!categoryName) {
        return; // Skip invalid categories
      }

      // Filter by selected categories if provided
      if (selectedCategories && !selectedCategories.has(categoryName)) {
        return;
      }

      // Aggregate the value for this category on this date
      dateCategoryTotals[dateStr][categoryName] = (dateCategoryTotals[dateStr][categoryName] || 0) + value;
    });
  });

  return dateCategoryTotals;
}

/**
 * Group categories by type (revenue vs cost)
 * 
 * @param categoryTotals - Dictionary of category -> value
 * @param categoriesConfig - Categories configuration from config.json
 * @returns Object with revenue, cost, and none dictionaries
 */
export function groupCategoriesByType(
  categoryTotals: Record<string, number>,
  categoriesConfig: CategoriesConfig
): {
  revenues: Record<string, number>;
  costs: Record<string, number>;
  none: Record<string, number>;
} {
  const revenues: Record<string, number> = {};
  const costs: Record<string, number> = {};
  const none: Record<string, number> = {};

  Object.entries(categoryTotals).forEach(([category, value]) => {
    const type = getCategoryType(category, categoriesConfig);
    if (type === 'revenue') {
      revenues[category] = value;
    } else if (type === 'cost') {
      costs[category] = value;
    } else {
      none[category] = value;
    }
  });

  return { revenues, costs, none };
}

/**
 * Filter transactions by selected categories
 * 
 * @param transactions - Array of transactions to filter
 * @param selectedCategories - Set of category names to include
 * @returns Filtered array of transactions that have at least one matching category
 */
export function filterTransactionsByCategories(
  transactions: Transaction[],
  selectedCategories: Set<string>
): Transaction[] {
  if (selectedCategories.size === 0) {
    return transactions;
  }

  return transactions.filter(transaction => {
    if (!transaction.categories || transaction.categories.length === 0) {
      return false;
    }

    // Check if transaction has at least one selected category
    return transaction.categories.some(category => selectedCategories.has(category));
  });
}

/**
 * Get all unique categories from transactions
 * 
 * @param transactions - Array of transactions
 * @returns Set of unique category names
 */
export function getUniqueCategories(transactions: Transaction[]): Set<string> {
  const categories = new Set<string>();

  transactions.forEach(transaction => {
    if (transaction.categories && transaction.categories.length > 0) {
      transaction.categories.forEach(category => {
        categories.add(category);
      });
    }
  });

  return categories;
}

/**
 * Calculate total value for a category type (revenue or cost)
 * 
 * @param categoryTotals - Dictionary of category -> value
 * @param type - 'revenue', 'cost', or 'none'
 * @param categoriesConfig - Categories configuration from config.json
 * @returns Total value for the specified type
 */
export function getTotalByType(
  categoryTotals: Record<string, number>,
  type: 'revenue' | 'cost' | 'none',
  categoriesConfig: CategoriesConfig
): number {
  return Object.entries(categoryTotals).reduce((total, [category, value]) => {
    const categoryType = getCategoryType(category, categoriesConfig);
    return categoryType === type ? total + value : total;
  }, 0);
}

/**
 * Get category statistics
 * 
 * @param categoryTotals - Dictionary of category -> value
 * @param categoriesConfig - Categories configuration from config.json
 * @returns Statistics object with totals and counts
 */
export function getCategoryStatistics(
  categoryTotals: Record<string, number>,
  categoriesConfig: CategoriesConfig
): {
  totalRevenue: number;
  totalCost: number;
  totalNone: number;
  totalValue: number;
  revenueCount: number;
  costCount: number;
  noneCount: number;
} {
  const grouped = groupCategoriesByType(categoryTotals, categoriesConfig);
  
  const totalRevenue = Object.values(grouped.revenues).reduce((sum, val) => sum + val, 0);
  const totalCost = Object.values(grouped.costs).reduce((sum, val) => sum + val, 0);
  const totalNone = Object.values(grouped.none).reduce((sum, val) => sum + val, 0);
  
  return {
    totalRevenue,
    totalCost,
    totalNone,
    totalValue: totalRevenue + totalCost + totalNone,
    revenueCount: Object.keys(grouped.revenues).length,
    costCount: Object.keys(grouped.costs).length,
    noneCount: Object.keys(grouped.none).length,
  };
}

/**
 * Extract all categories from a transaction (transaction level, assetsIn, assetsOut, nativeAssetFees)
 * 
 * @param transaction - Transaction to extract categories from
 * @returns Array of unique category names found in the transaction
 */
export function extractAllCategoriesFromTransaction(transaction: Transaction): string[] {
  const allCategories: string[] = [];

  // Extract categories from transaction level
  if (transaction.categories && Array.isArray(transaction.categories)) {
    transaction.categories.forEach(category => {
      const categoryName = extractCategoryName(category);
      if (categoryName) {
        allCategories.push(categoryName);
      }
    });
  }

  // Extract categories from assetsIn
  if (transaction.assetsIn && Array.isArray(transaction.assetsIn)) {
    transaction.assetsIn.forEach(asset => {
      if (asset.categories && Array.isArray(asset.categories)) {
        asset.categories.forEach(category => {
          const categoryName = extractCategoryName(category);
          if (categoryName) {
            allCategories.push(categoryName);
          }
        });
      }
    });
  }

  // Extract categories from assetsOut
  if (transaction.assetsOut && Array.isArray(transaction.assetsOut)) {
    transaction.assetsOut.forEach(asset => {
      if (asset.categories && Array.isArray(asset.categories)) {
        asset.categories.forEach(category => {
          const categoryName = extractCategoryName(category);
          if (categoryName) {
            allCategories.push(categoryName);
          }
        });
      }
    });
  }

  // Extract categories from nativeAssetFees
  if (transaction.nativeAssetFees && transaction.nativeAssetFees.categories && Array.isArray(transaction.nativeAssetFees.categories)) {
    transaction.nativeAssetFees.categories.forEach(category => {
      const categoryName = extractCategoryName(category);
      if (categoryName) {
        allCategories.push(categoryName);
      }
    });
  }

  // Return unique categories
  return Array.from(new Set(allCategories));
}

/**
 * Group transactions by time interval and category
 * Returns a nested dictionary: interval -> category -> value
 * 
 * @param transactions - Array of transactions to aggregate
 * @param startDate - Start date of the range (ISO string)
 * @param endDate - End date of the range (ISO string)
 * @param interval - Time interval type (daily, weekly, monthly, quarterly, yearly)
 * @param selectedCategories - Optional set of categories to filter by
 * @param valueField - Field to use for aggregation (default: 'valueFiat')
 * @returns Nested dictionary with interval as outer key, category as inner key, and value as value
 */
export function aggregateTransactionsByIntervalAndCategory(
  transactions: Transaction[],
  startDate: string,
  endDate: string,
  interval: TimeInterval,
  selectedCategories: Set<string>,
  valueField: 'value' | 'valueFiat' | 'fees' | 'feesFiat' = 'valueFiat'
): Record<string, Record<string, number>> {
  const intervalCategoryTotals: Record<string, Record<string, number>> = {};
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Helper to get value from an asset in assetsIn array
  // Assets have 'value' field (which is in fiat), but not 'valueFiat'
  // So when valueField is 'valueFiat', we use asset.value
  const getAssetInValue = (asset: any): number => {
    if (!asset) return 0;
    
    // Assets have 'value' field which is already in fiat terms
    if (valueField === 'valueFiat' || valueField === 'value') {
      return parseFloat(asset.value || '0') || 0;
    }
    // For fees, assets don't have fees - fees are at transaction level
    if (valueField === 'feesFiat' || valueField === 'fees') {
      return 0;
    }
    return 0;
  };

  // Helper to get value from an asset in assetsOut array
  // Assets have 'value' field (which is in fiat), but not 'valueFiat'
  // So when valueField is 'valueFiat', we use asset.value
  const getAssetOutValue = (asset: any): number => {
    if (!asset) return 0;
    
    // Assets have 'value' field which is already in fiat terms
    if (valueField === 'valueFiat' || valueField === 'value') {
      return parseFloat(asset.value || '0') || 0;
    }
    // For fees, assets don't have fees - fees are at transaction level
    if (valueField === 'feesFiat' || valueField === 'fees') {
      return 0;
    }
    return 0;
  };
  
  transactions.forEach(transaction => {
    // Get date from timestamp
    if (!transaction.timestamp) {
      return;
    }

    const txDate = new Date(Number(transaction.timestamp) * 1000);
    if (isNaN(txDate.getTime())) {
      return;
    }
    
    // Skip if transaction is outside the date range
    if (txDate < start || txDate > end) {
      return;
    }
    
    // Get the interval start for this transaction
    const intervalStart = getIntervalStart(txDate, interval);
    // Format date as YYYY-MM-DD without timezone conversion to avoid day shifts
    const intervalKey = `${intervalStart.getFullYear()}-${String(intervalStart.getMonth() + 1).padStart(2, '0')}-${String(intervalStart.getDate()).padStart(2, '0')}`;

    // Initialize interval entry if it doesn't exist
    if (!intervalCategoryTotals[intervalKey]) {
      intervalCategoryTotals[intervalKey] = {};
    }

    // Process transaction-level categories
    // When categories are at transaction level, we need to sum all asset values
    if (transaction.categories && Array.isArray(transaction.categories)) {
      // Calculate total value from all assetsIn and assetsOut
      let totalAssetValue = 0;
      
      // Sum all assetsIn values
      if (transaction.assetsIn && Array.isArray(transaction.assetsIn)) {
        transaction.assetsIn.forEach(asset => {
          totalAssetValue += getAssetInValue(asset);
        });
      }
      
      // Subtract all assetsOut values (they're typically negative/outgoing)
      if (transaction.assetsOut && Array.isArray(transaction.assetsOut)) {
        transaction.assetsOut.forEach(asset => {
          totalAssetValue -= getAssetOutValue(asset);
        });
      }
      
      transaction.categories.forEach(category => {
        const categoryName = extractCategoryName(category);
        if (!categoryName) return;
        
        // Filter by selected categories if provided
        if (selectedCategories.size > 0 && !selectedCategories.has(categoryName)) {
          return;
        }

        // Use the sum of all asset values for transaction-level categories
        intervalCategoryTotals[intervalKey][categoryName] = 
          (intervalCategoryTotals[intervalKey][categoryName] || 0) + totalAssetValue;
      });
    }

    // Process assetsIn with their own categories
    if (transaction.assetsIn && Array.isArray(transaction.assetsIn)) {
      transaction.assetsIn.forEach(asset => {
        if (asset.categories && Array.isArray(asset.categories) && asset.categories.length > 0) {
          asset.categories.forEach(category => {
            const categoryName = extractCategoryName(category);
            if (!categoryName) return;
            
            // Filter by selected categories if provided
            if (selectedCategories.size > 0 && !selectedCategories.has(categoryName)) {
              return;
            }

            // Use asset-level value from assetsIn
            const value = getAssetInValue(asset);
            intervalCategoryTotals[intervalKey][categoryName] = 
              (intervalCategoryTotals[intervalKey][categoryName] || 0) + value;
          });
        }
      });
    }

    // Process assetsOut with their own categories
    if (transaction.assetsOut && Array.isArray(transaction.assetsOut)) {
      transaction.assetsOut.forEach(asset => {
        if (asset.categories && Array.isArray(asset.categories) && asset.categories.length > 0) {
          asset.categories.forEach(category => {
            const categoryName = extractCategoryName(category);
            if (!categoryName) return;
            
            // Filter by selected categories if provided
            if (selectedCategories.size > 0 && !selectedCategories.has(categoryName)) {
              return;
            }

            // Use asset-level value from assetsOut (note: assetsOut values are typically negative)
            const value = getAssetOutValue(asset);
            intervalCategoryTotals[intervalKey][categoryName] = 
              (intervalCategoryTotals[intervalKey][categoryName] || 0) + value;
          });
        }
      });
    }

    // Process nativeAssetFees
    if (transaction.nativeAssetFees && transaction.nativeAssetFees.categories && Array.isArray(transaction.nativeAssetFees.categories)) {
      transaction.nativeAssetFees.categories.forEach(category => {
        const categoryName = extractCategoryName(category);
        if (!categoryName) return;
        
        // Filter by selected categories if provided
        if (selectedCategories.size > 0 && !selectedCategories.has(categoryName)) {
          return;
        }

        // Use nativeAssetFees value (fees are typically at transaction level, but check asset value)
        const value = getAssetInValue(transaction.nativeAssetFees);
        intervalCategoryTotals[intervalKey][categoryName] = 
          (intervalCategoryTotals[intervalKey][categoryName] || 0) + value;
      });
    }
  });

  return intervalCategoryTotals;
}

