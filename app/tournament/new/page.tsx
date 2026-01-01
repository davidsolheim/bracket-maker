'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useTournament } from '@/contexts/TournamentContext';
import { PlayerForm } from '@/components/player/PlayerForm';
import { PlayerList } from '@/components/player/PlayerList';
import { Button } from '@/components/ui/Button';
import type { Player } from '@/types/tournament';
import { cn } from '@/lib/utils';
import { loadPlayerLists, savePlayerList } from '@/lib/storage';
import type { PlayerList as SavedPlayerList } from '@/types/tournament';

export default function NewTournamentPage() {
  const router = useRouter();
  const { createTournament, startTournament } = useTournament();
  const [name, setName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [savedPlayerLists, setSavedPlayerLists] = useState<SavedPlayerList[]>([]);
  const [showSaveListModal, setShowSaveListModal] = useState(false);
  const [listNameToSave, setListNameToSave] = useState('');

  const handleAddPlayer = (player: Player) => {
    const updatedPlayers = [...players, { ...player, seed: players.length + 1 }];
    setPlayers(updatedPlayers);
  };

  const handleUpdatePlayers = (updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
  };

  const handleRemovePlayer = (id: string) => {
    const updatedPlayers = players
      .filter((p) => p.id !== id)
      .map((p, index) => ({ ...p, seed: index + 1 }));
    setPlayers(updatedPlayers);
  };

  const handleShuffle = () => {
    if (players.length < 2) {
      toast.error('Need at least 2 players to shuffle');
      return;
    }
    const shuffled = [...players]
      .sort(() => Math.random() - 0.5)
      .map((p, index) => ({ ...p, seed: index + 1 }));
    setPlayers(shuffled);
    toast.success('Players shuffled!');
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Please enter a tournament name');
      return;
    }
    if (players.length < 2) {
      toast.error('Please add at least 2 players');
      return;
    }

    const tournament = createTournament(name.trim(), players);
    router.push(`/tournament/${tournament.id}`);
  };

  const handleCreateAndStart = () => {
    if (!name.trim()) {
      toast.error('Please enter a tournament name');
      return;
    }
    if (players.length < 2) {
      toast.error('Please add at least 2 players');
      return;
    }

    const tournament = createTournament(name.trim(), players);
    startTournament(tournament.id);
    router.push(`/tournament/${tournament.id}`);
  };

  useEffect(() => {
    setSavedPlayerLists(loadPlayerLists());
  }, []);

  const handleLoadPlayerList = (listId: string) => {
    const list = savedPlayerLists.find((l) => l.id === listId);
    if (list) {
      const loadedPlayers: Player[] = list.players.map((p, idx) => ({
        id: uuidv4(),
        name: p.name,
        seed: idx + 1,
      }));
      setPlayers(loadedPlayers);
    }
  };

  const handleSaveAsList = () => {
    if (players.length === 0) {
      toast.error('Please add at least one player before saving');
      return;
    }
    setShowSaveListModal(true);
    setListNameToSave('');
  };

  const handleConfirmSaveList = () => {
    if (!listNameToSave.trim()) {
      toast.error('Please enter a list name');
      return;
    }

    const now = new Date();
    const playerList: SavedPlayerList = {
      id: uuidv4(),
      name: listNameToSave.trim(),
      players: players.map((p) => ({ name: p.name })),
      createdAt: now,
      updatedAt: now,
    };

    savePlayerList(playerList);
    setSavedPlayerLists(loadPlayerLists());
    setShowSaveListModal(false);
    setListNameToSave('');
    toast.success('Player list saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">Create New Tournament</h1>

        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <label className="mb-2 block text-sm font-medium">
            Tournament Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter tournament name"
            className={cn(
              'w-full rounded border border-gray-300 px-4 py-2',
              'dark:border-gray-600 dark:bg-gray-700'
            )}
          />
        </div>

        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Players</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Add players and drag to reorder for seeding
              </p>
            </div>
            <div className="flex items-center gap-2">
              {players.length >= 2 && (
                <Button
                  onClick={handleShuffle}
                  variant="secondary"
                  size="sm"
                  title="Randomize player order"
                >
                  <svg
                    className="mr-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Shuffle
                </Button>
              )}
              {savedPlayerLists.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleLoadPlayerList(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className={cn(
                    'rounded border border-gray-300 px-3 py-2 text-sm',
                    'dark:border-gray-600 dark:bg-gray-700'
                  )}
                  defaultValue=""
                >
                  <option value="">Load saved list...</option>
                  {savedPlayerLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.players.length} players)
                    </option>
                  ))}
                </select>
              )}
              {players.length > 0 && (
                <button
                  onClick={handleSaveAsList}
                  className={cn(
                    'rounded px-4 py-2 text-sm font-medium',
                    'border border-gray-300 bg-white hover:bg-gray-50',
                    'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
                  )}
                >
                  Save as List
                </button>
              )}
            </div>
          </div>
          <PlayerForm onAdd={handleAddPlayer} />
          <div className="mt-6">
            <PlayerList
              players={players}
              onUpdate={handleUpdatePlayers}
              onRemove={handleRemovePlayer}
            />
          </div>
        </div>

        {showSaveListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-xl font-bold">Save Player List</h3>
              <label className="mb-2 block text-sm font-medium">
                List Name
              </label>
              <input
                type="text"
                value={listNameToSave}
                onChange={(e) => setListNameToSave(e.target.value)}
                placeholder="Enter list name"
                className={cn(
                  'mb-4 w-full rounded border border-gray-300 px-4 py-2',
                  'dark:border-gray-600 dark:bg-gray-700'
                )}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmSaveList();
                  } else if (e.key === 'Escape') {
                    setShowSaveListModal(false);
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmSaveList}
                  className={cn(
                    'rounded px-4 py-2 font-medium text-white',
                    'bg-green-600 hover:bg-green-700',
                    'dark:bg-green-700 dark:hover:bg-green-600'
                  )}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveListModal(false)}
                  className={cn(
                    'rounded px-4 py-2 font-medium',
                    'border border-gray-300 bg-white hover:bg-gray-50',
                    'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
                  )}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleCreate}
            className={cn(
              'rounded-lg px-6 py-3 font-medium',
              'border-2 border-gray-300 bg-white hover:bg-gray-50',
              'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
            )}
          >
            Save Draft
          </button>
          <button
            onClick={handleCreateAndStart}
            className={cn(
              'rounded-lg px-6 py-3 font-medium text-white',
              'bg-green-600 hover:bg-green-700',
              'dark:bg-green-700 dark:hover:bg-green-600'
            )}
          >
            Create & Start Tournament
          </button>
        </div>
      </main>
    </div>
  );
}
