'use client';

import type { Match, Player } from '@/types/tournament';
import { MatchCard } from './MatchCard';

interface MatchListProps {
  matches: Match[];
  players: Player[];
  onMatchClick: (match: Match) => void;
  onOverrideClick?: (match: Match) => void;
  activeMatchId?: string;
}

export function MatchList({
  matches,
  players,
  onMatchClick,
  onOverrideClick,
  activeMatchId,
}: MatchListProps) {
  const groupedMatches = matches.reduce(
    (acc, match) => {
      const key = `${match.bracket}-r${match.round}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(match);
      return acc;
    },
    {} as Record<string, Match[]>
  );

  const bracketOrder: Array<{ bracket: string; label: string }> = [
    { bracket: 'winners', label: 'Winners Bracket' },
    { bracket: 'losers', label: 'Losers Bracket' },
    { bracket: 'grand-finals', label: 'Grand Finals' },
  ];

  return (
    <div className="space-y-8">
      {bracketOrder.map(({ bracket, label }) => {
        const bracketMatches = Object.entries(groupedMatches)
          .filter(([key]) => key.startsWith(bracket))
          .flatMap(([, matches]) => matches)
          .sort((a, b) => {
            if (a.round !== b.round) return a.round - b.round;
            return a.position - b.position;
          });

        if (bracketMatches.length === 0) return null;

        return (
          <div key={bracket}>
            <h2 className="mb-4 text-2xl font-bold">{label}</h2>
            <div className="space-y-6">
              {Array.from(
                new Set(bracketMatches.map((m) => m.round))
              ).map((round) => {
                const roundMatches = bracketMatches.filter(
                  (m) => m.round === round
                );
                return (
                  <div key={round}>
                    <h3 className="mb-3 text-lg font-semibold">
                      Round {round}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {roundMatches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          players={players}
                          onScoreClick={() => onMatchClick(match)}
                          onOverrideClick={onOverrideClick ? () => onOverrideClick(match) : undefined}
                          isActive={activeMatchId === match.id}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
