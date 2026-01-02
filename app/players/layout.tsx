import { Metadata } from 'next';
import { JsonLd } from "@/components/seo/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: 'Player Lists',
  description: 'Manage and reuse player lists for your tournaments. Import and export player data for quick setup.',
  openGraph: {
    title: 'Player Lists - Bracket Magic',
    description: 'Save time by managing reusable player lists for all your tournament needs.',
  },
};

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={getBreadcrumbSchema([
        { name: 'Home', item: '/' },
        { name: 'Players', item: '/players' }
      ])} />
      {children}
    </>
  );
}
