'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const CHAIN_OPTIONS = [
  'Arbitrum',
  'Avalanche',
  'Base',
  'BNB Chain',
  'Ethereum',
  'Gnosis',
  'Linea',
  'OP Mainnet',
  'Polygon',
  'Sonic',
];

interface ChainDropdownProps {
  value?: Set<string>;
  onChange?: (value: Set<string>) => void;
}

export function ChainDropdown({ value, onChange }: ChainDropdownProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalChains, setInternalChains] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use controlled value if provided, otherwise use internal state
  const selectedChains = value !== undefined ? value : internalChains;
  
  const updateChains = (newChains: Set<string>) => {
    if (onChange) {
      onChange(newChains);
    } else {
      setInternalChains(newChains);
    }
  };

  const allChainsSelected = CHAIN_OPTIONS.every(chain => selectedChains.has(chain));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAllChainsChange = (checked: boolean) => {
    if (checked) {
      updateChains(new Set(CHAIN_OPTIONS));
    } else {
      updateChains(new Set());
    }
  };

  const handleChainChange = (chain: string, checked: boolean) => {
    const newSelected = new Set(selectedChains);
    if (checked) {
      newSelected.add(chain);
    } else {
      newSelected.delete(chain);
    }
    updateChains(newSelected);
  };

  const displayText = selectedChains.size > 0
    ? Array.from(selectedChains).join(', ')
    : 'Select chains...';

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
          <label className="block px-4 py-2.5 cursor-pointer border-b border-border hover:bg-accent text-left">
            <input
              type="checkbox"
              checked={allChainsSelected}
              onChange={(e) => handleAllChainsChange(e.target.checked)}
              className="mr-2.5 accent-primary cursor-pointer"
            />
            All Chains
          </label>
          <div className="grid grid-cols-2">
            {CHAIN_OPTIONS.map((chain) => (
              <label
                key={chain}
                className="block px-4 py-2.5 cursor-pointer border-b border-border hover:bg-accent text-left"
              >
                <input
                  type="checkbox"
                  value={chain}
                  checked={selectedChains.has(chain)}
                  onChange={(e) => handleChainChange(chain, e.target.checked)}
                  className="mr-2.5 accent-primary cursor-pointer"
                />
                {chain}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

