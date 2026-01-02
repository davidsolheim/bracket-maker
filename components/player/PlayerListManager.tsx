'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import type { PlayerList } from '@/types/tournament';
import {
  loadPlayerLists,
  savePlayerList,
  deletePlayerList,
} from '@/lib/storage';
import { ImportExportButtons } from './ImportExportButtons';
import { PlayerForm } from './PlayerForm';
import { PlayerList as PlayerListComponent } from './PlayerList';
import type { Player } from '@/types/tournament';
import { cn } from '@/lib/utils';
import {
  type ImportedPlayerList,
  parseCSV,
  parseJSON,
  readFileAsText,
} from '@/lib/playerListIO';

export function PlayerListManager() {
  const [playerLists, setPlayerLists] = useState<PlayerList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [listName, setListName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setPlayerLists(loadPlayerLists());
  }, []);

  const selectedList = selectedListId
    ? playerLists.find((l) => l.id === selectedListId)
    : null;

  const handleNewList = () => {
    setSelectedListId(null);
    setListName('');
    setPlayers([]);
    setIsEditing(false);
  };

  const handleSelectList = (id: string) => {
    const list = playerLists.find((l) => l.id === id);
    if (list) {
      setSelectedListId(id);
      setListName(list.name);
      setPlayers(
        list.players.map((p, idx) => ({
          id: uuidv4(),
          name: p.name,
          seed: idx + 1,
        }))
      );
      setIsEditing(false);
    }
  };

  const handleSave = () => {
    if (!listName.trim()) {
      toast.error('Please enter a list name');
      return;
    }
    if (players.length === 0) {
      toast.error('Please add at least one player');
      return;
    }

    const now = new Date();
    const playerList: PlayerList = {
      id: selectedListId || uuidv4(),
      name: listName.trim(),
      players: players.map((p) => ({ name: p.name })),
      createdAt: selectedList?.createdAt || now,
      updatedAt: now,
    };

    savePlayerList(playerList);
    setPlayerLists(loadPlayerLists());
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!selectedListId) return;
    if (!confirm(`Are you sure you want to delete "${selectedList?.name}"?`)) {
      return;
    }

    deletePlayerList(selectedListId);
    setPlayerLists(loadPlayerLists());
    setSelectedListId(null);
    setListName('');
    setPlayers([]);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

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

  const handleImport = async (imported: ImportedPlayerList) => {
    setListName(imported.name);
    setPlayers(
      imported.players.map((name, idx) => ({
        id: uuidv4(),
        name: name.trim(),
        seed: idx + 1,
      }))
    );
    setIsEditing(true);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      const filename = file.name.toLowerCase();

      let imported: ImportedPlayerList;

      if (filename.endsWith('.csv')) {
        const playerNames = parseCSV(content);
        imported = {
          name: file.name.replace(/\.(csv|json)$/i, ''),
          players: playerNames,
        };
      } else if (filename.endsWith('.json')) {
        imported = parseJSON(content);
      } else {
        toast.error('Unsupported file format. Please use CSV or JSON.');
        return;
      }

      handleImport(imported);
    } catch (error) {
      toast.error(`Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left column: List of saved player lists */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800" aria-labelledby="saved-lists-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="saved-lists-title" className="text-2xl font-bold">Saved Lists</h2>
          <button
            onClick={handleNewList}
            className={cn(
              'rounded px-4 py-2 text-sm font-medium text-white',
              'bg-green-600 hover:bg-green-700',
              'dark:bg-green-700 dark:hover:bg-green-600'
            )}
          >
            New List
          </button>
        </div>

        <div className="mb-4">
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleImportFile}
            className="hidden"
            id="import-file-input"
          />
          <label
            htmlFor="import-file-input"
            className={cn(
              'inline-block cursor-pointer rounded px-4 py-2 text-sm font-medium',
              'border border-gray-300 bg-white hover:bg-gray-50',
              'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
            )}
          >
            Import from File
          </label>
        </div>

        {playerLists.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No saved lists yet
          </p>
        ) : (
          <div className="space-y-2">
            {playerLists.map((list) => (
              <button
                key={list.id}
                onClick={() => handleSelectList(list.id)}
                className={cn(
                  'w-full rounded-lg border-2 p-3 text-left transition-all',
                  'bg-white dark:bg-gray-800',
                  selectedListId === list.id
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                )}
              >
                <div className="font-medium">{list.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {list.players.length} player{list.players.length !== 1 ? 's' : ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Right column: Edit selected list */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800" aria-labelledby="edit-list-title">
        <h2 id="edit-list-title" className="mb-4 text-2xl font-bold">
          {selectedListId ? (isEditing ? 'Edit List' : 'View List') : 'Create New List'}
        </h2>

        {selectedListId && !isEditing && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={handleEdit}
              className={cn(
                'rounded px-4 py-2 text-sm font-medium',
                'border border-gray-300 bg-white hover:bg-gray-50',
                'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
              )}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className={cn(
                'rounded px-4 py-2 text-sm font-medium',
                'text-red-600 hover:bg-red-50',
                'dark:text-red-400 dark:hover:bg-red-950/20'
              )}
            >
              Delete
            </button>
            {selectedList && (
              <ImportExportButtons playerList={selectedList} />
            )}
          </div>
        )}

        {(isEditing || !selectedListId) && (
          <>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">
                List Name
              </label>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Enter list name"
                className={cn(
                  'w-full rounded border border-gray-300 px-4 py-2',
                  'dark:border-gray-600 dark:bg-gray-700'
                )}
              />
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-lg font-semibold">Players</h3>
              <PlayerForm onAdd={handleAddPlayer} />
              <div className="mt-4">
                <PlayerListComponent
                  players={players}
                  onUpdate={handleUpdatePlayers}
                  onRemove={handleRemovePlayer}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className={cn(
                  'rounded px-4 py-2 font-medium text-white',
                  'bg-green-600 hover:bg-green-700',
                  'dark:bg-green-700 dark:hover:bg-green-600'
                )}
              >
                {selectedListId ? 'Update' : 'Save'} List
              </button>
              {selectedListId && (
                <button
                  onClick={() => setIsEditing(false)}
                  className={cn(
                    'rounded px-4 py-2 font-medium',
                    'border border-gray-300 bg-white hover:bg-gray-50',
                    'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
                  )}
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        )}

        {selectedListId && !isEditing && (
          <div className="mt-4">
            <h3 className="mb-2 text-lg font-semibold">Players</h3>
            <div className="space-y-2">
              {selectedList?.players.map((p, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 p-3',
                    'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      'bg-green-100 font-bold text-green-700',
                      'dark:bg-green-900/30 dark:text-green-300'
                    )}
                  >
                    {idx + 1}
                  </div>
                  <span className="font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
