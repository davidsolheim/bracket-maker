'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Match } from '@/types/tournament';

interface MatchPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BracketConnectorProps {
  matches: Match[];
  matchPositions: Map<string, MatchPosition>;
  color?: string;
}

export function BracketConnector({
  matches,
  matchPositions,
  color = 'currentColor',
}: BracketConnectorProps) {
  const [paths, setPaths] = useState<Array<{ d: string; from: string; to: string }>>([]);

  useEffect(() => {
    const newPaths: Array<{ d: string; from: string; to: string }> = [];

    for (const match of matches) {
      const fromPos = matchPositions.get(match.id);
      if (!fromPos) continue;

      // Draw line to next match (winner advances)
      if (match.nextMatchId) {
        const toPos = matchPositions.get(match.nextMatchId);
        if (toPos) {
          const startX = fromPos.x + fromPos.width;
          const startY = fromPos.y + fromPos.height / 2;
          const endX = toPos.x;
          const endY = toPos.y + toPos.height / 2;

          // Bezier curve: horizontal line with slight curve
          const controlX1 = startX + (endX - startX) * 0.5;
          const controlX2 = startX + (endX - startX) * 0.5;
          const d = `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;

          newPaths.push({ d, from: match.id, to: match.nextMatchId });
        }
      }

      // Draw line to losers bracket (loser advances)
      if (match.loserNextMatchId && match.bracket === 'winners') {
        const toPos = matchPositions.get(match.loserNextMatchId);
        if (toPos) {
          const startX = fromPos.x + fromPos.width / 2;
          const startY = fromPos.y + fromPos.height;
          const endX = toPos.x + toPos.width / 2;
          const endY = toPos.y;

          // Diagonal line for losers bracket
          const controlX = (startX + endX) / 2;
          const controlY = startY + (endY - startY) * 0.3;
          const d = `M ${startX} ${startY} Q ${controlX} ${controlY}, ${endX} ${endY}`;

          newPaths.push({ d, from: match.id, to: match.loserNextMatchId });
        }
      }
    }

    setPaths(newPaths);
  }, [matches, matchPositions]);

  if (paths.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3, 0 6"
            fill={color}
            className="opacity-50"
          />
        </marker>
      </defs>
      {paths.map((path, index) => {
        const match = matches.find((m) => m.id === path.from);
        const isComplete = match?.winnerId !== null;
        
        return (
          <motion.path
            key={`${path.from}-${path.to}-${index}`}
            d={path.d}
            stroke={color}
            strokeWidth="2"
            fill="none"
            className={isComplete ? 'opacity-60' : 'opacity-40'}
            markerEnd="url(#arrowhead)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: isComplete ? 1 : 0.3 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          />
        );
      })}
    </svg>
  );
}
