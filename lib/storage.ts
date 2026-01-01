import type { Tournament, PlayerList } from '@/types/tournament';

const STORAGE_KEY = 'bracket-maker-tournaments';
const PLAYER_LISTS_STORAGE_KEY = 'bracket-maker-player-lists';

export function saveTournaments(tournaments: Tournament[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(tournaments);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save tournaments:', error);
  }
}

export function loadTournaments(): Tournament[] {
  if (typeof window === 'undefined') return [];
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return [];
    const tournaments = JSON.parse(serialized) as Tournament[];
    // Convert date strings back to Date objects
    return tournaments.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      completedAt: t.completedAt ? new Date(t.completedAt) : null,
    }));
  } catch (error) {
    console.error('Failed to load tournaments:', error);
    return [];
  }
}

export function saveTournament(tournament: Tournament): void {
  const tournaments = loadTournaments();
  const index = tournaments.findIndex((t) => t.id === tournament.id);
  if (index >= 0) {
    tournaments[index] = tournament;
  } else {
    tournaments.push(tournament);
  }
  saveTournaments(tournaments);
}

export function getTournament(id: string): Tournament | null {
  const tournaments = loadTournaments();
  return tournaments.find((t) => t.id === id) || null;
}

export function deleteTournament(id: string): void {
  const tournaments = loadTournaments();
  const filtered = tournaments.filter((t) => t.id !== id);
  saveTournaments(filtered);
}

export function savePlayerLists(playerLists: PlayerList[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(playerLists);
    localStorage.setItem(PLAYER_LISTS_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save player lists:', error);
  }
}

export function loadPlayerLists(): PlayerList[] {
  if (typeof window === 'undefined') return [];
  try {
    const serialized = localStorage.getItem(PLAYER_LISTS_STORAGE_KEY);
    if (!serialized) return [];
    const playerLists = JSON.parse(serialized) as PlayerList[];
    // Convert date strings back to Date objects
    return playerLists.map((list) => ({
      ...list,
      createdAt: new Date(list.createdAt),
      updatedAt: new Date(list.updatedAt),
    }));
  } catch (error) {
    console.error('Failed to load player lists:', error);
    return [];
  }
}

export function savePlayerList(playerList: PlayerList): void {
  const playerLists = loadPlayerLists();
  const index = playerLists.findIndex((l) => l.id === playerList.id);
  if (index >= 0) {
    playerLists[index] = playerList;
  } else {
    playerLists.push(playerList);
  }
  savePlayerLists(playerLists);
}

export function getPlayerList(id: string): PlayerList | null {
  const playerLists = loadPlayerLists();
  return playerLists.find((l) => l.id === id) || null;
}

export function deletePlayerList(id: string): void {
  const playerLists = loadPlayerLists();
  const filtered = playerLists.filter((l) => l.id !== id);
  savePlayerLists(filtered);
}
