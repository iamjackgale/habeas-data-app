'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Address {
  key: string;
  address: string;
  label: string;
}

interface AddressDropdownProps {
  value: Set<string>;
  onChange: (addresses: Set<string>) => void;
}

export function AddressDropdown({ value, onChange }: AddressDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAddresses = value;

  // Load addresses from config
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const config = await response.json();
          const configAddresses = config.settings?.addresses || {};
          
          // Convert dictionary to array format
          const addressesArray: Address[] = Object.entries(configAddresses).map(([key, value]: [string, any]) => ({
            key,
            address: value.address || value,
            label: value.label || key,
          }));
          
          setAddresses(addressesArray);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAddresses();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAllAddressesChange = (checked: boolean) => {
    const newSelected = new Set(selectedAddresses);
    if (checked) {
      addresses.forEach(addr => newSelected.add(addr.address));
    } else {
      addresses.forEach(addr => newSelected.delete(addr.address));
    }
    onChange(newSelected);
  };

  const handleAddressChange = (address: string, checked: boolean) => {
    const newSelected = new Set(selectedAddresses);
    if (checked) {
      newSelected.add(address);
    } else {
      newSelected.delete(address);
    }
    onChange(newSelected);
  };

  const allSelected = addresses.length > 0 && addresses.every(addr => selectedAddresses.has(addr.address));
  const someSelected = addresses.some(addr => selectedAddresses.has(addr.address));

  const displayText = selectedAddresses.size === 0
    ? 'Select addresses...'
    : selectedAddresses.size === 1
    ? '1 address selected'
    : `${selectedAddresses.size} addresses selected`;

  const formatAddress = (address: string): string => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getAddressLabel = (address: string): string => {
    const addr = addresses.find(a => a.address === address);
    return addr?.label || formatAddress(address);
  };

  return (
    <div className="relative inline-block w-full max-w-md" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="border border-border px-4 py-2.5 bg-background text-foreground rounded-xl flex justify-between items-center cursor-pointer hover:bg-accent transition-colors"
      >
        <span className="flex-1 text-left truncate">
          {isLoading ? 'Loading addresses...' : displayText}
        </span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 ml-2 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 ml-2 flex-shrink-0" />
        )}
      </div>
      {isOpen && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-border bg-background text-foreground rounded-xl z-50 shadow-lg max-h-[400px] overflow-y-auto">
          {addresses.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No addresses configured. Add addresses in config.json.
            </div>
          ) : (
            <>
              <div className="p-2 border-b border-border sticky top-0 bg-background">
                <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={(e) => handleAllAddressesChange(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="font-medium text-sm">Select All</span>
                </label>
              </div>
              <div className="p-2">
                {addresses.map((addr) => {
                  const isSelected = selectedAddresses.has(addr.address);
                  return (
                    <label
                      key={addr.address}
                      className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleAddressChange(addr.address, e.target.checked)}
                        className="rounded border-border"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        {addr.label && (
                          <span className="text-sm font-medium truncate">{addr.label}</span>
                        )}
                        <span className="text-xs text-muted-foreground truncate font-mono">
                          {formatAddress(addr.address)}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

