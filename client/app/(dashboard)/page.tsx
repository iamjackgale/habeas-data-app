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
            <PiesPortfolioByProtocol />
          </div>
          <div>
            <PiesPortfolioByAsset />
          </div>
        </div>
        {/* Fifth row: Two current bar charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <BarCurrentPortfolioByProtocol />
          </div>
          <div>
            <BarCurrentPortfolioByAsset />
          </div>
        </div>
        {/* Sixth row: Two historical bar charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <BarHistoricalPortfolioByProtocol />
          </div>
          <div>
            <BarHistoricalPortfolioByAsset />
          </div>
        </div>
        {/* Seventh row: Bar stacked widget */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <BarStackedPortfolioByAsset />
          </div>
        </div>
      </div>
    </div>
  );
}

