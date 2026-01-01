import { test, expect } from '@playwright/test';
import { clearAppData, createAndStartTournament, completeMatch, waitForTournamentCompletion } from '../fixtures/test-utils';
import { PLAYERS_4, PLAYERS_8 } from '../fixtures/players';

test.describe('Single Elimination', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
  });

  test('generates correct bracket structure for 4 players', async ({ page }) => {
    await createAndStartTournament(page, '4 Player Single Elim', 'Single Elimination', PLAYERS_4);

    // Should have 3 matches: 2 quarterfinals + 1 final
    await expect(page.locator('[data-testid="match-card"]')).toHaveCount(3);

    // Check round structure
    await expect(page.getByText('Round 1')).toHaveCount(2); // 2 matches in round 1
    await expect(page.getByText('Round 2')).toHaveCount(1); // 1 match in round 2
  });

  test('generates correct bracket structure for 8 players', async ({ page }) => {
    await createAndStartTournament(page, '8 Player Single Elim', 'Single Elimination', PLAYERS_8);

    // Should have 7 matches: 4 quarterfinals + 2 semifinals + 1 final
    await expect(page.locator('[data-testid="match-card"]')).toHaveCount(7);

    // Check round structure
    await expect(page.getByText('Round 1')).toHaveCount(4); // 4 matches in round 1
    await expect(page.getByText('Round 2')).toHaveCount(2); // 2 matches in round 2
    await expect(page.getByText('Round 3')).toHaveCount(1); // 1 match in round 3
  });

  test('handles byes correctly for odd player counts', async ({ page }) => {
    // Create tournament with 5 players (will need to be rounded up to 8)
    const oddPlayers = {
      name: '5 Players',
      players: [
        { name: 'Alice', seed: 1 },
        { name: 'Bob', seed: 2 },
        { name: 'Charlie', seed: 3 },
        { name: 'Diana', seed: 4 },
        { name: 'Eve', seed: 5 },
      ],
    };

    await createAndStartTournament(page, 'Odd Players Single Elim', 'Single Elimination', oddPlayers);

    // Should round up to 8 players total, so 7 matches
    await expect(page.locator('[data-testid="match-card"]')).toHaveCount(7);

    // Should have bye matches (matches with only one player)
    const byeMatches = page.locator('[data-testid="match-card"]').filter({ hasText: 'TBD' });
    await expect(byeMatches).toHaveCount(3); // 8 - 5 = 3 byes
  });

  test('auto-advances bye matches', async ({ page }) => {
    const oddPlayers = {
      name: '3 Players',
      players: [
        { name: 'Alice', seed: 1 },
        { name: 'Bob', seed: 2 },
        { name: 'Charlie', seed: 3 },
      ],
    };

    await createAndStartTournament(page, 'Bye Test', 'Single Elimination', oddPlayers);

    // Find a bye match (should have only one player and be marked as bye)
    const byeMatch = page.locator('[data-testid="match-card"]').filter({ hasText: 'BYE' }).first();

    // The bye player should be auto-advanced (winner should be set)
    await expect(byeMatch).toContainText(/Alice|Bob|Charlie/);
    await expect(byeMatch).toHaveClass(/completed/);
  });

  test('advances winner to next round match', async ({ page }) => {
    await createAndStartTournament(page, 'Advancement Test', 'Single Elimination', PLAYERS_4);

    // Complete first match: Alice vs Bob, Alice wins
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Alice
    await page.getByPlaceholder('Score').last().fill('19'); // Bob
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Alice should appear in the final match
    const finalMatch = page.locator('[data-testid="match-card"]').last();
    await expect(finalMatch).toContainText('Alice');
  });

  test('shows correct player seeding in bracket', async ({ page }) => {
    await createAndStartTournament(page, 'Seeding Test', 'Single Elimination', PLAYERS_4);

    // Check that players are seeded correctly
    // Alice (seed 1) should be in one quarterfinal
    // Bob (seed 2) should be in another
    const matches = page.locator('[data-testid="match-card"]');
    const firstMatch = matches.first();
    const secondMatch = matches.nth(1);

    // At least one match should contain Alice and one should contain Bob
    const allMatchText = await matches.allTextContents();
    const matchesWithAlice = allMatchText.filter(text => text.includes('Alice'));
    const matchesWithBob = allMatchText.filter(text => text.includes('Bob'));

    expect(matchesWithAlice.length).toBeGreaterThan(0);
    expect(matchesWithBob.length).toBeGreaterThan(0);
  });

  test('completes tournament when final match is won', async ({ page }) => {
    await createAndStartTournament(page, 'Completion Test', 'Single Elimination', PLAYERS_4);

    // Complete all matches
    const matches = page.locator('[data-testid="match-card"]');
    const matchCount = await matches.count();

    for (let i = 0; i < matchCount; i++) {
      const match = matches.nth(i);
      const matchText = await match.textContent();

      // Skip if already completed (bye matches)
      if (matchText?.includes('BYE') || matchText?.includes('21')) {
        continue;
      }

      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(200);
    }

    // Tournament should be completed
    await expect(page.getByText('Status: completed')).toBeVisible();

    // Should show winner celebration
    await expect(page.getByText(/Winner|Championship/i)).toBeVisible();
  });

  test('does not have losers bracket', async ({ page }) => {
    await createAndStartTournament(page, 'No Losers Bracket', 'Single Elimination', PLAYERS_8);

    // Should not have any losers bracket matches
    await expect(page.getByText('Losers')).not.toBeVisible();
    await expect(page.getByText('Grand Finals')).not.toBeVisible();

    // All matches should be in winners bracket only
    const matches = page.locator('[data-testid="match-card"]');
    const matchCount = await matches.count();

    for (let i = 0; i < matchCount; i++) {
      const match = matches.nth(i);
      await expect(match).not.toContainText('Losers');
      await expect(match).not.toContainText('Grand Finals');
    }
  });

  test('shows tournament progress correctly', async ({ page }) => {
    await createAndStartTournament(page, 'Progress Test', 'Single Elimination', PLAYERS_4);

    // Initially should show 0 completed matches
    await expect(page.getByText('Status: active')).toBeVisible();

    // Complete one match
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Should still be active
    await expect(page.getByText('Status: active')).toBeVisible();

    // Complete all remaining matches
    const remainingMatches = page.locator('[data-testid="match-card"]:not(.completed)');
    const remainingCount = await remainingMatches.count();

    for (let i = 0; i < remainingCount; i++) {
      await remainingMatches.first().click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(200);
    }

    // Should now be completed
    await expect(page.getByText('Status: completed')).toBeVisible();
  });

  test('maintains bracket structure integrity', async ({ page }) => {
    await createAndStartTournament(page, 'Structure Test', 'Single Elimination', PLAYERS_8);

    // Complete matches in reverse order to test advancement
    const matches = page.locator('[data-testid="match-card"]');
    const matchCount = await matches.count();

    // Start from the end and work backwards
    for (let i = matchCount - 1; i >= 0; i--) {
      const match = matches.nth(i);
      const matchText = await match.textContent();

      // Skip bye matches
      if (matchText?.includes('BYE')) {
        continue;
      }

      // Click match and complete it
      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(200);
    }

    // Tournament should complete successfully
    await expect(page.getByText('Status: completed')).toBeVisible();
  });

  test('handles player names with special characters', async ({ page }) => {
    const specialPlayers = {
      name: 'Special Characters',
      players: [
        { name: 'José María', seed: 1 },
        { name: 'Björk Guðmundsdóttir', seed: 2 },
        { name: 'O\'Neill', seed: 3 },
        { name: 'Smith-Jones', seed: 4 },
      ],
    };

    await createAndStartTournament(page, 'Special Names', 'Single Elimination', specialPlayers);

    // All special names should be displayed correctly
    await expect(page.getByText('José María')).toBeVisible();
    await expect(page.getByText('Björk Guðmundsdóttir')).toBeVisible();
    await expect(page.getByText('O\'Neill')).toBeVisible();
    await expect(page.getByText('Smith-Jones')).toBeVisible();
  });

  test('shows match connections in bracket view', async ({ page }) => {
    await createAndStartTournament(page, 'Bracket View Test', 'Single Elimination', PLAYERS_4);

    // Should be in bracket view by default
    await expect(page.getByRole('button', { name: 'Bracket' })).toHaveClass(/active/);

    // Should show SVG bracket connectors (assuming they exist)
    const bracketContainer = page.locator('[data-testid="bracket-container"]');
    await expect(bracketContainer).toBeVisible();

    // SVG elements should be present for bracket lines
    await expect(page.locator('svg')).toBeVisible();
  });

  test('allows switching to list view', async ({ page }) => {
    await createAndStartTournament(page, 'View Switch Test', 'Single Elimination', PLAYERS_4);

    // Switch to list view
    await page.getByRole('button', { name: 'List' }).click();

    // Should show match list instead of bracket
    await expect(page.getByRole('button', { name: 'List' })).toHaveClass(/active/);

    // Should show matches in list format
    const matchList = page.locator('[data-testid="match-list"]');
    await expect(matchList).toBeVisible();
  });
});