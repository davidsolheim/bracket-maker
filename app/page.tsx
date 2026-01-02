'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTournament } from '@/contexts/TournamentContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const { tournaments, isLoading, deleteTournament } = useTournament();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-dark)]">
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold heading gradient-text">Tournament Dashboard</h1>
            <p className="text-[var(--text-secondary)]">
              Manage your bumper pool tournaments
            </p>
          </div>
          <SkeletonList count={6} />
        </main>
      </div>
    );
  }

  const handleDeleteClick = (tournamentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTournamentToDelete(tournamentId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (tournamentToDelete) {
      deleteTournament(tournamentToDelete);
      setDeleteModalOpen(false);
      setTournamentToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setTournamentToDelete(null);
  };

  const activeTournaments = tournaments.filter((t) => t.status === 'active');
  const recentTournaments = tournaments
    .filter((t) => t.status === 'completed')
    .sort((a, b) => {
      const dateA = a.completedAt?.getTime() || 0;
      const dateB = b.completedAt?.getTime() || 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--bg-dark)]">
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          role="banner"
        >
          <h1 className="mb-2 text-4xl md:text-5xl font-bold heading gradient-text">
            Tournament Dashboard
          </h1>
          <p className="text-[var(--text-secondary)]">
            Manage your bumper pool tournaments
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Link href="/tournament/new">
            <Button size="lg" className="group">
              <span className="mr-2">🎮</span>
              Create New Tournament
              <motion.span
                className="ml-2 inline-block"
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                →
              </motion.span>
            </Button>
          </Link>
        </motion.div>

        {activeTournaments.length > 0 && (
          <section className="mb-8">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="h-8 w-1 bg-gradient-to-b from-[var(--neon-green)] to-[var(--neon-cyan)] rounded-full" />
              <h2 className="text-2xl font-bold heading text-[var(--neon-green)]">
                Active Tournaments
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-[var(--neon-green)]/20 text-[var(--neon-green)] rounded-full">
                {activeTournaments.length}
              </span>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeTournaments.map((tournament, index) => (
                <motion.article
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="relative group"
                  aria-labelledby={`tournament-title-${tournament.id}`}
                >
                  <Link
                    href={`/tournament/${tournament.id}`}
                    className={cn(
                      'cursor-pointer block rounded-xl p-6',
                      'esports-card',
                      'border-[var(--neon-green)]/30 hover:border-[var(--neon-green)]/60',
                      'hover:shadow-[0_0_30px_rgba(57,255,20,0.15)]',
                      'transition-all duration-300'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--neon-green)]/20 text-[var(--neon-green)]">
                        LIVE
                      </span>
                    </div>
                    <h3 id={`tournament-title-${tournament.id}`} className="mb-2 text-xl font-bold text-white heading">
                      {tournament.name}
                    </h3>
                    <p className="mb-2 text-sm text-[var(--text-secondary)]">
                      {tournament.players.length} players
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Started {format(tournament.createdAt, 'MMM d, yyyy')}
                    </p>
                  </Link>
                  <button
                    onClick={(e) => handleDeleteClick(tournament.id, e)}
                    className={cn(
                      'absolute top-4 right-4 p-1.5 rounded-lg',
                      'text-[var(--neon-magenta)] hover:bg-[var(--neon-magenta)]/10',
                      'opacity-0 group-hover:opacity-100 transition-all',
                      'sm:opacity-100'
                    )}
                    title="Delete tournament"
                    aria-label={`Delete tournament ${tournament.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </motion.article>
              ))}
            </div>
          </section>
        )}

        {recentTournaments.length > 0 && (
          <section>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="h-8 w-1 bg-gradient-to-b from-[var(--neon-magenta)] to-[var(--neon-cyan)] rounded-full" />
              <h2 className="text-2xl font-bold heading text-[var(--neon-magenta)]">
                Recent Tournaments
              </h2>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentTournaments.map((tournament, index) => (
                <motion.article
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="relative group"
                  aria-labelledby={`tournament-title-recent-${tournament.id}`}
                >
                  <Link
                    href={`/tournament/${tournament.id}`}
                    className={cn(
                      'cursor-pointer block rounded-xl p-6',
                      'esports-card',
                      'hover:border-[var(--neon-cyan)]/50',
                      'hover:shadow-[0_0_20px_rgba(0,245,255,0.1)]',
                      'transition-all duration-300'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--text-muted)]/20 text-[var(--text-muted)]">
                        COMPLETED
                      </span>
                    </div>
                    <h3 id={`tournament-title-recent-${tournament.id}`} className="mb-2 text-xl font-bold text-white heading">
                      {tournament.name}
                    </h3>
                    <p className="mb-2 text-sm text-[var(--text-secondary)]">
                      {tournament.players.length} players
                    </p>
                    {tournament.completedAt && (
                      <p className="text-xs text-[var(--text-muted)]">
                        Completed {format(tournament.completedAt, 'MMM d, yyyy')}
                      </p>
                    )}
                  </Link>
                  <button
                    onClick={(e) => handleDeleteClick(tournament.id, e)}
                    className={cn(
                      'absolute top-4 right-4 p-1.5 rounded-lg',
                      'text-[var(--neon-magenta)] hover:bg-[var(--neon-magenta)]/10',
                      'opacity-0 group-hover:opacity-100 transition-all',
                      'sm:opacity-100'
                    )}
                    title="Delete tournament"
                    aria-label={`Delete tournament ${tournament.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </motion.article>
              ))}
            </div>
          </section>
        )}

        {tournaments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border-2 border-dashed border-[var(--border-dim)] bg-[var(--bg-card)] p-12 text-center"
          >
            <div className="text-6xl mb-4">🏆</div>
            <p className="mb-4 text-lg text-[var(--text-secondary)]">
              No tournaments yet
            </p>
            <Link href="/tournament/new">
              <Button size="lg">
                Create Your First Tournament
              </Button>
            </Link>
          </motion.div>
        )}

        <Modal
          isOpen={deleteModalOpen}
          onClose={handleCancelDelete}
          title="Delete Tournament"
          size="md"
        >
          <p className="mb-6 text-[var(--text-secondary)]">
            Are you sure you want to delete this tournament? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleCancelDelete}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="danger"
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
