'use client';

import { useMemo } from 'react';
import type { Match, Player, GroupStanding } from '@/types/tournament';
import { calculateStandings, formatRecord } from '@/lib/standings';
import { cn } from '@/lib/utils';

interface StandingsTableProps {
  matches: Match[];
  players: Player[];
  groupId?: string;
  title?: string;
  compact?: boolean;
}

export function StandingsTable({
  matches,
  players,
  groupId,
  title,
  compact = false,
}: StandingsTableProps) {
  const standings = useMemo(
    () => calculateStandings(matches, players, groupId),
    [matches, players, groupId]
  );

  if (standings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {title && (
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h3 className="font-semibold">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              <th className={cn('px-4 py-2 text-left font-medium', compact && 'px-2 py-1')}>
                #
              </th>
              <th className={cn('px-4 py-2 text-left font-medium', compact && 'px-2 py-1')}>
                Player
              </th>
              <th className={cn('px-4 py-2 text-center font-medium', compact && 'px-2 py-1')}>
                Record
              </th>
              {!compact && (
                <>
                  <th className="px-4 py-2 text-center font-medium">PF</th>
                  <th className="px-4 py-2 text-center font-medium">PA</th>
                </>
              )}
              <th className={cn('px-4 py-2 text-center font-medium', compact && 'px-2 py-1')}>
                +/-
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => (
              <tr
                key={standing.playerId}
                className={cn(
                  'border-b border-gray-100 dark:border-gray-700/50',
                  index < 2 && 'bg-green-50/50 dark:bg-green-900/10'
                )}
              >
                <td className={cn('px-4 py-2 font-medium text-gray-500', compact && 'px-2 py-1')}>
                  {index + 1}
                </td>
                <td className={cn('px-4 py-2 font-medium', compact && 'px-2 py-1')}>
                  {standing.playerName}
                </td>
                <td className={cn('px-4 py-2 text-center', compact && 'px-2 py-1')}>
                  {formatRecord({
                    wins: standing.wins,
                    losses: standing.losses,
                    draws: standing.draws,
                  })}
                </td>
                {!compact && (
                  <>
                    <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                      {standing.pointsFor}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400">
                      {standing.pointsAgainst}
                    </td>
                  </>
                )}
                <td
                  className={cn(
                    'px-4 py-2 text-center font-medium',
                    compact && 'px-2 py-1',
                    standing.pointDifferential > 0 && 'text-green-600 dark:text-green-400',
                    standing.pointDifferential < 0 && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {standing.pointDifferential > 0 && '+'}
                  {standing.pointDifferential}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
