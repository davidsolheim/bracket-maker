'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { Player } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface ChampionNodeData {
  player: Player;
  players: Player[];
  isChampion: boolean;
}

function ChampionNodeComponent({ data }: NodeProps & { data: ChampionNodeData }) {
  const { player } = data;
  
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-[var(--neon-gold)] !border-2 !border-[var(--bg-dark)]"
        id="left"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
        className={cn(
          'w-[260px] rounded-xl p-6 text-center',
          'bg-gradient-to-br from-[var(--neon-gold)]/20 via-[var(--bg-card)] to-[var(--neon-orange)]/10',
          'border-2 border-[var(--neon-gold)]/50',
          'champion-glow'
        )}
      >
        {/* Trophy */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="text-6xl mb-3 trophy-animate"
        >
          🏆
        </motion.div>
        
        {/* Title */}
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-lg font-bold text-[var(--neon-gold)] text-glow-gold mb-1 heading"
        >
          CHAMPION
        </motion.h3>
        
        {/* Player name */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-2xl font-bold text-white heading"
        >
          {player.name}
        </motion.p>
        
        {/* Stats */}
        {(player.wins !== undefined || player.losses !== undefined) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-3 flex items-center justify-center gap-4 text-sm"
          >
            {player.wins !== undefined && (
              <span className="text-[var(--neon-green)]">
                <span className="font-bold">{player.wins}</span>
                <span className="text-[var(--text-muted)] ml-1">W</span>
              </span>
            )}
            {player.losses !== undefined && (
              <span className="text-[var(--neon-magenta)]">
                <span className="font-bold">{player.losses}</span>
                <span className="text-[var(--text-muted)] ml-1">L</span>
              </span>
            )}
          </motion.div>
        )}
        
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {/* Shimmer effect */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
          />
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[var(--neon-gold)] rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--neon-gold)] rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--neon-gold)] rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[var(--neon-gold)] rounded-br-xl" />
        </div>
      </motion.div>
    </>
  );
}

export const ChampionNode = memo(ChampionNodeComponent);
