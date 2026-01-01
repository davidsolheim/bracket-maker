import { test, expect } from '@playwright/test';
import { clearAppData, createAndStartTournament } from '../fixtures/test-utils';
import { PLAYERS_4 } from '../fixtures/players';

test.describe('Match Scoring', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
    await createAndStartTournament(page, 'Scoring Test', 'Single Elimination', PLAYERS_4);
  });

  test('opens score modal when clicking match card', async ({ page }) => {
    // Click on a match card
    await page.locator('[data-testid="match-card"]').first().click();

    // Score modal should open
    await expect(page.getByText('Enter Match Score')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Score' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('displays correct player names in score modal', async ({ page }) => {
    // Click on first match
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    const matchText = await firstMatch.textContent();

    // Extract player names from match card
    const playerNames = matchText?.match(/([A-Za-z]+).*?([A-Za-z]+)/)?.slice(1, 3);
    expect(playerNames).toBeDefined();
    expect(playerNames!.length).toBe(2);

    await firstMatch.click();

    // Modal should show the same player names
    await expect(page.getByText(`Player 1: ${playerNames![0]}`)).toBeVisible();
    await expect(page.getByText(`Player 2: ${playerNames![1]}`)).toBeVisible();
  });

  test('allows manual score entry with input fields', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Enter scores manually
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');

    // Save
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Should show success toast
    await expect(page.locator('[data-sonner-toast]')).toContainText('Match completed');

    // Match should be marked as completed
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await expect(firstMatch).toHaveClass(/completed/);
    await expect(firstMatch).toContainText('21 - 19');
  });

  test('validates scores are different', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Enter same scores
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('21');

    // Try to save
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Should show error
    await expect(page.locator('[data-sonner-toast]')).toContainText('Please enter valid scores');
  });

  test('validates scores are non-negative', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Enter negative score
    await page.getByPlaceholder('Score').first().fill('-1');
    await page.getByPlaceholder('Score').last().fill('21');

    // Try to save
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Should show error
    await expect(page.locator('[data-sonner-toast]')).toContainText('Please enter valid scores');
  });

  test('allows keyboard navigation with arrow keys', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Focus first score input
    const firstInput = page.getByPlaceholder('Score').first();
    await firstInput.focus();

    // Use arrow up to increase score
    await page.keyboard.press('ArrowUp');
    await expect(firstInput).toHaveValue('1');

    await page.keyboard.press('ArrowUp');
    await expect(firstInput).toHaveValue('2');

    // Use arrow down to decrease
    await page.keyboard.press('ArrowDown');
    await expect(firstInput).toHaveValue('1');

    // Move to second input with tab
    await page.keyboard.press('Tab');
    const secondInput = page.getByPlaceholder('Score').last();
    await expect(secondInput).toBeFocused();

    // Set second score
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(secondInput).toHaveValue('2');
  });

  test('saves score with Enter key', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Set scores with keyboard
    const firstInput = page.getByPlaceholder('Score').first();
    await firstInput.focus();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp'); // Score = 2

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowUp'); // Score = 1

    // Save with Enter
    await page.keyboard.press('Enter');

    // Match should be completed
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await expect(firstMatch).toHaveClass(/completed/);
    await expect(firstMatch).toContainText('2 - 1');
  });

  test('cancels with Escape key', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Enter some scores
    await page.getByPlaceholder('Score').first().fill('15');
    await page.getByPlaceholder('Score').last().fill('13');

    // Cancel with Escape
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(page.getByText('Enter Match Score')).not.toBeVisible();

    // Match should not be completed
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await expect(firstMatch).not.toHaveClass(/completed/);
  });

  test('cancels with Cancel button', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Enter some scores
    await page.getByPlaceholder('Score').first().fill('15');
    await page.getByPlaceholder('Score').last().fill('13');

    // Cancel with button
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Modal should close
    await expect(page.getByText('Enter Match Score')).not.toBeVisible();

    // Match should not be completed
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await expect(firstMatch).not.toHaveClass(/completed/);
  });

  test('shows keyboard shortcuts help', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Should show keyboard shortcuts
    await expect(page.getByText('Press ↑/↓ to adjust scores, Enter to save, Esc to cancel')).toBeVisible();
  });

  test('closes modal when clicking outside', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Click on backdrop (outside modal)
    await page.locator('.fixed.inset-0.z-40').click();

    // Modal should close
    await expect(page.getByText('Enter Match Score')).not.toBeVisible();
  });

  test('auto-focuses first score input', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // First input should be focused
    const firstInput = page.getByPlaceholder('Score').first();
    await expect(firstInput).toBeFocused();
  });

  test('persists scores after page reload', async ({ page }) => {
    // Complete a match
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Reload page
    await page.reload();

    // Match should still be completed with same scores
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await expect(firstMatch).toHaveClass(/completed/);
    await expect(firstMatch).toContainText('21 - 19');
  });

  test('shows winner correctly after scoring', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Alice beats Bob
    await page.getByPlaceholder('Score').first().fill('21'); // Alice
    await page.getByPlaceholder('Score').last().fill('19'); // Bob
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Match should show Alice as winner
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await expect(firstMatch).toContainText('Alice'); // Winner should be highlighted
  });

  test('advances winner to next round', async ({ page }) => {
    // Complete first round match
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Winner should appear in round 2
    const round2Match = page.locator('[data-testid="match-card"]').last();
    await expect(round2Match).toContainText('Alice'); // Assuming Alice won
  });

  test('handles empty score inputs', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Leave one score empty
    await page.getByPlaceholder('Score').first().fill('21');
    // Leave second score empty

    // Try to save
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Should show error
    await expect(page.locator('[data-sonner-toast]')).toContainText('Please enter valid scores');
  });

  test('handles zero scores', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Enter zero and positive score
    await page.getByPlaceholder('Score').first().fill('0');
    await page.getByPlaceholder('Score').last().fill('21');

    // Should save successfully
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Match should be completed
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await expect(firstMatch).toHaveClass(/completed/);
    await expect(firstMatch).toContainText('0 - 21');
  });

  test('prevents scoring completed matches without confirmation', async ({ page }) => {
    // Complete a match first
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Try to click on the completed match again
    await page.locator('[data-testid="match-card"]').first().click();

    // Should show confirmation modal for editing
    await expect(page.getByText('Edit Completed Match')).toBeVisible();
    await expect(page.getByText(/reset all downstream matches/)).toBeVisible();
  });

  test('allows editing completed matches with confirmation', async ({ page }) => {
    // Complete a match first
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Click on completed match again
    await page.locator('[data-testid="match-card"]').first().click();

    // Confirm edit
    await page.getByRole('button', { name: 'Continue Editing' }).click();

    // Should open score modal with existing scores
    await expect(page.getByText('Enter Match Score')).toBeVisible();
    await expect(page.getByPlaceholder('Score').first()).toHaveValue('21');
    await expect(page.getByPlaceholder('Score').last()).toHaveValue('19');
  });

  test('updates player statistics after scoring', async ({ page }) => {
    // Complete a match
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Navigate to stats page
    await page.goto('/stats');

    // Should show updated player stats
    const aliceRow = page.locator('tbody tr').filter({ hasText: 'Alice' });
    await expect(aliceRow).toContainText('1'); // 1 win

    const bobRow = page.locator('tbody tr').filter({ hasText: 'Bob' });
    await expect(bobRow).toContainText('1'); // 1 loss
  });

  test('handles modal stacking correctly', async ({ page }) => {
    // Click on match
    await page.locator('[data-testid="match-card"]').first().click();

    // Modal should be visible
    await expect(page.getByText('Enter Match Score')).toBeVisible();

    // Click outside to close
    await page.locator('.fixed.inset-0.z-40').first().click();

    // Modal should be gone
    await expect(page.getByText('Enter Match Score')).not.toBeVisible();

    // Click on match again
    await page.locator('[data-testid="match-card"]').first().click();

    // Modal should open again
    await expect(page.getByText('Enter Match Score')).toBeVisible();
  });

  test('shows loading state during save', async ({ page }) => {
    await page.locator('[data-testid="match-card"]').first().click();

    // Enter scores
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');

    // Click save - should show loading/disabled state briefly
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Button should be disabled during save
    await expect(page.getByRole('button', { name: 'Save Score' })).toBeDisabled();

    // Modal should close after save
    await expect(page.getByText('Enter Match Score')).not.toBeVisible();
  });
});