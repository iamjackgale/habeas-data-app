'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to load widget colors from config
 * Returns the configured colors or default colors if config is not available
 */
export function useWidgetColors(): string[] {
  const [colors, setColors] = useState<string[]>([
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300',
    '#9c88ff',
    '#ff8c94',
  ]);

  useEffect(() => {
    const loadColors = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const config = await response.json();
          if (config.settings?.visuals?.widgetColors && Array.isArray(config.settings.visuals.widgetColors)) {
            setColors(config.settings.visuals.widgetColors);
          }
        }
      } catch (error) {
        console.error('Error loading widget colors:', error);
      }
    };

    loadColors();
  }, []);

  return colors;
}

