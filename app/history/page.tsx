'use client';

import Link from 'next/link';
import { useTournament } from '@/contexts/TournamentContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const { tournaments, deleteTournament } = useTournament();

  const completedTournaments = tournaments
    .filter((t) => t.status === 'completed')
    .sort((a, b) => {
      const dateA = a.completedAt?.getTime() || 0;
      const dateB = b.completedAt?.getTime() || 0;
      return dateB - dateA;
    });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this tournament?')) {
      deleteTournament(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">Tournament History</h1>

        {completedTournaments.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No completed tournaments yet
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedTournaments.map((tournament) => {
              const winnerMatch = tournament.matches
                .filter((m) => m.bracket === 'grand-finals')
                .sort((a, b) => b.round - a.round)
                .find((m) => m.winnerId);
              const winner = winnerMatch
                ? tournament.players.find((p) => p.id === winnerMatch.winnerId)
                : null;

              return (
                <div
                  key={tournament.id}
                  className={cn(
                    'rounded-lg border-2 border-gray-200 bg-white p-6',
                    'dark:border-gray-700 dark:bg-gray-800'
                  )}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <Link
                      href={`/tournament/${tournament.id}`}
                      className="text-xl font-bold hover:text-green-600 dark:hover:text-green-400"
                    >
                      {tournament.name}
                    </Link>
                    <button
                      onClick={(e) => handleDelete(tournament.id, e)}
                      className={cn(
                        'rounded px-2 py-1 text-sm text-red-600',
                        'hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20'
                      )}
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    {tournament.players.length} players
                  </div>

                  {tournament.completedAt && (
                    <div className="mb-4 text-sm text-gray-500 dark:text-gray-500">
                      Completed {format(tournament.completedAt, 'MMM d, yyyy')}
                    </div>
                  )}

                  {winner && (
                    <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/20">
                      <div className="text-xs font-semibold text-green-700 dark:text-green-300">
                        Winner
                      </div>
                      <div className="text-lg font-bold text-green-800 dark:text-green-200">
                        {winner.name}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
