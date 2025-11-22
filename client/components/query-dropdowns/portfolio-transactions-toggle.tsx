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
    <div className="relative inline-block w-full max-w-md">
      <button
        type="button"
        onClick={handleToggle}
        className="relative inline-flex h-10 w-[161px] items-center rounded-full overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-[#DF3441]"
        role="switch"
        aria-checked={!isPortfolio}
        aria-label="Toggle between Portfolio and Transactions"
      >
        {/* Portfolio text - always on the left */}
        <span className={`absolute left-4 text-foreground font-medium z-10 transition-opacity ${
          isPortfolio ? 'opacity-100' : 'opacity-0'
        }`}>
          Portfolio
        </span>
        
        {/* Transactions text - always on the right */}
        <span className={`absolute right-4 text-foreground font-medium z-10 transition-opacity ${
          !isPortfolio ? 'opacity-100' : 'opacity-0'
        }`}>
          Transactions
        </span>
        
        {/* Background color changes based on selection */}
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isPortfolio ? 'bg-[#DF3441]' : 'bg-[#347745]'
          }`}
        />
        
        {/* Sliding button - circular */}
        <span
          className={`absolute h-8 w-8 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out z-20 ${
            isPortfolio ? 'translate-x-[125px]' : 'translate-x-2'
          }`}
        />
      </button>
    </div>
  );
}

