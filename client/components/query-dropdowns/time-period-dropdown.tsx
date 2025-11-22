'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Granularity = 'date' | 'week' | 'month' | 'quarter' | 'year' | 'past';

const GRANULARITY_OPTIONS: Granularity[] = ['date', 'week', 'month', 'quarter', 'year', 'past'];

const PAST_OPTIONS = [
  { label: '1D', days: 1, isYTD: false },
  { label: '7D', days: 7, isYTD: false },
  { label: '14D', days: 14, isYTD: false },
  { label: '30D', days: 30, isYTD: false },
  { label: '90D', days: 90, isYTD: false },
  { label: '180D', days: 180, isYTD: false },
  { label: 'YTD', days: 0, isYTD: true },
  { label: '1Y', days: 365, isYTD: false },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function TimePeriodDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>('date');
  const [currentView, setCurrentView] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectingStart, setSelectingStart] = useState(true);
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

  const formatDate = (date: Date, gran: Granularity): string => {
    if (gran === 'date') {
      return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
    } else if (gran === 'week') {
      const weekEnd = new Date(date);
      weekEnd.setDate(date.getDate() + 6);
      return `${formatDate(date, 'date')} - ${formatDate(weekEnd, 'date')}`;
    } else if (gran === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else if (gran === 'quarter') {
      const q = Math.floor(date.getMonth() / 3) + 1;
      return `${date.getFullYear()}-Q${q}`;
    } else if (gran === 'year') {
      return date.getFullYear().toString();
    }
    return formatDate(date, 'date');
  };

  const displayText = startDate
    ? endDate
      ? `From ${formatDate(startDate, granularity)} to ${formatDate(endDate, granularity)}`
      : `From ${formatDate(startDate, granularity)}`
    : 'Select time period...';

  const handleDateClick = (date: Date) => {
    if (selectingStart || !startDate || date < startDate) {
      setStartDate(date);
      setEndDate(null);
      setSelectingStart(false);
    } else {
      setEndDate(date);
      setSelectingStart(true);
    }
  };

  const handleWeekClick = (weekStart: Date, weekEnd: Date) => {
    if (selectingStart || !startDate || weekStart < startDate) {
      setStartDate(weekStart);
      setEndDate(null);
      setSelectingStart(false);
    } else {
      setEndDate(weekEnd);
      setSelectingStart(true);
    }
  };

  const handlePastClick = (days: number, isYTD: boolean) => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    let start: Date;
    if (isYTD) {
      start = new Date(now.getFullYear(), 0, 1);
    } else {
      start = new Date(now);
      start.setDate(now.getDate() - days);
    }
    start.setHours(0, 0, 0, 0);
    setStartDate(start);
    setEndDate(end);
    setSelectingStart(true);
  };

  const renderDatePicker = () => {
    const { year, month } = currentView;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const mondayBasedDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];
    for (let i = 0; i < mondayBasedDay; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView({ ...currentView, year: year - 1 })}
              className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
            >
              &lt;&lt;
            </button>
            <button
              onClick={() => {
                const newMonth = month - 1;
                if (newMonth < 0) {
                  setCurrentView({ year: year - 1, month: 11 });
                } else {
                  setCurrentView({ ...currentView, month: newMonth });
                }
              }}
              className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
            >
              &lt;
            </button>
          </div>
          <div className="font-semibold">{MONTH_NAMES[month]} {year}</div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newMonth = month + 1;
                if (newMonth > 11) {
                  setCurrentView({ year: year + 1, month: 0 });
                } else {
                  setCurrentView({ ...currentView, month: newMonth });
                }
              }}
              className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
            >
              &gt;
            </button>
            <button
              onClick={() => setCurrentView({ ...currentView, year: year + 1 })}
              className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
            >
              &gt;&gt;
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
            <div key={day} className="text-center p-1 text-muted-foreground text-xs">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) return <div key={idx} className="p-2" />;
            const dateStr = date.toISOString().split('T')[0];
            const startStr = startDate ? startDate.toISOString().split('T')[0] : null;
            const endStr = endDate ? endDate.toISOString().split('T')[0] : null;
            const isSelected = dateStr === startStr || dateStr === endStr;
            const isInRange = startStr && endStr && dateStr >= startStr && dateStr <= endStr;
            const bgColor = isSelected ? 'bg-primary' : isInRange ? 'bg-accent' : '';

            return (
              <div
                key={idx}
                onClick={() => handleDateClick(date)}
                className={`p-2 text-center cursor-pointer rounded hover:bg-accent ${bgColor} ${
                  isSelected || isInRange ? 'text-primary-foreground' : ''
                }`}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekPicker = () => {
    const { year, month } = currentView;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const startOffset = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
    const firstMonday = new Date(year, month, 1 + startOffset);

    const weeks = [];
    let currentDate = new Date(firstMonday);
    let weekStart = new Date(currentDate);

    while (currentDate <= lastDay || weekStart.getMonth() === month) {
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(currentDate.getDate() + 6);
      const weekStartStr = `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]}`;
      const weekEndStr = `${weekEnd.getDate()} ${MONTH_NAMES[weekEnd.getMonth()]}`;
      weeks.push({ start: new Date(weekStart), end: new Date(weekEnd), label: `${weekStartStr} - ${weekEndStr}` });
      currentDate.setDate(currentDate.getDate() + 7);
      weekStart = new Date(currentDate);
      if (weekStart > lastDay && weekStart.getMonth() !== month) break;
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView({ ...currentView, year: year - 1 })}
              className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
            >
              &lt;&lt;
            </button>
            <button
              onClick={() => {
                const newMonth = month - 1;
                if (newMonth < 0) {
                  setCurrentView({ year: year - 1, month: 11 });
                } else {
                  setCurrentView({ ...currentView, month: newMonth });
                }
              }}
              className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
            >
              &lt;
            </button>
          </div>
          <div className="font-semibold">{MONTH_NAMES[month]} {year}</div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newMonth = month + 1;
                if (newMonth > 11) {
                  setCurrentView({ year: year + 1, month: 0 });
                } else {
                  setCurrentView({ ...currentView, month: newMonth });
                }
              }}
              className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
            >
              &gt;
            </button>
            <button
              onClick={() => setCurrentView({ ...currentView, year: year + 1 })}
              className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
            >
              &gt;&gt;
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          {weeks.map((week, idx) => {
            const isStartSelected = startDate && startDate.getTime() === week.start.getTime();
            const isEndSelected = endDate && endDate.getTime() === week.end.getTime();
            const isInRange = startDate && endDate && week.start >= startDate && week.end <= endDate;
            const isSelected = isStartSelected || isEndSelected || isInRange;
            return (
              <div
                key={idx}
                onClick={() => handleWeekClick(week.start, week.end)}
                className={`p-3 text-center cursor-pointer rounded border border-border hover:bg-accent ${
                  isSelected ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                {week.label}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthPicker = () => {
    const { year } = currentView;
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentView({ ...currentView, year: year - 1 })}
            className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
          >
            &lt;&lt;
          </button>
          <div className="font-semibold">{year}</div>
          <button
            onClick={() => setCurrentView({ ...currentView, year: year + 1 })}
            className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
          >
            &gt;&gt;
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTH_NAMES.map((name, idx) => {
            const monthStart = new Date(year, idx, 1);
            const monthEnd = new Date(year, idx + 1, 0);
            const isStartSelected = startDate && startDate.getTime() === monthStart.getTime();
            const isEndSelected = endDate && endDate.getTime() === monthEnd.getTime();
            const isInRange = startDate && endDate && monthStart >= startDate && monthEnd <= endDate;
            const isSelected = isStartSelected || isEndSelected || isInRange;
            return (
              <div
                key={idx}
                onClick={() => {
                  const date = new Date(year, idx, 1);
                  if (selectingStart || !startDate || date < startDate) {
                    setStartDate(date);
                    setEndDate(null);
                    setSelectingStart(false);
                  } else {
                    setEndDate(new Date(year, idx + 1, 0));
                    setSelectingStart(true);
                  }
                }}
                className={`p-4 text-center cursor-pointer rounded border border-border hover:bg-accent ${
                  isSelected ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                {name}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderQuarterPicker = () => {
    const { year } = currentView;
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentView({ ...currentView, year: year - 1 })}
            className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
          >
            &lt;&lt;
          </button>
          <div className="font-semibold">{year}</div>
          <button
            onClick={() => setCurrentView({ ...currentView, year: year + 1 })}
            className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
          >
            &gt;&gt;
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {quarters.map((q, idx) => {
            const quarterStart = new Date(year, idx * 3, 1);
            const quarterEnd = new Date(year, idx * 3 + 3, 0);
            const isStartSelected = startDate && startDate.getTime() === quarterStart.getTime();
            const isEndSelected = endDate && endDate.getTime() === quarterEnd.getTime();
            const isInRange = startDate && endDate && quarterStart >= startDate && quarterEnd <= endDate;
            const isSelected = isStartSelected || isEndSelected || isInRange;
            return (
              <div
                key={idx}
                onClick={() => {
                  const startMonth = idx * 3;
                  const date = new Date(year, startMonth, 1);
                  if (selectingStart || !startDate || date < startDate) {
                    setStartDate(date);
                    setEndDate(null);
                    setSelectingStart(false);
                  } else {
                    setEndDate(new Date(year, startMonth + 3, 0));
                    setSelectingStart(true);
                  }
                }}
                className={`p-4 text-center cursor-pointer rounded border border-border hover:bg-accent ${
                  isSelected ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                {q}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearPicker = () => {
    const startYear = Math.floor(currentView.year / 10) * 10;
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentView({ ...currentView, year: currentView.year - 10 })}
            className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
          >
            &lt;&lt;
          </button>
          <div className="font-semibold">{startYear}-{startYear + 9}</div>
          <button
            onClick={() => setCurrentView({ ...currentView, year: currentView.year + 10 })}
            className="px-3 py-1 bg-secondary border border-border text-foreground rounded cursor-pointer hover:bg-accent"
          >
            &gt;&gt;
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 10 }, (_, i) => startYear + i).map((y) => {
            const yearStart = new Date(y, 0, 1);
            const yearEnd = new Date(y, 11, 31);
            const isStartSelected = startDate && startDate.getFullYear() === y && startDate.getMonth() === 0 && startDate.getDate() === 1;
            const isEndSelected = endDate && endDate.getFullYear() === y && endDate.getMonth() === 11 && endDate.getDate() === 31;
            const isInRange = startDate && endDate && yearStart >= startDate && yearEnd <= endDate;
            const isSelected = isStartSelected || isEndSelected || isInRange;
            return (
              <div
                key={y}
                onClick={() => {
                  const date = new Date(y, 0, 1);
                  if (selectingStart || !startDate || date < startDate) {
                    setStartDate(date);
                    setEndDate(null);
                    setSelectingStart(false);
                  } else {
                    setEndDate(new Date(y, 11, 31));
                    setSelectingStart(true);
                  }
                }}
                className={`p-4 text-center cursor-pointer rounded border border-border hover:bg-accent ${
                  isSelected ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                {y}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPastPicker = () => {
    return (
      <div>
        <div className="mb-4">
          <div className="font-semibold text-center">Past Periods</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PAST_OPTIONS.map((option) => {
            const now = new Date();
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            let start: Date;
            if (option.isYTD) {
              start = new Date(now.getFullYear(), 0, 1);
            } else {
              start = new Date(now);
              start.setDate(now.getDate() - option.days);
            }
            start.setHours(0, 0, 0, 0);
            const isSelected = startDate && endDate &&
              startDate.getTime() === start.getTime() &&
              endDate.getTime() === end.getTime();

            return (
              <div
                key={option.label}
                onClick={() => handlePastClick(option.days, option.isYTD)}
                className={`p-4 text-center cursor-pointer rounded border border-border hover:bg-accent ${
                  isSelected ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
        <div className="absolute top-full left-0 right-0 mt-1 border border-border bg-background text-foreground rounded-xl z-50 shadow-lg min-h-[320px] p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              {granularity === 'date' && renderDatePicker()}
              {granularity === 'week' && renderWeekPicker()}
              {granularity === 'month' && renderMonthPicker()}
              {granularity === 'quarter' && renderQuarterPicker()}
              {granularity === 'year' && renderYearPicker()}
              {granularity === 'past' && renderPastPicker()}
            </div>
            <div className="w-[120px] border-l border-border pl-4">
              {GRANULARITY_OPTIONS.map((gran) => (
                <div
                  key={gran}
                  onClick={() => setGranularity(gran)}
                  className={`py-2.5 cursor-pointer border-b border-border hover:bg-accent ${
                    granularity === gran ? 'border-b-2 border-primary text-primary' : ''
                  }`}
                >
                  {gran}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

