'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import type { Match, Player } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  players: Player[];
  onScoreClick?: () => void;
  onOverrideClick?: () => void;
  isActive?: boolean;
  compact?: boolean;
}

export function MatchCard({
  match,
  players,
  onScoreClick,
  onOverrideClick,
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

  const getBracketLabel = () => {
    switch (match.bracket) {
      case 'winners': return 'Winners';
      case 'losers': return 'Losers';
      case 'grand-finals': return 'Grand Finals';
      case 'round-robin': return 'Round Robin';
      case 'swiss': return 'Swiss';
      case 'group': return 'Group';
      default: return '';
    }
  };

  return (
    <motion.div
      animate={controls}
      whileHover={(canPlay || canEdit) ? { scale: 1.02 } : {}}
      className={cn(
        'rounded-xl transition-all duration-200 shadow-lg cursor-pointer select-none',
        // Esports card styling
        'esports-card',
        'p-3',
        // Active state
        isActive && 'border-glow-animate ring-1 ring-[var(--neon-cyan)]',
        // Complete state
        isComplete && 'ring-1 ring-[var(--neon-green)]/30',
        // Interactive states
        (canPlay || canEdit) && 'hover:border-[var(--neon-cyan)]/50 hover:shadow-[0_0_20px_rgba(0,245,255,0.15)]',
        compact && 'p-2 text-sm'
      )}
      onClick={(canPlay || canEdit) ? onScoreClick : undefined}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide',
            match.bracket === 'winners' && 'bg-[var(--neon-green)]/20 text-[var(--neon-green)]',
            match.bracket === 'losers' && 'bg-[var(--neon-magenta)]/20 text-[var(--neon-magenta)]',
            match.bracket === 'grand-finals' && 'bg-[var(--neon-gold)]/20 text-[var(--neon-gold)]',
            (match.bracket === 'round-robin' || match.bracket === 'swiss' || match.bracket === 'group') && 
              'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]'
          )}>
            {getBracketLabel()}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            Round {match.round}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {match.isForfeited && (
            <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
              FF
            </span>
          )}
          {onOverrideClick && !isComplete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOverrideClick();
              }}
              className="rounded p-1 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--neon-cyan)] transition-colors cursor-pointer"
              title="Match override options"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Players */}
      <div className="space-y-1.5">
        {/* Player 1 */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{
            opacity: winner?.id === player1?.id ? 1 : isComplete ? 0.5 : 1,
          }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex items-center justify-between rounded-lg px-3 py-2',
            winner?.id === player1?.id
              ? 'bg-[var(--neon-green)]/15 border border-[var(--neon-green)]/30'
              : 'bg-white/5'
          )}
        >
          <span
            className={cn(
              'font-medium truncate max-w-[150px]',
              winner?.id === player1?.id && 'text-[var(--neon-green)]',
              !player1 && 'text-[var(--text-muted)] italic'
            )}
          >
            {getPlayerName(player1)}
          </span>
          {match.player1Score !== null && (
            <span className={cn(
              'score font-bold text-lg min-w-[28px] text-right',
              winner?.id === player1?.id && 'text-[var(--neon-green)]'
            )}>
              {match.player1Score}
            </span>
          )}
        </motion.div>

        {/* VS divider */}
        <div className="flex items-center justify-center">
          <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-widest">VS</span>
        </div>

        {/* Player 2 */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{
            opacity: winner?.id === player2?.id ? 1 : isComplete ? 0.5 : 1,
          }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex items-center justify-between rounded-lg px-3 py-2',
            winner?.id === player2?.id
              ? 'bg-[var(--neon-green)]/15 border border-[var(--neon-green)]/30'
              : 'bg-white/5'
          )}
        >
          <span
            className={cn(
              'font-medium truncate max-w-[150px]',
              winner?.id === player2?.id && 'text-[var(--neon-green)]',
              !player2 && 'text-[var(--text-muted)] italic'
            )}
          >
            {getPlayerName(player2)}
          </span>
          {match.player2Score !== null && (
            <span className={cn(
              'score font-bold text-lg min-w-[28px] text-right',
              winner?.id === player2?.id && 'text-[var(--neon-green)]'
            )}>
              {match.player2Score}
            </span>
          )}
        </motion.div>
      </div>

      {/* Action hints */}
      {canPlay && (
        <div className="mt-3 text-center text-xs text-[var(--neon-cyan)] font-medium">
          Click to enter score
        </div>
      )}
      {canEdit && (
        <div className="mt-3 flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
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
