import { generateMetadata } from '@/lib/metadata';
import { DashboardFooter } from '@/components/dashboard-footer';
import { CategoryDropdown } from '@/components/query-dropdowns/category-dropdown';
import { TimePeriodDropdown } from '@/components/query-dropdowns/time-period-dropdown';
import { ChainDropdown } from '@/components/query-dropdowns/chain-dropdown';
import { PayButton } from '@/components/query-dropdowns/pay-button';
import { WidgetSelectorDropdown } from '@/components/query-dropdowns/widget-selector-dropdown';
import { PortfolioTransactionsToggle } from '@/components/query-dropdowns/portfolio-transactions-toggle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';

export const metadata = generateMetadata({
  title: 'Query',
  description: 'Query',
});

export default function QueryPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Query</h1>
      <div className="flex flex-col gap-2 mb-6">
        <p className="text-foreground">
          Build custom data queries to generate widgets, tables or data reflecting portfolio performance and operations.
        </p>
        <p className="text-foreground">
          Browse available{' '}
          <Link href="/widget" className="text-primary underline hover:text-primary/80">
            widgets
          </Link>
          {' '}to explore visualisation options for building your query.
        </p>
      </div>
      
      <div className="bg-sidebar rounded-lg border border-border p-6">
        <Tabs defaultValue="widget" className="w-full">
          <TabsList className="mb-6 justify-start">
            <TabsTrigger value="widget">Widget</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="widget" className="mt-0">
            <div className="flex flex-col gap-6 items-start">
              <PortfolioTransactionsToggle />
              <WidgetSelectorDropdown />
              <TimePeriodDropdown />
              <ChainDropdown />
              <CategoryDropdown />
              <PayButton fee="0.025" />
            </div>
          </TabsContent>
          
          <TabsContent value="table" className="mt-0">
            <div className="flex flex-col gap-6 items-start">
              <PortfolioTransactionsToggle />
              <TimePeriodDropdown />
              <ChainDropdown />
              <CategoryDropdown />
              <PayButton fee="0.025" />
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="mt-0">
            <div className="flex flex-col gap-6 items-start">
              <PortfolioTransactionsToggle />
              <TimePeriodDropdown />
              <ChainDropdown />
              <CategoryDropdown />
              <PayButton fee="0.025" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

