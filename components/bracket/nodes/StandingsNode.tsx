'use client';

import { memo, useMemo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { Match, Player } from '@/types/tournament';
import { cn } from '@/lib/utils';
import { calculateStandings } from '@/lib/standings';

interface StandingsNodeData {
  players: Player[];
  matches: Match[];
  title?: string;
  highlightQualified?: boolean;
  winsToQualify?: number;
}

function StandingsNodeComponent({ data }: NodeProps & { data: StandingsNodeData }) {
  const { 
    players, 
    matches, 
    title = 'Standings',
    highlightQualified = false,
    winsToQualify = 3,
  } = data;
  
  const standings = useMemo(() => {
    return calculateStandings(matches, players);
  }, [matches, players]);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'w-[320px] rounded-xl overflow-hidden',
        'esports-card'
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[var(--neon-magenta)]/10 to-transparent border-b border-[var(--border-dim)]">
        <h3 className="font-bold text-[var(--neon-magenta)] heading">{title}</h3>
      </div>
      
      {/* Standings table */}
      <div className="p-3 max-h-[350px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[var(--bg-card)]">
            <tr className="text-[var(--text-muted)]">
              <th className="text-left py-2">#</th>
              <th className="text-left py-2">Player</th>
              <th className="text-center py-2">W</th>
              <th className="text-center py-2">L</th>
              <th className="text-center py-2">PF</th>
              <th className="text-center py-2">PA</th>
              <th className="text-center py-2">+/-</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => {
              const isQualified = highlightQualified && standing.wins >= winsToQualify;
              
              return (
                <motion.tr
                  key={standing.playerId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    'border-t border-[var(--border-dim)]',
                    isQualified && 'bg-[var(--neon-green)]/10'
                  )}
                >
                  <td className={cn(
                    'py-2 font-bold',
                    isQualified ? 'text-[var(--neon-green)]' : 'text-[var(--text-muted)]'
                  )}>
                    {index + 1}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate max-w-[100px]">
                        {standing.playerName}
                      </span>
                      {isQualified && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-[var(--neon-green)]/20 text-[var(--neon-green)] font-bold">
                          Q
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 text-center text-[var(--neon-green)] font-medium">
                    {standing.wins}
                  </td>
                  <td className="py-2 text-center text-[var(--neon-magenta)] font-medium">
                    {standing.losses}
                  </td>
                  <td className="py-2 text-center text-[var(--text-secondary)] font-mono">
                    {standing.pointsFor}
                  </td>
                  <td className="py-2 text-center text-[var(--text-secondary)] font-mono">
                    {standing.pointsAgainst}
                  </td>
                  <td className={cn(
                    'py-2 text-center font-mono font-medium',
                    standing.pointDifferential > 0 && 'text-[var(--neon-green)]',
                    standing.pointDifferential < 0 && 'text-[var(--neon-magenta)]',
                    standing.pointDifferential === 0 && 'text-[var(--text-muted)]'
                  )}>
                    {standing.pointDifferential > 0 ? '+' : ''}{standing.pointDifferential}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      {highlightQualified && (
        <div className="px-4 py-2 border-t border-[var(--border-dim)] text-[10px] text-[var(--text-muted)]">
          <span className="text-[var(--neon-green)]">●</span> Qualified ({winsToQualify}+ wins)
        </div>
      )}
    </motion.div>
  );
}

export const StandingsNode = memo(StandingsNodeComponent);
