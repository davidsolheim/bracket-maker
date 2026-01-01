'use client';

import { useMemo } from 'react';
import type { Match, Player, TournamentFormatConfig } from '@/types/tournament';
import { StandingsTable } from './StandingsTable';
import { MatchCard } from '../match/MatchCard';
import { WinnersBracket } from './WinnersBracket';
import { LosersBracket } from './LosersBracket';
import { GrandFinals } from './GrandFinals';
import { Button } from '../ui/Button';
import { isGroupStageComplete } from '@/lib/standings';
import { cn } from '@/lib/utils';

interface GroupKnockoutViewProps {
  matches: Match[];
  players: Player[];
  formatConfig?: TournamentFormatConfig;
  groupStageComplete?: boolean;
  onMatchClick: (match: Match) => void;
  onAdvanceToKnockout?: () => void;
  activeMatchId?: string;
}

export function GroupKnockoutView({
  matches,
  players,
  formatConfig,
  groupStageComplete = false,
  onMatchClick,
  onAdvanceToKnockout,
  activeMatchId,
}: GroupKnockoutViewProps) {
  // Separate group and knockout matches
  const groupMatches = useMemo(
    () => matches.filter((m) => m.bracket === 'group'),
    [matches]
  );

  const knockoutMatches = useMemo(
    () => matches.filter((m) => m.bracket !== 'group'),
    [matches]
  );

  // Derive player groups from matches (since players don't have groupId)
  const playersByGroup = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    
    // First, collect player IDs from group matches
    groupMatches.forEach((match) => {
      if (match.groupId) {
        if (!groups.has(match.groupId)) {
          groups.set(match.groupId, new Set());
        }
        if (match.player1Id) groups.get(match.groupId)!.add(match.player1Id);
        if (match.player2Id) groups.get(match.groupId)!.add(match.player2Id);
      }
    });

    // Convert to array of [groupId, Player[]]
    const result: [string, Player[]][] = [];
    Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([groupId, playerIds]) => {
        const groupPlayers = players.filter((p) => playerIds.has(p.id));
        result.push([groupId, groupPlayers]);
      });

    return result;
  }, [groupMatches, players]);

  // Group matches by group
  const matchesByGroup = useMemo(() => {
    const groups = new Map<string, Match[]>();
    groupMatches.forEach((match) => {
      if (match.groupId) {
        if (!groups.has(match.groupId)) {
          groups.set(match.groupId, []);
        }
        groups.get(match.groupId)!.push(match);
      }
    });
    return groups;
  }, [groupMatches]);

  const allGroupMatchesComplete = isGroupStageComplete(groupMatches);
  const canAdvance = allGroupMatchesComplete && !groupStageComplete;
  const advancePerGroup = formatConfig?.advancePerGroup || 2;

  const winnersMatches = knockoutMatches.filter((m) => m.bracket === 'winners');
  const losersMatches = knockoutMatches.filter((m) => m.bracket === 'losers');
  const grandFinalsMatches = knockoutMatches.filter((m) => m.bracket === 'grand-finals');

  const groupCompletionCount = groupMatches.filter((m) => m.winnerId).length;
  const totalGroupMatches = groupMatches.length;
  const groupProgressPercent = totalGroupMatches > 0 
    ? Math.round((groupCompletionCount / totalGroupMatches) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Group Stage Section */}
      {!groupStageComplete && (
        <>
          {/* Progress */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Group Stage</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {groupCompletionCount} / {totalGroupMatches} matches completed
                </p>
              </div>
              {canAdvance && onAdvanceToKnockout && (
                <Button onClick={onAdvanceToKnockout} variant="primary">
                  Advance to Knockout
                </Button>
              )}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-300"
                style={{ width: `${groupProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Groups */}
          <div className="grid gap-6 lg:grid-cols-2">
            {playersByGroup.map(([groupId, groupPlayers]) => {
              const groupMatchList = matchesByGroup.get(groupId) || [];
              const groupLabel = groupId.replace('group-', 'Group ').toUpperCase();

              return (
                <div
                  key={groupId}
                  className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <h3 className="font-semibold">{groupLabel}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Top {advancePerGroup} advance to knockout
                    </p>
                  </div>

                  {/* Group Standings */}
                  <StandingsTable
                    matches={groupMatchList}
                    players={groupPlayers}
                    groupId={groupId}
                    compact
                  />

                  {/* Group Matches */}
                  <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                    <h4 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Matches
                    </h4>
                    <div className="space-y-2">
                      {groupMatchList.map((match) => (
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
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Knockout Stage Section */}
      {groupStageComplete && knockoutMatches.length > 0 && (
        <div className="space-y-8">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <h3 className="font-semibold text-green-800 dark:text-green-300">
              Knockout Stage
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400">
              Group stage complete. Top players from each group have advanced.
            </p>
          </div>

          {/* Show groups summary (collapsed) */}
          <details className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <summary className="cursor-pointer px-4 py-3 font-medium">
              Group Stage Results
            </summary>
            <div className="grid gap-4 border-t border-gray-200 p-4 dark:border-gray-700 lg:grid-cols-2">
              {playersByGroup.map(([groupId, groupPlayers]) => {
                const groupMatchList = matchesByGroup.get(groupId) || [];
                const groupLabel = groupId.replace('group-', 'Group ').toUpperCase();

                return (
                  <StandingsTable
                    key={groupId}
                    matches={groupMatchList}
                    players={groupPlayers}
                    groupId={groupId}
                    title={groupLabel}
                    compact
                  />
                );
              })}
            </div>
          </details>

          {/* Bracket display */}
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
      )}
    </div>
  );
}
