/**
 * Common test utilities and helpers for E2E tests
 */

import { Page } from '@playwright/test';
import { TestPlayer, TestPlayerList } from './players';

// LocalStorage keys used by the app
export const STORAGE_KEYS = {
  TOURNAMENTS: 'bracket-maker-tournaments',
  PLAYER_LISTS: 'bracket-maker-player-lists',
  THEME: 'bracket-maker-theme',
} as const;

/**
 * Clear all application data from localStorage
 */
export async function clearAppData(page: Page) {
  await page.context().addCookies([]); // Clear cookies
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Ignore localStorage errors in case of cross-origin restrictions
      console.warn('Could not clear localStorage:', e);
    }
  });
}

/**
 * Navigate to a page and wait for it to load
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for a toast notification to appear and disappear
 */
export async function waitForToast(page: Page, text?: string) {
  const toast = text
    ? page.locator('[data-sonner-toast]').filter({ hasText: text })
    : page.locator('[data-sonner-toast]');
  await toast.waitFor({ state: 'visible' });
  await toast.waitFor({ state: 'hidden' });
}

/**
 * Fill tournament name and validate
 */
export async function fillTournamentName(page: Page, name: string) {
  await page.getByLabel('Tournament Name').fill(name);
}

/**
 * Select a tournament format
 */
export async function selectTournamentFormat(page: Page, format: string) {
  await page.getByText(format, { exact: true }).click();
}

/**
 * Add players to a tournament
 */
export async function addPlayers(page: Page, players: TestPlayerList) {
  for (const player of players.players) {
    await page.getByPlaceholder('Player name').fill(player.name);
    await page.getByRole('button', { name: 'Add Player' }).click();
  }
}

/**
 * Add a single player
 */
export async function addPlayer(page: Page, player: TestPlayer) {
  await page.getByPlaceholder('Player name').fill(player.name);
  await page.getByRole('button', { name: 'Add Player' }).click();
}

/**
 * Shuffle players in tournament creation
 */
export async function shufflePlayers(page: Page) {
  await page.getByRole('button', { name: 'Shuffle' }).click();
  await waitForToast(page, 'Players shuffled!');
}

/**
 * Create and start a tournament
 */
export async function createAndStartTournament(
  page: Page,
  name: string,
  format: string,
  players: TestPlayerList
) {
  await fillTournamentName(page, name);
  await selectTournamentFormat(page, format);
  await addPlayers(page, players);
  await page.getByRole('button', { name: 'Create & Start Tournament' }).click();
  await page.waitForURL(/\/tournament\/.+/);
}

/**
 * Create a draft tournament
 */
export async function createDraftTournament(
  page: Page,
  name: string,
  format: string,
  players: TestPlayerList
) {
  await fillTournamentName(page, name);
  await selectTournamentFormat(page, format);
  await addPlayers(page, players);
  await page.getByRole('button', { name: 'Save Draft' }).click();
  await page.waitForURL(/\/tournament\/.+/);
}

/**
 * Start a draft tournament
 */
export async function startTournament(page: Page) {
  await page.getByRole('button', { name: 'Start Tournament' }).click();
  await page.waitForURL(/\/tournament\/.+/);
}

/**
 * Complete a match with given scores
 */
export async function completeMatch(page: Page, player1Score: number, player2Score: number) {
  // Click on a match card
  await page.locator('[data-testid="match-card"]').first().click();

  // Fill scores
  await page.getByPlaceholder('Score').first().fill(player1Score.toString());
  await page.getByPlaceholder('Score').last().fill(player2Score.toString());

  // Save
  await page.getByRole('button', { name: 'Save Score' }).click();
  await waitForToast(page);
}

/**
 * Complete a match using keyboard navigation
 */
export async function completeMatchWithKeyboard(
  page: Page,
  player1Score: number,
  player2Score: number
) {
  // Click on a match card
  await page.locator('[data-testid="match-card"]').first().click();

  // Use arrow keys to set scores
  const scoreInput1 = page.locator('[data-testid="player1-score"]').locator('input');
  await scoreInput1.focus();
  for (let i = 0; i < player1Score; i++) {
    await page.keyboard.press('ArrowUp');
  }

  const scoreInput2 = page.locator('[data-testid="player2-score"]').locator('input');
  await scoreInput2.focus();
  for (let i = 0; i < player2Score; i++) {
    await page.keyboard.press('ArrowUp');
  }

  // Save with Enter
  await page.keyboard.press('Enter');
  await waitForToast(page);
}

/**
 * Get tournament ID from URL
 */
export function getTournamentIdFromUrl(url: string): string {
  const match = url.match(/\/tournament\/([^\/]+)/);
  return match ? match[1] : '';
}

/**
 * Wait for tournament to be completed
 */
export async function waitForTournamentCompletion(page: Page) {
  await page.waitForSelector('[data-testid="winner-celebration"]');
}

/**
 * Toggle between bracket and list view
 */
export async function toggleView(page: Page, view: 'bracket' | 'list') {
  await page.getByRole('button', { name: view === 'bracket' ? 'Bracket' : 'List' }).click();
}

/**
 * Export tournament data
 */
export async function exportTournament(page: Page, format: 'json' | 'csv' | 'image') {
  const buttonText = format === 'json' ? 'Export JSON' :
                    format === 'csv' ? 'Export CSV' :
                    'Export Image';
  await page.getByRole('button', { name: buttonText }).click();

  if (format === 'image') {
    // Wait for download to start
    await page.waitForTimeout(1000);
  }
}

/**
 * Create a saved player list
 */
export async function createPlayerList(page: Page, listName: string, players: TestPlayerList) {
  // Navigate to players page
  await navigateTo(page, '/players');

  // Add players
  await addPlayers(page, players);

  // Save the list
  await page.getByRole('button', { name: 'Save as List' }).click();

  // Fill list name
  await page.getByLabel('List Name').fill(listName);

  // Confirm save
  await page.getByRole('button', { name: 'Save' }).click();
  await waitForToast(page, 'Player list saved successfully!');
}

/**
 * Load a saved player list in tournament creation
 */
export async function loadPlayerList(page: Page, listName: string) {
  // Navigate to tournament creation
  await navigateTo(page, '/tournament/new');

  // Open dropdown and select list
  await page.locator('select').filter({ hasText: 'Load saved list...' }).selectOption({ label: listName });
}

/**
 * Wait for element to be visible and stable
 */
export async function waitForStableElement(page: Page, selector: string) {
  await page.waitForSelector(selector, { state: 'visible' });
  await page.waitForSelector(selector, { state: 'attached' });
}

/**
 * Get text content from an element
 */
export async function getTextContent(page: Page, selector: string): Promise<string | null> {
  return page.locator(selector).textContent();
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return (await page.locator(selector).count()) > 0;
}

/**
 * Get match count in tournament
 */
export async function getMatchCount(page: Page): Promise<number> {
  return page.locator('[data-testid="match-card"]').count();
}

/**
 * Get completed match count
 */
export async function getCompletedMatchCount(page: Page): Promise<number> {
  return page.locator('[data-testid="match-card"].completed').count();
}