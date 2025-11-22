'use client';

import { useState, useEffect } from 'react';

type Mode = 'portfolio' | 'transactions';

interface PortfolioTransactionsToggleProps {
  onChange?: (mode: Mode) => void;
  defaultMode?: Mode;
}

export function PortfolioTransactionsToggle({ 
  onChange,
  defaultMode = 'portfolio' 
}: PortfolioTransactionsToggleProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);

  // Update internal state when defaultMode prop changes (controlled component)
  useEffect(() => {
    if (defaultMode !== undefined) {
      setMode(defaultMode);
    }
  }, [defaultMode]);

  const handleToggle = () => {
    const newMode = mode === 'portfolio' ? 'transactions' : 'portfolio';
    setMode(newMode);
    if (onChange) {
      onChange(newMode);
    }
  };

  const isPortfolio = mode === 'portfolio';

  return (
    <div className="flex items-center gap-3 w-full max-w-md">
      {/* Portfolio text - left of button */}
      <span className="text-foreground font-medium">
        Portfolio
      </span>
      
      {/* Sliding button - 60% of current size */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative inline-flex h-5 w-[48px] items-center rounded-full overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        role="switch"
        aria-checked={!isPortfolio}
        aria-label="Toggle between Portfolio and Transactions"
      >
        {/* Background color changes based on selection */}
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isPortfolio ? 'bg-[#DF3441]' : 'bg-[#347745]'
          }`}
        />
        
        {/* Sliding button - circular, 60% of current size */}
        <span
          className={`absolute h-4 w-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out z-20 ${
            isPortfolio ? 'translate-x-1' : 'translate-x-[32px]'
          }`}
        />
      </button>
      
      {/* Transactions text - right of button */}
      <span className="text-foreground font-medium">
        Transactions
      </span>
    </div>
  );
}

