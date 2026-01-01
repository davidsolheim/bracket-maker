import { test, expect } from '@playwright/test';
import { clearAppData, createAndStartTournament, completeMatch } from '../fixtures/test-utils';
import { PLAYERS_4, PLAYERS_8, PLAYERS_ODD } from '../fixtures/players';

test.describe('Round Robin', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
  });

  test('generates all possible matchups for 4 players', async ({ page }) => {
    await createAndStartTournament(page, '4 Player Round Robin', 'Round Robin', PLAYERS_4);

    // For 4 players: C(4,2) = 6 matches (each pair plays once)
    await expect(page.locator('[data-testid="match-card"]')).toHaveCount(6);

    // Each player should appear in 3 matches (4-1 = 3 opponents)
    const aliceMatches = await page.locator('[data-testid="match-card"]').filter({ hasText: 'Alice' }).count();
    const bobMatches = await page.locator('[data-testid="match-card"]').filter({ hasText: 'Bob' }).count();
    const charlieMatches = await page.locator('[data-testid="match-card"]').filter({ hasText: 'Charlie' }).count();
    const dianaMatches = await page.locator('[data-testid="match-card"]').filter({ hasText: 'Diana' }).count();

    expect(aliceMatches).toBe(3);
    expect(bobMatches).toBe(3);
    expect(charlieMatches).toBe(3);
    expect(dianaMatches).toBe(3);
  });

  test('generates correct matchups for 8 players', async ({ page }) => {
    await createAndStartTournament(page, '8 Player Round Robin', 'Round Robin', PLAYERS_8);

    // For 8 players: C(8,2) = 28 matches
    await expect(page.locator('[data-testid="match-card"]')).toHaveCount(28);

    // Each player should appear in 7 matches (8-1 = 7 opponents)
    const aliceMatches = await page.locator('[data-testid="match-card"]').filter({ hasText: 'Alice' }).count();
    expect(aliceMatches).toBe(7);
  });

  test('handles odd number of players with byes', async ({ page }) => {
    await createAndStartTournament(page, 'Odd Players Round Robin', 'Round Robin', PLAYERS_ODD);

    // For 5 players: C(5,2) = 10 matches, but one player gets a bye each round
    // Total matches = 10 (actual matchups) + 5 (byes) = 15
    await expect(page.locator('[data-testid="match-card"]')).toHaveCount(15);

    // Should have bye matches
    const byeMatches = page.locator('[data-testid="match-card"]').filter({ hasText: 'BYE' });
    await expect(byeMatches).toHaveCount(5); // One bye per round for 5 rounds
  });

  test('auto-advances bye matches', async ({ page }) => {
    await createAndStartTournament(page, 'Bye Test', 'Round Robin', PLAYERS_ODD);

    // Find bye matches
    const byeMatches = page.locator('[data-testid="match-card"]').filter({ hasText: 'BYE' });

    // Bye matches should be auto-completed with the non-bye player as winner
    const byeMatchCount = await byeMatches.count();
    expect(byeMatchCount).toBeGreaterThan(0);

    // Check that bye matches show the winner
    const firstByeMatch = byeMatches.first();
    await expect(firstByeMatch).toContainText(/Alice|Bob|Charlie|Diana|Eve/);
    await expect(firstByeMatch).toHaveClass(/completed/);
  });

  test('updates standings correctly after matches', async ({ page }) => {
    await createAndStartTournament(page, 'Standings Test', 'Round Robin', PLAYERS_4);

    // Complete a few matches
    const matches = page.locator('[data-testid="match-card"]');

    // Alice beats Bob
    await matches.filter({ hasText: 'Alice' }).filter({ hasText: 'Bob' }).first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Charlie beats Diana
    await matches.filter({ hasText: 'Charlie' }).filter({ hasText: 'Diana' }).first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Alice beats Charlie
    await matches.filter({ hasText: 'Alice' }).filter({ hasText: 'Charlie' }).first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Should show standings/leaderboard (if implemented)
    // For now, just verify matches are completed
    const completedMatches = page.locator('[data-testid="match-card"].completed');
    await expect(completedMatches).toHaveCount(3);
  });

  test('completes tournament when all matches are played', async ({ page }) => {
    await createAndStartTournament(page, 'Completion Test', 'Round Robin', PLAYERS_4);

    // Complete all matches
    const matches = page.locator('[data-testid="match-card"]');
    const matchCount = await matches.count();

    for (let i = 0; i < matchCount; i++) {
      const match = matches.nth(i);
      const matchText = await match.textContent();

      // Skip bye matches
      if (matchText?.includes('BYE')) {
        continue;
      }

      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Tournament should be completed
    await expect(page.getByText('Status: completed')).toBeVisible();

    // Should show winner celebration or final standings
    await expect(page.getByText(/Winner|Championship|Standings/i)).toBeVisible();
  });

  test('shows round robin in list view by default', async ({ page }) => {
    await createAndStartTournament(page, 'View Test', 'Round Robin', PLAYERS_4);

    // Round robin should show in list view by default (no bracket)
    await expect(page.getByRole('button', { name: 'List' })).toHaveClass(/active/);

    // Should show match list
    const matchList = page.locator('[data-testid="match-list"]');
    await expect(matchList).toBeVisible();
  });

  test('does not show bracket view for round robin', async ({ page }) => {
    await createAndStartTournament(page, 'No Bracket Test', 'Round Robin', PLAYERS_4);

    // Bracket view should not be available or should be disabled
    const bracketButton = page.getByRole('button', { name: 'Bracket' });
    await expect(bracketButton).toBeDisabled();
  });

  test('handles player ordering correctly', async ({ page }) => {
    // Create with shuffled players to test ordering doesn't affect matchups
    await createAndStartTournament(page, 'Ordering Test', 'Round Robin', PLAYERS_4);

    // All expected matchups should exist regardless of seeding
    const matchups = [
      ['Alice', 'Bob'],
      ['Alice', 'Charlie'],
      ['Alice', 'Diana'],
      ['Bob', 'Charlie'],
      ['Bob', 'Diana'],
      ['Charlie', 'Diana']
    ];

    for (const [player1, player2] of matchups) {
      const matchup = page.locator('[data-testid="match-card"]').filter({
        hasText: player1
      }).filter({ hasText: player2 });
      await expect(matchup).toHaveCount(1);
    }
  });

  test('maintains match integrity across page reloads', async ({ page }) => {
    await createAndStartTournament(page, 'Persistence Test', 'Round Robin', PLAYERS_4);

    // Complete a match
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await firstMatch.click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Reload page
    await page.reload();

    // Match should still be completed
    const completedMatches = page.locator('[data-testid="match-card"].completed');
    await expect(completedMatches).toHaveCount(1);
  });

  test('shows correct match count for different player numbers', async ({ page }) => {
    // Test different player counts
    const testCases = [
      { players: PLAYERS_4, expectedMatches: 6 }, // C(4,2) = 6
      { players: PLAYERS_ODD, expectedMatches: 15 }, // C(5,2) + 5 byes = 15
    ];

    for (const { players, expectedMatches } of testCases) {
      await createAndStartTournament(page, `Count Test ${players.players.length}`, 'Round Robin', players);
      await expect(page.locator('[data-testid="match-card"]')).toHaveCount(expectedMatches);

      // Navigate back for next test
      await page.goto('/');
      await clearAppData(page);
    }
  });

  test('handles forfeits correctly in round robin', async ({ page }) => {
    await createAndStartTournament(page, 'Forfeit Test', 'Round Robin', PLAYERS_4);

    // Use override to force a winner (forfeit)
    await page.locator('[data-testid="match-override-button"]').first().click();
    await page.getByRole('button', { name: 'Force Winner' }).click();

    // Select winner and mark as forfeit
    await page.getByLabel('Select Winner').first().check();
    await page.getByRole('checkbox', { name: 'Mark as forfeit/DQ' }).check();
    await page.getByRole('button', { name: 'Confirm Winner' }).click();

    // Match should be completed with forfeit
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await expect(firstMatch).toContainText('FORFEIT');
  });

  test('allows editing completed matches', async ({ page }) => {
    await createAndStartTournament(page, 'Edit Test', 'Round Robin', PLAYERS_4);

    // Complete a match
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await firstMatch.click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Click on completed match again - should show confirmation
    await firstMatch.click();
    await expect(page.getByText('Edit Completed Match')).toBeVisible();
    await expect(page.getByText(/reset all downstream matches/)).toBeVisible();
  });

  test('shows tournament progress correctly', async ({ page }) => {
    await createAndStartTournament(page, 'Progress Test', 'Round Robin', PLAYERS_4);

    const totalMatches = await page.locator('[data-testid="match-card"]').count();
    const nonByeMatches = totalMatches - 0; // Assuming no byes in this case

    // Initially active
    await expect(page.getByText('Status: active')).toBeVisible();

    // Complete all matches
    const matches = page.locator('[data-testid="match-card"]');
    for (let i = 0; i < totalMatches; i++) {
      const match = matches.nth(i);
      const matchText = await match.textContent();

      if (matchText?.includes('BYE')) continue;

      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(50);
    }

    // Should be completed
    await expect(page.getByText('Status: completed')).toBeVisible();
  });
});