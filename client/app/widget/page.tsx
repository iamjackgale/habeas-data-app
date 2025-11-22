'use client';

import { useState } from 'react';
import Portfolio from '@/components/widgets/portfolio';
import PieCurrentPortfolioByProtocol from '@/components/widgets/pie/pie-current-portfolio-by-protocol';
import PieCurrentPortfolioByAsset from '@/components/widgets/pie/pie-current-portfolio-by-asset';
import PieHistoricalPortfolioByProtocol from '@/components/widgets/pie/pie-historical-portfolio-by-protocol';
import PieHistoricalPortfolioByAsset from '@/components/widgets/pie/pie-historical-portfolio-by-asset';
import PiesPortfolioByProtocol from '@/components/widgets/pies/pies-portfolio-by-protocol';
import PiesPortfolioByAsset from '@/components/widgets/pies/pies-portfolio-by-asset';
import BarCurrentPortfolioByProtocol from '@/components/widgets/bar/bar-current-portfolio-by-protocol';
import BarCurrentPortfolioByAsset from '@/components/widgets/bar/bar-current-portfolio-by-asset';
import BarHistoricalPortfolioByProtocol from '@/components/widgets/bar/bar-historical-portfolio-by-protocol';
import BarHistoricalPortfolioByAsset from '@/components/widgets/bar/bar-historical-portfolio-by-asset';
import BarStackedPortfolioByAsset from '@/components/widgets/bar-stacked/bar-stacked-portfolio-by-asset';
import BarStackedPortfolioByProtocol from '@/components/widgets/bar-stacked/bar-stacked-portfolio-by-protocol';
import Historical from '@/components/widgets/historic';
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
  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Widget Library</h1>
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
              <Portfolio />
            </div>
            <div>
              <Historical />
            </div>
          </div>
        </CollapsibleSection>

        {/* Pie Section */}
        <CollapsibleSection title="Pie">
          {/* Current pie charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <PieCurrentPortfolioByProtocol />
            </div>
            <div>
              <PieCurrentPortfolioByAsset />
            </div>
          </div>
          {/* Historical pie charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <PieHistoricalPortfolioByProtocol />
            </div>
            <div>
              <PieHistoricalPortfolioByAsset />
            </div>
          </div>
          {/* Comparison pie charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <PiesPortfolioByProtocol />
            </div>
            <div>
              <PiesPortfolioByAsset />
            </div>
          </div>
        </CollapsibleSection>

        {/* Bar Section */}
        <CollapsibleSection title="Bar">
          {/* Current bar charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <BarCurrentPortfolioByProtocol />
            </div>
            <div>
              <BarCurrentPortfolioByAsset />
            </div>
          </div>
          {/* Historical bar charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <BarHistoricalPortfolioByProtocol />
            </div>
            <div>
              <BarHistoricalPortfolioByAsset />
            </div>
          </div>
          {/* Stacked bar charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <BarStackedPortfolioByProtocol />
            </div>
            <div>
              <BarStackedPortfolioByAsset />
            </div>
          </div>
        </CollapsibleSection>
      </div>
      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

