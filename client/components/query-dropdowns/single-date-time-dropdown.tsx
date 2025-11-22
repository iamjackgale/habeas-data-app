'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';

interface SingleDateTimeDropdownProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export function SingleDateTimeDropdown({ value, onChange }: SingleDateTimeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select date...';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateISO = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentView(prev => {
      if (direction === 'prev') {
        if (prev.month === 0) {
          return { year: prev.year - 1, month: 11 };
        }
        return { year: prev.year, month: prev.month - 1 };
      } else {
        if (prev.month === 11) {
          return { year: prev.year + 1, month: 0 };
        }
        return { year: prev.year, month: prev.month + 1 };
      }
    });
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentView.year, currentView.month);
  const firstDay = getFirstDayOfMonth(currentView.year, currentView.month);
  const days: (Date | null)[] = [];

  // Fill in empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Fill in days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(currentView.year, currentView.month, day));
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="relative inline-block w-full max-w-md" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="border border-border px-4 py-2.5 bg-background text-foreground rounded-xl flex justify-between items-center cursor-pointer hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="text-left truncate">{formatDate(value)}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 ml-2 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 ml-2 flex-shrink-0" />
        )}
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-border bg-background text-foreground rounded-xl z-50 shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-accent rounded transition-colors"
            >
              ←
            </button>
            <h3 className="font-semibold">
              {monthNames[currentView.month]} {currentView.year}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-accent rounded transition-colors"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-medium p-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="aspect-square" />;
              }
              const dateStr = formatDateISO(date);
              const isToday = date.getTime() === today.getTime();
              const isSelected = value && formatDateISO(value) === dateStr;
              const isPast = date < today;

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  disabled={isPast}
                  className={`aspect-square p-1 rounded transition-colors text-sm ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isPast
                      ? 'text-muted-foreground opacity-50 cursor-not-allowed'
                      : isToday
                      ? 'bg-accent hover:bg-accent/80'
                      : 'hover:bg-accent'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          {value && (
            <div className="mt-4 pt-4 border-t border-border">
              <input
                type="date"
                value={formatDateISO(value)}
                onChange={(e) => {
                  if (e.target.value) {
                    onChange(new Date(e.target.value));
                  }
                }}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

