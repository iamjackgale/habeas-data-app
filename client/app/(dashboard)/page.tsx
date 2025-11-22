import Portfolio from '@/components/widgets/portfolio';
import PieCurrentPortfolioByProtocol from '@/components/widgets/pie/pie-current-portfolio-by-protocol';
import PieCurrentPortfolioByAsset from '@/components/widgets/pie/pie-current-portfolio-by-asset';
import PieHistoricalPortfolioByProtocol from '@/components/widgets/pie/pie-historical-portfolio-by-protocol';
import PieHistoricalPortfolioByAsset from '@/components/widgets/pie/pie-historical-portfolio-by-asset';
import PiesCurrentPortfolioByProtocol from '@/components/widgets/pies/pies-current-portfolio-by-protocol';
import PiesCurrentPortfolioByAsset from '@/components/widgets/pies/pies-current-portfolio-by-asset';
import { generateMetadata } from '@/lib/metadata';
import Historical from '@/components/widgets/historic';

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
        {/* Second row: Two current pie charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <PieCurrentPortfolioByProtocol />
          </div>
          <div>
            <PieCurrentPortfolioByAsset />
          </div>
        </div>
        {/* Third row: Two historical pie charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <PieHistoricalPortfolioByProtocol />
          </div>
          <div>
            <PieHistoricalPortfolioByAsset />
          </div>
        </div>
        {/* Fourth row: Two-level comparison pie charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <PiesCurrentPortfolioByProtocol />
          </div>
          <div>
            <PiesCurrentPortfolioByAsset />
          </div>
        </div>
      </div>
    </div>
  );
}
