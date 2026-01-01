'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Tournament, Player, Match } from '@/types/tournament';
import {
  generateDoubleEliminationBracket,
  updateMatchResult,
  resetDownstreamMatches,
} from '@/lib/bracket';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { validateTournaments } from '@/lib/validators';
import { toast } from 'sonner';

interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isLoading: boolean;
  createTournament: (name: string, players: Player[]) => Tournament;
  updateTournament: (tournament: Tournament) => void;
  setCurrentTournament: (id: string | null) => void;
  startTournament: (id: string) => void;
  updateMatch: (
    tournamentId: string,
    matchId: string,
    player1Score: number,
    player2Score: number,
    isReScoring?: boolean
  ) => void;
  deleteTournament: (id: string) => void;
}

const STORAGE_KEY = 'bracket-maker-tournaments';

// Helper to convert date strings back to Date objects and validate
function hydrateTournaments(data: any[]): Tournament[] {
  if (!Array.isArray(data)) return [];
  
  const validated = validateTournaments(data);
  const invalidCount = data.length - validated.length;
  
  if (invalidCount > 0) {
    toast.warning(
      `Found ${invalidCount} invalid tournament${invalidCount > 1 ? 's' : ''} in storage. They have been removed.`
    );
  }
  
  return validated;
}

// Helper to serialize tournaments for storage
function serializeTournaments(tournaments: Tournament[]): any[] {
  return tournaments.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    completedAt: t.completedAt?.toISOString() || null,
  }));
}

const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined
);

export function TournamentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rawTournaments, setRawTournaments] = useLocalStorage<any[]>(
    STORAGE_KEY,
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [currentTournament, setCurrentTournamentState] =
    useState<Tournament | null>(null);

  // Hydrate tournaments from localStorage - memoize to prevent recreation on every render
  const tournaments = useMemo(() => hydrateTournaments(rawTournaments), [rawTournaments]);

  useEffect(() => {
    // Mark as loaded after initial hydration
    setIsLoading(false);
  }, []);

  // Update localStorage when tournaments change
  const updateTournamentsStorage = useCallback((updated: Tournament[]) => {
    setRawTournaments(serializeTournaments(updated));
  }, [setRawTournaments]);

  const createTournament = (name: string, players: Player[]): Tournament => {
    const tournament: Tournament = {
      id: uuidv4(),
      name,
      status: 'draft',
      players: players.map((p, index) => ({
        ...p,
        seed: p.seed || index + 1,
      })),
      matches: [],
      createdAt: new Date(),
      completedAt: null,
    };

    const updated = [...tournaments, tournament];
    updateTournamentsStorage(updated);
    return tournament;
  };

  const updateTournament = (tournament: Tournament) => {
    const updated = tournaments.map((t) =>
      t.id === tournament.id ? tournament : t
    );
    updateTournamentsStorage(updated);
    if (currentTournament?.id === tournament.id) {
      setCurrentTournamentState(tournament);
    }
  };

  const setCurrentTournament = useCallback((id: string | null) => {
    if (id === null) {
      setCurrentTournamentState(null);
      return;
    }
    const tournament = tournaments.find((t) => t.id === id);
    setCurrentTournamentState(tournament || null);
  }, [tournaments]);

  const startTournament = (id: string) => {
    const tournament = tournaments.find((t) => t.id === id);
    if (!tournament || tournament.status !== 'draft') return;

    const matches = generateDoubleEliminationBracket(tournament.players);
    const updated: Tournament = {
      ...tournament,
      status: 'active',
      matches,
    };

    updateTournament(updated);
  };

  const updateMatch = (
    tournamentId: string,
    matchId: string,
    player1Score: number,
    player2Score: number,
    isReScoring: boolean = false
  ) => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    let updatedMatches = tournament.matches;
    const match = updatedMatches.find((m) => m.id === matchId);
    const previousWinnerId = match?.winnerId || null;

    // If re-scoring, reset downstream matches first
    if (isReScoring) {
      updatedMatches = resetDownstreamMatches(updatedMatches, matchId);
      // Reset stats for previous winner/loser
      if (previousWinnerId && match) {
        const previousLoserId =
          previousWinnerId === match.player1Id
            ? match.player2Id
            : match.player1Id;
        const prevWinner = tournament.players.find((p) => p.id === previousWinnerId);
        const prevLoser = previousLoserId
          ? tournament.players.find((p) => p.id === previousLoserId)
          : null;
        if (prevWinner) {
          prevWinner.wins = Math.max(0, (prevWinner.wins || 0) - 1);
        }
        if (prevLoser) {
          prevLoser.losses = Math.max(0, (prevLoser.losses || 0) - 1);
        }
      }
    }

    updatedMatches = updateMatchResult(
      updatedMatches,
      matchId,
      player1Score,
      player2Score
    );

    // Update player statistics
    const updatedMatch = updatedMatches.find((m) => m.id === matchId);
    if (updatedMatch?.winnerId && updatedMatch.player1Id && updatedMatch.player2Id) {
      const winner = tournament.players.find((p) => p.id === updatedMatch.winnerId);
      const loserId =
        updatedMatch.winnerId === updatedMatch.player1Id
          ? updatedMatch.player2Id
          : updatedMatch.player1Id;
      const loser = tournament.players.find((p) => p.id === loserId);

      if (winner) {
        winner.wins = (winner.wins || 0) + 1;
      }
      if (loser) {
        loser.losses = (loser.losses || 0) + 1;
      }
    }

    // Check if tournament is complete
    const grandFinals = updatedMatches.filter(
      (m) => m.bracket === 'grand-finals'
    );
    const finalMatch = grandFinals
      .filter((m) => m.round === 2)
      .find((m) => m.winnerId);
    const isComplete = !!finalMatch;

    const updated: Tournament = {
      ...tournament,
      players: tournament.players,
      matches: updatedMatches,
      status: isComplete ? 'completed' : tournament.status,
      completedAt: isComplete ? new Date() : tournament.completedAt,
    };

    updateTournament(updated);
  };

  const deleteTournament = (id: string) => {
    const updated = tournaments.filter((t) => t.id !== id);
    updateTournamentsStorage(updated);
    if (currentTournament?.id === id) {
      setCurrentTournamentState(null);
    }
  };

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        currentTournament,
        isLoading,
        createTournament,
        updateTournament,
        setCurrentTournament,
        startTournament,
        updateMatch,
        deleteTournament,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within TournamentProvider');
  }
  return context;
}
