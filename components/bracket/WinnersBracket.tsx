'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import type { Match, Player } from '@/types/tournament';
import { MatchCard } from '../match/MatchCard';
import { BracketConnector } from './BracketConnector';

interface WinnersBracketProps {
  matches: Match[];
  players: Player[];
  onMatchClick: (match: Match) => void;
  onOverrideClick?: (match: Match) => void;
  activeMatchId?: string;
  title?: string;
}

export function WinnersBracket({
  matches,
  players,
  onMatchClick,
  onOverrideClick,
  activeMatchId,
  title = 'Winners Bracket',
}: WinnersBracketProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [matchPositions, setMatchPositions] = useState<
    Map<string, { id: string; x: number; y: number; width: number; height: number }>
  >(new Map());

  const rounds = useMemo(() => {
    const maxRound = Math.max(...matches.map((m) => m.round), 0);
    return Array.from({ length: maxRound }, (_, i) => i + 1);
  }, [matches]);

  const matchesByRound = useMemo(() => {
    const grouped: Record<number, Match[]> = {};
    rounds.forEach((round) => {
      grouped[round] = matches
        .filter((m) => m.round === round)
        .sort((a, b) => a.position - b.position);
    });
    return grouped;
  }, [matches, rounds]);

  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newPositions = new Map<
        string,
        { id: string; x: number; y: number; width: number; height: number }
      >();

      matchRefs.current.forEach((element, matchId) => {
        const rect = element.getBoundingClientRect();
        newPositions.set(matchId, {
          id: matchId,
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        });
      });

      setMatchPositions(newPositions);
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    // Use requestAnimationFrame to ensure DOM is updated
    const timeoutId = setTimeout(updatePositions, 100);

    return () => {
      window.removeEventListener('resize', updatePositions);
      clearTimeout(timeoutId);
    };
  }, [matches]);

  const setMatchRef = (matchId: string, element: HTMLDivElement | null) => {
    if (element) {
      matchRefs.current.set(matchId, element);
    } else {
      matchRefs.current.delete(matchId);
    }
  };

  return (
    <div className="rounded-lg border-2 border-green-200 bg-green-50/50 p-6 dark:border-green-800 dark:bg-green-950/20">
      <h2 className="mb-6 text-2xl font-bold text-green-700 dark:text-green-300">
        {title}
      </h2>
      <div ref={containerRef} className="relative flex gap-8 overflow-x-auto pb-4">
        <BracketConnector
          matches={matches}
          matchPositions={matchPositions}
          color="rgb(34, 197, 94)"
        />
        {rounds.map((round) => (
          <div key={round} className="flex-shrink-0">
            <div className="mb-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
              Round {round}
            </div>
            <div className="space-y-4">
              {matchesByRound[round]?.map((match) => (
                <div
                  key={match.id}
                  ref={(el) => setMatchRef(match.id, el)}
                  className="relative z-10"
                >
                  <MatchCard
                    match={match}
                    players={players}
                    onScoreClick={() => onMatchClick(match)}
                    onOverrideClick={onOverrideClick ? () => onOverrideClick(match) : undefined}
                    isActive={activeMatchId === match.id}
                    compact
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
