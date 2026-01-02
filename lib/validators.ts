import { z } from 'zod';
import type { Tournament, Player, Match, PlayerList, TournamentFormat } from '@/types/tournament';

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  seed: z.number().int().positive(),
  wins: z.number().int().nonnegative().optional(),
  losses: z.number().int().nonnegative().optional(),
  groupId: z.string().optional(),
});

export const MatchSchema = z.object({
  id: z.string(),
  bracket: z.enum(['winners', 'losers', 'grand-finals', 'round-robin', 'swiss', 'group']),
  round: z.number().int().positive(),
  position: z.number().int().positive(),
  player1Id: z.string().nullable(),
  player2Id: z.string().nullable(),
  player1Score: z.number().int().nonnegative().nullable(),
  player2Score: z.number().int().nonnegative().nullable(),
  winnerId: z.string().nullable(),
  isBye: z.boolean(),
  isForfeited: z.boolean().optional(),
  notes: z.string().optional(),
  nextMatchId: z.string().nullable(),
  nextMatchPosition: z.number().int().positive().nullable(),
  loserNextMatchId: z.string().nullable(),
  loserNextMatchPosition: z.number().int().positive().nullable(),
  groupId: z.string().optional(),
});

export const TournamentFormatConfigSchema = z.object({
  numberOfRounds: z.number().int().positive().optional(),
  winsToQualify: z.number().int().positive().optional(),
  qualifyingPlayers: z.number().int().positive().optional(),
  groupCount: z.number().int().positive().optional(),
  playersPerGroup: z.number().int().positive().optional(),
  advancePerGroup: z.number().int().positive().optional(),
  knockoutFormat: z.enum(['single-elimination', 'double-elimination']).optional(),
}).optional();

export const TournamentSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  format: z.enum(['single-elimination', 'double-elimination', 'round-robin', 'swiss', 'group-knockout']).optional(),
  formatConfig: TournamentFormatConfigSchema,
  status: z.enum(['draft', 'active', 'completed']),
  players: z.array(PlayerSchema),
  matches: z.array(MatchSchema),
  createdAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
  groupStageComplete: z.boolean().optional(),
  swissQualificationComplete: z.boolean().optional(),
  currentSwissRound: z.number().int().positive().optional(),
});

export const PlayerListSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  players: z.array(z.object({ name: z.string().min(1) })),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Migrate old tournament data to include format field
 * Existing tournaments without format are assumed to be double-elimination
 */
function migrateTournament(data: any): any {
  if (!data.format) {
    // Infer format from existing matches if possible
    const matches = data.matches || [];
    const hasLosers = matches.some((m: any) => m.bracket === 'losers');
    const hasGrandFinals = matches.some((m: any) => m.bracket === 'grand-finals');
    const hasRoundRobin = matches.some((m: any) => m.bracket === 'round-robin');
    const hasSwiss = matches.some((m: any) => m.bracket === 'swiss');
    const hasGroup = matches.some((m: any) => m.bracket === 'group');

    let format: TournamentFormat = 'double-elimination';

    if (hasRoundRobin) {
      format = 'round-robin';
    } else if (hasSwiss) {
      format = 'swiss';
    } else if (hasGroup) {
      format = 'group-knockout';
    } else if (hasLosers || hasGrandFinals) {
      format = 'double-elimination';
    } else if (matches.length > 0) {
      // Only winners bracket - could be single elim
      format = 'single-elimination';
    }

    return { ...data, format };
  }
  return data;
}

export function validateTournament(data: unknown): Tournament | null {
  // Apply migration first
  const migratedData = migrateTournament(data);
  
  const result = TournamentSchema.safeParse(migratedData);
  if (result.success) {
    // Ensure format has a default value
    return {
      ...result.data,
      format: result.data.format || 'double-elimination',
    } as Tournament;
  }
  console.warn('Invalid tournament data:', result.error);
  return null;
}

export function validateTournaments(data: unknown): Tournament[] {
  if (!Array.isArray(data)) {
    return [];
  }
  const validated: Tournament[] = [];
  for (const item of data) {
    const tournament = validateTournament(item);
    if (tournament) {
      validated.push(tournament);
    }
  }
  return validated;
}

export function validatePlayerList(data: unknown): PlayerList | null {
  const result = PlayerListSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.warn('Invalid player list data:', result.error);
  return null;
}

export function validatePlayerLists(data: unknown): PlayerList[] {
  if (!Array.isArray(data)) {
    return [];
  }
  const validated: PlayerList[] = [];
  for (const item of data) {
    const list = validatePlayerList(item);
    if (list) {
      validated.push(list);
    }
  }
  return validated;
}
