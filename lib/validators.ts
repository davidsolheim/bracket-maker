import { z } from 'zod';
import type { Tournament, Player, Match, PlayerList } from '@/types/tournament';

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  seed: z.number().int().positive(),
  wins: z.number().int().nonnegative().optional(),
  losses: z.number().int().nonnegative().optional(),
});

export const MatchSchema = z.object({
  id: z.string(),
  bracket: z.enum(['winners', 'losers', 'grand-finals']),
  round: z.number().int().positive(),
  position: z.number().int().positive(),
  player1Id: z.string().nullable(),
  player2Id: z.string().nullable(),
  player1Score: z.number().int().nonnegative().nullable(),
  player2Score: z.number().int().nonnegative().nullable(),
  winnerId: z.string().nullable(),
  isBye: z.boolean(),
  nextMatchId: z.string().nullable(),
  nextMatchPosition: z.number().int().positive().nullable(),
  loserNextMatchId: z.string().nullable(),
  loserNextMatchPosition: z.number().int().positive().nullable(),
});

export const TournamentSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  status: z.enum(['draft', 'active', 'completed']),
  players: z.array(PlayerSchema),
  matches: z.array(MatchSchema),
  createdAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
});

export const PlayerListSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  players: z.array(z.object({ name: z.string().min(1) })),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export function validateTournament(data: unknown): Tournament | null {
  const result = TournamentSchema.safeParse(data);
  if (result.success) {
    return result.data;
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
