import { test, expect } from '@playwright/test';
import { clearAppData, createAndStartTournament } from '../fixtures/test-utils';
import { PLAYERS_4, PLAYERS_8 } from '../fixtures/players';

test.describe('Match Override', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
  });

  test('shows override button on match cards', async ({ page }) => {
    await createAndStartTournament(page, 'Override Test', 'Single Elimination', PLAYERS_4);

    // Should have override buttons on match cards
    const overrideButtons = page.locator('[data-testid="match-override-button"]');
    await expect(overrideButtons).toHaveCount(await page.locator('[data-testid="match-card"]').count());
  });

  test('opens override modal when clicking override button', async ({ page }) => {
    await createAndStartTournament(page, 'Override Modal Test', 'Single Elimination', PLAYERS_4);

    // Click override button
    await page.locator('[data-testid="match-override-button"]').first().click();

    // Override modal should open
    await expect(page.getByText('Match Override')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Swap Players' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Force Winner' })).toBeVisible();
  });

  test('shows swap players tab by default', async ({ page }) => {
    await createAndStartTournament(page, 'Swap Tab Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();

    // Swap players tab should be active
    await expect(page.getByRole('button', { name: 'Swap Players' })).toHaveClass(/border-green-500/);
    await expect(page.getByText('Reassign players to this match slot')).toBeVisible();
  });

  test('allows switching between swap and force winner tabs', async ({ page }) => {
    await createAndStartTournament(page, 'Tab Switch Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();

    // Switch to force winner tab
    await page.getByRole('button', { name: 'Force Winner' }).click();

    // Force winner tab should be active
    await expect(page.getByRole('button', { name: 'Force Winner' })).toHaveClass(/border-green-500/);
    await expect(page.getByText('Declare a winner without entering scores')).toBeVisible();

    // Switch back to swap players
    await page.getByRole('button', { name: 'Swap Players' }).click();

    // Swap players tab should be active again
    await expect(page.getByRole('button', { name: 'Swap Players' })).toHaveClass(/border-green-500/);
  });

  test('swap players shows current player assignments', async ({ page }) => {
    await createAndStartTournament(page, 'Swap Players Display Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();

    // Should show player selection dropdowns
    await expect(page.getByText('Player 1 (Top Slot)')).toBeVisible();
    await expect(page.getByText('Player 2 (Bottom Slot)')).toBeVisible();

    // Should have dropdowns with player options
    const player1Select = page.locator('select').first();
    const player2Select = page.locator('select').last();

    await expect(player1Select).toBeVisible();
    await expect(player2Select).toBeVisible();

    // Should include current players as options
    await expect(page.getByText('Alice (Seed 1)')).toBeVisible();
    await expect(page.getByText('Bob (Seed 2)')).toBeVisible();
  });

  test('allows swapping players in match', async ({ page }) => {
    await createAndStartTournament(page, 'Player Swap Test', 'Single Elimination', PLAYERS_4);

    // Get original match players
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    const originalMatchText = await firstMatch.textContent();

    await page.locator('[data-testid="match-override-button"]').first().click();

    // Swap players: put Charlie in player 1 slot, Diana in player 2 slot
    const player1Select = page.locator('select').first();
    const player2Select = page.locator('select').last();

    await player1Select.selectOption({ label: 'Charlie (Seed 3)' });
    await player2Select.selectOption({ label: 'Diana (Seed 4)' });

    // Apply changes
    await page.getByRole('button', { name: 'Apply Changes' }).click();

    // Match should now show Charlie vs Diana
    await expect(firstMatch).toContainText('Charlie');
    await expect(firstMatch).toContainText('Diana');

    // Should not contain original players
    if (originalMatchText?.includes('Alice')) {
      await expect(firstMatch).not.toContainText('Alice');
    }
    if (originalMatchText?.includes('Bob')) {
      await expect(firstMatch).not.toContainText('Bob');
    }
  });

  test('allows setting empty slots with TBD', async ({ page }) => {
    await createAndStartTournament(page, 'Empty Slot Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();

    // Set player 2 to empty
    const player2Select = page.locator('select').last();
    await player2Select.selectOption('-- Empty (TBD) --');

    // Apply changes
    await page.getByRole('button', { name: 'Apply Changes' }).click();

    // Match should show TBD for empty slot
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await expect(firstMatch).toContainText('TBD');
  });

  test('prevents swapping to already assigned players', async ({ page }) => {
    await createAndStartTournament(page, 'Prevent Duplicate Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();

    // Try to assign Alice to both slots
    const player1Select = page.locator('select').first();
    const player2Select = page.locator('select').last();

    await player1Select.selectOption({ label: 'Alice (Seed 1)' });
    await player2Select.selectOption({ label: 'Alice (Seed 1)' });

    // Alice should not be available in player 2 dropdown when selected in player 1
    // (This tests the filtering logic - Alice should only appear once)
    const player2Options = player2Select.locator('option');
    const aliceInPlayer2 = player2Options.filter({ hasText: 'Alice (Seed 1)' });
    await expect(aliceInPlayer2).toHaveCount(0);
  });

  test('force winner tab shows when match has players', async ({ page }) => {
    await createAndStartTournament(page, 'Force Winner Tab Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();
    await page.getByRole('button', { name: 'Force Winner' }).click();

    // Should show winner selection
    await expect(page.getByText('Select Winner')).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(2); // Two players
  });

  test('force winner tab disabled when no players assigned', async ({ page }) => {
    await createAndStartTournament(page, 'No Players Force Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();

    // Set both players to empty
    const player1Select = page.locator('select').first();
    const player2Select = page.locator('select').last();

    await player1Select.selectOption('-- Empty (TBD) --');
    await player2Select.selectOption('-- Empty (TBD) --');

    await page.getByRole('button', { name: 'Apply Changes' }).click();

    // Re-open override modal
    await page.locator('[data-testid="match-override-button"]').first().click();
    await page.getByRole('button', { name: 'Force Winner' }).click();

    // Should show disabled state
    await expect(page.getByText('At least one player must be assigned')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm Winner' })).toBeDisabled();
  });

  test('allows forcing a winner', async ({ page }) => {
    await createAndStartTournament(page, 'Force Winner Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();
    await page.getByRole('button', { name: 'Force Winner' }).click();

    // Select Alice as winner
    await page.getByLabel('Alice').check();

    // Confirm winner
    await page.getByRole('button', { name: 'Confirm Winner' }).click();

    // Match should be completed with Alice as winner
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await expect(firstMatch).toHaveClass(/completed/);
    await expect(firstMatch).toContainText('Alice');
  });

  test('allows forcing a winner with forfeit', async ({ page }) => {
    await createAndStartTournament(page, 'Force Forfeit Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();
    await page.getByRole('button', { name: 'Force Winner' }).click();

    // Select Bob as winner and mark as forfeit
    await page.getByLabel('Bob').check();
    await page.getByRole('checkbox', { name: 'Mark as forfeit/DQ' }).check();

    // Confirm winner
    await page.getByRole('button', { name: 'Confirm Winner' }).click();

    // Match should be completed with forfeit
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await expect(firstMatch).toHaveClass(/completed/);
    await expect(firstMatch).toContainText('FORFEIT');
  });

  test('prevents forcing winner on completed matches', async ({ page }) => {
    await createAndStartTournament(page, 'Completed Match Override Test', 'Single Elimination', PLAYERS_4);

    // Complete a match first
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Try to override completed match
    await page.locator('[data-testid="match-override-button"]').first().click();

    // Should show message that match is completed
    await expect(page.getByText('This match has already been completed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  });

  test('closes override modal with cancel', async ({ page }) => {
    await createAndStartTournament(page, 'Cancel Override Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Modal should close
    await expect(page.getByText('Match Override')).not.toBeVisible();
  });

  test('closes override modal when clicking outside', async ({ page }) => {
    await createAndStartTournament(page, 'Click Outside Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();

    // Click outside modal
    await page.locator('.fixed.inset-0.z-40').first().click();

    // Modal should close
    await expect(page.getByText('Match Override')).not.toBeVisible();
  });

  test('shows confirm winner button only when winner selected', async ({ page }) => {
    await createAndStartTournament(page, 'Confirm Button Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();
    await page.getByRole('button', { name: 'Force Winner' }).click();

    // Initially no winner selected, button should be disabled
    await expect(page.getByRole('button', { name: 'Confirm Winner' })).toBeDisabled();

    // Select a winner
    await page.getByLabel('Alice').check();

    // Button should now be enabled
    await expect(page.getByRole('button', { name: 'Confirm Winner' })).toBeEnabled();
  });

  test('swap changes persist after modal close', async ({ page }) => {
    await createAndStartTournament(page, 'Swap Persistence Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();

    // Swap players
    const player1Select = page.locator('select').first();
    await player1Select.selectOption({ label: 'Charlie (Seed 3)' });

    await page.getByRole('button', { name: 'Apply Changes' }).click();

    // Re-open modal
    await page.locator('[data-testid="match-override-button"]').first().click();

    // Should still show Charlie as player 1
    const player1SelectAgain = page.locator('select').first();
    await expect(player1SelectAgain).toHaveValue('Charlie');
  });

  test('force winner updates player statistics', async ({ page }) => {
    await createAndStartTournament(page, 'Force Winner Stats Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();
    await page.getByRole('button', { name: 'Force Winner' }).click();

    // Force Alice to win
    await page.getByLabel('Alice').check();
    await page.getByRole('button', { name: 'Confirm Winner' }).click();

    // Navigate to stats
    await page.goto('/stats');

    // Alice should have 1 win
    const aliceRow = page.locator('tbody tr').filter({ hasText: 'Alice' });
    await expect(aliceRow).toContainText('1'); // Wins column

    // Bob should have 1 loss
    const bobRow = page.locator('tbody tr').filter({ hasText: 'Bob' });
    await expect(bobRow).toContainText('1'); // Losses column
  });

  test('swap players affects available options in other matches', async ({ page }) => {
    await createAndStartTournament(page, 'Swap Availability Test', 'Single Elimination', PLAYERS_4);

    // Swap Charlie into the first match
    await page.locator('[data-testid="match-override-button"]').first().click();
    const player1Select = page.locator('select').first();
    await player1Select.selectOption({ label: 'Charlie (Seed 3)' });
    await page.getByRole('button', { name: 'Apply Changes' }).click();

    // Now Charlie should not be available in other matches
    // (This tests that player availability is correctly tracked across matches)
    await page.locator('[data-testid="match-override-button"]').last().click();

    const player1SelectLast = page.locator('select').first();
    const charlieOption = player1SelectLast.locator('option').filter({ hasText: 'Charlie' });
    await expect(charlieOption).toHaveCount(0);
  });

  test('shows toast notification after successful operations', async ({ page }) => {
    await createAndStartTournament(page, 'Toast Test', 'Single Elimination', PLAYERS_4);

    // Swap players
    await page.locator('[data-testid="match-override-button"]').first().click();
    const player1Select = page.locator('select').first();
    await player1Select.selectOption({ label: 'Charlie (Seed 3)' });
    await page.getByRole('button', { name: 'Apply Changes' }).click();

    // Should show success toast
    await expect(page.locator('[data-sonner-toast]')).toContainText('Match players updated');

    // Force winner
    await page.locator('[data-testid="match-override-button"]').first().click();
    await page.getByRole('button', { name: 'Force Winner' }).click();
    await page.getByLabel('Alice').check();
    await page.getByRole('button', { name: 'Confirm Winner' }).click();

    // Should show success toast
    await expect(page.locator('[data-sonner-toast]')).toContainText('Winner declared');
  });

  test('handles forfeit marking correctly', async ({ page }) => {
    await createAndStartTournament(page, 'Forfeit Marking Test', 'Single Elimination', PLAYERS_4);

    await page.locator('[data-testid="match-override-button"]').first().click();
    await page.getByRole('button', { name: 'Force Winner' }).click();

    // Force Alice to win with forfeit
    await page.getByLabel('Alice').check();
    await page.getByRole('checkbox', { name: 'Mark as forfeit/DQ' }).check();
    await page.getByRole('button', { name: 'Confirm Winner' }).click();

    // Should show forfeit in toast
    await expect(page.locator('[data-sonner-toast]')).toContainText('Match forfeited');
  });
});