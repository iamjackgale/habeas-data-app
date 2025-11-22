'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

interface CategoryOption {
  value: string;
  label: string;
}

const REVENUE_OPTIONS: CategoryOption[] = [
  { value: 'Boost Revenues', label: 'Boost Revenues' },
  { value: 'Gauge Vote Incentive Revenues', label: 'Gauge Vote Incentive Revenues' },
  { value: 'Onramp Revenues', label: 'Onramp Revenues' },
  { value: 'Strategy Revenues', label: 'Strategy Revenues' },
  { value: 'Validator Revenues', label: 'Validator Revenues' },
  { value: 'Zap Revenues', label: 'Zap Revenues' },
];

const COST_OPTIONS: CategoryOption[] = [
  { value: 'Accounting Costs', label: 'Accounting Costs' },
  { value: 'Audit Costs', label: 'Audit Costs' },
  { value: 'Boost Costs', label: 'Boost Costs' },
  { value: 'Gauge Vote Incentive Costs', label: 'Gauge Vote Incentive Costs' },
  { value: 'Merkl Costs', label: 'Merkl Costs' },
  { value: 'Bounty Costs', label: 'Bounty Costs' },
  { value: 'Contributor Costs', label: 'Contributor Costs' },
  { value: 'Cowllector Gas Costs', label: 'Cowllector Gas Costs' },
  { value: 'Developer Gas Costs', label: 'Developer Gas Costs' },
  { value: 'Event Costs', label: 'Event Costs' },
  { value: 'Gelato Costs', label: 'Gelato Costs' },
  { value: 'Infrastructure Costs', label: 'Infrastructure Costs' },
  { value: 'Keeper Gas Costs', label: 'Keeper Gas Costs' },
  { value: 'Marketing Costs', label: 'Marketing Costs' },
  { value: 'Merchandise Costs', label: 'Merchandise Costs' },
  { value: 'Service Costs', label: 'Service Costs' },
  { value: 'Travel Costs', label: 'Travel Costs' },
  { value: 'Treasury Gas Costs', label: 'Treasury Gas Costs' },
];

export function CategoryDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [revenuesOpen, setRevenuesOpen] = useState(false);
  const [costsOpen, setCostsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allRevenuesSelected = REVENUE_OPTIONS.every(opt => selectedCategories.has(opt.value));
  const allCostsSelected = COST_OPTIONS.every(opt => selectedCategories.has(opt.value));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAllRevenuesChange = (checked: boolean) => {
    const newSelected = new Set(selectedCategories);
    if (checked) {
      REVENUE_OPTIONS.forEach(opt => newSelected.add(opt.value));
    } else {
      REVENUE_OPTIONS.forEach(opt => newSelected.delete(opt.value));
    }
    setSelectedCategories(newSelected);
  };

  const handleAllCostsChange = (checked: boolean) => {
    const newSelected = new Set(selectedCategories);
    if (checked) {
      COST_OPTIONS.forEach(opt => newSelected.add(opt.value));
    } else {
      COST_OPTIONS.forEach(opt => newSelected.delete(opt.value));
    }
    setSelectedCategories(newSelected);
  };

  const handleCategoryChange = (value: string, checked: boolean) => {
    const newSelected = new Set(selectedCategories);
    if (checked) {
      newSelected.add(value);
    } else {
      newSelected.delete(value);
    }
    setSelectedCategories(newSelected);
  };

  const displayText = selectedCategories.size > 0
    ? Array.from(selectedCategories).join(', ')
    : 'Select categories...';

  return (
    <div className="relative inline-block w-full max-w-md" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="border border-border px-4 py-2.5 bg-background text-foreground cursor-pointer rounded-xl flex justify-between items-center hover:bg-accent transition-colors"
      >
        <span className="flex-1 text-left truncate">{displayText}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 ml-2 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 ml-2 flex-shrink-0" />
        )}
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-border bg-background text-foreground rounded-xl max-h-[calc((100vh-300px)*0.4375)] overflow-y-auto z-50 shadow-lg">
          <div className="grid grid-cols-2">
            {/* Left Column: Revenues */}
            <div className="border-r border-border">
              <label className="block px-4 py-2.5 cursor-pointer border-b border-border hover:bg-accent text-left">
                <input
                  type="checkbox"
                  checked={allRevenuesSelected}
                  onChange={(e) => handleAllRevenuesChange(e.target.checked)}
                  className="mr-2.5 accent-primary cursor-pointer"
                />
                All Revenues
              </label>
              <div>
                <div
                  onClick={() => setRevenuesOpen(!revenuesOpen)}
                  className="flex justify-between items-center px-4 py-2.5 cursor-pointer border-b border-border hover:bg-accent"
                >
                  <span>Revenues</span>
                  {revenuesOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
                {revenuesOpen && (
                  <div className="border-b border-border">
                    {REVENUE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="block px-4 py-2.5 pl-8 cursor-pointer border-b border-border/50 hover:bg-accent text-left"
                      >
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={selectedCategories.has(option.value)}
                          onChange={(e) => handleCategoryChange(option.value, e.target.checked)}
                          className="mr-2.5 accent-primary cursor-pointer"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Costs */}
            <div>
              <label className="block px-4 py-2.5 cursor-pointer border-b border-border hover:bg-accent text-left">
                <input
                  type="checkbox"
                  checked={allCostsSelected}
                  onChange={(e) => handleAllCostsChange(e.target.checked)}
                  className="mr-2.5 accent-primary cursor-pointer"
                />
                All Costs
              </label>
              <div>
                <div
                  onClick={() => setCostsOpen(!costsOpen)}
                  className="flex justify-between items-center px-4 py-2.5 cursor-pointer border-b border-border hover:bg-accent"
                >
                  <span>Costs</span>
                  {costsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
                {costsOpen && (
                  <div className="border-b border-border">
                    {COST_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="block px-4 py-2.5 pl-8 cursor-pointer border-b border-border/50 hover:bg-accent text-left"
                      >
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={selectedCategories.has(option.value)}
                          onChange={(e) => handleCategoryChange(option.value, e.target.checked)}
                          className="mr-2.5 accent-primary cursor-pointer"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

