'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import type { Match, Player } from '@/types/tournament';
import { MatchCard } from '../match/MatchCard';
import { BracketConnector } from './BracketConnector';

interface GrandFinalsProps {
  matches: Match[];
  players: Player[];
  onMatchClick: (match: Match) => void;
  activeMatchId?: string;
}

export function GrandFinals({
  matches,
  players,
  onMatchClick,
  activeMatchId,
}: GrandFinalsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [matchPositions, setMatchPositions] = useState<
    Map<string, { id: string; x: number; y: number; width: number; height: number }>
  >(new Map());

  const sortedMatches = useMemo(
    () => matches.sort((a, b) => a.round - b.round),
    [matches]
  );

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

  if (sortedMatches.length === 0) return null;

  return (
    <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50/50 p-6 dark:border-yellow-800 dark:bg-yellow-950/20">
      <h2 className="mb-6 text-2xl font-bold text-yellow-700 dark:text-yellow-300">
        Grand Finals
      </h2>
      <div ref={containerRef} className="relative flex justify-center gap-8">
        <BracketConnector
          matches={matches}
          matchPositions={matchPositions}
          color="rgb(234, 179, 8)"
        />
        {sortedMatches.map((match) => (
          <div
            key={match.id}
            ref={(el) => setMatchRef(match.id, el)}
            className="relative z-10 flex-shrink-0"
          >
            <div className="mb-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
              {match.round === 1 ? 'First Match' : 'Bracket Reset'}
            </div>
            <MatchCard
              match={match}
              players={players}
              onScoreClick={() => onMatchClick(match)}
              isActive={activeMatchId === match.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
