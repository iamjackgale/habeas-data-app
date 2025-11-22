'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Calendar, Plus, X } from 'lucide-react';

export type MultiDateMode = 'list' | 'interval';

interface MultiDateTimeDropdownProps {
  value: {
    mode: MultiDateMode;
    dates: Date[];
    intervalType?: 'daily' | 'weekly' | 'monthly';
    intervalCount?: number; // Number of entries (up to 12)
    startDate?: Date;
  };
  onChange: (value: {
    mode: MultiDateMode;
    dates: Date[];
    intervalType?: 'daily' | 'weekly' | 'monthly';
    intervalCount?: number;
    startDate?: Date;
  }) => void;
}

export function MultiDateTimeDropdown({ value, onChange }: MultiDateTimeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [selectingDateIndex, setSelectingDateIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mode = value.mode || 'list';
  const dates = value.dates || [];
  const maxDates = 12;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectingDateIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleModeChange = (newMode: MultiDateMode) => {
    onChange({
      mode: newMode,
      dates: newMode === 'list' ? dates : [],
      intervalType: newMode === 'interval' ? (value.intervalType || 'daily') : undefined,
      intervalCount: newMode === 'interval' ? (value.intervalCount || 5) : undefined,
      startDate: newMode === 'interval' ? (value.startDate || new Date()) : undefined,
    });
  };

  const handleDateClick = (date: Date) => {
    if (selectingDateIndex !== null) {
      // Replace date at index
      const newDates = [...dates];
      newDates[selectingDateIndex] = date;
      onChange({ ...value, dates: newDates });
      setSelectingDateIndex(null);
    } else {
      // Add new date
      if (dates.length < maxDates) {
        onChange({ ...value, dates: [...dates, date].sort((a, b) => a.getTime() - b.getTime()) });
      }
    }
    setIsOpen(false);
  };

  const handleRemoveDate = (index: number) => {
    const newDates = dates.filter((_, i) => i !== index);
    onChange({ ...value, dates: newDates });
  };

  const handleAddDate = () => {
    if (dates.length < maxDates) {
      setSelectingDateIndex(dates.length);
      setIsOpen(true);
    }
  };

  const handleIntervalTypeChange = (type: 'daily' | 'weekly' | 'monthly') => {
    onChange({ ...value, intervalType: type });
  };

  const handleIntervalCountChange = (count: number) => {
    if (count >= 1 && count <= maxDates) {
      onChange({ ...value, intervalCount: count });
    }
  };

  const handleStartDateChange = (date: Date) => {
    onChange({ ...value, startDate: date });
  };

  const generateIntervalDates = () => {
    if (mode !== 'interval' || !value.startDate || !value.intervalType || !value.intervalCount) {
      return [];
    }

    const generated: Date[] = [];
    const start = new Date(value.startDate);
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < value.intervalCount; i++) {
      const date = new Date(start);
      if (value.intervalType === 'daily') {
        date.setDate(start.getDate() + i);
      } else if (value.intervalType === 'weekly') {
        date.setDate(start.getDate() + i * 7);
      } else if (value.intervalType === 'monthly') {
        date.setMonth(start.getMonth() + i);
      }
      generated.push(date);
    }

    return generated;
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

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(currentView.year, currentView.month, day));
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const displayDates = mode === 'list' ? dates : generateIntervalDates();
  const displayText = mode === 'list' 
    ? dates.length === 0 
      ? 'Select dates...' 
      : `${dates.length} date${dates.length !== 1 ? 's' : ''} selected`
    : value.intervalCount && value.startDate
      ? `${value.intervalCount} ${value.intervalType} entries from ${formatDate(value.startDate)}`
      : 'Select interval...';

  return (
    <div className="relative inline-block w-full max-w-md" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="border border-border px-4 py-2.5 bg-background text-foreground rounded-xl flex justify-between items-center cursor-pointer hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="text-left truncate">{displayText}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 ml-2 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 ml-2 flex-shrink-0" />
        )}
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-border bg-background text-foreground rounded-xl z-50 shadow-lg p-4 max-h-[600px] overflow-y-auto">
          {/* Mode Selection */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleModeChange('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent hover:bg-accent/80'
              }`}
            >
              List Dates
            </button>
            <button
              onClick={() => handleModeChange('interval')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'interval'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent hover:bg-accent/80'
              }`}
            >
              Interval
            </button>
          </div>

          {mode === 'list' ? (
            <>
              {/* Selected Dates List */}
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">
                  Selected Dates ({dates.length}/{maxDates})
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {dates.map((date, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-accent rounded-lg">
                      <span className="text-sm">{formatDate(date)}</span>
                      <button
                        onClick={() => handleRemoveDate(index)}
                        className="p-1 hover:bg-background rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {dates.length === 0 && (
                    <div className="text-sm text-muted-foreground">No dates selected</div>
                  )}
                </div>
                {dates.length < maxDates && (
                  <button
                    onClick={handleAddDate}
                    className="mt-2 flex items-center gap-2 px-3 py-2 bg-accent hover:bg-accent/80 rounded-lg transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Date
                  </button>
                )}
              </div>

              {/* Calendar */}
              {selectingDateIndex !== null || dates.length < maxDates ? (
                <>
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
                      const isSelected = dates.some(d => formatDateISO(d) === dateStr);
                      const isToday = date.getTime() === today.getTime();

                      return (
                        <button
                          key={index}
                          onClick={() => handleDateClick(date)}
                          className={`aspect-square p-1 rounded transition-colors text-sm ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
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
                </>
              ) : null}
            </>
          ) : (
            /* Interval Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Interval Type</label>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => handleIntervalTypeChange(type)}
                      className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                        value.intervalType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent hover:bg-accent/80'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Entries (1-{maxDates})
                </label>
                <input
                  type="number"
                  min="1"
                  max={maxDates}
                  value={value.intervalCount || 5}
                  onChange={(e) => handleIntervalCountChange(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={value.startDate ? formatDateISO(value.startDate) : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleStartDateChange(new Date(e.target.value));
                    }
                  }}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {displayDates.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Generated Dates</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {displayDates.map((date, index) => (
                      <div key={index} className="p-2 bg-accent rounded-lg text-sm">
                        {formatDate(date)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

