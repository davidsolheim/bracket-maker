import type { Tournament, PlayerList } from '@/types/tournament';
import { loadTournaments, saveTournaments, loadPlayerLists, savePlayerLists } from './storage';

// Serialized versions of Tournament and PlayerList with dates as strings
type SerializedTournament = Omit<Tournament, 'createdAt' | 'completedAt'> & {
  createdAt: string;
  completedAt: string | null;
};

type SerializedPlayerList = Omit<PlayerList, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export interface BackupData {
  version: number;
  exportedAt: string;
  appName: string;
  data: {
    tournaments: SerializedTournament[];
    playerLists: SerializedPlayerList[];
  };
}

/**
 * Export all tournaments and player lists to a backup JSON string
 */
export function exportFullBackup(): string {
  if (typeof window === 'undefined') {
    throw new Error('Backup can only be created in browser environment');
  }

  const tournaments = loadTournaments();
  const playerLists = loadPlayerLists();

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'bracket-maker',
    data: {
      tournaments: tournaments.map((t) => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
        completedAt: t.completedAt instanceof Date ? t.completedAt.toISOString() : (t.completedAt ? String(t.completedAt) : null),
      })),
      playerLists: playerLists.map((list) => ({
        ...list,
        createdAt: list.createdAt instanceof Date ? list.createdAt.toISOString() : String(list.createdAt),
        updatedAt: list.updatedAt instanceof Date ? list.updatedAt.toISOString() : String(list.updatedAt),
      })),
    },
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Download backup file
 */
export function downloadBackup(): void {
  try {
    const backupJson = exportFullBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bracket-maker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse and validate a backup file
 */
export function parseBackupFile(content: string): BackupData {
  try {
    const parsed = JSON.parse(content) as BackupData;

    // Validate structure
    if (!parsed.version || typeof parsed.version !== 'number') {
      throw new Error('Invalid backup: missing or invalid version field');
    }

    if (!parsed.exportedAt || typeof parsed.exportedAt !== 'string') {
      throw new Error('Invalid backup: missing or invalid exportedAt field');
    }

    if (!parsed.appName || typeof parsed.appName !== 'string') {
      throw new Error('Invalid backup: missing or invalid appName field');
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      throw new Error('Invalid backup: missing or invalid data field');
    }

    if (!Array.isArray(parsed.data.tournaments)) {
      throw new Error('Invalid backup: missing or invalid tournaments array');
    }

    if (!Array.isArray(parsed.data.playerLists)) {
      throw new Error('Invalid backup: missing or invalid playerLists array');
    }

    // Validate tournament structure
    for (const tournament of parsed.data.tournaments) {
      if (!tournament.id || !tournament.name || !tournament.status) {
        throw new Error('Invalid backup: tournament missing required fields');
      }
      if (!Array.isArray(tournament.players) || !Array.isArray(tournament.matches)) {
        throw new Error('Invalid backup: tournament missing players or matches arrays');
      }
    }

    // Validate player list structure
    for (const list of parsed.data.playerLists) {
      if (!list.id || !list.name) {
        throw new Error('Invalid backup: player list missing required fields');
      }
      if (!Array.isArray(list.players)) {
        throw new Error('Invalid backup: player list missing players array');
      }
    }

    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}

/**
 * Restore backup data to localStorage
 * @param backup - Parsed backup data
 * @param mode - 'replace' clears all existing data, 'merge' keeps existing and adds new
 */
export function restoreBackup(backup: BackupData, mode: 'replace' | 'merge'): void {
  if (typeof window === 'undefined') {
    throw new Error('Restore can only be performed in browser environment');
  }

  try {
    // Convert date strings back to Date objects
    const tournaments: Tournament[] = backup.data.tournaments.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      completedAt: t.completedAt ? new Date(t.completedAt) : null,
    }));

    const playerLists: PlayerList[] = backup.data.playerLists.map((list) => ({
      ...list,
      createdAt: new Date(list.createdAt),
      updatedAt: new Date(list.updatedAt),
    }));

    if (mode === 'replace') {
      // Clear and replace all data
      saveTournaments(tournaments);
      savePlayerLists(playerLists);
    } else {
      // Merge mode: keep existing, add new items (skip duplicates by ID)
      const existingTournaments = loadTournaments();
      const existingPlayerLists = loadPlayerLists();

      const tournamentMap = new Map(existingTournaments.map((t) => [t.id, t]));
      tournaments.forEach((t) => {
        if (!tournamentMap.has(t.id)) {
          tournamentMap.set(t.id, t);
        }
      });

      const playerListMap = new Map(existingPlayerLists.map((l) => [l.id, l]));
      playerLists.forEach((l) => {
        if (!playerListMap.has(l.id)) {
          playerListMap.set(l.id, l);
        }
      });

      saveTournaments(Array.from(tournamentMap.values()));
      savePlayerLists(Array.from(playerListMap.values()));
    }
  } catch (error) {
    throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Read a file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
