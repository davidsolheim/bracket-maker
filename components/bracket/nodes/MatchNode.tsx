'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { Match, Player } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface MatchNodeData {
  match: Match;
  players: Player[];
  onMatchClick?: (match: Match) => void;
  onOverrideClick?: (match: Match) => void;
  activeMatchId?: string;
}

function MatchNodeComponent({ data, selected }: NodeProps & { data: MatchNodeData }) {
  const { match, players, onMatchClick, onOverrideClick, activeMatchId } = data;
  
  const player1 = players.find(p => p.id === match.player1Id);
  const player2 = players.find(p => p.id === match.player2Id);
  const winner = players.find(p => p.id === match.winnerId);
  
  const isComplete = match.winnerId !== null;
  const canPlay = player1 && player2 && !isComplete;
  const canEdit = player1 && player2 && isComplete;
  const isActive = match.id === activeMatchId;
  
  const getPlayerName = (player: Player | undefined) => {
    if (!player) return match.isBye ? 'Bye' : 'TBD';
    return player.name;
  };
  
  const getBracketLabel = () => {
    switch (match.bracket) {
      case 'winners': return 'W';
      case 'losers': return 'L';
      case 'grand-finals': return 'GF';
      case 'round-robin': return 'RR';
      case 'swiss': return 'S';
      case 'group': return 'G';
      default: return '';
    }
  };
  
  const handleClick = () => {
    if ((canPlay || canEdit) && onMatchClick) {
      onMatchClick(match);
    }
  };
  
  return (
    <>
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-[var(--neon-cyan)] !border-2 !border-[var(--bg-dark)]"
        id="left"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[var(--neon-cyan)] !border-2 !border-[var(--bg-dark)]"
        id="right"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-[var(--neon-magenta)] !border-2 !border-[var(--bg-dark)]"
        id="top"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-[var(--neon-magenta)] !border-2 !border-[var(--bg-dark)]"
        id="bottom"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={canPlay || canEdit ? { scale: 1.03 } : {}}
        onClick={handleClick}
        className={cn(
          'w-[200px] rounded-lg p-3 cursor-pointer select-none',
          'esports-card transition-all duration-200',
          isActive && 'border-glow-animate',
          isComplete && 'ring-1 ring-[var(--neon-green)]/30',
          selected && 'ring-2 ring-[var(--neon-cyan)]',
          (canPlay || canEdit) && 'hover:border-[var(--neon-cyan)]/50'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded',
              match.bracket === 'winners' && 'bg-[var(--neon-green)]/20 text-[var(--neon-green)]',
              match.bracket === 'losers' && 'bg-[var(--neon-magenta)]/20 text-[var(--neon-magenta)]',
              match.bracket === 'grand-finals' && 'bg-[var(--neon-gold)]/20 text-[var(--neon-gold)]',
              (match.bracket === 'round-robin' || match.bracket === 'swiss' || match.bracket === 'group') && 
                'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]'
            )}>
              {getBracketLabel()}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              R{match.round}
            </span>
          </div>
          
          {match.isForfeited && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
              FF
            </span>
          )}
          
          {onOverrideClick && !isComplete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOverrideClick(match);
              }}
              className="p-1 rounded hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--neon-cyan)] transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          )}
        </div>
        
        {/* Players */}
        <div className="space-y-1">
          {/* Player 1 */}
          <motion.div
            animate={{
              opacity: winner?.id === player1?.id ? 1 : isComplete ? 0.5 : 1,
            }}
            className={cn(
              'flex items-center justify-between rounded px-2 py-1.5',
              winner?.id === player1?.id
                ? 'bg-[var(--neon-green)]/15 border border-[var(--neon-green)]/30'
                : 'bg-white/5'
            )}
          >
            <span className={cn(
              'text-sm font-medium truncate max-w-[120px]',
              winner?.id === player1?.id && 'text-[var(--neon-green)]',
              !player1 && 'text-[var(--text-muted)] italic'
            )}>
              {getPlayerName(player1)}
            </span>
            {match.player1Score !== null && (
              <span className={cn(
                'score text-sm font-bold min-w-[24px] text-right',
                winner?.id === player1?.id && 'text-[var(--neon-green)]'
              )}>
                {match.player1Score}
              </span>
            )}
          </motion.div>
          
          {/* Player 2 */}
          <motion.div
            animate={{
              opacity: winner?.id === player2?.id ? 1 : isComplete ? 0.5 : 1,
            }}
            className={cn(
              'flex items-center justify-between rounded px-2 py-1.5',
              winner?.id === player2?.id
                ? 'bg-[var(--neon-green)]/15 border border-[var(--neon-green)]/30'
                : 'bg-white/5'
            )}
          >
            <span className={cn(
              'text-sm font-medium truncate max-w-[120px]',
              winner?.id === player2?.id && 'text-[var(--neon-green)]',
              !player2 && 'text-[var(--text-muted)] italic'
            )}>
              {getPlayerName(player2)}
            </span>
            {match.player2Score !== null && (
              <span className={cn(
                'score text-sm font-bold min-w-[24px] text-right',
                winner?.id === player2?.id && 'text-[var(--neon-green)]'
              )}>
                {match.player2Score}
              </span>
            )}
          </motion.div>
        </div>
        
        {/* Action hint */}
        {canPlay && (
          <div className="mt-2 text-center text-[10px] text-[var(--neon-cyan)] font-medium">
            Click to enter score
          </div>
        )}
        {canEdit && (
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[var(--text-muted)]">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Click to edit
          </div>
        )}
      </motion.div>
    </>
  );
}

export const MatchNode = memo(MatchNodeComponent);
