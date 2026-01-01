'use client';

import { useMemo, forwardRef } from 'react';
import type { Match, Player, TournamentFormat, TournamentFormatConfig } from '@/types/tournament';
import { WinnersBracket } from './WinnersBracket';
import { LosersBracket } from './LosersBracket';
import { GrandFinals } from './GrandFinals';
import { RoundRobinView } from './RoundRobinView';
import { SwissView } from './SwissView';
import { GroupKnockoutView } from './GroupKnockoutView';

interface BracketTreeProps {
  matches: Match[];
  players: Player[];
  format?: TournamentFormat;
  formatConfig?: TournamentFormatConfig;
  currentSwissRound?: number;
  groupStageComplete?: boolean;
  onMatchClick: (match: Match) => void;
  onOverrideClick?: (match: Match) => void;
  onAdvanceSwissRound?: () => void;
  onAdvanceToKnockout?: () => void;
  activeMatchId?: string;
}

export const BracketTree = forwardRef<HTMLDivElement, BracketTreeProps>(
  function BracketTree(
    {
      matches,
      players,
      format = 'double-elimination',
      formatConfig,
      currentSwissRound = 1,
      groupStageComplete = false,
      onMatchClick,
      onOverrideClick,
      onAdvanceSwissRound,
      onAdvanceToKnockout,
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
    const roundRobinMatches = useMemo(
      () => matches.filter((m) => m.bracket === 'round-robin'),
      [matches]
    );
    const swissMatches = useMemo(
      () => matches.filter((m) => m.bracket === 'swiss'),
      [matches]
    );

    // Calculate total Swiss rounds
    const totalSwissRounds = formatConfig?.numberOfRounds || 
      Math.max(3, Math.ceil(Math.log2(players.length)));

    // Route to appropriate view based on format
    switch (format) {
      case 'round-robin':
        return (
          <div ref={ref} className="pb-8">
            <RoundRobinView
              matches={roundRobinMatches.length > 0 ? roundRobinMatches : matches}
              players={players}
              onMatchClick={onMatchClick}
              activeMatchId={activeMatchId}
            />
          </div>
        );

      case 'swiss':
        return (
          <div ref={ref} className="pb-8">
            <SwissView
              matches={swissMatches.length > 0 ? swissMatches : matches}
              players={players}
              currentRound={currentSwissRound}
              totalRounds={totalSwissRounds}
              onMatchClick={onMatchClick}
              onAdvanceRound={onAdvanceSwissRound}
              activeMatchId={activeMatchId}
            />
          </div>
        );

      case 'group-knockout':
        return (
          <div ref={ref} className="pb-8">
            <GroupKnockoutView
              matches={matches}
              players={players}
              formatConfig={formatConfig}
              groupStageComplete={groupStageComplete}
              onMatchClick={onMatchClick}
              onAdvanceToKnockout={onAdvanceToKnockout}
              activeMatchId={activeMatchId}
            />
          </div>
        );

      case 'single-elimination':
        return (
          <div ref={ref} className="space-y-12 overflow-x-auto pb-8">
            {winnersMatches.length > 0 && (
              <WinnersBracket
                matches={winnersMatches}
                players={players}
                onMatchClick={onMatchClick}
                onOverrideClick={onOverrideClick}
                activeMatchId={activeMatchId}
                title="Bracket"
              />
            )}
          </div>
        );

      case 'double-elimination':
      default:
        return (
          <div ref={ref} className="space-y-12 overflow-x-auto pb-8">
            {winnersMatches.length > 0 && (
              <WinnersBracket
                matches={winnersMatches}
                players={players}
                onMatchClick={onMatchClick}
                onOverrideClick={onOverrideClick}
                activeMatchId={activeMatchId}
              />
            )}

            {losersMatches.length > 0 && (
              <LosersBracket
                matches={losersMatches}
                players={players}
                onMatchClick={onMatchClick}
                onOverrideClick={onOverrideClick}
                activeMatchId={activeMatchId}
              />
            )}

            {grandFinalsMatches.length > 0 && (
              <GrandFinals
                matches={grandFinalsMatches}
                players={players}
                onMatchClick={onMatchClick}
                onOverrideClick={onOverrideClick}
                activeMatchId={activeMatchId}
              />
            )}
          </div>
        );
    }
  }
);
