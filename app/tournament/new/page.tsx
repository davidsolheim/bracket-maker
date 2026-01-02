'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useTournament } from '@/contexts/TournamentContext';
import { PlayerForm } from '@/components/player/PlayerForm';
import { PlayerList } from '@/components/player/PlayerList';
import { Button } from '@/components/ui/Button';
import type { Player, TournamentFormat, TournamentFormatConfig } from '@/types/tournament';
import { cn } from '@/lib/utils';
import { loadPlayerLists, savePlayerList } from '@/lib/storage';
import type { PlayerList as SavedPlayerList } from '@/types/tournament';

const FORMAT_OPTIONS: { value: TournamentFormat; label: string; description: string }[] = [
  {
    value: 'single-elimination',
    label: 'Single Elimination',
    description: 'One loss and you\'re out. Fast and simple.',
  },
  {
    value: 'double-elimination',
    label: 'Double Elimination',
    description: 'Two losses to be eliminated. Includes losers bracket.',
  },
  {
    value: 'round-robin',
    label: 'Round Robin',
    description: 'Everyone plays everyone. Best for smaller groups.',
  },
  {
    value: 'swiss',
    label: 'Swiss System',
    description: 'Players matched by similar records each round.',
  },
  {
    value: 'group-knockout',
    label: 'Group Stage + Knockout',
    description: 'Pool play followed by elimination bracket.',
  },
];

export default function NewTournamentPage() {
  const router = useRouter();
  const { createTournament, startTournament } = useTournament();
  const [name, setName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [format, setFormat] = useState<TournamentFormat>('double-elimination');
  const [formatConfig, setFormatConfig] = useState<TournamentFormatConfig>({});
  const [swissMode, setSwissMode] = useState<'fixed' | 'qualification'>('fixed');
  const [savedPlayerLists, setSavedPlayerLists] = useState<SavedPlayerList[]>([]);
  const [showSaveListModal, setShowSaveListModal] = useState(false);
  const [listNameToSave, setListNameToSave] = useState('');

  // Calculate default config values based on player count
  const defaultSwissRounds = Math.max(3, Math.ceil(Math.log2(players.length || 8)));
  const defaultGroupCount = Math.min(4, Math.max(2, Math.floor(players.length / 3)));

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

  const getMinPlayers = (): number => {
    switch (format) {
      case 'group-knockout':
        return 4;
      default:
        return 2;
    }
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Please enter a tournament name');
      return;
    }
    const minPlayers = getMinPlayers();
    if (players.length < minPlayers) {
      toast.error(`Please add at least ${minPlayers} players for this format`);
      return;
    }

    // Validate Swiss qualification mode
    if (format === 'swiss' && swissMode === 'qualification') {
      const qualifyingPlayers = formatConfig.qualifyingPlayers || 8;
      if (qualifyingPlayers > players.length) {
        toast.error(`Cannot have ${qualifyingPlayers} qualifiers with only ${players.length} players`);
        return;
      }
    }

    const config = buildFormatConfig();
    const tournament = createTournament(name.trim(), players, format, config);
    router.push(`/tournament/${tournament.id}`);
  };

  const handleCreateAndStart = () => {
    if (!name.trim()) {
      toast.error('Please enter a tournament name');
      return;
    }
    const minPlayers = getMinPlayers();
    if (players.length < minPlayers) {
      toast.error(`Please add at least ${minPlayers} players for this format`);
      return;
    }

    // Validate Swiss qualification mode
    if (format === 'swiss' && swissMode === 'qualification') {
      const qualifyingPlayers = formatConfig.qualifyingPlayers || 8;
      if (qualifyingPlayers > players.length) {
        toast.error(`Cannot have ${qualifyingPlayers} qualifiers with only ${players.length} players`);
        return;
      }
    }

    const config = buildFormatConfig();
    const tournament = createTournament(name.trim(), players, format, config);
    startTournament(tournament.id);
    router.push(`/tournament/${tournament.id}`);
  };

  const buildFormatConfig = (): TournamentFormatConfig | undefined => {
    switch (format) {
      case 'swiss':
        if (swissMode === 'qualification') {
          return {
            winsToQualify: formatConfig.winsToQualify || 3,
            qualifyingPlayers: formatConfig.qualifyingPlayers || 8,
          };
        } else {
          return {
            numberOfRounds: formatConfig.numberOfRounds || defaultSwissRounds,
          };
        }
      case 'group-knockout':
        return {
          groupCount: formatConfig.groupCount || defaultGroupCount,
          advancePerGroup: formatConfig.advancePerGroup || 2,
          knockoutFormat: formatConfig.knockoutFormat || 'single-elimination',
        };
      default:
        return undefined;
    }
  };

  useEffect(() => {
    setSavedPlayerLists(loadPlayerLists());
  }, []);

  // Clear format config when switching Swiss modes
  useEffect(() => {
    if (format === 'swiss') {
      setFormatConfig(prev => {
        if (swissMode === 'qualification') {
          // Clear fixed rounds config
          const { numberOfRounds, ...rest } = prev;
          return rest;
        } else {
          // Clear qualification config
          const { winsToQualify, qualifyingPlayers, ...rest } = prev;
          return rest;
        }
      });
    }
  }, [format, swissMode]);

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

        {/* Format Selector */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-bold">Tournament Format</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFormat(option.value)}
                className={cn(
                  'rounded-lg border-2 p-4 text-left transition-all',
                  format === option.value
                    ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                )}
              >
                <div className="font-semibold">{option.label}</div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {option.description}
                </div>
              </button>
            ))}
          </div>

          {/* Format-specific options */}
          {format === 'swiss' && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
              <h3 className="mb-4 font-medium">Swiss Tournament Mode</h3>

              {/* Mode selector */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">
                  Tournament Style
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSwissMode('fixed')}
                    className={cn(
                      'rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                      swissMode === 'fixed'
                        ? 'border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-900/20 dark:text-green-300'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                    )}
                  >
                    Fixed Rounds
                  </button>
                  <button
                    onClick={() => setSwissMode('qualification')}
                    className={cn(
                      'rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                      swissMode === 'qualification'
                        ? 'border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-900/20 dark:text-green-300'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                    )}
                  >
                    Qualification Mode
                  </button>
                </div>
              </div>

              {swissMode === 'fixed' && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Number of Rounds
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={formatConfig.numberOfRounds || defaultSwissRounds}
                    onChange={(e) =>
                      setFormatConfig({
                        ...formatConfig,
                        numberOfRounds: parseInt(e.target.value) || defaultSwissRounds,
                      })
                    }
                    className={cn(
                      'w-32 rounded border border-gray-300 px-3 py-2',
                      'dark:border-gray-600 dark:bg-gray-700'
                    )}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Recommended: {defaultSwissRounds} rounds for {players.length || '?'} players
                  </p>
                </div>
              )}

              {swissMode === 'qualification' && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Wins to Qualify
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={10}
                      value={formatConfig.winsToQualify || 3}
                      onChange={(e) =>
                        setFormatConfig({
                          ...formatConfig,
                          winsToQualify: parseInt(e.target.value) || 3,
                        })
                      }
                      className={cn(
                        'w-32 rounded border border-gray-300 px-3 py-2',
                        'dark:border-gray-600 dark:bg-gray-700'
                      )}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Players need this many wins to qualify for knockout
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Number of Qualifiers
                    </label>
                    <select
                      value={formatConfig.qualifyingPlayers || 8}
                      onChange={(e) =>
                        setFormatConfig({
                          ...formatConfig,
                          qualifyingPlayers: parseInt(e.target.value),
                        })
                      }
                      className={cn(
                        'w-32 rounded border border-gray-300 px-3 py-2',
                        'dark:border-gray-600 dark:bg-gray-700'
                      )}
                    >
                      <option value={4}>4</option>
                      <option value={8}>8</option>
                      <option value={12}>12</option>
                      <option value={16}>16</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Must be divisible by 4 for knockout bracket
                      {players.length > 0 && formatConfig.qualifyingPlayers && formatConfig.qualifyingPlayers > players.length && (
                        <span className="text-red-600 dark:text-red-400">
                          {' '}• Too many qualifiers for {players.length} players
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Qualification Mode:</strong> Rounds continue until {formatConfig.qualifyingPlayers || 8} players
                      have won {formatConfig.winsToQualify || 3} matches, then qualified players advance to single elimination.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {format === 'group-knockout' && (
            <div className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Number of Groups
                </label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={formatConfig.groupCount || defaultGroupCount}
                  onChange={(e) =>
                    setFormatConfig({
                      ...formatConfig,
                      groupCount: parseInt(e.target.value) || defaultGroupCount,
                    })
                  }
                  className={cn(
                    'w-32 rounded border border-gray-300 px-3 py-2',
                    'dark:border-gray-600 dark:bg-gray-700'
                  )}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Players Advancing Per Group
                </label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={formatConfig.advancePerGroup || 2}
                  onChange={(e) =>
                    setFormatConfig({
                      ...formatConfig,
                      advancePerGroup: parseInt(e.target.value) || 2,
                    })
                  }
                  className={cn(
                    'w-32 rounded border border-gray-300 px-3 py-2',
                    'dark:border-gray-600 dark:bg-gray-700'
                  )}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Knockout Format
                </label>
                <select
                  value={formatConfig.knockoutFormat || 'single-elimination'}
                  onChange={(e) =>
                    setFormatConfig({
                      ...formatConfig,
                      knockoutFormat: e.target.value as 'single-elimination' | 'double-elimination',
                    })
                  }
                  className={cn(
                    'rounded border border-gray-300 px-3 py-2',
                    'dark:border-gray-600 dark:bg-gray-700'
                  )}
                >
                  <option value="single-elimination">Single Elimination</option>
                  <option value="double-elimination">Double Elimination</option>
                </select>
              </div>
            </div>
          )}
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
