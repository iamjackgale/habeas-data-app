'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { useCategories, getCategoryDisplayName, groupCategoriesByType, getCategoryTypes } from '@/hooks/use-categories';

interface CategoryDropdownProps {
  value?: Set<string>;
  onChange?: (value: Set<string>) => void;
}

export function CategoryDropdown({ value, onChange }: CategoryDropdownProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [typeOpenStates, setTypeOpenStates] = useState<Record<string, boolean>>({});
  const [internalCategories, setInternalCategories] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Load categories from config
  const categoriesConfig = useCategories();
  const groupedCategories = groupCategoriesByType(categoriesConfig);
  const categoryTypes = getCategoryTypes(categoriesConfig);
  
  
  // Use controlled value if provided, otherwise use internal state
  const selectedCategories = value !== undefined ? value : internalCategories;
  
  const updateCategories = (newCategories: Set<string>) => {
    if (onChange) {
      onChange(newCategories);
    } else {
      setInternalCategories(newCategories);
    }
  };

  const toggleTypeOpen = (type: string) => {
    setTypeOpenStates(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleTypeToggle = (type: string, checked: boolean) => {
    const newSelected = new Set(selectedCategories);
    const categoriesInType = groupedCategories[type] || [];
    
    if (checked) {
      categoriesInType.forEach(categoryKey => {
        newSelected.add(categoryKey);
      });
    } else {
      categoriesInType.forEach(categoryKey => {
        newSelected.delete(categoryKey);
      });
    }
    
    updateCategories(newSelected);
  };

  const handleCategoryChange = (value: string, checked: boolean) => {
    const newSelected = new Set(selectedCategories);
    if (checked) {
      newSelected.add(value);
    } else {
      newSelected.delete(value);
    }
    updateCategories(newSelected);
  };

  const isTypeAllSelected = (type: string): boolean => {
    const categoriesInType = groupedCategories[type] || [];
    if (categoriesInType.length === 0) return false;
    return categoriesInType.every(categoryKey => selectedCategories.has(categoryKey));
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

  // Create display text from selected categories
  const displayText = selectedCategories.size > 0
    ? Array.from(selectedCategories)
        .map(cat => getCategoryDisplayName(cat, categoriesConfig))
        .slice(0, 3)
        .join(', ') + (selectedCategories.size > 3 ? ` +${selectedCategories.size - 3} more` : '')
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
          {categoryTypes.map((type) => {
            const categoriesInType = groupedCategories[type] || [];
            const isOpen = typeOpenStates[type] ?? false;
            const allSelected = isTypeAllSelected(type);
            
            return (
              <div key={type}>
                <div
                  onClick={() => toggleTypeOpen(type)}
                  className="flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-border hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>{type}</span>
                  </div>
                  <label
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTypeToggle(type, !allSelected);
                    }}
                    className="cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleTypeToggle(type, e.target.checked);
                      }}
                      className="mr-2.5 accent-primary cursor-pointer"
                    />
                  </label>
                </div>
                {isOpen && (
                  <div className="border-b border-border">
                    {categoriesInType.length > 0 ? (
                      categoriesInType.map((categoryKey) => {
                        const displayName = getCategoryDisplayName(categoryKey, categoriesConfig);
                        return (
                          <label
                            key={categoryKey}
                            className="block px-4 py-2.5 pl-8 cursor-pointer border-b border-border/50 hover:bg-accent text-left"
                          >
                            <input
                              type="checkbox"
                              value={categoryKey}
                              checked={selectedCategories.has(categoryKey)}
                              onChange={(e) => handleCategoryChange(categoryKey, e.target.checked)}
                              className="mr-2.5 accent-primary cursor-pointer"
                            />
                            {displayName}
                          </label>
                        );
                      })
                    ) : (
                      <div className="px-4 py-2.5 pl-8 text-muted-foreground text-sm">
                        No categories
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
