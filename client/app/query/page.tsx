import { generateMetadata } from '@/lib/metadata';
import { DashboardFooter } from '@/components/dashboard-footer';

export const metadata = generateMetadata({
  title: 'Query',
  description: 'Query',
});

export default function QueryPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Data Query</h1>
      <div className="flex flex-col gap-6">
        <p className="text-foreground">Welcome to the Query page.</p>
      </div>
      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

