'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Match, Player } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  players: Player[];
  onSave: (player1Score: number, player2Score: number) => void;
  initialScores?: { player1: number; player2: number };
}

export function ScoreModal({
  isOpen,
  onClose,
  match,
  players,
  onSave,
  initialScores,
}: ScoreModalProps) {
  const [player1Score, setPlayer1Score] = useState<string>(
    initialScores?.player1.toString() || ''
  );
  const [player2Score, setPlayer2Score] = useState<string>(
    initialScores?.player2.toString() || ''
  );

  // Reset scores when modal opens/closes or initialScores change
  useEffect(() => {
    if (isOpen) {
      setPlayer1Score(initialScores?.player1.toString() || '');
      setPlayer2Score(initialScores?.player2.toString() || '');
    } else {
      setPlayer1Score('');
      setPlayer2Score('');
    }
  }, [isOpen, initialScores]);

  const player1 = players.find((p) => p.id === match.player1Id);
  const player2 = players.find((p) => p.id === match.player2Id);

  const handleSave = () => {
    const score1 = parseInt(player1Score, 10);
    const score2 = parseInt(player2Score, 10);

    if (
      isNaN(score1) ||
      isNaN(score2) ||
      score1 < 0 ||
      score2 < 0 ||
      score1 === score2
    ) {
      toast.error('Please enter valid scores. Scores must be different.');
      return;
    }

    onSave(score1, score2);
    setPlayer1Score('');
    setPlayer2Score('');
    onClose();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    isPlayer1: boolean
  ) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentValue = parseInt(isPlayer1 ? player1Score : player2Score, 10);
      const newValue = isNaN(currentValue) ? 0 : currentValue + 1;
      if (isPlayer1) {
        setPlayer1Score(newValue.toString());
      } else {
        setPlayer2Score(newValue.toString());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentValue = parseInt(isPlayer1 ? player1Score : player2Score, 10);
      const newValue = isNaN(currentValue) ? 0 : Math.max(0, currentValue - 1);
      if (isPlayer1) {
        setPlayer1Score(newValue.toString());
      } else {
        setPlayer2Score(newValue.toString());
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cursor-pointer fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800"
          >
            <h2 className="mb-4 text-xl font-bold">Enter Match Score</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {player1?.name || 'Player 1'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={player1Score}
                  onChange={(e) => setPlayer1Score(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, true)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Score"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  {player2?.name || 'Player 2'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={player2Score}
                  onChange={(e) => setPlayer2Score(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, false)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Score"
                />
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <p>Press ↑/↓ to adjust scores, Enter to save, Esc to cancel</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className={cn(
                  'cursor-pointer flex-1 rounded px-4 py-2 font-medium',
                  'border border-gray-300 bg-white hover:bg-gray-50',
                  'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={cn(
                  'cursor-pointer flex-1 rounded px-4 py-2 font-medium text-white',
                  'bg-green-600 hover:bg-green-700',
                  'dark:bg-green-700 dark:hover:bg-green-600'
                )}
              >
                Save Score
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
