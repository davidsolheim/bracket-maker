'use client';

import { PlayerListManager } from '@/components/player/PlayerListManager';

export default function PlayersPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">Player Lists</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Create and manage reusable player lists for your tournaments. Export as CSV or JSON to share with others.
        </p>
        <PlayerListManager />
      </main>
    </div>
  );
}
