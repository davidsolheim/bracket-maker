export type BracketType = 'winners' | 'losers' | 'grand-finals';

export type TournamentStatus = 'draft' | 'active' | 'completed';

export interface Player {
  id: string;
  name: string;
  seed: number;
  wins?: number;
  losses?: number;
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
  nextMatchId: string | null;
  nextMatchPosition: number | null;
  loserNextMatchId: string | null;
  loserNextMatchPosition: number | null;
}

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  players: Player[];
  matches: Match[];
  createdAt: Date;
  completedAt: Date | null;
}

export interface PlayerList {
  id: string;
  name: string;
  players: Pick<Player, 'name'>[];
  createdAt: Date;
  updatedAt: Date;
}
