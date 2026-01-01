import { test, expect } from '@playwright/test';
import { clearAppData, navigateTo, waitForToast, addPlayer, addPlayers, shufflePlayers } from '../fixtures/test-utils';
import { PLAYERS_4, PLAYERS_8 } from '../fixtures/players';

test.describe('Tournament Creation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
  });

  test('validates empty tournament name', async ({ page }) => {
    // Leave name empty and try to create
    await page.getByRole('button', { name: 'Create & Start Tournament' }).click();

    // Should show error toast
    await expect(page.locator('[data-sonner-toast]')).toContainText('Please enter a tournament name');
  });

  test('validates minimum players for single elimination', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');
    await page.getByText('Single Elimination', { exact: true }).click();

    // Add only 1 player
    await addPlayer(page, PLAYERS_4.players[0]);

    await page.getByRole('button', { name: 'Create & Start Tournament' }).click();

    // Should show error toast
    await expect(page.locator('[data-sonner-toast]')).toContainText('Please add at least 2 players for this format');
  });

  test('validates minimum players for double elimination', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');
    await page.getByText('Double Elimination', { exact: true }).click();

    // Add only 1 player
    await addPlayer(page, PLAYERS_4.players[0]);

    await page.getByRole('button', { name: 'Create & Start Tournament' }).click();

    // Should show error toast
    await expect(page.locator('[data-sonner-toast]')).toContainText('Please add at least 2 players for this format');
  });

  test('validates minimum players for group knockout', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');
    await page.getByText('Group Stage + Knockout', { exact: true }).click();

    // Add only 3 players
    await addPlayer(page, PLAYERS_4.players[0]);
    await addPlayer(page, PLAYERS_4.players[1]);
    await addPlayer(page, PLAYERS_4.players[2]);

    await page.getByRole('button', { name: 'Create & Start Tournament' }).click();

    // Should show error toast
    await expect(page.locator('[data-sonner-toast]')).toContainText('Please add at least 4 players for this format');
  });

  test('allows adding players with Enter key', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');

    // Add player using Enter key
    await page.getByPlaceholder('Player name').fill('Alice');
    await page.keyboard.press('Enter');

    // Player should be added
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('(Seed 1)')).toBeVisible();
  });

  test('allows adding players with Add Player button', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');

    // Add player using button
    await addPlayer(page, PLAYERS_4.players[0]);

    // Player should be added
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('(Seed 1)')).toBeVisible();
  });

  test('reorders seeds when player is removed', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');

    // Add 3 players
    await addPlayer(page, PLAYERS_4.players[0]);
    await addPlayer(page, PLAYERS_4.players[1]);
    await addPlayer(page, PLAYERS_4.players[2]);

    // Verify initial order
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('(Seed 1)')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText('(Seed 2)')).toBeVisible();
    await expect(page.getByText('Charlie')).toBeVisible();
    await expect(page.getByText('(Seed 3)')).toBeVisible();

    // Remove middle player (Bob)
    await page.locator('[data-testid="remove-player"]').nth(1).click();

    // Seeds should be reordered
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('(Seed 1)')).toBeVisible();
    await expect(page.getByText('Charlie')).toBeVisible();
    await expect(page.getByText('(Seed 2)')).toBeVisible();
    await expect(page.getByText('Bob')).not.toBeVisible();
  });

  test('shuffle randomizes player order', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');

    // Add players in known order
    await addPlayers(page, PLAYERS_4);

    // Verify initial order
    const playersBefore = await page.locator('[data-testid="player-name"]').allTextContents();
    expect(playersBefore).toEqual(['Alice', 'Bob', 'Charlie', 'Diana']);

    // Shuffle players
    await shufflePlayers(page);

    // Order should be different (with high probability)
    const playersAfter = await page.locator('[data-testid="player-name"]').allTextContents();
    expect(playersAfter).not.toEqual(['Alice', 'Bob', 'Charlie', 'Diana']);
    expect(playersAfter.sort()).toEqual(['Alice', 'Bob', 'Charlie', 'Diana']); // Same players, different order
  });

  test('can load saved player list', async ({ page }) => {
    // First create a saved player list
    await navigateTo(page, '/players');
    await addPlayers(page, PLAYERS_4);
    await page.getByRole('button', { name: 'Save as List' }).click();
    await page.getByLabel('List Name').fill('Test List');
    await page.getByRole('button', { name: 'Save' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Now go to tournament creation
    await navigateTo(page, '/tournament/new');

    // Load the saved list
    await page.locator('select').filter({ hasText: 'Load saved list...' }).selectOption({ label: 'Test List (4 players)' });

    // Players should be loaded
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText('Charlie')).toBeVisible();
    await expect(page.getByText('Diana')).toBeVisible();
  });

  test('can save current players as new list', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');

    // Add players
    await addPlayers(page, PLAYERS_4);

    // Save as list
    await page.getByRole('button', { name: 'Save as List' }).click();

    // Fill list name
    await page.getByLabel('List Name').fill('My Tournament Players');

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Verify list was created
    await navigateTo(page, '/players');
    await expect(page.getByText('My Tournament Players')).toBeVisible();
    await expect(page.getByText('4 player')).toBeVisible();
  });

  test('shows validation error for empty list name when saving', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');

    // Add players
    await addPlayers(page, PLAYERS_4);

    // Try to save with empty name
    await page.getByRole('button', { name: 'Save as List' }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    // Should show error
    await waitForToast(page, 'Please enter a list name');
  });

  test('shows validation error when saving empty list', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');

    // Try to save without any players
    await page.getByRole('button', { name: 'Save as List' }).click();

    // Should show error
    await waitForToast(page, 'Please add at least one player before saving');
  });

  test('can select all 5 tournament formats', async ({ page }) => {
    const formats = [
      'Single Elimination',
      'Double Elimination',
      'Round Robin',
      'Swiss System',
      'Group Stage + Knockout'
    ];

    for (const format of formats) {
      await page.getByText(format, { exact: true }).click();
      await expect(page.locator('[data-selected="true"]')).toContainText(format);
    }
  });

  test('shows Swiss format configuration options', async ({ page }) => {
    await page.getByText('Swiss System', { exact: true }).click();

    // Should show number of rounds input
    await expect(page.getByText('Number of Rounds')).toBeVisible();
    await expect(page.getByDisplayValue('3')).toBeVisible(); // Default for 8 players

    // Should show recommendation text
    await expect(page.getByText(/Recommended: 3 rounds/)).toBeVisible();
  });

  test('shows group knockout configuration options', async ({ page }) => {
    await page.getByText('Group Stage + Knockout', { exact: true }).click();

    // Should show group configuration
    await expect(page.getByText('Number of Groups')).toBeVisible();
    await expect(page.getByText('Players Advancing Per Group')).toBeVisible();
    await expect(page.getByText('Knockout Format')).toBeVisible();

    // Should have default values
    await expect(page.getByDisplayValue('2')).toBeVisible(); // Default groups
    await expect(page.getByDisplayValue('2')).toBeVisible(); // Default advance per group
  });

  test('can configure Swiss tournament rounds', async ({ page }) => {
    await page.getByText('Swiss System', { exact: true }).click();

    // Change number of rounds
    await page.getByDisplayValue('3').fill('5');

    // Should update the input value
    await expect(page.getByDisplayValue('5')).toBeVisible();
  });

  test('can configure group knockout settings', async ({ page }) => {
    await page.getByText('Group Stage + Knockout', { exact: true }).click();

    // Change group count
    await page.getByDisplayValue('2').first().fill('4');

    // Change advance per group
    await page.getByDisplayValue('2').last().fill('3');

    // Change knockout format
    await page.locator('select').selectOption('Double Elimination');

    // Values should be updated
    await expect(page.getByDisplayValue('4')).toBeVisible();
    await expect(page.getByDisplayValue('3')).toBeVisible();
    await expect(page.getByDisplayValue('Double Elimination')).toBeVisible();
  });

  test('creates draft tournament successfully', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Draft Tournament');
    await page.getByText('Single Elimination', { exact: true }).click();
    await addPlayers(page, PLAYERS_4);

    await page.getByRole('button', { name: 'Save Draft' }).click();

    // Should navigate to tournament page
    await expect(page).toHaveURL(/\/tournament\/.+/);
    await expect(page.getByText('Draft Tournament')).toBeVisible();
    await expect(page.getByText('Status: draft')).toBeVisible();
  });

  test('creates and starts tournament successfully', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Active Tournament');
    await page.getByText('Single Elimination', { exact: true }).click();
    await addPlayers(page, PLAYERS_4);

    await page.getByRole('button', { name: 'Create & Start Tournament' }).click();

    // Should navigate to tournament page
    await expect(page).toHaveURL(/\/tournament\/.+/);
    await expect(page.getByText('Active Tournament')).toBeVisible();
    await expect(page.getByText('Status: active')).toBeVisible();

    // Should have matches generated
    await expect(page.locator('[data-testid="match-card"]')).toHaveCount(3); // Single elim with 4 players = 3 matches
  });

  test('hides shuffle button when less than 2 players', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');

    // Add only 1 player
    await addPlayer(page, PLAYERS_4.players[0]);

    // Shuffle button should not be visible
    await expect(page.getByRole('button', { name: 'Shuffle' })).not.toBeVisible();

    // Add second player
    await addPlayer(page, PLAYERS_4.players[1]);

    // Shuffle button should now be visible
    await expect(page.getByRole('button', { name: 'Shuffle' })).toBeVisible();
  });

  test('hides save list button when no players', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');

    // Save as List button should not be visible
    await expect(page.getByRole('button', { name: 'Save as List' })).not.toBeVisible();

    // Add a player
    await addPlayer(page, PLAYERS_4.players[0]);

    // Save as List button should now be visible
    await expect(page.getByRole('button', { name: 'Save as List' })).toBeVisible();
  });

  test('hides load list dropdown when no saved lists', async ({ page }) => {
    await page.getByLabel('Tournament Name').fill('Test Tournament');

    // Load list dropdown should not be visible
    await expect(page.locator('select').filter({ hasText: 'Load saved list...' })).not.toBeVisible();

    // Create a saved list first
    await navigateTo(page, '/players');
    await addPlayers(page, PLAYERS_4);
    await page.getByRole('button', { name: 'Save as List' }).click();
    await page.getByLabel('List Name').fill('Test List');
    await page.getByRole('button', { name: 'Save' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Go back to tournament creation
    await navigateTo(page, '/tournament/new');

    // Load list dropdown should now be visible
    await expect(page.locator('select').filter({ hasText: 'Load saved list...' })).toBeVisible();
  });
});