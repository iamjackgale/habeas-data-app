'use client';

import { useState } from 'react';
import PortfolioSnapshot from '@/components/widgets-snapshots/counter/portfolio-snapshot';
import HistoricalSnapshot from '@/components/widgets-snapshots/counter/historic-snapshot';
import PieCurrentPortfolioByAssetSnapshot from '@/components/widgets-snapshots/pie/pie-current-portfolio-by-asset-snapshot';
import PiesPortfolioByAssetSnapshot from '@/components/widgets-snapshots/pies/pies-portfolio-by-asset-snapshot';
import BarCurrentPortfolioByAssetSnapshot from '@/components/widgets-snapshots/bar/bar-current-portfolio-by-asset-snapshot';
import BarStackedPortfolioByAssetSnapshot from '@/components/widgets-snapshots/bar-stacked/bar-stacked-portfolio-by-asset-snapshot';
import { DashboardFooter } from '@/components/dashboard-footer';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
        <div className="p-6 flex flex-col gap-6">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const handleUpdate = () => {
    // TODO: Implement update functionality
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Widget Library</h1>
        <button
          onClick={handleUpdate}
          className="px-6 py-2.5 rounded-xl font-semibold transition-all bg-[#347745] hover:bg-[#2a5f37] text-white"
        >
          Update
        </button>
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

