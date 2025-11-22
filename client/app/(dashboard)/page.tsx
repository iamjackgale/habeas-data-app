import Portfolio from '@/components/widgets/portfolio';
import PiePortfolioByProtocol from '@/components/widgets/pie-portfolio-by-protocol';
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Portfolio />
        </div>
        <div>
          <PiePortfolioByProtocol />
        </div>
        <div>
          <Historical />
        </div>
      </div>
    </div>
  );
}
