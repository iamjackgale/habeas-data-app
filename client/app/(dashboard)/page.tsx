import Portfolio from '@/components/example/portfolio';
import { generateMetadata } from '@/lib/metadata';

export const metadata = generateMetadata({
  title: 'Template',
  description: 'Template',
});

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <p className="py-4 mt-2 md:mt-0">Hello world</p>
      <Portfolio />
    </div>
  );
}
