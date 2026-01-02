'use client';

import { useMemo } from 'react';
import { useTournament } from '@/contexts/TournamentContext';
import { SkeletonList } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  tournaments: number;
  winRate: number;
}

export default function StatsPage() {
  const { tournaments, isLoading } = useTournament();

  const playerStats = useMemo(() => {
    const statsMap = new Map<string, PlayerStats>();

    tournaments.forEach((tournament) => {
      tournament.players.forEach((player) => {
        const existing = statsMap.get(player.name);
        const wins = player.wins || 0;
        const losses = player.losses || 0;

        if (existing) {
          existing.wins += wins;
          existing.losses += losses;
          existing.tournaments += 1;
        } else {
          statsMap.set(player.name, {
            name: player.name,
            wins,
            losses,
            tournaments: 1,
            winRate: 0,
          });
        }
      });
    });

    // Calculate win rates
    const stats = Array.from(statsMap.values()).map((stat) => ({
      ...stat,
      winRate:
        stat.wins + stat.losses > 0
          ? (stat.wins / (stat.wins + stat.losses)) * 100
          : 0,
    }));

    // Sort by wins descending, then by win rate
    return stats.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winRate - a.winRate;
    });
  }, [tournaments]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-8 text-4xl font-bold">Player Statistics</h1>
          <SkeletonList count={5} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">Player Statistics</h1>

        {playerStats.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No player statistics yet. Complete some tournaments to see stats!
            </p>
          </div>
        ) : (
          <section className="overflow-x-auto" aria-labelledby="stats-table-title">
            <h2 id="stats-table-title" className="sr-only">Player Statistics Table</h2>
            <table className="w-full border-collapse rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-semibold dark:border-gray-600">
                    Rank
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-left text-sm font-semibold dark:border-gray-600">
                    Player
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-center text-sm font-semibold dark:border-gray-600">
                    Wins
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-center text-sm font-semibold dark:border-gray-600">
                    Losses
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-center text-sm font-semibold dark:border-gray-600">
                    Win Rate
                  </th>
                  <th className="border-b border-gray-200 px-6 py-4 text-center text-sm font-semibold dark:border-gray-600">
                    Tournaments
                  </th>
                </tr>
              </thead>
              <tbody>
                {playerStats.map((stat, index) => (
                  <tr
                    key={stat.name}
                    className={cn(
                      'transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50',
                      index === 0 && 'bg-yellow-50 dark:bg-yellow-950/20'
                    )}
                  >
                    <td className="border-b border-gray-200 px-6 py-4 text-sm dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <span className="text-yellow-500">🏆</span>
                        )}
                        {index + 1}
                      </div>
                    </td>
                    <td className="border-b border-gray-200 px-6 py-4 font-medium dark:border-gray-600">
                      {stat.name}
                    </td>
                    <td className="border-b border-gray-200 px-6 py-4 text-center text-sm text-green-600 dark:text-green-400 dark:border-gray-600">
                      {stat.wins}
                    </td>
                    <td className="border-b border-gray-200 px-6 py-4 text-center text-sm text-red-600 dark:text-red-400 dark:border-gray-600">
                      {stat.losses}
                    </td>
                    <td className="border-b border-gray-200 px-6 py-4 text-center text-sm dark:border-gray-600">
                      {stat.winRate.toFixed(1)}%
                    </td>
                    <td className="border-b border-gray-200 px-6 py-4 text-center text-sm dark:border-gray-600">
                      {stat.tournaments}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
