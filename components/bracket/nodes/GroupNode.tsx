'use client';

import { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { Match, Player } from '@/types/tournament';
import { cn } from '@/lib/utils';
import { calculateStandings } from '@/lib/standings';

interface GroupNodeData {
  groupId: string;
  groupMatches: Match[];
  players: Player[];
  onMatchClick?: (match: Match) => void;
  activeMatchId?: string;
}

function GroupNodeComponent({ data }: NodeProps & { data: GroupNodeData }) {
  const { groupId, groupMatches, players, onMatchClick, activeMatchId } = data;
  
  const standings = useMemo(() => {
    return calculateStandings(groupMatches, players);
  }, [groupMatches, players]);
  
  const groupLabel = groupId.replace('group-', 'Group ').toUpperCase();
  const completedMatches = groupMatches.filter(m => m.winnerId).length;
  const totalMatches = groupMatches.length;
  const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;
  
  return (
    <>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[var(--neon-cyan)] !border-2 !border-[var(--bg-dark)]"
        id="right"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'w-[300px] rounded-xl overflow-hidden',
          'esports-card'
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-[var(--neon-cyan)]/10 to-transparent border-b border-[var(--border-dim)]">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[var(--neon-cyan)] heading">{groupLabel}</h3>
            <span className="text-xs text-[var(--text-muted)]">
              {completedMatches}/{totalMatches}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-[var(--bg-darker)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-green)]"
            />
          </div>
        </div>
        
        {/* Standings table */}
        <div className="p-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--text-muted)]">
                <th className="text-left py-1">#</th>
                <th className="text-left py-1">Player</th>
                <th className="text-center py-1">W</th>
                <th className="text-center py-1">L</th>
                <th className="text-center py-1">+/-</th>
              </tr>
            </thead>
            <tbody>
              {standings.slice(0, 6).map((standing, index) => (
                <motion.tr
                  key={standing.playerId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'border-t border-[var(--border-dim)]',
                    index < 2 && 'bg-[var(--neon-green)]/5'
                  )}
                >
                  <td className={cn(
                    'py-1.5 font-bold',
                    index < 2 ? 'text-[var(--neon-green)]' : 'text-[var(--text-muted)]'
                  )}>
                    {index + 1}
                  </td>
                  <td className="py-1.5 font-medium truncate max-w-[120px]">
                    {standing.playerName}
                  </td>
                  <td className="py-1.5 text-center text-[var(--neon-green)]">{standing.wins}</td>
                  <td className="py-1.5 text-center text-[var(--neon-magenta)]">{standing.losses}</td>
                  <td className={cn(
                    'py-1.5 text-center font-mono',
                    standing.pointDifferential > 0 && 'text-[var(--neon-green)]',
                    standing.pointDifferential < 0 && 'text-[var(--neon-magenta)]'
                  )}>
                    {standing.pointDifferential > 0 ? '+' : ''}{standing.pointDifferential}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Matches preview */}
        <div className="px-3 pb-3">
          <div className="text-[10px] text-[var(--text-muted)] mb-2 font-medium">RECENT MATCHES</div>
          <div className="space-y-1 max-h-[120px] overflow-y-auto">
            {groupMatches.slice(0, 4).map((match) => {
              const p1 = players.find(p => p.id === match.player1Id);
              const p2 = players.find(p => p.id === match.player2Id);
              const isActive = match.id === activeMatchId;
              
              return (
                <motion.div
                  key={match.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onMatchClick?.(match)}
                  className={cn(
                    'flex items-center justify-between px-2 py-1.5 rounded cursor-pointer',
                    'bg-white/5 hover:bg-white/10 transition-colors',
                    isActive && 'ring-1 ring-[var(--neon-cyan)]'
                  )}
                >
                  <div className="flex items-center gap-2 text-xs flex-1 min-w-0">
                    <span className={cn(
                      'truncate',
                      match.winnerId === p1?.id && 'text-[var(--neon-green)] font-medium'
                    )}>
                      {p1?.name || 'TBD'}
                    </span>
                    <span className="text-[var(--text-muted)]">vs</span>
                    <span className={cn(
                      'truncate',
                      match.winnerId === p2?.id && 'text-[var(--neon-green)] font-medium'
                    )}>
                      {p2?.name || 'TBD'}
                    </span>
                  </div>
                  {match.winnerId && (
                    <span className="text-xs font-mono text-[var(--text-secondary)]">
                      {match.player1Score}-{match.player2Score}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
}

export const GroupNode = memo(GroupNodeComponent);
