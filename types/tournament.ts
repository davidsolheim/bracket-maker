export type BracketType = 'winners' | 'losers' | 'grand-finals' | 'round-robin' | 'swiss' | 'group';

export type TournamentStatus = 'draft' | 'active' | 'completed';

export type TournamentFormat = 
  | 'single-elimination' 
  | 'double-elimination' 
  | 'round-robin' 
  | 'swiss' 
  | 'group-knockout';

export interface TournamentFormatConfig {
  // Swiss system - legacy fixed rounds mode
  numberOfRounds?: number;
  // Swiss system - win-based qualification mode
  winsToQualify?: number;
  qualifyingPlayers?: number;
  // Group Stage
  groupCount?: number;
  playersPerGroup?: number;
  advancePerGroup?: number;
  knockoutFormat?: 'single-elimination' | 'double-elimination';
}

export interface Player {
  id: string;
  name: string;
  seed: number;
  wins?: number;
  losses?: number;
  // For group stage tournaments
  groupId?: string;
}

export interface Match {
  id: string;
  bracket: BracketType;
  round: number;
  position: number;
  player1Id: string | null;
  player2Id: string | null;
  player1Score: number | null;
  player2Score: number | null;
  winnerId: string | null;
  isBye: boolean;
  isForfeited?: boolean;
  notes?: string;
  nextMatchId: string | null;
  nextMatchPosition: number | null;
  loserNextMatchId: string | null;
  loserNextMatchPosition: number | null;
  // For group stage / round robin
  groupId?: string;
}

export interface GroupStanding {
  playerId: string;
  playerName: string;
  groupId?: string;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  matchesPlayed: number;
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  formatConfig?: TournamentFormatConfig;
  status: TournamentStatus;
  players: Player[];
  matches: Match[];
  createdAt: Date;
  completedAt: Date | null;
  // For group-knockout: track when group stage is complete
  groupStageComplete?: boolean;
  // For Swiss: track when qualification phase is complete
  swissQualificationComplete?: boolean;
  // Current round for Swiss tournaments
  currentSwissRound?: number;
}

export interface PlayerList {
  id: string;
  name: string;
  players: Pick<Player, 'name'>[];
  createdAt: Date;
  updatedAt: Date;
}
