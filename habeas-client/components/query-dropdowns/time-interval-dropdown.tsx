'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export type TimeInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface TimeIntervalDropdownProps {
  value?: TimeInterval | null;
  onChange?: (value: TimeInterval | null) => void;
}

const INTERVAL_OPTIONS: { value: TimeInterval; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export function TimeIntervalDropdown({ value, onChange }: TimeIntervalDropdownProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalInterval, setInternalInterval] = useState<TimeInterval | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use controlled value if provided, otherwise use internal state
  const selectedInterval = value !== undefined ? value : internalInterval;
  
  const updateInterval = (newInterval: TimeInterval | null) => {
    if (onChange) {
      onChange(newInterval);
    } else {
      setInternalInterval(newInterval);
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

  const handleIntervalSelect = (interval: TimeInterval) => {
    updateInterval(interval);
    setIsOpen(false);
  };

  const displayText = selectedInterval
    ? INTERVAL_OPTIONS.find(opt => opt.value === selectedInterval)?.label || 'Select time interval...'
    : 'Select time interval...';

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
        <div className="absolute top-full left-0 right-0 mt-1 border border-border bg-background text-foreground rounded-xl max-h-[300px] overflow-y-auto z-50 shadow-lg">
          {INTERVAL_OPTIONS.map((option) => (
            <div
              key={option.value}
              onClick={() => handleIntervalSelect(option.value)}
              className={`px-4 py-2.5 cursor-pointer border-b border-border hover:bg-accent ${
                selectedInterval === option.value ? 'bg-accent' : ''
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

