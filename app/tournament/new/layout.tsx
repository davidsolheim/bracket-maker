import { Metadata } from 'next';
import { JsonLd } from "@/components/seo/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: 'Create Tournament',
  description: 'Create single or double elimination brackets, round robin, Swiss, and group stage tournaments with our easy-to-use bracket maker.',
  openGraph: {
    title: 'Create Tournament - Bracket Magic',
    description: 'Launch your next tournament in seconds. Supports multiple formats including Double Elimination and Swiss.',
  },
};

export default function NewTournamentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={getBreadcrumbSchema([
        { name: 'Home', item: '/' },
        { name: 'Create Tournament', item: '/tournament/new' }
      ])} />
      {children}
    </>
  );
}
