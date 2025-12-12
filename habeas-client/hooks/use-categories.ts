'use client';

import { useState, useEffect } from 'react';

export interface CategoryConfig {
  category_name?: string;
  category_type: string;
  category_colour?: string;
}

export interface CategoriesConfig {
  [categoryName: string]: CategoryConfig;
}

/**
 * Hook to load categories from config
 * Returns the configured categories or empty object if config is not available
 */
export function useCategories(): CategoriesConfig {
  const [categories, setCategories] = useState<CategoriesConfig>({});

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const config = await response.json();
          if (config.settings?.categories && typeof config.settings.categories === 'object') {
            setCategories(config.settings.categories);
          }
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  return categories;
}

/**
 * Get all revenue categories from config
 */
export function getRevenueCategories(categories: CategoriesConfig): string[] {
  return Object.entries(categories)
    .filter(([_, config]) => {
      const type = config.category_type?.toLowerCase();
      return type === 'revenue';
    })
    .map(([name]) => name);
}

/**
 * Get all cost categories from config
 */
export function getCostCategories(categories: CategoriesConfig): string[] {
  return Object.entries(categories)
    .filter(([_, config]) => {
      const type = config.category_type?.toLowerCase();
      return type === 'cost';
    })
    .map(([name]) => name);
}

/**
 * Get all categories with no type (none)
 */
export function getNoneCategories(categories: CategoriesConfig): string[] {
  return Object.entries(categories)
    .filter(([_, config]) => {
      const type = config.category_type?.toLowerCase();
      return !type || type === 'none';
    })
    .map(([name]) => name);
}

/**
 * Get the display name for a category (uses category_name if available, otherwise the key)
 */
export function getCategoryDisplayName(categoryKey: string, categories: CategoriesConfig): string {
  const config = categories[categoryKey];
  return config?.category_name || categoryKey;
}

/**
 * Get all unique category types from the config
 */
export function getCategoryTypes(categories: CategoriesConfig): string[] {
  const types = new Set<string>();
  Object.values(categories).forEach(config => {
    if (config.category_type) {
      types.add(config.category_type);
    }
  });
  return Array.from(types).sort();
}

/**
 * Get all categories for a specific type
 */
export function getCategoriesByType(categories: CategoriesConfig, type: string): string[] {
  return Object.entries(categories)
    .filter(([_, config]) => config.category_type === type)
    .map(([key]) => key);
}

/**
 * Group categories by their type
 */
export function groupCategoriesByType(categories: CategoriesConfig): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  Object.entries(categories).forEach(([key, config]) => {
    const type = config.category_type || 'None';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(key);
  });
  // Sort categories within each type by their display name
  Object.keys(grouped).forEach(type => {
    grouped[type].sort((a, b) => {
      const nameA = getCategoryDisplayName(a, categories);
      const nameB = getCategoryDisplayName(b, categories);
      return nameA.localeCompare(nameB);
    });
  });
  return grouped;
}

