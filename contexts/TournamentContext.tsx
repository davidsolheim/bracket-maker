'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Tournament, Player, Match, TournamentFormat, TournamentFormatConfig } from '@/types/tournament';
import {
  generateBracket,
  updateMatchResult,
  resetDownstreamMatches,
  forceMatchWinner as forceMatchWinnerLib,
  overrideMatchPlayers as overrideMatchPlayersLib,
  generateSwissNextRound,
  generateKnockoutFromGroups,
  generateKnockoutFromSwiss,
} from '@/lib/bracket';
import { isGroupStageComplete, isRoundComplete, countQualifiedPlayers, getPlayerRecord } from '@/lib/standings';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { validateTournaments } from '@/lib/validators';
import { toast } from 'sonner';

interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isLoading: boolean;
  createTournament: (
    name: string,
    players: Player[],
    format: TournamentFormat,
    formatConfig?: TournamentFormatConfig
  ) => Tournament;
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
  overrideMatchPlayers: (
    tournamentId: string,
    matchId: string,
    player1Id: string | null,
    player2Id: string | null
  ) => void;
  forceMatchWinner: (
    tournamentId: string,
    matchId: string,
    winnerId: string,
    isForfeited?: boolean
  ) => void;
  advanceSwissRound: (tournamentId: string) => void;
  advanceSwissToKnockout: (tournamentId: string) => void;
  advanceToKnockout: (tournamentId: string) => void;
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

  const createTournament = (
    name: string,
    players: Player[],
    format: TournamentFormat = 'double-elimination',
    formatConfig?: TournamentFormatConfig
  ): Tournament => {
    const tournament: Tournament = {
      id: uuidv4(),
      name,
      format,
      formatConfig,
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

    const matches = generateBracket(
      tournament.players,
      tournament.format,
      tournament.formatConfig
    );

    const updated: Tournament = {
      ...tournament,
      status: 'active',
      matches,
      currentSwissRound: tournament.format === 'swiss' ? 1 : undefined,
    };

    updateTournament(updated);
  };

  const checkTournamentComplete = (tournament: Tournament, matches: Match[]): boolean => {
    const format = tournament.format;

    switch (format) {
      case 'single-elimination': {
        // Tournament is complete when the final match has a winner
        const winnersMatches = matches.filter((m) => m.bracket === 'winners');
        const maxRound = Math.max(...winnersMatches.map((m) => m.round), 0);
        const finalMatch = winnersMatches.find((m) => m.round === maxRound);
        return !!finalMatch?.winnerId;
      }

      case 'double-elimination': {
        // Complete when grand finals round 2 has a winner, or round 1 if winners bracket champ wins
        const grandFinals = matches.filter((m) => m.bracket === 'grand-finals');
        const gfRound1 = grandFinals.find((m) => m.round === 1);
        const gfRound2 = grandFinals.find((m) => m.round === 2);
        
        // If round 1 is done and winners bracket champ won, tournament is over
        if (gfRound1?.winnerId === gfRound1?.player1Id) {
          return true;
        }
        // Otherwise need round 2 to complete
        return !!gfRound2?.winnerId;
      }

      case 'round-robin': {
        // Complete when all matches are played
        return matches.every((m) => m.winnerId !== null);
      }

      case 'swiss': {
        // Check if qualification phase is complete
        const isQualificationMode = tournament.formatConfig?.winsToQualify !== undefined;

        if (isQualificationMode) {
          // In qualification mode, check if knockout phase is complete
          if (tournament.swissQualificationComplete) {
            // Check knockout completion (similar to single-elimination)
            const knockoutMatches = matches.filter((m) => m.bracket === 'winners');
            const maxRound = Math.max(...knockoutMatches.map((m) => m.round), 0);
            const finalMatch = knockoutMatches.find((m) => m.round === maxRound);
            return !!finalMatch?.winnerId;
          }
          // Qualification phase is not complete yet
          return false;
        } else {
          // Fixed rounds mode: complete when all rounds are done
          const totalRounds = tournament.formatConfig?.numberOfRounds ||
            Math.ceil(Math.log2(tournament.players.length));
          const currentRound = tournament.currentSwissRound || 1;
          return currentRound >= totalRounds && isRoundComplete(matches, currentRound);
        }
      }

      case 'group-knockout': {
        // Complete when knockout phase final has a winner
        const knockoutMatches = matches.filter(
          (m) => m.bracket === 'winners' || m.bracket === 'losers' || m.bracket === 'grand-finals'
        );
        if (knockoutMatches.length === 0) {
          return false; // Still in group stage
        }
        
        const knockoutFormat = tournament.formatConfig?.knockoutFormat || 'single-elimination';
        if (knockoutFormat === 'double-elimination') {
          const grandFinals = knockoutMatches.filter((m) => m.bracket === 'grand-finals');
          const gfRound1 = grandFinals.find((m) => m.round === 1);
          const gfRound2 = grandFinals.find((m) => m.round === 2);
          if (gfRound1?.winnerId === gfRound1?.player1Id) return true;
          return !!gfRound2?.winnerId;
        } else {
          const maxRound = Math.max(...knockoutMatches.map((m) => m.round), 0);
          const finalMatch = knockoutMatches.find((m) => m.round === maxRound);
          return !!finalMatch?.winnerId;
        }
      }

      default:
        return false;
    }
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

    // #region agent log
    fetch('http://127.0.0.1:7254/ingest/87bd214f-3162-4f5e-83f2-30c0aab71339',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'contexts/TournamentContext.tsx:326',message:'updateMatch player stats',data:{matchId:matchId.slice(-6),playerWinCounts:tournament.players.map(p=>({id:p.id.slice(-4),name:p.name,wins:p.wins,losses:p.losses}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    const isComplete = checkTournamentComplete(tournament, updatedMatches);

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

  const overrideMatchPlayers = (
    tournamentId: string,
    matchId: string,
    player1Id: string | null,
    player2Id: string | null
  ) => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    const updatedMatches = overrideMatchPlayersLib(
      tournament.matches,
      matchId,
      player1Id,
      player2Id
    );

    const updated: Tournament = {
      ...tournament,
      matches: updatedMatches,
    };

    updateTournament(updated);
    toast.success('Match players updated');
  };

  const forceMatchWinner = (
    tournamentId: string,
    matchId: string,
    winnerId: string,
    isForfeited: boolean = false
  ) => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    const updatedMatches = forceMatchWinnerLib(
      tournament.matches,
      matchId,
      winnerId,
      isForfeited
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

    const isComplete = checkTournamentComplete(tournament, updatedMatches);

    const updated: Tournament = {
      ...tournament,
      players: tournament.players,
      matches: updatedMatches,
      status: isComplete ? 'completed' : tournament.status,
      completedAt: isComplete ? new Date() : tournament.completedAt,
    };

    updateTournament(updated);
    toast.success(isForfeited ? 'Match forfeited' : 'Winner declared');
  };

  const advanceSwissRound = (tournamentId: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7254/ingest/87bd214f-3162-4f5e-83f2-30c0aab71339',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'contexts/TournamentContext.tsx:422',message:'advanceSwissRound entry',data:{tournamentId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament || tournament.format !== 'swiss') return;

    const currentRound = tournament.currentSwissRound || 1;
    const isQualificationMode = tournament.formatConfig?.winsToQualify !== undefined;

    // #region agent log
    fetch('http://127.0.0.1:7254/ingest/87bd214f-3162-4f5e-83f2-30c0aab71339',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'contexts/TournamentContext.tsx:428',message:'Swiss mode check (post-fix)',data:{currentRound,isQualificationMode,formatConfig:tournament.formatConfig},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Check if current round is complete
    if (!isRoundComplete(tournament.matches, currentRound)) {
      toast.error('Complete all matches in the current round first');
      return;
    }

    if (isQualificationMode) {
      // In qualification mode, check if enough players have qualified
      // Use match data instead of player.wins for accurate counting
      const winsToQualify = tournament.formatConfig?.winsToQualify || 3;
      const qualifiedPlayersCount = countQualifiedPlayers(
        tournament.matches,
        tournament.players,
        winsToQualify
      );

      const targetQualifiers = tournament.formatConfig?.qualifyingPlayers || 8;

      // #region agent log
      fetch('http://127.0.0.1:7254/ingest/87bd214f-3162-4f5e-83f2-30c0aab71339',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'contexts/TournamentContext.tsx:441',message:'Qualification advance check (fixed)',data:{qualifiedPlayersCount,targetQualifiers,currentRound},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (qualifiedPlayersCount >= targetQualifiers) {
        toast.info(`Qualification target reached (${qualifiedPlayersCount}/${targetQualifiers}). Use "Advance to Knockout" instead.`);
        return;
      }

      // Generate next round matches
      const newMatches = generateSwissNextRound(
        tournament.players,
        tournament.matches,
        currentRound,
        tournament.formatConfig
      );

      const updated: Tournament = {
        ...tournament,
        matches: [...tournament.matches, ...newMatches],
        currentSwissRound: currentRound + 1,
      };

      updateTournament(updated);
      toast.success(`Qualification Round ${currentRound + 1} generated`);
    } else {
      // Fixed rounds mode
      const totalRounds = tournament.formatConfig?.numberOfRounds ||
        Math.ceil(Math.log2(tournament.players.length));

      if (currentRound >= totalRounds) {
        toast.info('All Swiss rounds are complete');
        return;
      }

      // Generate next round matches
      const newMatches = generateSwissNextRound(
        tournament.players,
        tournament.matches,
        currentRound,
        tournament.formatConfig
      );

      const updated: Tournament = {
        ...tournament,
        matches: [...tournament.matches, ...newMatches],
        currentSwissRound: currentRound + 1,
      };

      updateTournament(updated);
      toast.success(`Round ${currentRound + 1} generated`);
    }
  };

  const advanceSwissToKnockout = (tournamentId: string) => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament || tournament.format !== 'swiss') return;

    const isQualificationMode = tournament.formatConfig?.winsToQualify !== undefined;
    if (!isQualificationMode) {
      toast.error('This tournament is not in qualification mode');
      return;
    }

    // Check if qualification target is met using match data for accuracy
    const winsToQualify = tournament.formatConfig?.winsToQualify || 3;
    const qualifiedPlayers = tournament.players.filter((player) => {
      const record = getPlayerRecord(tournament.matches, player.id);
      return record.wins >= winsToQualify;
    });

    const targetQualifiers = tournament.formatConfig?.qualifyingPlayers || 8;
    if (qualifiedPlayers.length < targetQualifiers) {
      toast.error(`Need ${targetQualifiers} qualified players, but only ${qualifiedPlayers.length} have ${winsToQualify} wins`);
      return;
    }

    // Sort qualified players by wins (desc), then by seed (asc)
    const sortedQualifiedPlayers = qualifiedPlayers.sort((a, b) => {
      const recordA = getPlayerRecord(tournament.matches, a.id);
      const recordB = getPlayerRecord(tournament.matches, b.id);
      if (recordB.wins !== recordA.wins) return recordB.wins - recordA.wins;
      return a.seed - b.seed;
    });

    // Generate knockout bracket from qualified players
    const knockoutMatches = generateKnockoutFromSwiss(
      sortedQualifiedPlayers,
      tournament.formatConfig
    );

    const updated: Tournament = {
      ...tournament,
      matches: [...tournament.matches, ...knockoutMatches],
      swissQualificationComplete: true,
    };

    updateTournament(updated);
    toast.success(`Knockout bracket generated with ${qualifiedPlayers.length} players`);
  };

  const advanceToKnockout = (tournamentId: string) => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament || tournament.format !== 'group-knockout') return;

    // Check if group stage is complete
    const groupMatches = tournament.matches.filter((m) => m.bracket === 'group');
    if (!isGroupStageComplete(groupMatches)) {
      toast.error('Complete all group stage matches first');
      return;
    }

    if (tournament.groupStageComplete) {
      toast.info('Already advanced to knockout stage');
      return;
    }

    // Generate knockout bracket from group results
    const knockoutMatches = generateKnockoutFromGroups(
      tournament.players,
      groupMatches,
      tournament.formatConfig
    );

    const updated: Tournament = {
      ...tournament,
      matches: [...tournament.matches, ...knockoutMatches],
      groupStageComplete: true,
    };

    updateTournament(updated);
    toast.success('Knockout bracket generated');
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
        overrideMatchPlayers,
        forceMatchWinner,
        advanceSwissRound,
        advanceSwissToKnockout,
        advanceToKnockout,
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
