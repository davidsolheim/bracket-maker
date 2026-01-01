import { v4 as uuidv4 } from 'uuid';
import type { Player, Match, BracketType } from '@/types/tournament';

export function calculateNextPowerOf2(n: number): number {
  if (n <= 1) return 2;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export function seedPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => a.seed - b.seed);
}

export function generateDoubleEliminationBracket(
  players: Player[]
): Match[] {
  const seededPlayers = seedPlayers(players);
  const playerCount = seededPlayers.length;
  const bracketSize = calculateNextPowerOf2(playerCount);
  const matches: Match[] = [];

  // Generate winners bracket
  const winnersMatches = generateWinnersBracket(seededPlayers, bracketSize);
  matches.push(...winnersMatches);

  // Generate losers bracket
  const losersMatches = generateLosersBracket(
    seededPlayers,
    bracketSize,
    winnersMatches
  );
  matches.push(...losersMatches);

  // Generate grand finals
  const grandFinals = generateGrandFinals(winnersMatches, losersMatches);
  matches.push(...grandFinals);

  return matches;
}

function generateWinnersBracket(
  players: Player[],
  bracketSize: number
): Match[] {
  const matches: Match[] = [];
  const playerCount = players.length;
  const rounds = Math.log2(bracketSize);
  let matchIdCounter = 0;

  // Round 1: Initial matches with byes
  const round1Matches = Math.floor(bracketSize / 2);
  for (let i = 0; i < round1Matches; i++) {
    const position = i + 1;
    const player1Index = i * 2;
    const player2Index = i * 2 + 1;

    const isBye =
      player1Index >= playerCount || player2Index >= playerCount;

    matches.push({
      id: `winners-r1-m${matchIdCounter++}`,
      bracket: 'winners',
      round: 1,
      position,
      player1Id: player1Index < playerCount ? players[player1Index].id : null,
      player2Id: player2Index < playerCount ? players[player2Index].id : null,
      player1Score: null,
      player2Score: null,
      winnerId: null,
      isBye,
      nextMatchId: null,
      nextMatchPosition: null,
      loserNextMatchId: null,
      loserNextMatchPosition: null,
    });
  }

  // Subsequent rounds
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.floor(bracketSize / Math.pow(2, round));
    for (let i = 0; i < matchesInRound; i++) {
      const position = i + 1;
      matches.push({
        id: `winners-r${round}-m${matchIdCounter++}`,
        bracket: 'winners',
        round,
        position,
        player1Id: null,
        player2Id: null,
        player1Score: null,
        player2Score: null,
        winnerId: null,
        isBye: false,
        nextMatchId: null,
        nextMatchPosition: null,
        loserNextMatchId: null,
        loserNextMatchPosition: null,
      });
    }
  }

  // Link matches - winners advance to next round
  for (let round = 1; round < rounds; round++) {
    const currentRoundMatches = matches.filter(
      (m) => m.bracket === 'winners' && m.round === round
    );
    const nextRoundMatches = matches.filter(
      (m) => m.bracket === 'winners' && m.round === round + 1
    );

    currentRoundMatches.forEach((match, index) => {
      const nextMatchIndex = Math.floor(index / 2);
      if (nextMatchIndex < nextRoundMatches.length) {
        match.nextMatchId = nextRoundMatches[nextMatchIndex].id;
        match.nextMatchPosition = nextRoundMatches[nextMatchIndex].position;
      }
    });
  }

  return matches;
}

function generateLosersBracket(
  players: Player[],
  bracketSize: number,
  winnersMatches: Match[]
): Match[] {
  const matches: Match[] = [];
  const rounds = Math.log2(bracketSize);
  let matchIdCounter = 0;

  // Losers bracket has more rounds due to feed-ins from winners bracket
  const totalLosersRounds = rounds * 2 - 1;

  // Generate all losers bracket rounds
  for (let round = 1; round <= totalLosersRounds; round++) {
    let matchesInRound = 0;

    if (round === 1) {
      // First losers round: losers from first winners round
      matchesInRound = Math.floor(bracketSize / 4);
    } else if (round <= rounds - 1) {
      // Early rounds: feed from winners bracket losers
      matchesInRound = Math.floor(bracketSize / Math.pow(2, round + 1));
    } else {
      // Later rounds: consolidation
      matchesInRound = Math.floor(bracketSize / Math.pow(2, round));
    }

    for (let i = 0; i < matchesInRound; i++) {
      const position = i + 1;
      matches.push({
        id: `losers-r${round}-m${matchIdCounter++}`,
        bracket: 'losers',
        round,
        position,
        player1Id: null,
        player2Id: null,
        player1Score: null,
        player2Score: null,
        winnerId: null,
        isBye: false,
        nextMatchId: null,
        nextMatchPosition: null,
        loserNextMatchId: null,
        loserNextMatchPosition: null,
      });
    }
  }

  // Link losers bracket matches
  for (let round = 1; round < totalLosersRounds; round++) {
    const currentRoundMatches = matches.filter(
      (m) => m.bracket === 'losers' && m.round === round
    );
    const nextRoundMatches = matches.filter(
      (m) => m.bracket === 'losers' && m.round === round + 1
    );

    currentRoundMatches.forEach((match, index) => {
      const nextMatchIndex = Math.floor(index / 2);
      if (nextMatchIndex < nextRoundMatches.length) {
        match.nextMatchId = nextRoundMatches[nextMatchIndex].id;
        match.nextMatchPosition = nextRoundMatches[nextMatchIndex].position;
      }
    });
  }

  // Link winners bracket losers to losers bracket
  linkWinnersLosersToLosersBracket(winnersMatches, matches, rounds);

  return matches;
}

function linkWinnersLosersToLosersBracket(
  winnersMatches: Match[],
  losersMatches: Match[],
  rounds: number
): void {
  // Link losers from winners bracket round 1 to losers bracket round 1
  const winnersRound1 = winnersMatches.filter((m) => m.round === 1);
  const losersRound1 = losersMatches.filter((m) => m.round === 1);

  winnersRound1.forEach((match, index) => {
    if (index < losersRound1.length) {
      match.loserNextMatchId = losersRound1[index].id;
      match.loserNextMatchPosition = losersRound1[index].position;
    }
  });

  // Link losers from subsequent winners rounds to appropriate losers rounds
  for (let round = 2; round <= rounds; round++) {
    const winnersRoundMatches = winnersMatches.filter(
      (m) => m.round === round
    );
    const losersRound = round === rounds ? rounds - 1 : round;
    const targetLosersMatches = losersMatches.filter(
      (m) => m.round === losersRound
    );

    winnersRoundMatches.forEach((match, index) => {
      const targetIndex = Math.floor(index / 2);
      if (targetIndex < targetLosersMatches.length) {
        match.loserNextMatchId = targetLosersMatches[targetIndex].id;
        match.loserNextMatchPosition =
          targetLosersMatches[targetIndex].position;
      }
    });
  }
}

function generateGrandFinals(
  winnersMatches: Match[],
  losersMatches: Match[]
): Match[] {
  const finalWinnersMatch = winnersMatches
    .filter((m) => m.bracket === 'winners')
    .sort((a, b) => b.round - a.round)[0];

  const finalLosersMatch = losersMatches
    .filter((m) => m.bracket === 'losers')
    .sort((a, b) => b.round - a.round)[0];

  const grandFinals: Match[] = [
    {
      id: 'grand-finals-1',
      bracket: 'grand-finals',
      round: 1,
      position: 1,
      player1Id: null,
      player2Id: null,
      player1Score: null,
      player2Score: null,
      winnerId: null,
      isBye: false,
      nextMatchId: 'grand-finals-2',
      nextMatchPosition: 2,
      loserNextMatchId: null,
      loserNextMatchPosition: null,
    },
    {
      id: 'grand-finals-2',
      bracket: 'grand-finals',
      round: 2,
      position: 2,
      player1Id: null,
      player2Id: null,
      player1Score: null,
      player2Score: null,
      winnerId: null,
      isBye: false,
      nextMatchId: null,
      nextMatchPosition: null,
      loserNextMatchId: null,
      loserNextMatchPosition: null,
    },
  ];

  // Link final matches to grand finals
  // Winners bracket champion goes to player1 slot
  // Losers bracket champion goes to player2 slot
  if (finalWinnersMatch) {
    finalWinnersMatch.nextMatchId = grandFinals[0].id;
    finalWinnersMatch.nextMatchPosition = 1;
    // Set player1Id when winners bracket final is complete
  }
  if (finalLosersMatch) {
    finalLosersMatch.nextMatchId = grandFinals[0].id;
    finalLosersMatch.nextMatchPosition = 1;
    // Set player2Id when losers bracket final is complete
  }

  return grandFinals;
}

export function getMatchById(matches: Match[], matchId: string): Match | null {
  return matches.find((m) => m.id === matchId) || null;
}

export function updateMatchResult(
  matches: Match[],
  matchId: string,
  player1Score: number,
  player2Score: number
): Match[] {
  const updatedMatches = [...matches];
  const matchIndex = updatedMatches.findIndex((m) => m.id === matchId);
  if (matchIndex === -1) return updatedMatches;

  const match = updatedMatches[matchIndex];
  match.player1Score = player1Score;
  match.player2Score = player2Score;
  match.winnerId =
    player1Score > player2Score ? match.player1Id : match.player2Id;

  // Advance winner to next match
  if (match.nextMatchId && match.winnerId) {
    const nextMatch = getMatchById(updatedMatches, match.nextMatchId);
    if (nextMatch) {
      // For grand finals, winners bracket champion goes to player1, losers to player2
      if (nextMatch.bracket === 'grand-finals' && nextMatch.round === 1) {
        if (match.bracket === 'winners') {
          nextMatch.player1Id = match.winnerId;
        } else if (match.bracket === 'losers') {
          nextMatch.player2Id = match.winnerId;
        }
      } else {
        // Regular bracket progression
        if (!nextMatch.player1Id) {
          nextMatch.player1Id = match.winnerId;
        } else if (!nextMatch.player2Id) {
          nextMatch.player2Id = match.winnerId;
        }
      }
    }
  }

  // Advance loser to losers bracket (if applicable)
  if (
    match.bracket === 'winners' &&
    match.loserNextMatchId &&
    match.winnerId
  ) {
    const loserId =
      match.winnerId === match.player1Id
        ? match.player2Id
        : match.player1Id;
    if (loserId) {
      const loserMatch = getMatchById(updatedMatches, match.loserNextMatchId);
      if (loserMatch) {
        if (!loserMatch.player1Id) {
          loserMatch.player1Id = loserId;
        } else if (!loserMatch.player2Id) {
          loserMatch.player2Id = loserId;
        }
      }
    }
  }

  // Handle grand finals bracket reset
  if (match.bracket === 'grand-finals' && match.round === 1 && match.winnerId) {
    // If losers bracket winner wins first grand finals, need bracket reset
    const finalWinnersMatch = updatedMatches
      .filter((m) => m.bracket === 'winners')
      .sort((a, b) => b.round - a.round)[0];
    const finalLosersMatch = updatedMatches
      .filter((m) => m.bracket === 'losers')
      .sort((a, b) => b.round - a.round)[0];

    // Check if winner came from losers bracket
    const winnerFromLosers =
      finalLosersMatch && finalLosersMatch.winnerId === match.winnerId;

    if (winnerFromLosers && match.nextMatchId) {
      const bracketResetMatch = getMatchById(updatedMatches, match.nextMatchId);
      if (bracketResetMatch && finalWinnersMatch) {
        // Winners bracket champion vs losers bracket champion (who won first match)
        bracketResetMatch.player1Id = finalWinnersMatch.winnerId;
        bracketResetMatch.player2Id = match.winnerId;
      }
    }
  }

  return updatedMatches;
}

export function resetDownstreamMatches(
  matches: Match[],
  matchId: string
): Match[] {
  const updatedMatches = [...matches];
  const match = getMatchById(updatedMatches, matchId);
  if (!match) return updatedMatches;

  // Reset the current match
  match.player1Score = null;
  match.player2Score = null;
  match.winnerId = null;

  // Find and reset matches that depend on this match
  const matchesToReset = new Set<string>();

  // Find matches that have this match's winner as a player
  const findDependentMatches = (sourceMatchId: string) => {
    updatedMatches.forEach((m) => {
      if (
        (m.nextMatchId === sourceMatchId ||
          m.loserNextMatchId === sourceMatchId) &&
        !matchesToReset.has(m.id)
      ) {
        matchesToReset.add(m.id);
        findDependentMatches(m.id);
      }
    });
  };

  // Find matches that receive players from this match
  if (match.nextMatchId) {
    matchesToReset.add(match.nextMatchId);
    findDependentMatches(match.nextMatchId);
  }

  if (match.loserNextMatchId) {
    matchesToReset.add(match.loserNextMatchId);
    findDependentMatches(match.loserNextMatchId);
  }

  // Reset all dependent matches
  matchesToReset.forEach((id) => {
    const m = getMatchById(updatedMatches, id);
    if (m) {
      // Only reset playerIds if they came from the source match
      const sourceMatch = getMatchById(updatedMatches, matchId);
      if (sourceMatch?.winnerId) {
        if (m.player1Id === sourceMatch.winnerId) {
          m.player1Id = null;
        }
        if (m.player2Id === sourceMatch.winnerId) {
          m.player2Id = null;
        }
        // Also check for loser advancement
        if (match.bracket === 'winners' && match.loserNextMatchId === m.id) {
          const loserId =
            sourceMatch.winnerId === sourceMatch.player1Id
              ? sourceMatch.player2Id
              : sourceMatch.player1Id;
          if (loserId) {
            if (m.player1Id === loserId) {
              m.player1Id = null;
            }
            if (m.player2Id === loserId) {
              m.player2Id = null;
            }
          }
        }
      }
      m.player1Score = null;
      m.player2Score = null;
      m.winnerId = null;
    }
  });

  return updatedMatches;
}
