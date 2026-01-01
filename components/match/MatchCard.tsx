'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import type { Match, Player } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  players: Player[];
  onScoreClick?: () => void;
  isActive?: boolean;
  compact?: boolean;
}

export function MatchCard({
  match,
  players,
  onScoreClick,
  isActive = false,
  compact = false,
}: MatchCardProps) {
  const player1 = players.find((p) => p.id === match.player1Id);
  const player2 = players.find((p) => p.id === match.player2Id);
  const winner = players.find((p) => p.id === match.winnerId);

  const getPlayerName = (player: Player | undefined) => {
    if (!player) return match.isBye ? 'Bye' : 'TBD';
    return player.name;
  };

  const isComplete = match.winnerId !== null;
  const canPlay = player1 && player2 && !isComplete;
  const canEdit = player1 && player2 && isComplete && onScoreClick;
  const controls = useAnimation();

  useEffect(() => {
    if (isComplete && winner) {
      // Pulse animation when match completes
      controls.start({
        scale: [1, 1.02, 1],
        transition: { duration: 0.5, times: [0, 0.5, 1] },
      });
    }
  }, [isComplete, winner, controls]);

  return (
    <motion.div
      animate={controls}
      whileHover={(canPlay || canEdit) ? { scale: 1.02 } : {}}
      className={cn(
        'rounded-lg border-2 p-3 transition-all shadow-sm',
        isActive
          ? 'border-green-500 bg-green-50 shadow-md dark:bg-green-950/20'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
        (canPlay || canEdit) && 'cursor-pointer hover:border-green-400 hover:shadow-md',
        isComplete && 'ring-2 ring-green-500/20',
        compact && 'p-2 text-sm'
      )}
      onClick={(canPlay || canEdit) ? onScoreClick : undefined}
    >
      <div className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
        {match.bracket === 'winners' && 'Winners'}
        {match.bracket === 'losers' && 'Losers'}
        {match.bracket === 'grand-finals' && 'Grand Finals'} - Round{' '}
        {match.round}
      </div>

      <div className="space-y-1">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{
            opacity: winner?.id === player1?.id ? 1 : isComplete ? 0.6 : 1,
          }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex items-center justify-between rounded px-2 py-1',
            winner?.id === player1?.id
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-gray-50 dark:bg-gray-700/50'
          )}
        >
          <span
            className={cn(
              'font-medium',
              winner?.id === player1?.id && 'text-green-700 dark:text-green-300'
            )}
          >
            {getPlayerName(player1)}
          </span>
          {match.player1Score !== null && (
            <span className="score font-bold">{match.player1Score}</span>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 1 }}
          animate={{
            opacity: winner?.id === player2?.id ? 1 : isComplete ? 0.6 : 1,
          }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex items-center justify-between rounded px-2 py-1',
            winner?.id === player2?.id
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-gray-50 dark:bg-gray-700/50'
          )}
        >
          <span
            className={cn(
              'font-medium',
              winner?.id === player2?.id && 'text-green-700 dark:text-green-300'
            )}
          >
            {getPlayerName(player2)}
          </span>
          {match.player2Score !== null && (
            <span className="score font-bold">{match.player2Score}</span>
          )}
        </motion.div>
      </div>

      {canPlay && (
        <div className="mt-2 text-center text-xs text-green-600 dark:text-green-400">
          Click to enter score
        </div>
      )}
      {canEdit && (
        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Click to edit score
        </div>
      )}
    </motion.div>
  );
}
