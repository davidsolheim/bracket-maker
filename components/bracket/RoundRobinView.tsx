'use client';

import { useMemo } from 'react';
import type { Match, Player } from '@/types/tournament';
import { StandingsTable } from './StandingsTable';
import { MatchCard } from '../match/MatchCard';
import { cn } from '@/lib/utils';

interface RoundRobinViewProps {
  matches: Match[];
  players: Player[];
  onMatchClick: (match: Match) => void;
  activeMatchId?: string;
}

export function RoundRobinView({
  matches,
  players,
  onMatchClick,
  activeMatchId,
}: RoundRobinViewProps) {
  // Group matches by round
  const matchesByRound = useMemo(() => {
    const grouped = new Map<number, Match[]>();
    matches.forEach((match) => {
      const round = match.round;
      if (!grouped.has(round)) {
        grouped.set(round, []);
      }
      grouped.get(round)!.push(match);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);
  }, [matches]);

  const completedCount = matches.filter((m) => m.winnerId).length;
  const totalCount = matches.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-gray-600 dark:text-gray-400">
            {completedCount} / {totalCount} matches ({progressPercent}%)
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Standings */}
      <StandingsTable matches={matches} players={players} title="Standings" />

      {/* Matches by Round */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Matches</h3>
        {matchesByRound.map(([round, roundMatches]) => (
          <div key={round}>
            <h4 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
              Round {round}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roundMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  players={players}
                  onScoreClick={() => onMatchClick(match)}
                  isActive={match.id === activeMatchId}
                  compact
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
