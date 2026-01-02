import { Metadata } from 'next';
import { JsonLd } from "@/components/seo/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: 'Tournament History',
  description: 'View completed tournaments, past results, and winners from your previous competitions.',
  openGraph: {
    title: 'Tournament History - Bracket Magic',
    description: 'Relive the glory and check past tournament brackets and results.',
  },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={getBreadcrumbSchema([
        { name: 'Home', item: '/' },
        { name: 'History', item: '/history' }
      ])} />
      {children}
    </>
  );
}
