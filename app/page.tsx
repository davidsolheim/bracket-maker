'use client';

import Link from 'next/link';
import { useTournament } from '@/contexts/TournamentContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SkeletonList } from '@/components/ui/Skeleton';

export default function Home() {
  const { tournaments, isLoading } = useTournament();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Tournament Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your bumper pool tournaments
            </p>
          </div>
          <SkeletonList count={6} />
        </main>
      </div>
    );
  }

  const activeTournaments = tournaments.filter((t) => t.status === 'active');
  const recentTournaments = tournaments
    .filter((t) => t.status === 'completed')
    .sort((a, b) => {
      const dateA = a.completedAt?.getTime() || 0;
      const dateB = b.completedAt?.getTime() || 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Tournament Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your bumper pool tournaments
          </p>
        </div>

        <div className="mb-8">
          <Link
            href="/tournament/new"
            className={cn(
              'cursor-pointer inline-block rounded-lg px-6 py-3 font-medium text-white',
              'bg-green-600 hover:bg-green-700',
              'dark:bg-green-700 dark:hover:bg-green-600'
            )}
          >
            Create New Tournament
          </Link>
        </div>

        {activeTournaments.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Active Tournaments</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  href={`/tournament/${tournament.id}`}
                  className={cn(
                    'cursor-pointer block rounded-lg border-2 border-green-200 bg-white p-6',
                    'transition-all hover:border-green-400 hover:shadow-lg',
                    'dark:border-green-800 dark:bg-gray-800'
                  )}
                >
                  <h3 className="mb-2 text-xl font-bold">{tournament.name}</h3>
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    {tournament.players.length} players
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Started {format(tournament.createdAt, 'MMM d, yyyy')}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {recentTournaments.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl font-bold">Recent Tournaments</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  href={`/tournament/${tournament.id}`}
                  className={cn(
                    'cursor-pointer block rounded-lg border-2 border-gray-200 bg-white p-6',
                    'transition-all hover:border-gray-400 hover:shadow-lg',
                    'dark:border-gray-700 dark:bg-gray-800'
                  )}
                >
                  <h3 className="mb-2 text-xl font-bold">{tournament.name}</h3>
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    {tournament.players.length} players
                  </p>
                  {tournament.completedAt && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Completed {format(tournament.completedAt, 'MMM d, yyyy')}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {tournaments.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
              No tournaments yet
            </p>
            <Link
              href="/tournament/new"
              className={cn(
                'cursor-pointer inline-block rounded-lg px-6 py-3 font-medium text-white',
                'bg-green-600 hover:bg-green-700',
                'dark:bg-green-700 dark:hover:bg-green-600'
              )}
            >
              Create Your First Tournament
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
