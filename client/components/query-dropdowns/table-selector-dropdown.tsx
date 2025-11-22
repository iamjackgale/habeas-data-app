'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

type Mode = 'portfolio' | 'transactions';

const PORTFOLIO_TABLE_CATEGORIES: Record<string, Array<{ key: string; label: string }>> = {
  'Current': [
    { key: 'portfolio-by-protocol', label: 'Portfolio Assets by Protocol' },
    { key: 'portfolio-by-asset', label: 'Portfolio Assets by Asset' },
  ],
  'Historical': [
    { key: 'historical-portfolio-by-protocol', label: 'Portfolio Assets by Protocol' },
    { key: 'historical-portfolio-by-asset', label: 'Portfolio Assets by Asset' },
  ],
  'Comparison': [
    { key: 'comparison-portfolio-by-protocol', label: 'Portfolio Comparison by Protocol' },
    { key: 'comparison-portfolio-by-asset', label: 'Portfolio Comparison by Asset' },
  ],
};

const TRANSACTIONS_TABLE_CATEGORIES: Record<string, Array<{ key: string; label: string }>> = {
  'Transactions': [
    { key: 'transactions-by-day', label: 'Transactions by Day' },
  ],
};

interface TableSelectorDropdownProps {
  mode?: Mode;
  value: string | null;
  onChange: (newSelection: string | null) => void;
}

export function TableSelectorDropdown({ 
  mode = 'portfolio', 
  value, 
  onChange 
}: TableSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedTable = value;

  useEffect(() => {
    if (value === undefined) {
      onChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setOpenCategory(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTableSelect = (tableKey: string) => {
    onChange(tableKey);
    setIsOpen(false);
    setOpenCategory(null);
  };

  const tableCategories = mode === 'portfolio' ? PORTFOLIO_TABLE_CATEGORIES : TRANSACTIONS_TABLE_CATEGORIES;
  const hasTables = Object.keys(tableCategories).length > 0;

  const getSelectedTableLabel = () => {
    if (!selectedTable) return 'Select table...';
    
    for (const category of Object.values(tableCategories)) {
      const table = category.find(t => t.key === selectedTable);
      if (table) return table.label;
    }
    return 'Select table...';
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!hasTables}
        className={`w-full px-4 py-2.5 text-left bg-background border border-border rounded-lg flex items-center justify-between ${
          !hasTables ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent'
        }`}
      >
        <span className="text-foreground">{getSelectedTableLabel()}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-foreground" />
        )}
      </button>

      {isOpen && hasTables && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {Object.entries(tableCategories).map(([categoryName, tables]) => (
            <div key={categoryName}>
              <button
                type="button"
                onClick={() => setOpenCategory(openCategory === categoryName ? null : categoryName)}
                className="w-full px-4 py-2 text-left hover:bg-accent flex items-center justify-between"
              >
                <span className="font-semibold text-foreground">{categoryName}</span>
                {openCategory === categoryName ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {openCategory === categoryName && (
                <div className="pl-4">
                  {tables.map((table) => (
                    <button
                      key={table.key}
                      type="button"
                      onClick={() => handleTableSelect(table.key)}
                      className="w-full px-4 py-2 text-left hover:bg-accent flex items-center justify-between"
                    >
                      <span className="text-foreground">{table.label}</span>
                      {selectedTable === table.key && (
                        <Check className="h-4 w-4 text-foreground" />
                      )}
                    </button>
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

