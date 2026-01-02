import { Metadata } from 'next';
import { JsonLd } from "@/components/seo/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: 'Player Statistics',
  description: 'Track player performance, win rates, and tournament records across all your competitions.',
  openGraph: {
    title: 'Player Statistics - Bracket Magic',
    description: 'Deep dive into player data and see who reigns supreme on the leaderboard.',
  },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={getBreadcrumbSchema([
        { name: 'Home', item: '/' },
        { name: 'Statistics', item: '/stats' }
      ])} />
      {children}
    </>
  );
}
