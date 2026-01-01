'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface PlayerListProps {
  players: Player[];
  onUpdate: (players: Player[]) => void;
  onRemove: (id: string) => void;
}

export function PlayerList({
  players,
  onUpdate,
  onRemove,
}: PlayerListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPlayers = [...players];
    const draggedPlayer = newPlayers[draggedIndex];
    newPlayers.splice(draggedIndex, 1);
    newPlayers.splice(dropIndex, 0, draggedPlayer);

    // Update seeds
    const updatedPlayers = newPlayers.map((p, idx) => ({
      ...p,
      seed: idx + 1,
    }));

    onUpdate(updatedPlayers);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-2">
      {players.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No players added yet
        </p>
      ) : (
        players.map((player, index) => (
          <motion.div
            key={player.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            whileHover={{ scale: 1.02 }}
            whileDrag={{ opacity: 0.5 }}
            className={cn(
              'flex items-center justify-between rounded-lg border-2 p-3',
              'bg-white dark:bg-gray-800',
              draggedIndex === index
                ? 'border-green-500 opacity-50'
                : dragOverIndex === index
                  ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
                  : 'border-gray-200 dark:border-gray-700',
              'cursor-move transition-all'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  'bg-green-100 font-bold text-green-700',
                  'dark:bg-green-900/30 dark:text-green-300'
                )}
              >
                {player.seed}
              </div>
              <span className="font-medium">{player.name}</span>
            </div>
            <button
              onClick={() => onRemove(player.id)}
              className={cn(
                'cursor-pointer rounded px-3 py-1 text-sm font-medium',
                'text-red-600 hover:bg-red-50',
                'dark:text-red-400 dark:hover:bg-red-950/20'
              )}
            >
              Remove
            </button>
          </motion.div>
        ))
      )}
    </div>
  );
}
