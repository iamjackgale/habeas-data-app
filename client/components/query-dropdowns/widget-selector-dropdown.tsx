'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

type Mode = 'portfolio' | 'transactions';

const PORTFOLIO_WIDGET_CATEGORIES = {
  'pie': [
    { key: 'pie-current-portfolio-by-asset', label: 'Portfolio Assets by Asset' },
    { key: 'pie-current-portfolio-by-protocol', label: 'Portfolio Assets by Protocol' },
    { key: 'pie-historical-portfolio-by-asset', label: 'Portfolio Assets by Asset' },
    { key: 'pie-historical-portfolio-by-protocol', label: 'Portfolio Assets by Protocol' },
  ],
  'pie-in-pie': [
    { key: 'pies-portfolio-by-asset', label: 'Portfolio Comparison by Asset' },
    { key: 'pies-portfolio-by-protocol', label: 'Portfolio Comparison by Protocol' },
  ],
  'bar': [
    { key: 'bar-current-portfolio-by-asset', label: 'Portfolio Assets by Asset' },
    { key: 'bar-current-portfolio-by-protocol', label: 'Portfolio Assets by Protocol' },
    { key: 'bar-historical-portfolio-by-asset', label: 'Portfolio Assets by Asset' },
    { key: 'bar-historical-portfolio-by-protocol', label: 'Portfolio Assets by Protocol' },
    { key: 'bar-portfolio-by-networth', label: 'Portfolio Net Worth by Date' },
  ],
  'bar-stacked': [
    { key: 'bar-stacked-portfolio-by-asset', label: 'Portfolio Comparison by Asset' },
    { key: 'bar-stacked-portfolio-by-protocol', label: 'Portfolio Comparison by Protocol' },
  ],
};

const TRANSACTIONS_WIDGET_CATEGORIES = {
  'bar': [
    { key: 'bar-transactions-by-day', label: 'Transactions by Day' },
  ],
};

interface WidgetSelectorDropdownProps {
  mode?: Mode;
  value?: string | null;
  onChange?: (value: string | null) => void;
}

export function WidgetSelectorDropdown({ mode = 'portfolio', value, onChange }: WidgetSelectorDropdownProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [internalWidget, setInternalWidget] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use controlled value if provided, otherwise use internal state
  const selectedWidget = value !== undefined ? value : internalWidget;
  
  const updateWidget = (widget: string | null) => {
    if (onChange) {
      onChange(widget);
    } else {
      setInternalWidget(widget);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWidgetSelect = (widgetKey: string) => {
    updateWidget(widgetKey);
    setIsOpen(false);
    setOpenCategory(null);
  };

  // Reset selected widget when mode changes
  useEffect(() => {
    updateWidget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Get widgets based on mode
  const widgetCategories = mode === 'portfolio' ? PORTFOLIO_WIDGET_CATEGORIES : TRANSACTIONS_WIDGET_CATEGORIES;

  // Find the display label for the selected widget
  const getSelectedWidgetLabel = () => {
    if (!selectedWidget) return 'Select widget...';
    
    for (const widgets of Object.values(widgetCategories)) {
      const widget = widgets.find((w) => w.key === selectedWidget);
      if (widget) return widget.label;
    }
    return selectedWidget;
  };

  const displayText = getSelectedWidgetLabel();
  const hasWidgets = Object.keys(widgetCategories).length > 0;

  return (
    <div className="relative inline-block w-full max-w-md" ref={dropdownRef}>
      <div
        onClick={() => hasWidgets && setIsOpen(!isOpen)}
        className={`border border-border px-4 py-2.5 bg-background text-foreground rounded-xl flex justify-between items-center transition-colors ${
          hasWidgets ? 'cursor-pointer hover:bg-accent' : 'cursor-not-allowed opacity-50'
        }`}
      >
        <span className="flex-1 text-left truncate">{displayText}</span>
        {hasWidgets && (
          isOpen ? (
            <ChevronUp className="h-5 w-5 ml-2 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 ml-2 flex-shrink-0" />
          )
        )}
      </div>
      {isOpen && hasWidgets && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-border bg-background text-foreground rounded-xl max-h-[400px] overflow-y-auto z-50 shadow-lg">
          {Object.entries(widgetCategories).map(([category, widgets]) => (
            <div key={category}>
              <div
                onClick={() => setOpenCategory(openCategory === category ? null : category)}
                className="flex justify-between items-center px-4 py-2.5 cursor-pointer border-b border-border hover:bg-accent"
              >
                <span>{category}</span>
                {openCategory === category ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
              {openCategory === category && (
                <div className="border-b border-border">
                  {widgets.map((widget) => (
                    <div
                      key={widget.key}
                      onClick={() => handleWidgetSelect(widget.key)}
                      className={`px-4 py-2.5 pl-8 cursor-pointer border-b border-border/50 hover:bg-accent text-left ${
                        selectedWidget === widget.key ? 'bg-accent' : ''
                      }`}
                    >
                      {widget.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

