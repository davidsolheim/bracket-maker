'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTournament } from '@/contexts/TournamentContext';
import { BracketTree } from '@/components/bracket/BracketTree';
import { MatchList } from '@/components/match/MatchList';
import { ScoreModal } from '@/components/match/ScoreModal';
import { MatchOverrideModal } from '@/components/match/MatchOverrideModal';
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

const FORMAT_LABELS: Record<string, string> = {
  'single-elimination': 'Single Elimination',
  'double-elimination': 'Double Elimination',
  'round-robin': 'Round Robin',
  'swiss': 'Swiss System',
  'group-knockout': 'Group Stage + Knockout',
};

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const {
    tournaments,
    setCurrentTournament,
    updateMatch,
    startTournament,
    isLoading,
    overrideMatchPlayers,
    forceMatchWinner,
    advanceSwissRound,
    advanceSwissToKnockout,
    advanceToKnockout,
    deleteTournament,
  } = useTournament();
  const [view, setView] = useState<ViewType>('bracket');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isReScoring, setIsReScoring] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const handleOverrideClick = (match: Match) => {
    setSelectedMatch(match);
    setIsOverrideModalOpen(true);
  };

  const handleSwapPlayers = (player1Id: string | null, player2Id: string | null) => {
    if (!selectedMatch) return;
    overrideMatchPlayers(tournament.id, selectedMatch.id, player1Id, player2Id);
    setSelectedMatch(null);
    setIsOverrideModalOpen(false);
  };

  const handleForceWinner = (winnerId: string, isForfeited: boolean) => {
    if (!selectedMatch) return;
    forceMatchWinner(tournament.id, selectedMatch.id, winnerId, isForfeited);
    setSelectedMatch(null);
    setIsOverrideModalOpen(false);
  };

  const handleAdvanceSwissRound = () => {
    advanceSwissRound(tournament.id);
  };

  const handleAdvanceToKnockout = () => {
    advanceToKnockout(tournament.id);
  };

  const handleAdvanceSwissToKnockout = () => {
    advanceSwissToKnockout(tournament.id);
  };

  const handleDeleteTournament = () => {
    deleteTournament(tournament.id);
    router.push('/');
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

  const formatLabel = FORMAT_LABELS[tournament.format] || tournament.format;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">{tournament.name}</h1>
            <div className="mt-2 flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <span>Status: {tournament.status}</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-sm dark:bg-gray-700">
                {formatLabel}
              </span>
            </div>
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
            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="danger"
              size="sm"
            >
              Delete Tournament
            </Button>
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
                format={tournament.format}
                formatConfig={tournament.formatConfig}
                currentSwissRound={tournament.currentSwissRound}
                groupStageComplete={tournament.groupStageComplete}
                swissQualificationComplete={tournament.swissQualificationComplete}
                onMatchClick={handleMatchClick}
                onOverrideClick={handleOverrideClick}
                onAdvanceSwissRound={handleAdvanceSwissRound}
                onAdvanceToKnockout={tournament.format === 'swiss' ? handleAdvanceSwissToKnockout : handleAdvanceToKnockout}
                activeMatchId={selectedMatch?.id}
              />
            ) : (
              <MatchList
                matches={tournament.matches}
                players={tournament.players}
                onMatchClick={handleMatchClick}
                onOverrideClick={handleOverrideClick}
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
              format={tournament.format}
              formatConfig={tournament.formatConfig}
              currentSwissRound={tournament.currentSwissRound}
              groupStageComplete={tournament.groupStageComplete}
              swissQualificationComplete={tournament.swissQualificationComplete}
              onMatchClick={handleMatchClick}
              onOverrideClick={handleOverrideClick}
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

        {selectedMatch && (
          <MatchOverrideModal
            isOpen={isOverrideModalOpen}
            onClose={() => {
              setIsOverrideModalOpen(false);
              setSelectedMatch(null);
            }}
            match={selectedMatch}
            players={tournament.players}
            onSwapPlayers={handleSwapPlayers}
            onForceWinner={handleForceWinner}
          />
        )}

        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Tournament"
          size="md"
        >
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Are you sure you want to delete "{tournament.name}"? This action cannot be undone and will permanently remove all tournament data including matches, players, and results.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTournament}
              variant="danger"
              className="flex-1"
            >
              Delete Tournament
            </Button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
