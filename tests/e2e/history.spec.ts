import { test, expect } from '@playwright/test';
import { clearAppData, navigateTo, createAndStartTournament } from '../fixtures/test-utils';
import { PLAYERS_4, PLAYERS_8 } from '../fixtures/players';

test.describe('Tournament History', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/history');
    await clearAppData(page);
  });

  test('shows empty state when no completed tournaments', async ({ page }) => {
    await expect(page.getByText('No completed tournaments yet')).toBeVisible();
  });

  test('displays completed tournaments', async ({ page }) => {
    // Create and complete a tournament
    await createAndStartTournament(page, 'History Test Tournament', 'Single Elimination', PLAYERS_4);

    // Complete all matches
    const matches = page.locator('[data-testid="match-card"]');
    const matchCount = await matches.count();

    for (let i = 0; i < matchCount; i++) {
      const match = matches.nth(i);
      const matchText = await match.textContent();

      if (matchText?.includes('BYE')) continue;

      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Navigate to history
    await navigateTo(page, '/history');

    // Should show the completed tournament
    await expect(page.getByText('History Test Tournament')).toBeVisible();
    await expect(page.getByText('4 players')).toBeVisible();
  });

  test('shows winner name for completed tournaments', async ({ page }) => {
    // Create and complete tournament
    await createAndStartTournament(page, 'Winner Display Test', 'Single Elimination', PLAYERS_4);

    // Complete matches so Alice wins
    const matches = page.locator('[data-testid="match-card"]');

    // Alice beats Bob
    await matches.nth(0).click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Charlie beats Diana
    await matches.nth(1).click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Alice beats Charlie (final)
    await matches.nth(2).click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Navigate to history
    await navigateTo(page, '/history');

    // Should show Alice as winner
    const tournamentCard = page.locator('[href*="/tournament/"]').filter({ hasText: 'Winner Display Test' });
    await expect(tournamentCard).toContainText('Alice');
  });

  test('shows completion date for tournaments', async ({ page }) => {
    const beforeDate = new Date();

    // Create and complete tournament
    await createAndStartTournament(page, 'Date Test Tournament', 'Single Elimination', PLAYERS_4);

    // Complete tournament
    const matches = page.locator('[data-testid="match-card"]');
    await matches.first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    const afterDate = new Date();

    // Navigate to history
    await navigateTo(page, '/history');

    // Should show completion date
    const tournamentCard = page.locator('[href*="/tournament/"]').filter({ hasText: 'Date Test Tournament' });
    await expect(tournamentCard.locator('text=/Completed/')).toBeVisible();

    // The date should be reasonable (between before and after test times)
    const dateText = await tournamentCard.locator('text=/Completed/').textContent();
    expect(dateText).toBeTruthy();

    // Parse the date and check it's reasonable
    const dateMatch = dateText!.match(/Completed (.+)/);
    if (dateMatch) {
      const completionDate = new Date(dateMatch[1]);
      expect(completionDate.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime());
      expect(completionDate.getTime()).toBeLessThanOrEqual(afterDate.getTime() + 60000); // Allow 1 minute buffer
    }
  });

  test('sorts tournaments by completion date descending', async ({ page }) => {
    // Create and complete first tournament
    await createAndStartTournament(page, 'First Tournament', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Wait a moment, then create second tournament
    await page.waitForTimeout(1000);

    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
    await createAndStartTournament(page, 'Second Tournament', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Navigate to history
    await navigateTo(page, '/history');

    // Second tournament should appear first (most recent)
    const tournaments = page.locator('[href*="/tournament/"]');
    await expect(tournaments.first()).toContainText('Second Tournament');
    await expect(tournaments.last()).toContainText('First Tournament');
  });

  test('navigates to tournament page when clicked', async ({ page }) => {
    // Create and complete tournament
    await createAndStartTournament(page, 'Navigation Test', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Navigate to history
    await navigateTo(page, '/history');

    // Click on tournament
    await page.getByRole('link', { name: 'Navigation Test' }).click();

    // Should navigate to tournament page
    await expect(page).toHaveURL(/\/tournament\/.+/);
    await expect(page.getByText('Navigation Test')).toBeVisible();
    await expect(page.getByText('Status: completed')).toBeVisible();
  });

  test('deletes tournament with confirmation', async ({ page }) => {
    // Create and complete tournament
    await createAndStartTournament(page, 'Delete Test Tournament', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Navigate to history
    await navigateTo(page, '/history');

    // Mock window.confirm to return true
    await page.evaluate(() => {
      window.confirm = () => true;
    });

    // Click delete button
    await page.getByRole('button', { name: 'Delete' }).click();

    // Tournament should be removed
    await expect(page.getByText('Delete Test Tournament')).not.toBeVisible();
    await expect(page.getByText('No completed tournaments yet')).toBeVisible();
  });

  test('cancels delete when user declines confirmation', async ({ page }) => {
    // Create and complete tournament
    await createAndStartTournament(page, 'Cancel Delete Test', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Navigate to history
    await navigateTo(page, '/history');

    // Mock window.confirm to return false
    await page.evaluate(() => {
      window.confirm = () => false;
    });

    // Click delete button
    await page.getByRole('button', { name: 'Delete' }).click();

    // Tournament should still be there
    await expect(page.getByText('Cancel Delete Test')).toBeVisible();
  });

  test('shows player count for each tournament', async ({ page }) => {
    // Create tournament with 8 players
    await createAndStartTournament(page, '8 Player Tournament', 'Single Elimination', PLAYERS_8);

    // Complete tournament
    const matches = page.locator('[data-testid="match-card"]');
    for (let i = 0; i < await matches.count(); i++) {
      const match = matches.nth(i);
      const matchText = await match.textContent();

      if (matchText?.includes('BYE')) continue;

      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(50);
    }

    // Navigate to history
    await navigateTo(page, '/history');

    // Should show 8 players
    const tournamentCard = page.locator('[href*="/tournament/"]').filter({ hasText: '8 Player Tournament' });
    await expect(tournamentCard).toContainText('8 players');
  });

  test('displays multiple completed tournaments', async ({ page }) => {
    // Create and complete multiple tournaments
    const tournamentNames = ['Tournament Alpha', 'Tournament Beta', 'Tournament Gamma'];

    for (let i = 0; i < tournamentNames.length; i++) {
      if (i > 0) {
        await navigateTo(page, '/tournament/new');
        await clearAppData(page);
      }

      await createAndStartTournament(page, tournamentNames[i], 'Single Elimination', PLAYERS_4);

      // Complete tournament
      await page.locator('[data-testid="match-card"]').first().click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
    }

    // Navigate to history
    await navigateTo(page, '/history');

    // Should show all 3 tournaments
    await expect(page.locator('[href*="/tournament/"]')).toHaveCount(3);

    for (const name of tournamentNames) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });

  test('handles tournaments with different formats', async ({ page }) => {
    // Create tournaments with different formats
    const formats = [
      { name: 'Single Elim Test', format: 'Single Elimination' },
      { name: 'Double Elim Test', format: 'Double Elimination' },
      { name: 'Round Robin Test', format: 'Round Robin' },
    ];

    for (let i = 0; i < formats.length; i++) {
      if (i > 0) {
        await navigateTo(page, '/tournament/new');
        await clearAppData(page);
      }

      await createAndStartTournament(page, formats[i].name, formats[i].format as any, PLAYERS_4);

      // Complete tournament (different completion logic for different formats)
      if (formats[i].format === 'Round Robin') {
        // Round robin needs all matches completed
        const matches = page.locator('[data-testid="match-card"]');
        for (let j = 0; j < await matches.count(); j++) {
          const match = matches.nth(j);
          const matchText = await match.textContent();

          if (matchText?.includes('BYE')) continue;

          await match.click();
          await page.getByPlaceholder('Score').first().fill('21');
          await page.getByPlaceholder('Score').last().fill('19');
          await page.getByRole('button', { name: 'Save Score' }).click();
          await page.waitForTimeout(50);
        }
      } else {
        // Single/Double elimination - just complete one match
        await page.locator('[data-testid="match-card"]').first().click();
        await page.getByPlaceholder('Score').first().fill('21');
        await page.getByPlaceholder('Score').last().fill('19');
        await page.getByRole('button', { name: 'Save Score' }).click();
      }
    }

    // Navigate to history
    await navigateTo(page, '/history');

    // Should show all tournaments
    await expect(page.locator('[href*="/tournament/"]')).toHaveCount(3);

    for (const format of formats) {
      await expect(page.getByText(format.name)).toBeVisible();
    }
  });

  test('shows page title correctly', async ({ page }) => {
    // Create and complete a tournament first
    await createAndStartTournament(page, 'Title Test', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Navigate to history
    await navigateTo(page, '/history');

    // Check page title
    await expect(page.getByRole('heading', { name: 'Tournament History' })).toBeVisible();
  });

  test('persists history after page reload', async ({ page }) => {
    // Create and complete tournament
    await createAndStartTournament(page, 'Persistence Test', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Navigate to history
    await navigateTo(page, '/history');

    // Record what we see
    const tournamentCount = await page.locator('[href*="/tournament/"]').count();

    // Reload page
    await page.reload();

    // Should still show the same tournaments
    await expect(page.locator('[href*="/tournament/"]')).toHaveCount(tournamentCount);
    await expect(page.getByText('Persistence Test')).toBeVisible();
  });

  test('shows different winners for different tournaments', async ({ page }) => {
    // Create first tournament where Alice wins
    await createAndStartTournament(page, 'Alice Wins', 'Single Elimination', PLAYERS_4);

    // Alice beats Bob, Charlie beats Diana, Alice beats Charlie
    const matches1 = page.locator('[data-testid="match-card"]');
    await matches1.nth(0).click(); // Alice vs Bob
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    await matches1.nth(1).click(); // Charlie vs Diana
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    await matches1.nth(2).click(); // Alice vs Charlie
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Create second tournament where Bob wins
    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
    await createAndStartTournament(page, 'Bob Wins', 'Single Elimination', PLAYERS_4);

    // Bob beats Alice, Diana beats Charlie, Bob beats Diana
    const matches2 = page.locator('[data-testid="match-card"]');
    await matches2.nth(0).click(); // Alice vs Bob
    await page.getByPlaceholder('Score').first().fill('19');
    await page.getByPlaceholder('Score').last().fill('21');
    await page.getByRole('button', { name: 'Save Score' }).click();

    await matches2.nth(1).click(); // Charlie vs Diana
    await page.getByPlaceholder('Score').first().fill('19');
    await page.getByPlaceholder('Score').last().fill('21');
    await page.getByRole('button', { name: 'Save Score' }).click();

    await matches2.nth(2).click(); // Bob vs Diana
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Navigate to history
    await navigateTo(page, '/history');

    // Should show different winners
    const aliceTournament = page.locator('[href*="/tournament/"]').filter({ hasText: 'Alice Wins' });
    const bobTournament = page.locator('[href*="/tournament/"]').filter({ hasText: 'Bob Wins' });

    await expect(aliceTournament).toContainText('Alice');
    await expect(bobTournament).toContainText('Bob');
  });

  test('delete button is visible and accessible', async ({ page }) => {
    // Create and complete tournament
    await createAndStartTournament(page, 'Delete Button Test', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Navigate to history
    await navigateTo(page, '/history');

    // Delete button should be visible
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeEnabled();
  });
});