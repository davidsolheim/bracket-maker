'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTournament } from '@/contexts/TournamentContext';
import { BracketTree } from '@/components/bracket/BracketTree';
import { MatchList } from '@/components/match/MatchList';
import { ScoreModal } from '@/components/match/ScoreModal';
import { ViewToggle } from '@/components/layout/ViewToggle';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { WinnerCelebration } from '@/components/tournament/WinnerCelebration';
import {
  exportTournamentJSON,
  exportTournamentCSV,
  exportTournamentImage,
} from '@/lib/exportTournament';
import type { Match } from '@/types/tournament';
import { cn } from '@/lib/utils';

type ViewType = 'bracket' | 'list';

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const { tournaments, setCurrentTournament, updateMatch, startTournament, isLoading } =
    useTournament();
  const [view, setView] = useState<ViewType>('bracket');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isReScoring, setIsReScoring] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const bracketRef = useRef<HTMLDivElement>(null);

  const tournamentId = params.id as string;
  const tournament = tournaments.find((t) => t.id === tournamentId);

  useEffect(() => {
    if (tournamentId) {
      setCurrentTournament(tournamentId);
    }
    return () => setCurrentTournament(null);
  }, [tournamentId, setCurrentTournament]);

  // Show loading state while tournaments are being loaded to prevent hydration mismatch
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="mx-auto max-w-7xl px-4 py-8">
          <p>Tournament not found</p>
        </main>
      </div>
    );
  }

  const handleMatchClick = (match: Match) => {
    const player1 = tournament.players.find((p) => p.id === match.player1Id);
    const player2 = tournament.players.find((p) => p.id === match.player2Id);
    if (player1 && player2) {
      setSelectedMatch(match);
      if (match.winnerId) {
        // Show confirmation modal for completed matches
        setShowConfirmModal(true);
      } else {
        setIsReScoring(false);
        setIsScoreModalOpen(true);
      }
    }
  };

  const handleConfirmEdit = () => {
    setShowConfirmModal(false);
    setIsReScoring(true);
    setIsScoreModalOpen(true);
  };

  const handleSaveScore = (player1Score: number, player2Score: number) => {
    if (!selectedMatch) return;
    updateMatch(
      tournament.id,
      selectedMatch.id,
      player1Score,
      player2Score,
      isReScoring
    );
    setSelectedMatch(null);
    setIsScoreModalOpen(false);
    setIsReScoring(false);
  };

  const handleStartTournament = () => {
    if (tournament.status === 'draft') {
      startTournament(tournament.id);
    }
  };

  const handleExportImage = async () => {
    if (!bracketRef.current) return;

    setIsExportingImage(true);
    try {
      await exportTournamentImage(bracketRef.current, tournament.name);
    } catch (error) {
      console.error('Failed to export image:', error);
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">{tournament.name}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Status: {tournament.status}
            </p>
          </div>
          <div className="flex gap-2">
            {(tournament.status === 'active' ||
              tournament.status === 'completed') &&
              tournament.matches.length > 0 && (
                <Button
                  onClick={handleExportImage}
                  variant="secondary"
                  size="sm"
                  disabled={isExportingImage || view !== 'bracket'}
                >
                  {isExportingImage ? 'Exporting...' : 'Export Image'}
                </Button>
              )}
            {tournament.status === 'completed' && (
              <>
                <Button
                  onClick={() => exportTournamentJSON(tournament)}
                  variant="secondary"
                  size="sm"
                >
                  Export JSON
                </Button>
                <Button
                  onClick={() => exportTournamentCSV(tournament)}
                  variant="secondary"
                  size="sm"
                >
                  Export CSV
                </Button>
              </>
            )}
            {tournament.status === 'draft' && (
              <Button onClick={handleStartTournament} variant="primary">
                Start Tournament
              </Button>
            )}
          </div>
        </div>

        {tournament.status === 'active' && tournament.matches.length > 0 && (
          <div className="mb-6">
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        )}

        {tournament.status === 'draft' && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
              Tournament is in draft mode. Click "Start Tournament" to begin.
            </p>
          </div>
        )}

        {tournament.status === 'active' && tournament.matches.length > 0 && (
          <>
            {view === 'bracket' ? (
              <BracketTree
                ref={bracketRef}
                matches={tournament.matches}
                players={tournament.players}
                onMatchClick={handleMatchClick}
                activeMatchId={selectedMatch?.id}
              />
            ) : (
              <MatchList
                matches={tournament.matches}
                players={tournament.players}
                onMatchClick={handleMatchClick}
                activeMatchId={selectedMatch?.id}
              />
            )}
          </>
        )}

        {tournament.status === 'completed' && tournament.matches.length > 0 && (
          <>
            <WinnerCelebration tournament={tournament} />
            <BracketTree
              ref={bracketRef}
              matches={tournament.matches}
              players={tournament.players}
              onMatchClick={handleMatchClick}
              activeMatchId={selectedMatch?.id}
            />
          </>
        )}

        <Modal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setSelectedMatch(null);
          }}
          title="Edit Completed Match"
          size="md"
        >
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Editing this match will reset all downstream matches that depend on
            its result. Are you sure you want to continue?
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowConfirmModal(false);
                setSelectedMatch(null);
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmEdit} variant="primary" className="flex-1">
              Continue Editing
            </Button>
          </div>
        </Modal>

        {selectedMatch && (
          <ScoreModal
            isOpen={isScoreModalOpen}
            onClose={() => {
              setIsScoreModalOpen(false);
              setSelectedMatch(null);
              setIsReScoring(false);
            }}
            match={selectedMatch}
            players={tournament.players}
            onSave={handleSaveScore}
            initialScores={
              isReScoring && selectedMatch.winnerId
                ? {
                    player1: selectedMatch.player1Score ?? 0,
                    player2: selectedMatch.player2Score ?? 0,
                  }
                : undefined
            }
          />
        )}
      </main>
    </div>
  );
}
