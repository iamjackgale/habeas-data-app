import { generateMetadata } from '@/lib/metadata';
import { DashboardFooter } from '@/components/dashboard-footer';

export const metadata = generateMetadata({
  title: 'Dashboard',
  description: 'Dashboard',
});

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Portfolio Dashboard</h1>
      <div className="flex flex-col gap-6">
        <p className="text-foreground">Welcome to the Dashboard page.</p>
      </div>
      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

