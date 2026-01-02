import { v4 as uuidv4 } from 'uuid';
import type { Player, Match, BracketType, TournamentFormat, TournamentFormatConfig } from '@/types/tournament';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function calculateNextPowerOf2(n: number): number {
  if (n <= 1) return 2;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export function seedPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => a.seed - b.seed);
}

export function getMatchById(matches: Match[], matchId: string): Match | null {
  return matches.find((m) => m.id === matchId) || null;
}

// ============================================================================
// BRACKET GENERATION - MAIN ENTRY POINT
// ============================================================================

export function generateBracket(
  players: Player[],
  format: TournamentFormat,
  config?: TournamentFormatConfig
): Match[] {
  switch (format) {
    case 'single-elimination':
      return generateSingleEliminationBracket(players);
    case 'double-elimination':
      return generateDoubleEliminationBracket(players);
    case 'round-robin':
      return generateRoundRobinBracket(players);
    case 'swiss':
      return generateSwissFirstRound(players, config?.numberOfRounds);
    case 'group-knockout':
      return generateGroupKnockoutBracket(players, config);
    default:
      return generateDoubleEliminationBracket(players);
  }
}

// ============================================================================
// SINGLE ELIMINATION
// ============================================================================

export function generateSingleEliminationBracket(players: Player[]): Match[] {
  const seededPlayers = seedPlayers(players);
  const bracketSize = calculateNextPowerOf2(seededPlayers.length);
  
  // Generate winners bracket (which is the only bracket for single elim)
  const matches = generateWinnersBracket(seededPlayers, bracketSize);
  
  // Remove loser links since there's no losers bracket
  matches.forEach(match => {
    match.loserNextMatchId = null;
    match.loserNextMatchPosition = null;
  });
  
  return matches;
}

// ============================================================================
// DOUBLE ELIMINATION
// ============================================================================

export function generateDoubleEliminationBracket(players: Player[]): Match[] {
  const seededPlayers = seedPlayers(players);
  const bracketSize = calculateNextPowerOf2(seededPlayers.length);
  const matches: Match[] = [];

  // Generate winners bracket
  const winnersMatches = generateWinnersBracket(seededPlayers, bracketSize);
  matches.push(...winnersMatches);

  // Generate losers bracket
  const losersMatches = generateLosersBracket(bracketSize, winnersMatches);
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

    const isBye = player1Index >= playerCount || player2Index >= playerCount;

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

  // Auto-advance bye matches
  const byeMatches = matches.filter(
    (m) => m.isBye && ((m.player1Id && !m.player2Id) || (!m.player1Id && m.player2Id))
  );
  byeMatches.forEach((match) => {
    match.winnerId = match.player1Id || match.player2Id;
    if (match.nextMatchId && match.winnerId) {
      const nextMatch = matches.find((m) => m.id === match.nextMatchId);
      if (nextMatch) {
        const feedsToPlayer1Slot = match.position % 2 === 1;
        if (feedsToPlayer1Slot) {
          if (!nextMatch.player1Id) {
            nextMatch.player1Id = match.winnerId;
          }
        } else {
          if (!nextMatch.player2Id) {
            nextMatch.player2Id = match.winnerId;
          }
        }
      }
    }
  });

  return matches;
}

function generateLosersBracket(
  bracketSize: number,
  winnersMatches: Match[]
): Match[] {
  const matches: Match[] = [];
  const winnersRounds = Math.log2(bracketSize);
  let matchIdCounter = 0;

  const totalLosersRounds = (winnersRounds - 1) * 2;
  let currentPlayerCount = bracketSize / 2;

  for (let round = 1; round <= totalLosersRounds; round++) {
    let matchesInRound: number;

    if (round === 1) {
      matchesInRound = Math.floor(bracketSize / 4);
      currentPlayerCount = matchesInRound;
    } else if (round % 2 === 0) {
      matchesInRound = currentPlayerCount;
    } else {
      matchesInRound = Math.floor(currentPlayerCount / 2);
      currentPlayerCount = matchesInRound;
    }

    if (matchesInRound === 0 && round <= totalLosersRounds) {
      matchesInRound = 1;
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

    if (round % 2 === 0) {
      currentPlayerCount = matchesInRound;
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
  linkWinnersLosersToLosersBracket(winnersMatches, matches, winnersRounds);

  return matches;
}

function linkWinnersLosersToLosersBracket(
  winnersMatches: Match[],
  losersMatches: Match[],
  rounds: number
): void {
  const winnersRound1 = winnersMatches.filter((m) => m.round === 1);
  const losersRound1 = losersMatches.filter((m) => m.round === 1);

  winnersRound1.forEach((match, index) => {
    const targetIndex = Math.floor(index / 2);
    if (targetIndex < losersRound1.length) {
      match.loserNextMatchId = losersRound1[targetIndex].id;
      match.loserNextMatchPosition = losersRound1[targetIndex].position;
    }
  });

  for (let round = 2; round <= rounds; round++) {
    const winnersRoundMatches = winnersMatches.filter((m) => m.round === round);
    const losersRound = (round - 1) * 2;
    const targetLosersMatches = losersMatches.filter((m) => m.round === losersRound);

    winnersRoundMatches.forEach((match, index) => {
      if (index < targetLosersMatches.length) {
        match.loserNextMatchId = targetLosersMatches[index].id;
        match.loserNextMatchPosition = targetLosersMatches[index].position;
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

  if (finalWinnersMatch) {
    finalWinnersMatch.nextMatchId = grandFinals[0].id;
    finalWinnersMatch.nextMatchPosition = 1;
  }
  if (finalLosersMatch) {
    finalLosersMatch.nextMatchId = grandFinals[0].id;
    finalLosersMatch.nextMatchPosition = 1;
  }

  return grandFinals;
}

// ============================================================================
// ROUND ROBIN
// ============================================================================

export function generateRoundRobinBracket(players: Player[]): Match[] {
  const seededPlayers = seedPlayers(players);
  const matches: Match[] = [];
  const n = seededPlayers.length;

  // Use circle method for round robin scheduling
  // If odd number of players, add a "bye" player
  const playerIds = seededPlayers.map((p) => p.id);
  const hasOddPlayers = n % 2 === 1;
  if (hasOddPlayers) {
    playerIds.push('BYE');
  }

  const numPlayers = playerIds.length;
  const numRounds = numPlayers - 1;
  const halfSize = numPlayers / 2;

  let matchIdCounter = 0;

  for (let round = 1; round <= numRounds; round++) {
    const roundMatches: { p1: string; p2: string }[] = [];

    for (let i = 0; i < halfSize; i++) {
      const home = (round + i) % (numPlayers - 1);
      let away = (numPlayers - 1 - i + round) % (numPlayers - 1);

      if (i === 0) {
        away = numPlayers - 1;
      }

      const player1Id = playerIds[home];
      const player2Id = playerIds[away];

      // Skip bye matches
      if (player1Id === 'BYE' || player2Id === 'BYE') {
        continue;
      }

      roundMatches.push({ p1: player1Id, p2: player2Id });
    }

    roundMatches.forEach((matchup, position) => {
      matches.push({
        id: `rr-r${round}-m${matchIdCounter++}`,
        bracket: 'round-robin',
        round,
        position: position + 1,
        player1Id: matchup.p1,
        player2Id: matchup.p2,
        player1Score: null,
        player2Score: null,
        winnerId: null,
        isBye: false,
        nextMatchId: null,
        nextMatchPosition: null,
        loserNextMatchId: null,
        loserNextMatchPosition: null,
      });
    });
  }

  return matches;
}

// ============================================================================
// SWISS SYSTEM
// ============================================================================

export function generateSwissFirstRound(
  players: Player[],
  totalRounds?: number
): Match[] {
  const seededPlayers = seedPlayers(players);
  const n = seededPlayers.length;
  const matches: Match[] = [];

  // First round: pair by seed (1 vs n, 2 vs n-1, etc.)
  const halfSize = Math.floor(n / 2);
  let matchIdCounter = 0;

  for (let i = 0; i < halfSize; i++) {
    const player1 = seededPlayers[i];
    const player2 = seededPlayers[n - 1 - i];

    matches.push({
      id: `swiss-r1-m${matchIdCounter++}`,
      bracket: 'swiss',
      round: 1,
      position: i + 1,
      player1Id: player1.id,
      player2Id: player2.id,
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

  // If odd number of players, one gets a bye
  if (n % 2 === 1) {
    const byePlayer = seededPlayers[halfSize];
    matches.push({
      id: `swiss-r1-m${matchIdCounter++}`,
      bracket: 'swiss',
      round: 1,
      position: halfSize + 1,
      player1Id: byePlayer.id,
      player2Id: null,
      player1Score: null,
      player2Score: null,
      winnerId: byePlayer.id, // Auto-win for bye
      isBye: true,
      nextMatchId: null,
      nextMatchPosition: null,
      loserNextMatchId: null,
      loserNextMatchPosition: null,
    });
  }

  return matches;
}

export function generateSwissNextRound(
  players: Player[],
  existingMatches: Match[],
  currentRound: number,
  config?: TournamentFormatConfig
): Match[] {
  // Get player records
  const playerRecords = new Map<string, { wins: number; losses: number; opponents: Set<string> }>();

  players.forEach((p) => {
    playerRecords.set(p.id, { wins: 0, losses: 0, opponents: new Set() });
  });

  existingMatches.forEach((match) => {
    if (match.winnerId && match.player1Id && match.player2Id) {
      const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;

      const winnerRecord = playerRecords.get(match.winnerId);
      const loserRecord = playerRecords.get(loserId);

      if (winnerRecord) {
        winnerRecord.wins++;
        winnerRecord.opponents.add(loserId);
      }
      if (loserRecord) {
        loserRecord.losses++;
        loserRecord.opponents.add(match.winnerId);
      }
    }
    // Handle byes
    if (match.isBye && match.winnerId) {
      const record = playerRecords.get(match.winnerId);
      if (record) {
        record.wins++;
      }
    }
  });

  // In qualification mode, exclude players who have already qualified
  const isQualificationMode = config?.winsToQualify !== undefined;
  const winsToQualify = config?.winsToQualify || 3;

  // #region agent log
  fetch('http://127.0.0.1:7254/ingest/87bd214f-3162-4f5e-83f2-30c0aab71339',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/bracket.ts:530',message:'Player records computed',data:{totalPlayers:players.length,isQualificationMode,winsToQualify,playerRecords:Array.from(playerRecords.entries()).map(([id,r])=>({id:id.slice(-4),wins:r.wins,losses:r.losses}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
  // #endregion

  // Sort players by record (wins desc, then by seed)
  let sortedPlayers = [...players].sort((a, b) => {
    const recordA = playerRecords.get(a.id)!;
    const recordB = playerRecords.get(b.id)!;
    if (recordB.wins !== recordA.wins) return recordB.wins - recordA.wins;
    return a.seed - b.seed;
  });

  // Filter out qualified players in qualification mode
  if (isQualificationMode) {
    const beforeFilterCount = sortedPlayers.length;
    sortedPlayers = sortedPlayers.filter((player) => {
      const record = playerRecords.get(player.id);
      return !record || record.wins < winsToQualify;
    });
    // #region agent log
    fetch('http://127.0.0.1:7254/ingest/87bd214f-3162-4f5e-83f2-30c0aab71339',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/bracket.ts:550',message:'Filtered qualified players',data:{beforeFilterCount,afterFilterCount:sortedPlayers.length,winsToQualify},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
  }

  // Pair players with same record, avoiding rematches
  const newMatches: Match[] = [];
  const paired = new Set<string>();
  let matchIdCounter = 0;
  const nextRound = currentRound + 1;

  // #region agent log
  fetch('http://127.0.0.1:7254/ingest/87bd214f-3162-4f5e-83f2-30c0aab71339',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/bracket.ts:557',message:'Pairing start',data:{playerCount:sortedPlayers.length,nextRound},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  for (let i = 0; i < sortedPlayers.length; i++) {
    const player1 = sortedPlayers[i];
    if (paired.has(player1.id)) continue;

    const record1 = playerRecords.get(player1.id)!;

    // Find best opponent (same record, haven't played)
    let opponent: Player | null = null;
    for (let j = i + 1; j < sortedPlayers.length; j++) {
      const candidate = sortedPlayers[j];
      if (paired.has(candidate.id)) continue;
      if (record1.opponents.has(candidate.id)) continue;

      opponent = candidate;
      break;
    }

    if (opponent) {
      paired.add(player1.id);
      paired.add(opponent.id);

      newMatches.push({
        id: `swiss-r${nextRound}-m${matchIdCounter++}`,
        bracket: 'swiss',
        round: nextRound,
        position: newMatches.length + 1,
        player1Id: player1.id,
        player2Id: opponent.id,
        player1Score: null,
        player2Score: null,
        winnerId: null,
        isBye: false,
        nextMatchId: null,
        nextMatchPosition: null,
        loserNextMatchId: null,
        loserNextMatchPosition: null,
      });
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7254/ingest/87bd214f-3162-4f5e-83f2-30c0aab71339',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/bracket.ts:592',message:'No opponent found',data:{player1Id:player1.id,nextRound},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    }
  }

  // Handle any remaining unpaired player (bye)
  const unpaired = sortedPlayers.filter((p) => !paired.has(p.id));
  if (unpaired.length === 1) {
    const byePlayer = unpaired[0];
    newMatches.push({
      id: `swiss-r${nextRound}-m${matchIdCounter++}`,
      bracket: 'swiss',
      round: nextRound,
      position: newMatches.length + 1,
      player1Id: byePlayer.id,
      player2Id: null,
      player1Score: null,
      player2Score: null,
      winnerId: byePlayer.id,
      isBye: true,
      nextMatchId: null,
      nextMatchPosition: null,
      loserNextMatchId: null,
      loserNextMatchPosition: null,
    });
  }

  return newMatches;
}

export function generateKnockoutFromSwiss(
  qualifiedPlayers: Player[],
  config?: TournamentFormatConfig
): Match[] {
  // Seed the qualified players by assigning new seeds based on qualification order
  const seededPlayers = qualifiedPlayers.map((player, index) => ({
    ...player,
    seed: index + 1,
  }));

  // Generate single elimination bracket
  return generateSingleEliminationBracket(seededPlayers);
}

// ============================================================================
// GROUP STAGE + KNOCKOUT
// ============================================================================

export function generateGroupKnockoutBracket(
  players: Player[],
  config?: TournamentFormatConfig
): Match[] {
  const seededPlayers = seedPlayers(players);
  const groupCount = config?.groupCount || Math.min(4, Math.floor(seededPlayers.length / 2));
  const advancePerGroup = config?.advancePerGroup || 2;

  // Assign players to groups using snake draft (for balanced seeding)
  const groups: Player[][] = Array.from({ length: groupCount }, () => []);

  seededPlayers.forEach((player, index) => {
    const round = Math.floor(index / groupCount);
    const groupIndex = round % 2 === 0 ? index % groupCount : groupCount - 1 - (index % groupCount);
    groups[groupIndex].push({ ...player, groupId: `group-${groupIndex + 1}` });
  });

  const matches: Match[] = [];
  let matchIdCounter = 0;

  // Generate round robin matches for each group
  groups.forEach((groupPlayers, groupIndex) => {
    const groupId = `group-${groupIndex + 1}`;
    const n = groupPlayers.length;

    if (n < 2) return;

    // Round robin within group
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        matches.push({
          id: `${groupId}-m${matchIdCounter++}`,
          bracket: 'group',
          round: 1, // All group matches are "round 1" conceptually
          position: matches.length + 1,
          player1Id: groupPlayers[i].id,
          player2Id: groupPlayers[j].id,
          player1Score: null,
          player2Score: null,
          winnerId: null,
          isBye: false,
          groupId,
          nextMatchId: null,
          nextMatchPosition: null,
          loserNextMatchId: null,
          loserNextMatchPosition: null,
        });
      }
    }
  });

  // Knockout bracket will be generated when group stage completes
  // For now, we only generate group stage matches

  return matches;
}

export function generateKnockoutFromGroups(
  players: Player[],
  groupMatches: Match[],
  config?: TournamentFormatConfig
): Match[] {
  const advancePerGroup = config?.advancePerGroup || 2;
  const knockoutFormat = config?.knockoutFormat || 'single-elimination';

  // Calculate standings for each group
  const groupIds = [...new Set(groupMatches.map((m) => m.groupId).filter(Boolean))] as string[];
  const advancingPlayers: Player[] = [];

  groupIds.forEach((groupId) => {
    const groupMatchList = groupMatches.filter((m) => m.groupId === groupId);
    const standings = calculateGroupStandings(groupMatchList, players);

    // Take top N from this group
    const topPlayers = standings.slice(0, advancePerGroup);
    topPlayers.forEach((standing) => {
      const player = players.find((p) => p.id === standing.playerId);
      if (player) {
        advancingPlayers.push(player);
      }
    });
  });

  // Seed advancing players (alternate from groups for balanced bracket)
  const seededAdvancing = advancingPlayers.map((p, idx) => ({
    ...p,
    seed: idx + 1,
  }));

  if (knockoutFormat === 'double-elimination') {
    return generateDoubleEliminationBracket(seededAdvancing);
  }

  return generateSingleEliminationBracket(seededAdvancing);
}

function calculateGroupStandings(
  matches: Match[],
  players: Player[]
): { playerId: string; wins: number; pointDiff: number }[] {
  const standings = new Map<string, { wins: number; pointsFor: number; pointsAgainst: number }>();

  matches.forEach((match) => {
    if (match.player1Id && !standings.has(match.player1Id)) {
      standings.set(match.player1Id, { wins: 0, pointsFor: 0, pointsAgainst: 0 });
    }
    if (match.player2Id && !standings.has(match.player2Id)) {
      standings.set(match.player2Id, { wins: 0, pointsFor: 0, pointsAgainst: 0 });
    }

    if (match.winnerId && match.player1Score !== null && match.player2Score !== null) {
      const winner = standings.get(match.winnerId);
      if (winner) winner.wins++;

      const p1 = standings.get(match.player1Id!);
      const p2 = standings.get(match.player2Id!);

      if (p1) {
        p1.pointsFor += match.player1Score;
        p1.pointsAgainst += match.player2Score;
      }
      if (p2) {
        p2.pointsFor += match.player2Score;
        p2.pointsAgainst += match.player1Score;
      }
    }
  });

  return Array.from(standings.entries())
    .map(([playerId, data]) => ({
      playerId,
      wins: data.wins,
      pointDiff: data.pointsFor - data.pointsAgainst,
    }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.pointDiff - a.pointDiff;
    });
}

// ============================================================================
// MATCH RESULT UPDATES
// ============================================================================

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
  match.winnerId = player1Score > player2Score ? match.player1Id : match.player2Id;

  // For round-robin, swiss, and group matches - no advancement logic needed
  if (match.bracket === 'round-robin' || match.bracket === 'swiss' || match.bracket === 'group') {
    return updatedMatches;
  }

  // Advance winner to next match
  if (match.nextMatchId && match.winnerId) {
    const nextMatch = getMatchById(updatedMatches, match.nextMatchId);
    if (nextMatch) {
      if (nextMatch.bracket === 'grand-finals' && nextMatch.round === 1) {
        if (match.bracket === 'winners') {
          nextMatch.player1Id = match.winnerId;
        } else if (match.bracket === 'losers') {
          nextMatch.player2Id = match.winnerId;
        }
      } else {
        if (!nextMatch.player1Id) {
          nextMatch.player1Id = match.winnerId;
        } else if (!nextMatch.player2Id) {
          nextMatch.player2Id = match.winnerId;
        }
      }
    }
  }

  // Advance loser to losers bracket (double elimination only)
  if (match.bracket === 'winners' && match.loserNextMatchId && match.winnerId) {
    const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
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
    const finalWinnersMatch = updatedMatches
      .filter((m) => m.bracket === 'winners')
      .sort((a, b) => b.round - a.round)[0];

    const winnerFromLosers = match.winnerId === match.player2Id;

    if (winnerFromLosers && match.nextMatchId) {
      const bracketResetMatch = getMatchById(updatedMatches, match.nextMatchId);
      if (bracketResetMatch && finalWinnersMatch) {
        bracketResetMatch.player1Id = finalWinnersMatch.winnerId;
        bracketResetMatch.player2Id = match.winnerId;
      }
    }
  }

  return updatedMatches;
}

export function resetDownstreamMatches(matches: Match[], matchId: string): Match[] {
  const updatedMatches = [...matches];
  const match = getMatchById(updatedMatches, matchId);
  if (!match) return updatedMatches;

  // Reset the current match
  match.player1Score = null;
  match.player2Score = null;
  match.winnerId = null;

  // For non-bracket formats, no downstream to reset
  if (match.bracket === 'round-robin' || match.bracket === 'swiss' || match.bracket === 'group') {
    return updatedMatches;
  }

  const matchesToReset = new Set<string>();

  const findDependentMatches = (sourceMatchId: string) => {
    updatedMatches.forEach((m) => {
      if (
        (m.nextMatchId === sourceMatchId || m.loserNextMatchId === sourceMatchId) &&
        !matchesToReset.has(m.id)
      ) {
        matchesToReset.add(m.id);
        findDependentMatches(m.id);
      }
    });
  };

  if (match.nextMatchId) {
    matchesToReset.add(match.nextMatchId);
    findDependentMatches(match.nextMatchId);
  }

  if (match.loserNextMatchId) {
    matchesToReset.add(match.loserNextMatchId);
    findDependentMatches(match.loserNextMatchId);
  }

  matchesToReset.forEach((id) => {
    const m = getMatchById(updatedMatches, id);
    if (m) {
      const sourceMatch = getMatchById(updatedMatches, matchId);
      if (sourceMatch?.winnerId) {
        if (m.player1Id === sourceMatch.winnerId) {
          m.player1Id = null;
        }
        if (m.player2Id === sourceMatch.winnerId) {
          m.player2Id = null;
        }
        if (match.bracket === 'winners' && match.loserNextMatchId === m.id) {
          const loserId =
            sourceMatch.winnerId === sourceMatch.player1Id
              ? sourceMatch.player2Id
              : sourceMatch.player1Id;
          if (loserId) {
            if (m.player1Id === loserId) m.player1Id = null;
            if (m.player2Id === loserId) m.player2Id = null;
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

export function forceMatchWinner(
  matches: Match[],
  matchId: string,
  winnerId: string,
  isForfeited: boolean = false
): Match[] {
  const updatedMatches = [...matches];
  const matchIndex = updatedMatches.findIndex((m) => m.id === matchId);
  if (matchIndex === -1) return updatedMatches;

  const match = updatedMatches[matchIndex];

  if (match.player1Id !== winnerId && match.player2Id !== winnerId) {
    return updatedMatches;
  }

  match.winnerId = winnerId;
  match.isForfeited = isForfeited;

  // For non-bracket formats, no advancement needed
  if (match.bracket === 'round-robin' || match.bracket === 'swiss' || match.bracket === 'group') {
    return updatedMatches;
  }

  if (match.nextMatchId && match.winnerId) {
    const nextMatch = getMatchById(updatedMatches, match.nextMatchId);
    if (nextMatch) {
      if (nextMatch.bracket === 'grand-finals' && nextMatch.round === 1) {
        if (match.bracket === 'winners') {
          nextMatch.player1Id = match.winnerId;
        } else if (match.bracket === 'losers') {
          nextMatch.player2Id = match.winnerId;
        }
      } else {
        if (!nextMatch.player1Id) {
          nextMatch.player1Id = match.winnerId;
        } else if (!nextMatch.player2Id) {
          nextMatch.player2Id = match.winnerId;
        }
      }
    }
  }

  if (match.bracket === 'winners' && match.loserNextMatchId && match.winnerId) {
    const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
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

  return updatedMatches;
}

export function overrideMatchPlayers(
  matches: Match[],
  matchId: string,
  player1Id: string | null,
  player2Id: string | null
): Match[] {
  const updatedMatches = [...matches];
  const matchIndex = updatedMatches.findIndex((m) => m.id === matchId);
  if (matchIndex === -1) return updatedMatches;

  const match = updatedMatches[matchIndex];

  if (match.winnerId) {
    return updatedMatches;
  }

  match.player1Id = player1Id;
  match.player2Id = player2Id;
  match.isBye = (player1Id === null || player2Id === null) && (player1Id !== null || player2Id !== null);

  return updatedMatches;
}
