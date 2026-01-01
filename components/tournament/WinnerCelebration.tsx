'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Tournament, Player } from '@/types/tournament';
import { motion } from 'framer-motion';

interface WinnerCelebrationProps {
  tournament: Tournament;
}

export function WinnerCelebration({ tournament }: WinnerCelebrationProps) {
  const grandFinals = tournament.matches.filter(
    (m) => m.bracket === 'grand-finals'
  );
  const finalMatch = grandFinals
    .filter((m) => m.round === 2)
    .find((m) => m.winnerId);

  const winner = finalMatch
    ? tournament.players.find((p) => p.id === finalMatch.winnerId)
    : null;

  useEffect(() => {
    if (tournament.status === 'completed' && winner) {
      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }
  }, [tournament.status, winner]);

  if (tournament.status !== 'completed' || !winner) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-lg border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-yellow-100 p-8 text-center dark:from-yellow-950/30 dark:to-yellow-900/20 dark:border-yellow-600"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
        className="mb-4 text-6xl"
      >
        🏆
      </motion.div>
      <h2 className="mb-2 text-3xl font-bold text-yellow-800 dark:text-yellow-300">
        Tournament Champion!
      </h2>
      <p className="text-2xl font-semibold text-yellow-700 dark:text-yellow-400">
        {winner.name}
      </p>
    </motion.div>
  );
}
