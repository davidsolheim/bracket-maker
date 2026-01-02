import type { Tournament, Match, Player } from '@/types/tournament';

export function exportToJSON(tournament: Tournament): string {
  const exportData = {
    ...tournament,
    createdAt: tournament.createdAt.toISOString(),
    completedAt: tournament.completedAt?.toISOString() || null,
  };
  return JSON.stringify(exportData, null, 2);
}

export function exportToCSV(tournament: Tournament): string {
  const headers = [
    'Match ID',
    'Bracket',
    'Round',
    'Position',
    'Player 1',
    'Player 1 Score',
    'Player 2',
    'Player 2 Score',
    'Winner',
  ];

  const rows = tournament.matches.map((match) => {
    const player1 = tournament.players.find((p) => p.id === match.player1Id);
    const player2 = tournament.players.find((p) => p.id === match.player2Id);
    const winner = tournament.players.find((p) => p.id === match.winnerId);

    return [
      match.id,
      match.bracket,
      match.round.toString(),
      match.position.toString(),
      player1?.name || 'TBD',
      match.player1Score?.toString() || '',
      player2?.name || 'TBD',
      match.player2Score?.toString() || '',
      winner?.name || '',
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
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

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTournamentJSON(tournament: Tournament) {
  const json = exportToJSON(tournament);
  const filename = `${tournament.name.replace(/[^a-z0-9]/gi, '_')}_${tournament.id}.json`;
  downloadFile(json, filename, 'application/json');
}

export function exportTournamentCSV(tournament: Tournament) {
  const csv = exportToCSV(tournament);
  const filename = `${tournament.name.replace(/[^a-z0-9]/gi, '_')}_${tournament.id}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_');
}

// Note: exportTournamentImage is now handled directly in the ReactFlowBracket component
// This function is kept for backward compatibility but is deprecated
export async function exportTournamentImage(
  element: HTMLElement,
  tournamentName: string
): Promise<void> {
  console.warn('exportTournamentImage is deprecated. Use ReactFlowBracket ref exportToBlob method instead.');

  // Fallback implementation using html-to-image
  try {
    const { toPng } = await import('html-to-image');

    const isDarkMode =
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const backgroundColor = isDarkMode ? '#111827' : '#ffffff';

    const dataUrl = await toPng(element, {
      backgroundColor,
      pixelRatio: 2,
      quality: 1.0,
    });

    const link = document.createElement('a');
    link.download = `${sanitizeFilename(tournamentName)}_bracket.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to export image:', error);
    throw error;
  }
}
