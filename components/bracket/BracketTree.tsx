'use client';

import { useMemo, forwardRef } from 'react';
import type { Match, Player } from '@/types/tournament';
import { WinnersBracket } from './WinnersBracket';
import { LosersBracket } from './LosersBracket';
import { GrandFinals } from './GrandFinals';

interface BracketTreeProps {
  matches: Match[];
  players: Player[];
  onMatchClick: (match: Match) => void;
  activeMatchId?: string;
}

export const BracketTree = forwardRef<HTMLDivElement, BracketTreeProps>(
  function BracketTree(
    {
      matches,
      players,
      onMatchClick,
      activeMatchId,
    },
    ref
  ) {
  const winnersMatches = useMemo(
    () => matches.filter((m) => m.bracket === 'winners'),
    [matches]
  );
  const losersMatches = useMemo(
    () => matches.filter((m) => m.bracket === 'losers'),
    [matches]
  );
  const grandFinalsMatches = useMemo(
    () => matches.filter((m) => m.bracket === 'grand-finals'),
    [matches]
  );

    return (
      <div ref={ref} className="space-y-12 overflow-x-auto pb-8">
        {winnersMatches.length > 0 && (
          <WinnersBracket
            matches={winnersMatches}
            players={players}
            onMatchClick={onMatchClick}
            activeMatchId={activeMatchId}
          />
        )}

        {losersMatches.length > 0 && (
          <LosersBracket
            matches={losersMatches}
            players={players}
            onMatchClick={onMatchClick}
            activeMatchId={activeMatchId}
          />
        )}

        {grandFinalsMatches.length > 0 && (
          <GrandFinals
            matches={grandFinalsMatches}
            players={players}
            onMatchClick={onMatchClick}
            activeMatchId={activeMatchId}
          />
        )}
      </div>
    );
  }
);
