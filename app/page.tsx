'use client';

import { useState } from 'react';
import Link from 'next/link';
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Tournament Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Tournament Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your bumper pool tournaments
          </p>
        </div>

        <div className="mb-8">
          <Link
            href="/tournament/new"
            className={cn(
              'cursor-pointer inline-block rounded-lg px-6 py-3 font-medium text-white',
              'bg-green-600 hover:bg-green-700',
              'dark:bg-green-700 dark:hover:bg-green-600'
            )}
          >
            Create New Tournament
          </Link>
        </div>

        {activeTournaments.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Active Tournaments</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeTournaments.map((tournament) => (
                <div key={tournament.id} className="relative group">
                  <Link
                    href={`/tournament/${tournament.id}`}
                    className={cn(
                      'cursor-pointer block rounded-lg border-2 border-green-200 bg-white p-6',
                      'transition-all hover:border-green-400 hover:shadow-lg',
                      'dark:border-green-800 dark:bg-gray-800'
                    )}
                  >
                    <h3 className="mb-2 text-xl font-bold">{tournament.name}</h3>
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      {tournament.players.length} players
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Started {format(tournament.createdAt, 'MMM d, yyyy')}
                    </p>
                  </Link>
                  <button
                    onClick={(e) => handleDeleteClick(tournament.id, e)}
                    className={cn(
                      'absolute top-2 right-2 p-1.5 rounded-full',
                      'text-red-600 hover:bg-red-50 hover:text-red-700',
                      'dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'sm:opacity-100' // Always visible on small screens
                    )}
                    title="Delete tournament"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {recentTournaments.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl font-bold">Recent Tournaments</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentTournaments.map((tournament) => (
                <div key={tournament.id} className="relative group">
                  <Link
                    href={`/tournament/${tournament.id}`}
                    className={cn(
                      'cursor-pointer block rounded-lg border-2 border-gray-200 bg-white p-6',
                      'transition-all hover:border-gray-400 hover:shadow-lg',
                      'dark:border-gray-700 dark:bg-gray-800'
                    )}
                  >
                    <h3 className="mb-2 text-xl font-bold">{tournament.name}</h3>
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      {tournament.players.length} players
                    </p>
                    {tournament.completedAt && (
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Completed {format(tournament.completedAt, 'MMM d, yyyy')}
                      </p>
                    )}
                  </Link>
                  <button
                    onClick={(e) => handleDeleteClick(tournament.id, e)}
                    className={cn(
                      'absolute top-2 right-2 p-1.5 rounded-full',
                      'text-red-600 hover:bg-red-50 hover:text-red-700',
                      'dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'sm:opacity-100' // Always visible on small screens
                    )}
                    title="Delete tournament"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {tournaments.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
              No tournaments yet
            </p>
            <Link
              href="/tournament/new"
              className={cn(
                'cursor-pointer inline-block rounded-lg px-6 py-3 font-medium text-white',
                'bg-green-600 hover:bg-green-700',
                'dark:bg-green-700 dark:hover:bg-green-600'
              )}
            >
              Create Your First Tournament
            </Link>
          </div>
        )}

        <Modal
          isOpen={deleteModalOpen}
          onClose={handleCancelDelete}
          title="Delete Tournament"
          size="md"
        >
          <p className="mb-4 text-gray-600 dark:text-gray-400">
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
