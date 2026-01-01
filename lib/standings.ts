import type { Match, Player, GroupStanding } from '@/types/tournament';

/**
 * Calculate standings from a list of matches (for round-robin, swiss, or group stage)
 */
export function calculateStandings(
  matches: Match[],
  players: Player[],
  groupId?: string
): GroupStanding[] {
  const standingsMap = new Map<string, GroupStanding>();

  // Initialize standings for all players
  players.forEach((player) => {
    // If groupId is specified, only include players from that group
    if (groupId && player.groupId !== groupId) return;

    standingsMap.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      groupId: player.groupId,
      wins: 0,
      losses: 0,
      draws: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifferential: 0,
      matchesPlayed: 0,
    });
  });

  // Filter matches by groupId if specified
  const relevantMatches = groupId
    ? matches.filter((m) => m.groupId === groupId)
    : matches;

  // Process completed matches
  relevantMatches.forEach((match) => {
    if (!match.player1Id || !match.player2Id) return;
    if (match.isBye) return;

    const p1Standing = standingsMap.get(match.player1Id);
    const p2Standing = standingsMap.get(match.player2Id);

    if (!p1Standing || !p2Standing) return;

    // Only count completed matches
    if (match.winnerId || (match.player1Score !== null && match.player2Score !== null)) {
      p1Standing.matchesPlayed++;
      p2Standing.matchesPlayed++;

      if (match.player1Score !== null && match.player2Score !== null) {
        p1Standing.pointsFor += match.player1Score;
        p1Standing.pointsAgainst += match.player2Score;
        p2Standing.pointsFor += match.player2Score;
        p2Standing.pointsAgainst += match.player1Score;
      }

      if (match.winnerId === match.player1Id) {
        p1Standing.wins++;
        p2Standing.losses++;
      } else if (match.winnerId === match.player2Id) {
        p2Standing.wins++;
        p1Standing.losses++;
      } else if (match.player1Score === match.player2Score) {
        // Draw (rare in most tournament formats but possible)
        p1Standing.draws++;
        p2Standing.draws++;
      }
    }
  });

  // Calculate point differential and convert to array
  const standings = Array.from(standingsMap.values()).map((standing) => ({
    ...standing,
    pointDifferential: standing.pointsFor - standing.pointsAgainst,
  }));

  // Sort by wins (desc), then point differential (desc), then points for (desc)
  return standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDifferential !== a.pointDifferential) {
      return b.pointDifferential - a.pointDifferential;
    }
    return b.pointsFor - a.pointsFor;
  });
}

/**
 * Calculate standings for multiple groups
 */
export function calculateGroupStandings(
  matches: Match[],
  players: Player[]
): Map<string, GroupStanding[]> {
  const groupIds = [...new Set(players.map((p) => p.groupId).filter(Boolean))] as string[];
  const groupStandings = new Map<string, GroupStanding[]>();

  groupIds.forEach((groupId) => {
    const groupPlayers = players.filter((p) => p.groupId === groupId);
    const standings = calculateStandings(matches, groupPlayers, groupId);
    groupStandings.set(groupId, standings);
  });

  return groupStandings;
}

/**
 * Get the current Swiss round number from matches
 */
export function getCurrentSwissRound(matches: Match[]): number {
  const swissMatches = matches.filter((m) => m.bracket === 'swiss');
  if (swissMatches.length === 0) return 0;
  return Math.max(...swissMatches.map((m) => m.round));
}

/**
 * Check if all matches in a round are complete
 */
export function isRoundComplete(matches: Match[], round: number): boolean {
  const roundMatches = matches.filter((m) => m.round === round);
  return roundMatches.length > 0 && roundMatches.every((m) => m.winnerId !== null);
}

/**
 * Check if all group stage matches are complete
 */
export function isGroupStageComplete(matches: Match[]): boolean {
  const groupMatches = matches.filter((m) => m.bracket === 'group');
  return groupMatches.length > 0 && groupMatches.every((m) => m.winnerId !== null);
}

/**
 * Get win-loss record for a player
 */
export function getPlayerRecord(
  matches: Match[],
  playerId: string
): { wins: number; losses: number; draws: number } {
  let wins = 0;
  let losses = 0;
  let draws = 0;

  matches.forEach((match) => {
    if (match.player1Id !== playerId && match.player2Id !== playerId) return;
    if (!match.winnerId && match.player1Score === null) return;

    if (match.winnerId === playerId) {
      wins++;
    } else if (match.winnerId && match.winnerId !== playerId) {
      losses++;
    } else if (match.player1Score === match.player2Score) {
      draws++;
    }
  });

  return { wins, losses, draws };
}

/**
 * Format a player's record as a string (e.g., "3-1" or "3-1-1" with draws)
 */
export function formatRecord(record: { wins: number; losses: number; draws: number }): string {
  if (record.draws > 0) {
    return `${record.wins}-${record.losses}-${record.draws}`;
  }
  return `${record.wins}-${record.losses}`;
}

/**
 * Get head-to-head result between two players
 */
export function getHeadToHead(
  matches: Match[],
  player1Id: string,
  player2Id: string
): { player1Wins: number; player2Wins: number; draws: number } {
  let player1Wins = 0;
  let player2Wins = 0;
  let draws = 0;

  matches.forEach((match) => {
    const isMatchup =
      (match.player1Id === player1Id && match.player2Id === player2Id) ||
      (match.player1Id === player2Id && match.player2Id === player1Id);

    if (!isMatchup) return;
    if (!match.winnerId && match.player1Score === null) return;

    if (match.winnerId === player1Id) {
      player1Wins++;
    } else if (match.winnerId === player2Id) {
      player2Wins++;
    } else {
      draws++;
    }
  });

  return { player1Wins, player2Wins, draws };
}
