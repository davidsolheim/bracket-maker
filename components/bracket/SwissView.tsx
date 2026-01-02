'use client';

import { useMemo } from 'react';
import type { Match, Player, TournamentFormatConfig } from '@/types/tournament';
import { StandingsTable } from './StandingsTable';
import { MatchCard } from '../match/MatchCard';
import { Button } from '../ui/Button';
import { isRoundComplete } from '@/lib/standings';
import { cn } from '@/lib/utils';

interface SwissViewProps {
  matches: Match[];
  players: Player[];
  currentRound: number;
  totalRounds: number;
  onMatchClick: (match: Match) => void;
  onAdvanceRound?: () => void;
  activeMatchId?: string;
  // Qualification mode props
  isQualificationMode?: boolean;
  winsToQualify?: number;
  qualifyingPlayers?: number;
  onAdvanceToKnockout?: () => void;
}

export function SwissView({
  matches,
  players,
  currentRound,
  totalRounds,
  onMatchClick,
  onAdvanceRound,
  activeMatchId,
  isQualificationMode = false,
  winsToQualify = 3,
  qualifyingPlayers = 8,
  onAdvanceToKnockout,
}: SwissViewProps) {
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
    return Array.from(grouped.entries()).sort((a, b) => b[0] - a[0]); // Most recent first
  }, [matches]);

  const currentRoundMatches = matches.filter((m) => m.round === currentRound);
  const currentRoundComplete = isRoundComplete(matches, currentRound);

  // Calculate qualified players for qualification mode
  const qualifiedPlayers = useMemo(() => {
    if (!isQualificationMode) return 0;

    return players.filter((player) => (player.wins || 0) >= winsToQualify).length;
  }, [players, isQualificationMode, winsToQualify]);

  const canAdvance = isQualificationMode
    ? currentRoundComplete && qualifiedPlayers < qualifyingPlayers
    : currentRoundComplete && currentRound < totalRounds;

  const qualificationComplete = isQualificationMode && qualifiedPlayers >= qualifyingPlayers;
  const isComplete = isQualificationMode
    ? qualificationComplete
    : currentRound >= totalRounds && currentRoundComplete;

  return (
    <div className="space-y-8">
      {/* Round Progress */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <div>
            {isQualificationMode ? (
              <>
                <h3 className="font-semibold">
                  Qualification Round {currentRound}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {qualifiedPlayers >= qualifyingPlayers
                    ? `Qualification complete! ${qualifiedPlayers} of ${qualifyingPlayers} players qualified.`
                    : currentRoundComplete
                    ? `Round complete - ${qualifiedPlayers} of ${qualifyingPlayers} players qualified`
                    : `${currentRoundMatches.filter((m) => m.winnerId).length} / ${currentRoundMatches.length} matches completed`}
                </p>
              </>
            ) : (
              <>
                <h3 className="font-semibold">
                  Round {currentRound} of {totalRounds}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentRoundComplete
                    ? isComplete
                      ? 'Tournament complete!'
                      : 'Round complete'
                    : `${currentRoundMatches.filter((m) => m.winnerId).length} / ${currentRoundMatches.length} matches completed`}
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {canAdvance && onAdvanceRound && (
              <Button onClick={onAdvanceRound} variant="primary">
                Generate Round {currentRound + 1}
              </Button>
            )}
            {qualificationComplete && onAdvanceToKnockout && (
              <Button onClick={onAdvanceToKnockout} variant="primary">
                Advance to Knockout
              </Button>
            )}
          </div>
        </div>

        {/* Round indicators - only show for fixed rounds mode */}
        {!isQualificationMode && (
          <div className="flex gap-2">
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => {
              const roundComplete = isRoundComplete(matches, round);
              const isCurrent = round === currentRound;
              const hasMatches = matches.some((m) => m.round === round);

              return (
                <div
                  key={round}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all',
                    roundComplete
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white'
                      : hasMatches
                      ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                  )}
                >
                  {round}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Standings */}
      <StandingsTable
        matches={matches}
        players={players}
        title="Standings"
        highlightQualified={isQualificationMode}
        winsToQualify={winsToQualify}
      />

      {/* Current Round Matches */}
      {currentRoundMatches.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">Current Round</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentRoundMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                players={players}
                onScoreClick={() => onMatchClick(match)}
                isActive={match.id === activeMatchId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Previous Rounds */}
      {matchesByRound
        .filter(([round]) => round < currentRound)
        .map(([round, roundMatches]) => (
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
  );
}
