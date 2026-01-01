import type { PlayerList } from '@/types/tournament';

export interface ImportedPlayerList {
  name: string;
  players: string[];
}

/**
 * Export a player list to CSV format
 */
export function exportToCSV(playerList: PlayerList): string {
  const header = 'name\n';
  const rows = playerList.players.map((p) => p.name).join('\n');
  return header + rows;
}

/**
 * Export a player list to JSON format
 */
export function exportToJSON(playerList: PlayerList): string {
  const json: ImportedPlayerList = {
    name: playerList.name,
    players: playerList.players.map((p) => p.name),
  };
  return JSON.stringify(json, null, 2);
}

/**
 * Download a file with the given content and filename
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV content into an array of player names
 */
export function parseCSV(content: string): string[] {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];
  
  // Skip header if it exists
  const startIndex = lines[0].toLowerCase().trim() === 'name' ? 1 : 0;
  
  return lines
    .slice(startIndex)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Parse JSON content into an ImportedPlayerList
 */
export function parseJSON(content: string): ImportedPlayerList {
  try {
    const parsed = JSON.parse(content) as ImportedPlayerList;
    
    // Validate structure
    if (!parsed.name || typeof parsed.name !== 'string') {
      throw new Error('Invalid JSON: missing or invalid "name" field');
    }
    
    if (!Array.isArray(parsed.players)) {
      throw new Error('Invalid JSON: missing or invalid "players" array');
    }
    
    // Ensure all players are strings
    parsed.players = parsed.players
      .map((p) => String(p).trim())
      .filter((p) => p.length > 0);
    
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
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
