/**
 * Test fixtures for player data used across E2E tests
 */

export interface TestPlayer {
  name: string;
  seed?: number;
}

export interface TestPlayerList {
  name: string;
  players: TestPlayer[];
}

// Standard player sets for different tournament sizes
export const PLAYERS_4: TestPlayerList = {
  name: 'Test Players 4',
  players: [
    { name: 'Alice', seed: 1 },
    { name: 'Bob', seed: 2 },
    { name: 'Charlie', seed: 3 },
    { name: 'Diana', seed: 4 },
  ],
};

export const PLAYERS_8: TestPlayerList = {
  name: 'Test Players 8',
  players: [
    { name: 'Alice', seed: 1 },
    { name: 'Bob', seed: 2 },
    { name: 'Charlie', seed: 3 },
    { name: 'Diana', seed: 4 },
    { name: 'Eve', seed: 5 },
    { name: 'Frank', seed: 6 },
    { name: 'Grace', seed: 7 },
    { name: 'Henry', seed: 8 },
  ],
};

export const PLAYERS_16: TestPlayerList = {
  name: 'Test Players 16',
  players: [
    { name: 'Alice', seed: 1 },
    { name: 'Bob', seed: 2 },
    { name: 'Charlie', seed: 3 },
    { name: 'Diana', seed: 4 },
    { name: 'Eve', seed: 5 },
    { name: 'Frank', seed: 6 },
    { name: 'Grace', seed: 7 },
    { name: 'Henry', seed: 8 },
    { name: 'Iris', seed: 9 },
    { name: 'Jack', seed: 10 },
    { name: 'Kate', seed: 11 },
    { name: 'Liam', seed: 12 },
    { name: 'Maya', seed: 13 },
    { name: 'Noah', seed: 14 },
    { name: 'Olivia', seed: 15 },
    { name: 'Paul', seed: 16 },
  ],
};

export const PLAYERS_ODD: TestPlayerList = {
  name: 'Test Players Odd',
  players: [
    { name: 'Alice', seed: 1 },
    { name: 'Bob', seed: 2 },
    { name: 'Charlie', seed: 3 },
    { name: 'Diana', seed: 4 },
    { name: 'Eve', seed: 5 },
  ],
};

// Export all player sets
export const PLAYER_SETS = {
  PLAYERS_4,
  PLAYERS_8,
  PLAYERS_16,
  PLAYERS_ODD,
} as const;

// Get players by count
export function getPlayersByCount(count: number): TestPlayerList | null {
  switch (count) {
    case 4:
      return PLAYERS_4;
    case 8:
      return PLAYERS_8;
    case 16:
      return PLAYERS_16;
    case 5:
      return PLAYERS_ODD;
    default:
      return null;
  }
}

// Get player names array for convenience
export function getPlayerNames(playerList: TestPlayerList): string[] {
  return playerList.players.map(p => p.name);
}