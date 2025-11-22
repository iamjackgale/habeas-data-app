import { generateMetadata } from '@/lib/metadata';
import { DashboardFooter } from '@/components/dashboard-footer';

export const metadata = generateMetadata({
  title: 'Settings',
  description: 'Settings',
});

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex flex-col gap-6">
        <p className="text-foreground">Welcome to the Settings page.</p>
      </div>
      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

