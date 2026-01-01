'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Match, Player } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface MatchOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  players: Player[];
  onSwapPlayers: (player1Id: string | null, player2Id: string | null) => void;
  onForceWinner: (winnerId: string, isForfeited: boolean) => void;
}

type OverrideTab = 'swap' | 'force';

export function MatchOverrideModal({
  isOpen,
  onClose,
  match,
  players,
  onSwapPlayers,
  onForceWinner,
}: MatchOverrideModalProps) {
  const [activeTab, setActiveTab] = useState<OverrideTab>('swap');
  const [selectedPlayer1, setSelectedPlayer1] = useState<string | null>(match.player1Id);
  const [selectedPlayer2, setSelectedPlayer2] = useState<string | null>(match.player2Id);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [markAsForfeit, setMarkAsForfeit] = useState(false);

  const player1 = players.find((p) => p.id === match.player1Id);
  const player2 = players.find((p) => p.id === match.player2Id);

  // Get players that are available to swap in (not already in this match)
  const getAvailablePlayers = (excludeId: string | null) => {
    return players.filter(p => p.id !== excludeId);
  };

  const handleSwapPlayers = () => {
    onSwapPlayers(selectedPlayer1, selectedPlayer2);
    onClose();
  };

  const handleForceWinner = () => {
    if (selectedWinner) {
      onForceWinner(selectedWinner, markAsForfeit);
      onClose();
    }
  };

  const canForceWinner = match.player1Id || match.player2Id;
  const isMatchComplete = match.winnerId !== null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Match Override" size="md">
      {isMatchComplete ? (
        <div className="text-center py-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This match has already been completed. To modify it, please edit the match score instead.
          </p>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              onClick={() => setActiveTab('swap')}
              className={cn(
                'flex-1 py-2 px-4 text-sm font-medium transition-colors cursor-pointer',
                activeTab === 'swap'
                  ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              Swap Players
            </button>
            <button
              onClick={() => setActiveTab('force')}
              className={cn(
                'flex-1 py-2 px-4 text-sm font-medium transition-colors cursor-pointer',
                activeTab === 'force'
                  ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              Force Winner
            </button>
          </div>

          {/* Swap Players Tab */}
          {activeTab === 'swap' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reassign players to this match slot. This is useful when the bracket needs manual correction.
              </p>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Player 1 (Top Slot)
                </label>
                <select
                  value={selectedPlayer1 || ''}
                  onChange={(e) => setSelectedPlayer1(e.target.value || null)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="">-- Empty (TBD) --</option>
                  {getAvailablePlayers(selectedPlayer2).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Seed {p.seed})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Player 2 (Bottom Slot)
                </label>
                <select
                  value={selectedPlayer2 || ''}
                  onChange={(e) => setSelectedPlayer2(e.target.value || null)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="">-- Empty (TBD) --</option>
                  {getAvailablePlayers(selectedPlayer1).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Seed {p.seed})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={onClose} variant="secondary" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSwapPlayers} variant="primary" className="flex-1">
                  Apply Changes
                </Button>
              </div>
            </div>
          )}

          {/* Force Winner Tab */}
          {activeTab === 'force' && (
            <div className="space-y-4">
              {!canForceWinner ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  At least one player must be assigned to force a winner.
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Declare a winner without entering scores. Use this for forfeits, disqualifications, or no-shows.
                  </p>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Select Winner
                    </label>
                    <div className="space-y-2">
                      {player1 && (
                        <label
                          className={cn(
                            'flex items-center gap-3 rounded border p-3 cursor-pointer transition-colors',
                            selectedWinner === player1.id
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          )}
                        >
                          <input
                            type="radio"
                            name="winner"
                            value={player1.id}
                            checked={selectedWinner === player1.id}
                            onChange={() => setSelectedWinner(player1.id)}
                            className="h-4 w-4 text-green-600"
                          />
                          <span className="font-medium">{player1.name}</span>
                          <span className="text-sm text-gray-500">(Seed {player1.seed})</span>
                        </label>
                      )}
                      {player2 && (
                        <label
                          className={cn(
                            'flex items-center gap-3 rounded border p-3 cursor-pointer transition-colors',
                            selectedWinner === player2.id
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          )}
                        >
                          <input
                            type="radio"
                            name="winner"
                            value={player2.id}
                            checked={selectedWinner === player2.id}
                            onChange={() => setSelectedWinner(player2.id)}
                            className="h-4 w-4 text-green-600"
                          />
                          <span className="font-medium">{player2.name}</span>
                          <span className="text-sm text-gray-500">(Seed {player2.seed})</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markAsForfeit}
                      onChange={(e) => setMarkAsForfeit(e.target.checked)}
                      className="h-4 w-4 rounded text-green-600"
                    />
                    <span className="text-sm">Mark as forfeit/DQ</span>
                  </label>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={onClose} variant="secondary" className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleForceWinner}
                      variant="primary"
                      className="flex-1"
                      disabled={!selectedWinner}
                    >
                      Confirm Winner
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
