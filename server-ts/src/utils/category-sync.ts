import { promises as fs } from 'fs';
import path from 'path';
import { Transaction, CombinedTransactionsResponse } from '../types/transaction.js';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CONFIG_PATH = path.join(process.cwd(), '..', 'config.json');

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  url: string;
}

interface CategoryConfig {
  category_name?: string;
  category_type: string;
}

interface Config {
  settings: {
    categories?: Record<string, CategoryConfig>;
    [key: string]: any;
  };
}

/**
 * Extract category name from either a string or an object with a label property
 */
function extractCategoryName(category: any): string | null {
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
    // If no label but has other properties, log for debugging
    if (Object.keys(category).length > 0) {
      console.warn(`[Category Sync] Category object missing label property:`, JSON.stringify(category));
    }
  }

  return null;
}

/**
 * Get all unique categories from an array of transactions
 * Handles both string categories and object categories with label property
 */
function getUniqueCategories(transactions: Transaction[]): Set<string> {
  const categories = new Set<string>();

  transactions.forEach(transaction => {
    // Extract categories from transaction level
    if (transaction.categories && Array.isArray(transaction.categories)) {
      transaction.categories.forEach(category => {
        const categoryName = extractCategoryName(category);
        if (categoryName) {
          categories.add(categoryName);
        }
      });
    }

    // Also check assets for categories (though they should be the same)
    if (transaction.assetsIn && Array.isArray(transaction.assetsIn)) {
      transaction.assetsIn.forEach(asset => {
        if (asset.categories && Array.isArray(asset.categories)) {
          asset.categories.forEach(category => {
            const categoryName = extractCategoryName(category);
            if (categoryName) {
              categories.add(categoryName);
            }
          });
        }
      });
    }

    if (transaction.assetsOut && Array.isArray(transaction.assetsOut)) {
      transaction.assetsOut.forEach(asset => {
        if (asset.categories && Array.isArray(asset.categories)) {
          asset.categories.forEach(category => {
            const categoryName = extractCategoryName(category);
            if (categoryName) {
              categories.add(categoryName);
            }
          });
        }
      });
    }

    // Check nativeAssetFees for categories
    if (transaction.nativeAssetFees && transaction.nativeAssetFees.categories && Array.isArray(transaction.nativeAssetFees.categories)) {
      transaction.nativeAssetFees.categories.forEach(category => {
        const categoryName = extractCategoryName(category);
        if (categoryName) {
          categories.add(categoryName);
        }
      });
    }
  });

  return categories;
}

/**
 * Check if a cache entry contains transaction data
 */
function isTransactionCacheEntry(entry: CacheEntry<any>): entry is CacheEntry<CombinedTransactionsResponse> {
  if (!entry.data) return false;
  
  // Check if it has the structure of CombinedTransactionsResponse
  const data = entry.data;
  return (
    typeof data === 'object' &&
    Array.isArray(data.data) &&
    typeof data.dataByAddress === 'object' &&
    typeof data.progress === 'object'
  );
}

/**
 * Extract all transactions from cache files
 */
async function extractTransactionsFromCache(): Promise<Transaction[]> {
  const allTransactions: Transaction[] = [];

  try {
    // Check if cache directory exists
    try {
      await fs.access(CACHE_DIR);
    } catch {
      console.log('[Category Sync] Cache directory does not exist, skipping...');
      return allTransactions;
    }

    const files = await fs.readdir(CACHE_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }

      try {
        const cachePath = path.join(CACHE_DIR, file);
        const content = await fs.readFile(cachePath, 'utf-8');
        const entry: CacheEntry<any> = JSON.parse(content);

        // Check if this is a transaction cache entry
        if (isTransactionCacheEntry(entry)) {
          const response = entry.data;
          
          // Extract transactions from data array
          if (Array.isArray(response.data)) {
            allTransactions.push(...response.data);
          }

          // Extract transactions from dataByAddress
          if (response.dataByAddress && typeof response.dataByAddress === 'object') {
            Object.values(response.dataByAddress).forEach((transactions: any) => {
              if (Array.isArray(transactions)) {
                allTransactions.push(...transactions);
              }
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read or parsed
        console.warn(`[Category Sync] Skipping cache file ${file}:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }
  } catch (error) {
    console.error('[Category Sync] Error reading cache directory:', error);
  }

  return allTransactions;
}

/**
 * Read config.json and return parsed config
 */
async function readConfig(): Promise<Config> {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('[Category Sync] Error reading config.json:', error);
    // Return default config structure
    return {
      settings: {
        categories: {},
      },
    };
  }
}

/**
 * Write config back to config.json
 */
async function writeConfig(config: Config): Promise<void> {
  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Category Sync] Error writing config.json:', error);
    throw error;
  }
}

/**
 * Sync categories from cached transactions to config.json
 * Adds any new categories found in cache with type "none"
 */
export async function syncCategoriesFromCache(): Promise<{
  newCategories: string[];
  totalCategories: number;
  totalTransactions: number;
}> {
  console.log('[Category Sync] Starting category sync from cache...');

  // Extract all transactions from cache
  const transactions = await extractTransactionsFromCache();
  console.log(`[Category Sync] Found ${transactions.length} transactions in cache`);

  if (transactions.length === 0) {
    console.log('[Category Sync] No transactions found in cache, nothing to sync');
    return {
      newCategories: [],
      totalCategories: 0,
      totalTransactions: 0,
    };
  }

  // Get unique categories from transactions
  const uniqueCategories = getUniqueCategories(transactions);
  console.log(`[Category Sync] Found ${uniqueCategories.size} unique categories in transactions`);
  if (uniqueCategories.size > 0) {
    console.log(`[Category Sync] Categories found:`, Array.from(uniqueCategories).sort().join(', '));
  }

  // Read current config
  const config = await readConfig();

  // Ensure categories object exists
  if (!config.settings.categories) {
    config.settings.categories = {};
  }

  // Clean up any invalid category names that might already exist
  const invalidCategoryPatterns = ['[object Object]', '[object '];
  const categoriesToRemove: string[] = [];
  Object.keys(config.settings.categories).forEach(categoryName => {
    if (invalidCategoryPatterns.some(pattern => categoryName === pattern || categoryName.startsWith(pattern))) {
      categoriesToRemove.push(categoryName);
    }
  });

  if (categoriesToRemove.length > 0) {
    console.log(`[Category Sync] Removing ${categoriesToRemove.length} invalid category names from config:`);
    categoriesToRemove.forEach(cat => {
      console.log(`  - Removing: "${cat}"`);
      delete config.settings.categories![cat];
    });
  }

  const existingCategories = new Set(Object.keys(config.settings.categories));
  const newCategories: string[] = [];

  // Find categories that don't exist in config
  uniqueCategories.forEach(category => {
    // Skip invalid category names (like "[object Object]")
    if (category === '[object Object]' || category.startsWith('[object ')) {
      console.warn(`[Category Sync] Skipping invalid category name: "${category}"`);
      return;
    }

    if (!existingCategories.has(category)) {
      newCategories.push(category);
      // Add to config with type "None"
      config.settings.categories![category] = {
        category_type: 'None',
      };
    }
  });

  // Write updated config if we have changes (new categories or removed invalid ones)
  if (newCategories.length > 0 || categoriesToRemove.length > 0) {
    if (newCategories.length > 0) {
      console.log(`[Category Sync] Found ${newCategories.length} new categories to add:`);
      newCategories.forEach(cat => console.log(`  - ${cat}`));
    }

    // Write updated config
    await writeConfig(config);
    console.log('[Category Sync] Successfully updated config.json with new categories');
  } else {
    console.log('[Category Sync] No new categories found, config is up to date');
  }

  return {
    newCategories,
    totalCategories: Object.keys(config.settings.categories).length,
    totalTransactions: transactions.length,
  };
}

