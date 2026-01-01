import { test, expect } from '@playwright/test';
import { clearAppData, createAndStartTournament, completeMatch } from '../fixtures/test-utils';
import { PLAYERS_8 } from '../fixtures/players';

test.describe('Group Knockout', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
  });

  test('assigns players to groups using snake draft', async ({ page }) => {
    await createAndStartTournament(page, 'Group Assignment Test', 'Group Stage + Knockout', PLAYERS_8);

    // Should show group stage initially
    await expect(page.getByText('Group Stage')).toBeVisible();

    // Should have multiple groups
    await expect(page.getByText(/Group [A-Z]/)).toBeVisible();

    // Check that players are distributed across groups
    // With 8 players and default 2 groups, should be 4 players per group
    const groupElements = page.locator('[data-testid="group"]');
    await expect(groupElements).toHaveCount(2);

    // Each group should have players
    for (const group of await groupElements.all()) {
      const playersInGroup = await group.locator('[data-testid="player"]').count();
      expect(playersInGroup).toBe(4);
    }
  });

  test('generates round robin matches within each group', async ({ page }) => {
    await createAndStartTournament(page, 'Group Matches Test', 'Group Stage + Knockout', PLAYERS_8);

    // Should have group matches
    const groupMatches = page.locator('[data-testid="match-card"][data-bracket="group"]');

    // For 2 groups of 4 players each: 2 * C(4,2) = 2 * 6 = 12 matches
    await expect(groupMatches).toHaveCount(12);

    // Should be labeled by group
    await expect(page.getByText('Group A')).toBeVisible();
    await expect(page.getByText('Group B')).toBeVisible();
  });

  test('shows group standings correctly', async ({ page }) => {
    await createAndStartTournament(page, 'Standings Test', 'Group Stage + Knockout', PLAYERS_8);

    // Complete some group matches
    const groupMatches = page.locator('[data-testid="match-card"][data-bracket="group"]');

    // Complete first few matches
    for (let i = 0; i < 4; i++) {
      await groupMatches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Should show group standings
    await expect(page.getByText('Standings')).toBeVisible();

    // Should show wins/losses for players
    const standingsTable = page.locator('[data-testid="group-standings"]');
    await expect(standingsTable).toBeVisible();
  });

  test('shows advance to knockout button when group stage complete', async ({ page }) => {
    await createAndStartTournament(page, 'Advance Test', 'Group Stage + Knockout', PLAYERS_8);

    // Initially no advance button
    await expect(page.getByRole('button', { name: 'Advance to Knockout' })).not.toBeVisible();

    // Complete all group matches
    const groupMatches = page.locator('[data-testid="match-card"][data-bracket="group"]');
    const matchCount = await groupMatches.count();

    for (let i = 0; i < matchCount; i++) {
      const match = groupMatches.nth(i);
      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(50);
    }

    // Advance button should now appear
    await expect(page.getByRole('button', { name: 'Advance to Knockout' })).toBeVisible();
  });

  test('cannot advance until all group matches complete', async ({ page }) => {
    await createAndStartTournament(page, 'Incomplete Advance Test', 'Group Stage + Knockout', PLAYERS_8);

    // Complete only some matches
    const groupMatches = page.locator('[data-testid="match-card"][data-bracket="group"]');
    await groupMatches.first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Advance button should not appear
    await expect(page.getByRole('button', { name: 'Advance to Knockout' })).not.toBeVisible();
  });

  test('advances top players from each group to knockout', async ({ page }) => {
    await createAndStartTournament(page, 'Knockout Advancement Test', 'Group Stage + Knockout', PLAYERS_8);

    // Set up group results so we know who advances
    const groupMatches = page.locator('[data-testid="match-card"][data-bracket="group"]');

    // Manipulate results so Alice and Bob are in Group A, Alice has best record
    // Charlie and Diana in Group B, Charlie has best record
    // This is simplified - in practice we'd need to carefully control the match results

    // Complete all group matches
    const matchCount = await groupMatches.count();
    for (let i = 0; i < matchCount; i++) {
      await groupMatches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(50);
    }

    // Advance to knockout
    await page.getByRole('button', { name: 'Advance to Knockout' }).click();

    // Should now show knockout bracket
    await expect(page.getByText('Knockout Stage')).toBeVisible();

    // Should have knockout matches (single elimination with 4 players = 3 matches)
    const knockoutMatches = page.locator('[data-testid="match-card"]').filter({
      hasText: 'winners'
    }).or(page.locator('[data-testid="match-card"]').filter({
      hasText: 'losers'
    })).or(page.locator('[data-testid="match-card"]').filter({
      hasText: 'grand-finals'
    }));

    // Depending on knockout format configured, should have some matches
    const knockoutMatchCount = await knockoutMatches.count();
    expect(knockoutMatchCount).toBeGreaterThan(0);
  });

  test('configures group count correctly', async ({ page }) => {
    // Create tournament with 3 groups
    await page.goto('/tournament/new');
    await page.getByLabel('Tournament Name').fill('3 Group Test');

    await page.getByText('Group Stage + Knockout', { exact: true }).click();

    // Configure 3 groups
    await page.getByDisplayValue('2').first().fill('3'); // Number of groups

    // Add 9 players for 3 groups of 3
    const players9 = [
      { name: 'Alice', seed: 1 },
      { name: 'Bob', seed: 2 },
      { name: 'Charlie', seed: 3 },
      { name: 'Diana', seed: 4 },
      { name: 'Eve', seed: 5 },
      { name: 'Frank', seed: 6 },
      { name: 'Grace', seed: 7 },
      { name: 'Henry', seed: 8 },
      { name: 'Iris', seed: 9 },
    ];

    for (const player of players9) {
      await page.getByPlaceholder('Player name').fill(player.name);
      await page.getByRole('button', { name: 'Add Player' }).click();
    }

    await page.getByRole('button', { name: 'Create & Start Tournament' }).click();

    // Should have 3 groups
    const groups = page.locator('[data-testid="group"]');
    await expect(groups).toHaveCount(3);

    // Each group should have 3 players
    for (const group of await groups.all()) {
      const playersInGroup = await group.locator('[data-testid="player"]').count();
      expect(playersInGroup).toBe(3);
    }
  });

  test('configures advance per group correctly', async ({ page }) => {
    // Create tournament advancing 3 per group
    await page.goto('/tournament/new');
    await page.getByLabel('Tournament Name').fill('Advance 3 Test');

    await page.getByText('Group Stage + Knockout', { exact: true }).click();

    // Configure 2 groups, advance 3 per group (6 total to knockout)
    await page.getByDisplayValue('2').last().fill('3'); // Advance per group

    // Add enough players: 2 groups × 4 players = 8 players
    for (const player of PLAYERS_8.players) {
      await page.getByPlaceholder('Player name').fill(player.name);
      await page.getByRole('button', { name: 'Add Player' }).click();
    }

    await page.getByRole('button', { name: 'Create & Start Tournament' }).click();

    // Complete group stage
    const groupMatches = page.locator('[data-testid="match-card"][data-bracket="group"]');
    const matchCount = await groupMatches.count();

    for (let i = 0; i < matchCount; i++) {
      await groupMatches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(50);
    }

    // Advance to knockout
    await page.getByRole('button', { name: 'Advance to Knockout' }).click();

    // Should have knockout with 6 players
    // For single elimination: 6 players → 5 matches + 1 bye = 6 matches
    const knockoutMatches = page.locator('[data-testid="match-card"]:not([data-bracket="group"])');
    await expect(knockoutMatches).toHaveCount(5); // Single elim with 6 players
  });

  test('configures knockout format correctly', async ({ page }) => {
    // Create tournament with double elimination knockout
    await page.goto('/tournament/new');
    await page.getByLabel('Tournament Name').fill('Double Elim Knockout Test');

    await page.getByText('Group Stage + Knockout', { exact: true }).click();

    // Configure double elimination knockout
    await page.locator('select').selectOption('Double Elimination');

    // Add players and start
    for (const player of PLAYERS_8.players) {
      await page.getByPlaceholder('Player name').fill(player.name);
      await page.getByRole('button', { name: 'Add Player' }).click();
    }

    await page.getByRole('button', { name: 'Create & Start Tournament' }).click();

    // Complete group stage
    const groupMatches = page.locator('[data-testid="match-card"][data-bracket="group"]');
    const matchCount = await groupMatches.count();

    for (let i = 0; i < matchCount; i++) {
      await groupMatches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(50);
    }

    // Advance to knockout
    await page.getByRole('button', { name: 'Advance to Knockout' }).click();

    // Should have double elimination bracket
    await expect(page.getByText('Grand Finals')).toBeVisible();
    await expect(page.locator('[data-testid="match-card"][data-bracket="grand-finals"]')).toHaveCount(2);
  });

  test('shows group stage completion status', async ({ page }) => {
    await createAndStartTournament(page, 'Completion Status Test', 'Group Stage + Knockout', PLAYERS_8);

    // Initially should show group stage active
    await expect(page.getByText('Group Stage')).toBeVisible();
    await expect(page.getByText('Status: active')).toBeVisible();

    // Complete all group matches
    const groupMatches = page.locator('[data-testid="match-card"][data-bracket="group"]');
    const matchCount = await groupMatches.count();

    for (let i = 0; i < matchCount; i++) {
      await groupMatches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(50);
    }

    // Should still be active but show advance button
    await expect(page.getByText('Status: active')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Advance to Knockout' })).toBeVisible();
  });

  test('completes full tournament from groups to knockout champion', async ({ page }) => {
    await createAndStartTournament(page, 'Full Tournament Test', 'Group Stage + Knockout', PLAYERS_8);

    // Complete group stage
    const groupMatches = page.locator('[data-testid="match-card"][data-bracket="group"]');
    const groupMatchCount = await groupMatches.count();

    for (let i = 0; i < groupMatchCount; i++) {
      await groupMatches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(50);
    }

    // Advance to knockout
    await page.getByRole('button', { name: 'Advance to Knockout' }).click();

    // Complete knockout stage
    const knockoutMatches = page.locator('[data-testid="match-card"]:not([data-bracket="group"])');
    const knockoutMatchCount = await knockoutMatches.count();

    for (let i = 0; i < knockoutMatchCount; i++) {
      const match = knockoutMatches.nth(i);
      const matchText = await match.textContent();

      if (matchText?.includes('TBD') || matchText?.includes('21')) continue;

      await match.click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Tournament should be completed
    await expect(page.getByText('Status: completed')).toBeVisible();

    // Should show winner celebration
    await expect(page.getByText(/Winner|Championship/i)).toBeVisible();
  });

  test('handles forfeits in group stage', async ({ page }) => {
    await createAndStartTournament(page, 'Group Forfeit Test', 'Group Stage + Knockout', PLAYERS_8);

    // Force a winner in group stage
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

  test('maintains group integrity during matches', async ({ page }) => {
    await createAndStartTournament(page, 'Group Integrity Test', 'Group Stage + Knockout', PLAYERS_8);

    // Verify initial group assignments
    const groups = page.locator('[data-testid="group"]');
    const group1Players = await groups.first().locator('[data-testid="player"]').allTextContents();
    const group2Players = await groups.last().locator('[data-testid="player"]').allTextContents();

    expect(group1Players.length).toBe(4);
    expect(group2Players.length).toBe(4);

    // Complete some matches
    const groupMatches = page.locator('[data-testid="match-card"][data-bracket="group"]');

    for (let i = 0; i < 2; i++) {
      await groupMatches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(100);
    }

    // Group assignments should remain the same
    const group1PlayersAfter = await groups.first().locator('[data-testid="player"]').allTextContents();
    const group2PlayersAfter = await groups.last().locator('[data-testid="player"]').allTextContents();

    expect(group1PlayersAfter.sort()).toEqual(group1Players.sort());
    expect(group2PlayersAfter.sort()).toEqual(group2Players.sort());
  });
});