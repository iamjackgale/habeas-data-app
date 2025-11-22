'use client';

import React, { useState, useEffect, useRef } from 'react';
import PortfolioSnapshot from '@/components/widgets-snapshots/counter/portfolio-snapshot';
import HistoricalSnapshot from '@/components/widgets-snapshots/counter/historic-snapshot';
import PieCurrentPortfolioByAssetSnapshot from '@/components/widgets-snapshots/pie/pie-current-portfolio-by-asset-snapshot';
import PiesPortfolioByAssetSnapshot from '@/components/widgets-snapshots/pies/pies-portfolio-by-asset-snapshot';
import BarCurrentPortfolioByAssetSnapshot from '@/components/widgets-snapshots/bar/bar-current-portfolio-by-asset-snapshot';
import BarTransactionsByDaySnapshot from '@/components/widgets-snapshots/bar/bar-transactions-by-day-snapshot';
import BarStackedPortfolioByAssetSnapshot from '@/components/widgets-snapshots/bar-stacked/bar-stacked-portfolio-by-asset-snapshot';
import { DashboardFooter } from '@/components/dashboard-footer';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import TransactionCountSnapshot from '@/components/widgets-snapshots/counter/transaction-snapshot';
import { LoadingSpinner } from '@/components/loading-spinner';

function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [widgetsReady, setWidgetsReady] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset ready state when opening
      setWidgetsReady(false);
      
      // Fallback timeout - show widgets after 10 seconds max
      const fallbackTimeout = setTimeout(() => {
        setWidgetsReady(true);
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      }, 10000);
      
      // Start checking for widget readiness after a short delay to allow widgets to start rendering
      const initialDelay = setTimeout(() => {
        let consecutiveReadyChecks = 0;
        checkIntervalRef.current = setInterval(() => {
          if (contentRef.current) {
            // Check if there are any loading indicators
            const hasLoadingText = contentRef.current.textContent?.includes('Loading...');
            const loadingSpinners = contentRef.current.querySelectorAll('img[alt="Loading"]');
            
            // Check if widgets have rendered (have widget containers, charts, or error/data messages)
            // Look for actual widget content, not just containers
            const widgetContainers = contentRef.current.querySelectorAll('.widget-bg, .border-red-300, .border-yellow-300, .border-gray-300');
            const rechartsWrappers = contentRef.current.querySelectorAll('.recharts-wrapper');
            const hasWidgetContent = widgetContainers.length > 0 || rechartsWrappers.length > 0;
            
            // Widgets are ready if:
            // 1. We have widget content (containers or charts)
            // 2. There's no "Loading..." text
            // 3. There are no loading spinner images
            const noLoadingIndicators = !hasLoadingText && loadingSpinners.length === 0;
            
            if (hasWidgetContent && noLoadingIndicators) {
              consecutiveReadyChecks++;
              // Require 2 consecutive ready checks to ensure stability
              if (consecutiveReadyChecks >= 2) {
                clearTimeout(fallbackTimeout);
                setWidgetsReady(true);
                if (checkIntervalRef.current) {
                  clearInterval(checkIntervalRef.current);
                }
              }
            } else {
              consecutiveReadyChecks = 0;
            }
          }
        }, 200); // Check every 200ms
      }, 200); // Initial delay to let widgets start rendering

      return () => {
        clearTimeout(initialDelay);
        clearTimeout(fallbackTimeout);
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
    } else {
      // Clear interval when closed
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      setWidgetsReady(false);
    }
  }, [isOpen]);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent transition-colors"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {isOpen ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </button>
      {isOpen && (
        <div className="p-6 relative min-h-[400px]" ref={contentRef}>
          {/* Render widgets but make them invisible until ready */}
          <div className={`flex flex-col gap-6 ${widgetsReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {children}
          </div>
          {/* Show loading spinner while widgets are loading */}
          {!widgetsReady && (
            <div className="flex items-center justify-center absolute inset-0">
              <LoadingSpinner />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Widget Library</h1>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-foreground">
            Our library of widgets help to visualise portfolio performance and operations with flexible and arbitrary data types and schemas.
          </p>
          <p className="text-foreground">
            Use it to decide which widgets to select for your{' '}
            <Link href="/query" className="text-primary underline hover:text-primary/80">
              query
            </Link>
            . All widgets are compatible for export to Octav.
          </p>
        </div>

        {/* Counter Section */}
        <CollapsibleSection title="Counter">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <PortfolioSnapshot />
            </div>
            <div>
              <HistoricalSnapshot />
            </div>
          </div>
          <div>
            <TransactionCountSnapshot />
          </div>
          
        </CollapsibleSection>

        {/* Pie Section */}
        <CollapsibleSection title="Pie">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <PieCurrentPortfolioByAssetSnapshot />
            </div>
          </div>
        </CollapsibleSection>

        {/* Pies Section */}
        <CollapsibleSection title="Pie-in-Pie">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <PiesPortfolioByAssetSnapshot />
            </div>
          </div>
        </CollapsibleSection>

        {/* Bar Section */}
        <CollapsibleSection title="Bar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <BarCurrentPortfolioByAssetSnapshot />
            </div>
            <div>
              <BarTransactionsByDaySnapshot />
            </div>
          </div>
        </CollapsibleSection>

        {/* Bar Stacked Section */}
        <CollapsibleSection title="Bar Stacked">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <BarStackedPortfolioByAssetSnapshot />
            </div>
          </div>
        </CollapsibleSection>
      </div>
      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

