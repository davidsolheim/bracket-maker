'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Player } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface PlayerFormProps {
  onAdd: (player: Player) => void;
}

export function PlayerForm({ onAdd }: PlayerFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const player: Player = {
      id: uuidv4(),
      name: name.trim(),
      seed: 0, // Will be set by PlayerList
    };

    onAdd(player);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter player name"
        className={cn(
          'flex-1 rounded border border-gray-300 px-4 py-2',
          'dark:border-gray-600 dark:bg-gray-700'
        )}
      />
      <button
        type="submit"
        className={cn(
          'rounded px-6 py-2 font-medium text-white',
          'bg-green-600 hover:bg-green-700',
          'dark:bg-green-700 dark:hover:bg-green-600'
        )}
      >
        Add
      </button>
    </form>
  );
}
