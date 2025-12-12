import { Request, Response } from 'express';
import { syncCategoriesFromCache } from '../utils/category-sync.js';

/**
 * Sync categories from cached transactions to config.json
 * GET /api/octav/categories/sync
 */
export async function syncCategories(req: Request, res: Response): Promise<void> {
  try {
    const result = await syncCategoriesFromCache();
    
    res.json({
      success: true,
      message: `Category sync completed. Found ${result.newCategories.length} new categories.`,
      ...result,
    });
  } catch (error) {
    console.error('Error syncing categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}

