import Portfolio from '@/components/widgets/portfolio';
import PiePortfolioByProtocol from '@/components/widgets/pie-portfolio-by-protocol';
import PiePortfolioByAsset from '@/components/widgets/pie-portfolio-by-asset';
import { generateMetadata } from '@/lib/metadata';
import Historical from '@/components/widgets/historic';
import HistoricalRange from '@/components/widgets/historicalRange';

export const metadata = generateMetadata({
  title: 'Template',
  description: 'Template',
});

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Portfolio Dashboard</h1>
      <div className="flex flex-col gap-6">
        {/* First row: Portfolio and Historic side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Portfolio />
          </div>
          <div>
            <Historical />
          </div>
        </div>
        {/* Second row: Two pie charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <PiePortfolioByProtocol />
          </div>
          <div>
            <PiePortfolioByAsset />
          </div>
          <div>
            <HistoricalRange />
          </div>
        </div>
      </div>
    </div>
  );
}
