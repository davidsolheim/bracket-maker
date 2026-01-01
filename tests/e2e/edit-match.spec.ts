import { test, expect } from '@playwright/test';
import { clearAppData, createAndStartTournament } from '../fixtures/test-utils';
import { PLAYERS_4, PLAYERS_8 } from '../fixtures/players';

test.describe('Edit Completed Matches', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
  });

  test('shows confirmation modal when editing completed match', async ({ page }) => {
    await createAndStartTournament(page, 'Edit Confirmation Test', 'Single Elimination', PLAYERS_4);

    // Complete a match
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Click on completed match again
    await page.locator('[data-testid="match-card"]').first().click();

    // Should show confirmation modal
    await expect(page.getByText('Edit Completed Match')).toBeVisible();
    await expect(page.getByText(/reset all downstream matches/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue Editing' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('can cancel editing completed match', async ({ page }) => {
    await createAndStartTournament(page, 'Cancel Edit Test', 'Single Elimination', PLAYERS_4);

    // Complete a match
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Click on completed match again
    await page.locator('[data-testid="match-card"]').first().click();

    // Cancel editing
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Should close confirmation modal without opening score modal
    await expect(page.getByText('Edit Completed Match')).not.toBeVisible();
    await expect(page.getByText('Enter Match Score')).not.toBeVisible();
  });

  test('opens score modal with existing scores when continuing edit', async ({ page }) => {
    await createAndStartTournament(page, 'Continue Edit Test', 'Single Elimination', PLAYERS_4);

    // Complete a match
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Click on completed match again
    await page.locator('[data-testid="match-card"]').first().click();

    // Continue editing
    await page.getByRole('button', { name: 'Continue Editing' }).click();

    // Should open score modal with existing scores
    await expect(page.getByText('Enter Match Score')).toBeVisible();
    await expect(page.getByPlaceholder('Score').first()).toHaveValue('21');
    await expect(page.getByPlaceholder('Score').last()).toHaveValue('19');
  });

  test('resets downstream matches when editing', async ({ page }) => {
    await createAndStartTournament(page, 'Cascade Reset Test', 'Single Elimination', PLAYERS_4);

    // Complete both matches in round 1
    const round1Matches = page.locator('[data-testid="match-card"]');

    // Alice beats Bob
    await round1Matches.first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Charlie beats Diana
    await round1Matches.last().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Alice should advance to final
    const finalMatch = page.locator('[data-testid="match-card"]').last();
    await expect(finalMatch).toContainText('Alice');

    // Now edit the first match to make Bob win instead
    await round1Matches.first().click();
    await page.getByRole('button', { name: 'Continue Editing' }).click();

    // Change scores so Bob wins
    await page.getByPlaceholder('Score').first().fill('19');
    await page.getByPlaceholder('Score').last().fill('21');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Final should now have Bob instead of Alice
    await expect(finalMatch).toContainText('Bob');
    await expect(finalMatch).not.toContainText('Alice');
  });

  test('resets player statistics when editing match result', async ({ page }) => {
    await createAndStartTournament(page, 'Stats Reset Test', 'Single Elimination', PLAYERS_4);

    // Complete a match: Alice wins
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Check stats
    await page.goto('/stats');
    const aliceRow = page.locator('tbody tr').filter({ hasText: 'Alice' });
    await expect(aliceRow).toContainText('1'); // 1 win

    // Go back to tournament
    await page.goto('/tournament/1'); // Assuming first tournament

    // Edit match to make Bob win instead
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByRole('button', { name: 'Continue Editing' }).click();

    await page.getByPlaceholder('Score').first().fill('19');
    await page.getByPlaceholder('Score').last().fill('21');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Check stats again
    await page.goto('/stats');
    const aliceRowAfter = page.locator('tbody tr').filter({ hasText: 'Alice' });
    await expect(aliceRowAfter).toContainText('0'); // 0 wins

    const bobRowAfter = page.locator('tbody tr').filter({ hasText: 'Bob' });
    await expect(bobRowAfter).toContainText('1'); // 1 win
  });

  test('handles complex cascade reset in double elimination', async ({ page }) => {
    await createAndStartTournament(page, 'Complex Cascade Test', 'Double Elimination', PLAYERS_8);

    // Complete several matches to set up a complex bracket state
    const matches = page.locator('[data-testid="match-card"]');

    // Complete winners bracket matches
    for (let i = 0; i < 7; i++) { // Winners bracket has 7 matches
      const match = matches.nth(i);
      const matchText = await match.textContent();

      if (matchText?.includes('TBD') || matchText?.includes('21')) continue;

      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Edit an early match
    await matches.first().click();
    await page.getByRole('button', { name: 'Continue Editing' }).click();

    // Change the winner
    await page.getByPlaceholder('Score').first().fill('19');
    await page.getByPlaceholder('Score').last().fill('21');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // The entire bracket should be recalculated
    // Winners should be properly reset and redistributed
    const winnersMatches = page.locator('[data-testid="match-card"][data-bracket="winners"]');
    await expect(winnersMatches).toHaveCount(7);
  });

  test('preserves unaffected matches during cascade reset', async ({ page }) => {
    await createAndStartTournament(page, 'Selective Reset Test', 'Single Elimination', PLAYERS_8);

    // Complete matches in a way that some are affected by reset and some aren't
    const matches = page.locator('[data-testid="match-card"]');

    // Complete round 1 matches (4 matches)
    for (let i = 0; i < 4; i++) {
      await matches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Now complete one round 2 match
    const round2Match = matches.filter({ hasText: 'Round 2' }).first();
    await round2Match.click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Edit one of the round 1 matches that feeds into the completed round 2 match
    const matchToEdit = matches.filter({ hasText: 'Round 1' }).first();
    await matchToEdit.click();
    await page.getByRole('button', { name: 'Continue Editing' }).click();

    // Change winner
    await page.getByPlaceholder('Score').first().fill('19');
    await page.getByPlaceholder('Score').last().fill('21');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // The round 2 match should be reset, but other unaffected matches should remain
    const affectedMatch = matches.filter({ hasText: 'Round 2' }).first();
    await expect(affectedMatch).not.toHaveClass(/completed/);
  });

  test('shows warning about cascade effects', async ({ page }) => {
    await createAndStartTournament(page, 'Warning Test', 'Single Elimination', PLAYERS_8);

    // Complete several matches to have downstream effects
    const matches = page.locator('[data-testid="match-card"]');

    for (let i = 0; i < 6; i++) {
      await matches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Try to edit an early match
    await matches.first().click();

    // Warning should mention downstream matches will be reset
    await expect(page.getByText(/downstream matches.*depend.*result/)).toBeVisible();
    await expect(page.getByText(/reset all downstream matches/)).toBeVisible();
  });

  test('can edit matches in different tournament formats', async ({ page }) => {
    // Test editing in round robin (should have no downstream effects)
    await createAndStartTournament(page, 'Round Robin Edit Test', 'Round Robin', PLAYERS_4);

    // Complete a match
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Edit the match
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByRole('button', { name: 'Continue Editing' }).click();

    // Should open score modal (round robin has no downstream, so simpler)
    await expect(page.getByText('Enter Match Score')).toBeVisible();
    await expect(page.getByPlaceholder('Score').first()).toHaveValue('21');
  });

  test('edit modal closes when clicking outside', async ({ page }) => {
    await createAndStartTournament(page, 'Click Outside Edit Test', 'Single Elimination', PLAYERS_4);

    // Complete a match
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Click on completed match again
    await page.locator('[data-testid="match-card"]').first().click();

    // Click outside the confirmation modal
    await page.locator('.fixed.inset-0.z-40').first().click();

    // Confirmation modal should close
    await expect(page.getByText('Edit Completed Match')).not.toBeVisible();
  });

  test('confirmation modal shows correct match information', async ({ page }) => {
    await createAndStartTournament(page, 'Match Info Test', 'Single Elimination', PLAYERS_4);

    // Complete a match
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    const matchText = await firstMatch.textContent();

    await firstMatch.click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Click on completed match again
    await firstMatch.click();

    // Confirmation should reference the specific match
    await expect(page.getByText('Edit Completed Match')).toBeVisible();
    await expect(page.getByText(/this match/)).toBeVisible();
  });

  test('editing match preserves bracket structure', async ({ page }) => {
    await createAndStartTournament(page, 'Structure Preservation Test', 'Single Elimination', PLAYERS_8);

    // Complete all matches to finish tournament
    const matches = page.locator('[data-testid="match-card"]');
    const matchCount = await matches.count();

    for (let i = 0; i < matchCount; i++) {
      const match = matches.nth(i);
      const matchText = await match.textContent();

      if (matchText?.includes('TBD') || matchText?.includes('21')) continue;

      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(50);
    }

    // Tournament should be completed
    await expect(page.getByText('Status: completed')).toBeVisible();

    // Edit an early match
    await matches.first().click();
    await page.getByRole('button', { name: 'Continue Editing' }).click();

    // Change winner
    await page.getByPlaceholder('Score').first().fill('19');
    await page.getByPlaceholder('Score').last().fill('21');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Tournament should become active again
    await expect(page.getByText('Status: active')).toBeVisible();

    // Bracket structure should be maintained
    await expect(page.locator('[data-testid="match-card"]')).toHaveCount(7);
  });

  test('handles editing matches with forfeits', async ({ page }) => {
    await createAndStartTournament(page, 'Forfeit Edit Test', 'Single Elimination', PLAYERS_4);

    // Force a winner with forfeit
    await page.locator('[data-testid="match-override-button"]').first().click();
    await page.getByRole('button', { name: 'Force Winner' }).click();
    await page.getByLabel('Alice').check();
    await page.getByRole('checkbox', { name: 'Mark as forfeit/DQ' }).check();
    await page.getByRole('button', { name: 'Confirm Winner' }).click();

    // Edit the match
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByRole('button', { name: 'Continue Editing' }).click();

    // Should be able to enter normal scores
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Match should no longer show forfeit
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await expect(firstMatch).not.toContainText('FORFEIT');
    await expect(firstMatch).toContainText('21 - 19');
  });
});