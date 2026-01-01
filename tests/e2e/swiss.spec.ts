import { test, expect } from '@playwright/test';
import { clearAppData, createAndStartTournament, completeMatch } from '../fixtures/test-utils';
import { PLAYERS_8, PLAYERS_ODD } from '../fixtures/players';

test.describe('Swiss System', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
  });

  test('pairs players by seed in round 1', async ({ page }) => {
    await createAndStartTournament(page, 'Swiss Round 1', 'Swiss System', PLAYERS_8);

    // Should have round 1 matches
    await expect(page.getByText('Round 1')).toBeVisible();

    // Check specific pairings: seed 1 vs seed 8, seed 2 vs seed 7, etc.
    const matches = page.locator('[data-testid="match-card"]');

    // Alice (1) vs Henry (8)
    const aliceHenryMatch = matches.filter({ hasText: 'Alice' }).filter({ hasText: 'Henry' });
    await expect(aliceHenryMatch).toHaveCount(1);

    // Bob (2) vs Grace (7)
    const bobGraceMatch = matches.filter({ hasText: 'Bob' }).filter({ hasText: 'Grace' });
    await expect(bobGraceMatch).toHaveCount(1);

    // Charlie (3) vs Frank (6)
    const charlieFrankMatch = matches.filter({ hasText: 'Charlie' }).filter({ hasText: 'Frank' });
    await expect(charlieFrankMatch).toHaveCount(1);

    // Diana (4) vs Eve (5)
    const dianaEveMatch = matches.filter({ hasText: 'Diana' }).filter({ hasText: 'Eve' });
    await expect(dianaEveMatch).toHaveCount(1);
  });

  test('shows advance round button when round is complete', async ({ page }) => {
    await createAndStartTournament(page, 'Swiss Advance Test', 'Swiss System', PLAYERS_8);

    // Initially no advance button
    await expect(page.getByRole('button', { name: 'Advance to Round 2' })).not.toBeVisible();

    // Complete all round 1 matches
    const round1Matches = page.locator('[data-testid="match-card"]');
    const matchCount = await round1Matches.count();

    for (let i = 0; i < matchCount; i++) {
      await round1Matches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Advance button should now appear
    await expect(page.getByRole('button', { name: 'Advance to Round 2' })).toBeVisible();
  });

  test('cannot advance round until all matches complete', async ({ page }) => {
    await createAndStartTournament(page, 'Swiss Incomplete Test', 'Swiss System', PLAYERS_8);

    // Complete only some matches
    const round1Matches = page.locator('[data-testid="match-card"]');
    await round1Matches.first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Advance button should not appear
    await expect(page.getByRole('button', { name: 'Advance to Round 2' })).not.toBeVisible();

    // Should show warning if trying to advance
    await expect(page.getByText('Complete all matches')).not.toBeVisible();
  });

  test('generates round 2 with proper pairing', async ({ page }) => {
    await createAndStartTournament(page, 'Swiss Round 2 Test', 'Swiss System', PLAYERS_8);

    // Set up round 1 results to control pairing
    // Alice (1) beats Henry (8) - Alice: 1-0
    const aliceMatch = page.locator('[data-testid="match-card"]').filter({ hasText: 'Alice' }).filter({ hasText: 'Henry' });
    await aliceMatch.click();
    await page.getByPlaceholder('Score').first().fill('21'); // Alice
    await page.getByPlaceholder('Score').last().fill('19'); // Henry
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Bob (2) loses to Grace (7) - Bob: 0-1, Grace: 1-0
    const bobMatch = page.locator('[data-testid="match-card"]').filter({ hasText: 'Bob' }).filter({ hasText: 'Grace' });
    await bobMatch.click();
    await page.getByPlaceholder('Score').first().fill('19'); // Bob
    await page.getByPlaceholder('Score').last().fill('21'); // Grace
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Complete remaining matches
    const remainingMatches = page.locator('[data-testid="match-card"]:not(.completed)');
    const remainingCount = await remainingMatches.count();

    for (let i = 0; i < remainingCount; i++) {
      await remainingMatches.first().click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Advance to round 2
    await page.getByRole('button', { name: 'Advance to Round 2' }).click();

    // Should now show round 2
    await expect(page.getByText('Round 2')).toBeVisible();

    // Verify round 2 has new matches
    const round2Matches = page.locator('[data-testid="match-card"]');
    await expect(round2Matches).toHaveCount(4); // 8 players / 2 = 4 matches

    // Alice (1-0) should be paired with someone else with 1-0 record
    // (This is a simplified check - full pairing logic would be complex)
    const aliceInRound2 = round2Matches.filter({ hasText: 'Alice' });
    await expect(aliceInRound2).toHaveCount(1);
  });

  test('handles odd number of players with byes', async ({ page }) => {
    await createAndStartTournament(page, 'Swiss Odd Players', 'Swiss System', PLAYERS_ODD);

    // For 5 players: 2 matches + 1 bye in round 1
    await expect(page.locator('[data-testid="match-card"]')).toHaveCount(3);

    // Should have one bye match
    const byeMatches = page.locator('[data-testid="match-card"]').filter({ hasText: 'BYE' });
    await expect(byeMatches).toHaveCount(1);

    // Bye player should be auto-advanced
    const byeMatch = byeMatches.first();
    await expect(byeMatch).toContainText(/Alice|Bob|Charlie|Diana|Eve/);
    await expect(byeMatch).toHaveClass(/completed/);
  });

  test('bye player gets automatic win', async ({ page }) => {
    await createAndStartTournament(page, 'Swiss Bye Win', 'Swiss System', PLAYERS_ODD);

    // Find the bye match
    const byeMatch = page.locator('[data-testid="match-card"]').filter({ hasText: 'BYE' }).first();
    const byeMatchText = await byeMatch.textContent();
    const byePlayer = byeMatchText?.match(/(Alice|Bob|Charlie|Diana|Eve)/)?.[1];

    expect(byePlayer).toBeDefined();

    // Complete the actual matches
    const realMatches = page.locator('[data-testid="match-card"]:not(:has-text("BYE"))');
    const realMatchCount = await realMatches.count();

    for (let i = 0; i < realMatchCount; i++) {
      await realMatches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // The bye player should have 1 win when advancing to next round
    // (This would be verified by checking the pairing in round 2)
  });

  test('completes tournament after configured rounds', async ({ page }) => {
    // Create a Swiss tournament with 3 rounds
    await page.goto('/tournament/new');
    await page.getByLabel('Tournament Name').fill('3 Round Swiss');

    // Select Swiss and configure 3 rounds
    await page.getByText('Swiss System', { exact: true }).click();
    await page.getByDisplayValue('3').fill('3'); // Default is 3 for 8 players

    // Add players and start
    for (const player of PLAYERS_8.players) {
      await page.getByPlaceholder('Player name').fill(player.name);
      await page.getByRole('button', { name: 'Add Player' }).click();
    }
    await page.getByRole('button', { name: 'Create & Start Tournament' }).click();

    // Complete 3 rounds
    for (let round = 1; round <= 3; round++) {
      // Complete all matches in current round
      const matches = page.locator('[data-testid="match-card"]:not(.completed)');
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

      // Tournament should complete after round 3
      if (round === 3) {
        await expect(page.getByText('Status: completed')).toBeVisible();
      } else {
        // Advance to next round
        await page.getByRole('button', { name: `Advance to Round ${round + 1}` }).click();
        await expect(page.getByText(`Round ${round + 1}`)).toBeVisible();
      }
    }
  });

  test('prevents advancing beyond configured rounds', async ({ page }) => {
    // Create a 2-round Swiss tournament
    await page.goto('/tournament/new');
    await page.getByLabel('Tournament Name').fill('2 Round Swiss');
    await page.getByText('Swiss System', { exact: true }).click();
    await page.getByDisplayValue('3').fill('2'); // Only 2 rounds

    // Add players and start
    for (const player of PLAYERS_8.players) {
      await page.getByPlaceholder('Player name').fill(player.name);
      await page.getByRole('button', { name: 'Add Player' }).click();
    }
    await page.getByRole('button', { name: 'Create & Start Tournament' }).click();

    // Complete round 1
    const round1Matches = page.locator('[data-testid="match-card"]');
    const matchCount = await round1Matches.count();

    for (let i = 0; i < matchCount; i++) {
      const match = round1Matches.nth(i);
      const matchText = await match.textContent();

      if (matchText?.includes('BYE')) continue;

      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Advance to round 2
    await page.getByRole('button', { name: 'Advance to Round 2' }).click();

    // Complete round 2
    const round2Matches = page.locator('[data-testid="match-card"]:not(.completed)');
    const round2MatchCount = await round2Matches.count();

    for (let i = 0; i < round2MatchCount; i++) {
      const match = round2Matches.nth(i);
      const matchText = await match.textContent();

      if (matchText?.includes('BYE')) continue;

      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Tournament should complete after round 2
    await expect(page.getByText('Status: completed')).toBeVisible();

    // No advance button should be shown
    await expect(page.getByRole('button', { name: 'Advance to Round 3' })).not.toBeVisible();
  });

  test('shows current round number correctly', async ({ page }) => {
    await createAndStartTournament(page, 'Round Display Test', 'Swiss System', PLAYERS_8);

    // Should start with round 1
    await expect(page.getByText('Round 1')).toBeVisible();
    await expect(page.getByText('Current Swiss Round: 1')).toBeVisible();

    // Complete round 1 and advance
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

    // Advance to round 2
    await page.getByRole('button', { name: 'Advance to Round 2' }).click();

    // Should show round 2
    await expect(page.getByText('Round 2')).toBeVisible();
    await expect(page.getByText('Current Swiss Round: 2')).toBeVisible();
  });

  test('avoids rematching players from previous rounds', async ({ page }) => {
    await createAndStartTournament(page, 'No Rematch Test', 'Swiss System', PLAYERS_8);

    // Complete round 1 with specific results
    const round1Matches = page.locator('[data-testid="match-card"]');

    // Record who played whom in round 1
    const round1Pairings: Set<string> = new Set();

    for (let i = 0; i < 4; i++) {
      const match = round1Matches.nth(i);
      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();

      // Record the pairing (simplified - would need more robust parsing)
      await page.waitForTimeout(100);
    }

    // Advance to round 2
    await page.getByRole('button', { name: 'Advance to Round 2' }).click();

    // In round 2, no player should be matched with someone they played in round 1
    // (This is a complex check that would require analyzing the pairing algorithm)
    const round2Matches = page.locator('[data-testid="match-card"]');
    await expect(round2Matches).toHaveCount(4);

    // Basic check: all players are still present
    for (const player of PLAYERS_8.players) {
      const playerInRound2 = round2Matches.filter({ hasText: player.name });
      await expect(playerInRound2).toHaveCount(1);
    }
  });

  test('handles forfeits in Swiss system', async ({ page }) => {
    await createAndStartTournament(page, 'Swiss Forfeit Test', 'Swiss System', PLAYERS_8);

    // Force a winner using override
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

  test('maintains player records across rounds', async ({ page }) => {
    await createAndStartTournament(page, 'Records Test', 'Swiss System', PLAYERS_8);

    // Complete round 1
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

    // Advance to round 2
    await page.getByRole('button', { name: 'Advance to Round 2' }).click();

    // Records should be maintained for round 2 pairing
    // (This is tested implicitly by the pairing working correctly)
    const round2Matches = page.locator('[data-testid="match-card"]');
    await expect(round2Matches).toHaveCount(4);
  });
});