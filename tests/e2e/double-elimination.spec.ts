import { test, expect } from '@playwright/test';
import { clearAppData, createAndStartTournament, completeMatch } from '../fixtures/test-utils';
import { PLAYERS_4, PLAYERS_8 } from '../fixtures/players';

test.describe('Double Elimination', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
  });

  test('generates winners, losers, and grand finals brackets', async ({ page }) => {
    await createAndStartTournament(page, 'Double Elim Test', 'Double Elimination', PLAYERS_4);

    // Should have winners bracket, losers bracket, and grand finals
    await expect(page.getByText('Winners')).toBeVisible();
    await expect(page.getByText('Losers')).toBeVisible();
    await expect(page.getByText('Grand Finals')).toBeVisible();
  });

  test('creates correct match structure for 4 players', async ({ page }) => {
    await createAndStartTournament(page, '4 Player Double Elim', 'Double Elimination', PLAYERS_4);

    // For 4 players: 2 winners matches + 2 losers matches + 2 grand finals = 6 matches
    await expect(page.locator('[data-testid="match-card"]')).toHaveCount(6);

    // Winners bracket: 2 matches (1 round)
    await expect(page.locator('[data-testid="match-card"][data-bracket="winners"]')).toHaveCount(2);

    // Losers bracket: 2 matches
    await expect(page.locator('[data-testid="match-card"][data-bracket="losers"]')).toHaveCount(2);

    // Grand finals: 2 matches
    await expect(page.locator('[data-testid="match-card"][data-bracket="grand-finals"]')).toHaveCount(2);
  });

  test('moves losers to losers bracket correctly', async ({ page }) => {
    await createAndStartTournament(page, 'Losers Test', 'Double Elimination', PLAYERS_4);

    // Complete first winners match: Alice (21) vs Bob (19)
    const winnersMatches = page.locator('[data-testid="match-card"][data-bracket="winners"]');
    await winnersMatches.first().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Alice
    await page.getByPlaceholder('Score').last().fill('19'); // Bob
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Bob should appear in losers bracket
    const losersMatches = page.locator('[data-testid="match-card"][data-bracket="losers"]');
    await expect(losersMatches.first()).toContainText('Bob');
  });

  test('advances through losers bracket correctly', async ({ page }) => {
    await createAndStartTournament(page, 'Losers Advancement', 'Double Elimination', PLAYERS_4);

    // Complete winners bracket matches to populate losers bracket
    const winnersMatches = page.locator('[data-testid="match-card"][data-bracket="winners"]');

    // Winners match 1: Alice beats Bob
    await winnersMatches.first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Winners match 2: Charlie beats Diana
    await winnersMatches.last().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Now complete losers bracket match
    const losersMatches = page.locator('[data-testid="match-card"][data-bracket="losers"]');
    await losersMatches.first().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Bob wins
    await page.getByPlaceholder('Score').last().fill('19'); // Diana loses
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Bob should advance to grand finals
    const gfMatch = page.locator('[data-testid="match-card"][data-bracket="grand-finals"]').first();
    await expect(gfMatch).toContainText('Bob');
  });

  test('populates grand finals correctly', async ({ page }) => {
    await createAndStartTournament(page, 'Grand Finals Test', 'Double Elimination', PLAYERS_4);

    // Complete winners bracket to get winners champion
    const winnersMatches = page.locator('[data-testid="match-card"][data-bracket="winners"]');

    // Winners match 1: Alice beats Bob
    await winnersMatches.first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Winners match 2: Charlie beats Diana
    await winnersMatches.last().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Winners final: Alice beats Charlie
    const winnersFinal = winnersMatches.last();
    await winnersFinal.click();
    await page.getByPlaceholder('Score').first().fill('21'); // Alice
    await page.getByPlaceholder('Score').last().fill('19'); // Charlie
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Alice should be in grand finals as winners champion
    const gfMatch = page.locator('[data-testid="match-card"][data-bracket="grand-finals"]').first();
    await expect(gfMatch).toContainText('Alice');

    // Now complete losers bracket
    const losersMatches = page.locator('[data-testid="match-card"][data-bracket="losers"]');

    // Losers match 1: Bob beats Diana
    await losersMatches.first().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Bob
    await page.getByPlaceholder('Score').last().fill('19'); // Diana
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Losers match 2: Charlie beats Bob
    await losersMatches.last().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Charlie
    await page.getByPlaceholder('Score').last().fill('19'); // Bob
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Charlie should also be in grand finals as losers champion
    await expect(gfMatch).toContainText('Charlie');
  });

  test('grand finals round 1 works correctly', async ({ page }) => {
    await createAndStartTournament(page, 'GF Round 1 Test', 'Double Elimination', PLAYERS_4);

    // Set up grand finals: Alice (winners) vs Charlie (losers)
    // Complete winners and losers brackets first...

    const winnersMatches = page.locator('[data-testid="match-card"][data-bracket="winners"]');

    // Winners: Alice beats Bob, then Alice beats Charlie
    await winnersMatches.first().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Alice
    await page.getByPlaceholder('Score').last().fill('19'); // Bob
    await page.getByRole('button', { name: 'Save Score' }).click();

    await winnersMatches.last().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Alice
    await page.getByPlaceholder('Score').last().fill('19'); // Charlie
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Losers: Bob beats Diana, then Charlie beats Bob
    const losersMatches = page.locator('[data-testid="match-card"][data-bracket="losers"]');
    await losersMatches.first().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Bob
    await page.getByPlaceholder('Score').last().fill('19'); // Diana
    await page.getByRole('button', { name: 'Save Score' }).click();

    await losersMatches.last().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Charlie
    await page.getByPlaceholder('Score').last().fill('19'); // Bob
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Now grand finals round 1: Alice vs Charlie, Charlie wins
    const gfRound1 = page.locator('[data-testid="match-card"][data-bracket="grand-finals"][data-round="1"]');
    await gfRound1.click();
    await page.getByPlaceholder('Score').first().fill('19'); // Alice
    await page.getByPlaceholder('Score').last().fill('21'); // Charlie
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Charlie should win GF round 1
    await expect(gfRound1).toContainText('Charlie');
  });

  test('bracket resets when losers champion wins GF round 1', async ({ page }) => {
    await createAndStartTournament(page, 'Bracket Reset Test', 'Double Elimination', PLAYERS_4);

    // Set up scenario where losers champion wins GF round 1
    // This should complete the tournament immediately

    const winnersMatches = page.locator('[data-testid="match-card"][data-bracket="winners"]');

    // Winners: Alice beats Bob, then Charlie beats Alice
    await winnersMatches.first().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Alice
    await page.getByPlaceholder('Score').last().fill('19'); // Bob
    await page.getByRole('button', { name: 'Save Score' }).click();

    await winnersMatches.last().click();
    await page.getByPlaceholder('Score').first().fill('19'); // Charlie
    await page.getByPlaceholder('Score').last().fill('21'); // Alice
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Losers: Bob beats Diana, then Alice beats Bob
    const losersMatches = page.locator('[data-testid="match-card"][data-bracket="losers"]');
    await losersMatches.first().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Bob
    await page.getByPlaceholder('Score').last().fill('19'); // Diana
    await page.getByRole('button', { name: 'Save Score' }).click();

    await losersMatches.last().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Alice
    await page.getByPlaceholder('Score').last().fill('19'); // Bob
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Now GF round 1: Charlie (winners) vs Alice (losers), Alice wins
    const gfRound1 = page.locator('[data-testid="match-card"][data-bracket="grand-finals"][data-round="1"]');
    await gfRound1.click();
    await page.getByPlaceholder('Score').first().fill('19'); // Charlie
    await page.getByPlaceholder('Score').last().fill('21'); // Alice
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Tournament should be completed immediately (no GF round 2 needed)
    await expect(page.getByText('Status: completed')).toBeVisible();

    // Alice should be the winner
    await expect(page.getByText(/Winner|Champion/i)).toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();
  });

  test('requires grand finals round 2 when winners champion wins GF round 1', async ({ page }) => {
    await createAndStartTournament(page, 'GF Round 2 Required', 'Double Elimination', PLAYERS_4);

    // Set up scenario where winners champion wins GF round 1
    // This should require GF round 2

    const winnersMatches = page.locator('[data-testid="match-card"][data-bracket="winners"]');

    // Winners: Alice beats Bob, then Alice beats Charlie
    await winnersMatches.first().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Alice
    await page.getByPlaceholder('Score').last().fill('19'); // Bob
    await page.getByRole('button', { name: 'Save Score' }).click();

    await winnersMatches.last().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Alice
    await page.getByPlaceholder('Score').last().fill('19'); // Charlie
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Losers: Bob beats Diana, then Charlie beats Bob
    const losersMatches = page.locator('[data-testid="match-card"][data-bracket="losers"]');
    await losersMatches.first().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Bob
    await page.getByPlaceholder('Score').last().fill('19'); // Diana
    await page.getByRole('button', { name: 'Save Score' }).click();

    await losersMatches.last().click();
    await page.getByPlaceholder('Score').first().fill('21'); // Charlie
    await page.getByPlaceholder('Score').last().fill('19'); // Bob
    await page.getByRole('button', { name: 'Save Score' }).click();

    // GF round 1: Alice (winners) vs Charlie (losers), Alice wins
    const gfRound1 = page.locator('[data-testid="match-card"][data-bracket="grand-finals"][data-round="1"]');
    await gfRound1.click();
    await page.getByPlaceholder('Score').first().fill('21'); // Alice
    await page.getByPlaceholder('Score').last().fill('19'); // Charlie
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Tournament should NOT be completed yet
    await expect(page.getByText('Status: active')).toBeVisible();

    // GF round 2 should be populated
    const gfRound2 = page.locator('[data-testid="match-card"][data-bracket="grand-finals"][data-round="2"]');
    await expect(gfRound2).toContainText('Alice');
    await expect(gfRound2).toContainText('Charlie');
  });

  test('completes tournament after grand finals round 2', async ({ page }) => {
    await createAndStartTournament(page, 'Complete Double Elim', 'Double Elimination', PLAYERS_4);

    // Complete entire tournament including GF round 2
    const allMatches = page.locator('[data-testid="match-card"]');
    const matchCount = await allMatches.count();

    // Complete matches in order (winners -> losers -> GF round 1 -> GF round 2)
    for (let i = 0; i < matchCount; i++) {
      const match = allMatches.nth(i);
      const matchText = await match.textContent();

      // Skip completed matches
      if (matchText?.includes('21 -') || matchText?.includes('BYE')) {
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

  test('handles 8 player double elimination correctly', async ({ page }) => {
    await createAndStartTournament(page, '8 Player Double Elim', 'Double Elimination', PLAYERS_8);

    // For 8 players: winners (7 matches) + losers (variable) + GF (2) = more matches
    const matchCount = await page.locator('[data-testid="match-card"]').count();
    expect(matchCount).toBeGreaterThan(10);

    // Should have proper bracket structure
    await expect(page.locator('[data-testid="match-card"][data-bracket="winners"]')).toHaveCount(7);
    await expect(page.locator('[data-testid="match-card"][data-bracket="grand-finals"]')).toHaveCount(2);
  });

  test('shows correct round labels for complex brackets', async ({ page }) => {
    await createAndStartTournament(page, 'Round Labels Test', 'Double Elimination', PLAYERS_8);

    // Winners bracket should have rounds 1-3
    await expect(page.getByText('Winners - Round 1')).toBeVisible();
    await expect(page.getByText('Winners - Round 2')).toBeVisible();
    await expect(page.getByText('Winners - Round 3')).toBeVisible();

    // Losers bracket should have multiple rounds
    await expect(page.getByText('Losers - Round 1')).toBeVisible();

    // Grand finals should have rounds 1 and 2
    await expect(page.getByText('Grand Finals - Round 1')).toBeVisible();
    await expect(page.getByText('Grand Finals - Round 2')).toBeVisible();
  });

  test('maintains bracket integrity during complex advancement', async ({ page }) => {
    await createAndStartTournament(page, 'Integrity Test', 'Double Elimination', PLAYERS_8);

    // Complete several matches and verify bracket remains consistent
    const winnersMatches = page.locator('[data-testid="match-card"][data-bracket="winners"]');

    // Complete a few winners matches
    for (let i = 0; i < 4; i++) {
      await winnersMatches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Verify that advancement happened correctly
    // Later round matches should have winners populated
    const round2Matches = page.locator('[data-testid="match-card"][data-bracket="winners"][data-round="2"]');
    await expect(round2Matches).toHaveCount(2);

    // At least one round 2 match should have players
    const round2Texts = await round2Matches.allTextContents();
    const populatedRound2 = round2Texts.some(text => !text.includes('TBD'));
    expect(populatedRound2).toBe(true);
  });

  test('handles forfeits and forced winners in double elimination', async ({ page }) => {
    await createAndStartTournament(page, 'Forfeit Test', 'Double Elimination', PLAYERS_4);

    // Use override to force a winner (forfeit)
    const firstMatch = page.locator('[data-testid="match-card"]').first();

    // Click override button (three dots menu)
    await page.locator('[data-testid="match-override-button"]').first().click();

    // Force winner tab
    await page.getByRole('button', { name: 'Force Winner' }).click();

    // Select a winner and mark as forfeit
    await page.getByLabel('Select Winner').check();
    await page.getByRole('checkbox', { name: 'Mark as forfeit/DQ' }).check();

    // Confirm
    await page.getByRole('button', { name: 'Confirm Winner' }).click();

    // Match should be completed with forfeit
    await expect(firstMatch).toContainText('FORFEIT');
  });
});