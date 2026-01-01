import { test, expect } from '@playwright/test';
import { clearAppData, navigateTo, createAndStartTournament, createDraftTournament } from '../fixtures/test-utils';
import { PLAYERS_4 } from '../fixtures/players';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/');
    await clearAppData(page);
  });

  test('shows empty state when no tournaments exist', async ({ page }) => {
    // Check empty state message
    await expect(page.getByText('No tournaments yet')).toBeVisible();
    await expect(page.getByText('Manage your bumper pool tournaments')).toBeVisible();
    await expect(page.getByText('Create Your First Tournament')).toBeVisible();

    // Check CTA button
    await expect(page.getByRole('link', { name: 'Create Your First Tournament' })).toBeVisible();
  });

  test('displays active tournaments in correct section', async ({ page }) => {
    // Create an active tournament
    await createAndStartTournament(page, 'Active Tournament', 'Single Elimination', PLAYERS_4);

    // Navigate back to dashboard
    await navigateTo(page, '/');

    // Check active tournaments section
    await expect(page.getByText('Active Tournaments')).toBeVisible();
    await expect(page.getByText('Active Tournament')).toBeVisible();
    await expect(page.getByText('4 players')).toBeVisible();
    await expect(page.getByText('Status: active')).toBeVisible();
  });

  test('displays recent tournaments in correct section', async ({ page }) => {
    // Create and complete a tournament by playing all matches
    await createAndStartTournament(page, 'Completed Tournament', 'Single Elimination', PLAYERS_4);

    // Complete all matches in the tournament
    const matches = page.locator('[data-testid="match-card"]');
    const matchCount = await matches.count();

    for (let i = 0; i < matchCount; i++) {
      await matches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(500); // Wait for toast and animations
    }

    // Navigate back to dashboard
    await navigateTo(page, '/');

    // Check recent tournaments section
    await expect(page.getByText('Recent Tournaments')).toBeVisible();
    await expect(page.getByText('Completed Tournament')).toBeVisible();
    await expect(page.getByText('4 players')).toBeVisible();
  });

  test('shows up to 5 recent tournaments sorted by completion date', async ({ page }) => {
    // Create multiple completed tournaments
    for (let i = 1; i <= 6; i++) {
      await createAndStartTournament(page, `Tournament ${i}`, 'Single Elimination', PLAYERS_4);

      // Complete the tournament quickly
      const matches = page.locator('[data-testid="match-card"]');
      const matchCount = await matches.count();
      for (let j = 0; j < matchCount; j++) {
        await matches.nth(j).click();
        await page.getByPlaceholder('Score').first().fill('21');
        await page.getByPlaceholder('Score').last().fill('19');
        await page.getByRole('button', { name: 'Save Score' }).click();
        await page.waitForTimeout(200);
      }

      // Navigate back to dashboard for next tournament
      await navigateTo(page, '/');
    }

    // Check that only 5 recent tournaments are shown
    const recentCards = page.locator('[href*="/tournament/"]').filter({ hasText: 'Tournament' });
    await expect(recentCards).toHaveCount(5);

    // First card should be most recent (Tournament 6)
    const firstCard = recentCards.first();
    await expect(firstCard).toContainText('Tournament 6');
  });

  test('navigation works - Create New Tournament button', async ({ page }) => {
    await page.getByRole('link', { name: 'Create New Tournament' }).click();
    await expect(page).toHaveURL('/tournament/new');
  });

  test('tournament cards navigate to tournament page', async ({ page }) => {
    // Create an active tournament
    await createAndStartTournament(page, 'Test Tournament', 'Single Elimination', PLAYERS_4);

    // Navigate back to dashboard
    await navigateTo(page, '/');

    // Click on the tournament card
    await page.getByRole('link', { name: 'Test Tournament' }).click();

    // Should navigate to tournament page
    await expect(page).toHaveURL(/\/tournament\/.+/);
    await expect(page.getByText('Test Tournament')).toBeVisible();
  });

  test('displays draft tournaments correctly', async ({ page }) => {
    // Create a draft tournament
    await createDraftTournament(page, 'Draft Tournament', 'Single Elimination', PLAYERS_4);

    // Navigate back to dashboard
    await navigateTo(page, '/');

    // Should not appear in active tournaments section
    await expect(page.getByText('Active Tournaments')).not.toBeVisible();

    // Should not appear in recent tournaments section
    await expect(page.getByText('Draft Tournament')).not.toBeVisible();
  });

  test('shows tournament creation date for active tournaments', async ({ page }) => {
    // Create an active tournament
    await createAndStartTournament(page, 'Dated Tournament', 'Single Elimination', PLAYERS_4);

    // Navigate back to dashboard
    await navigateTo(page, '/');

    // Check that creation date is displayed
    const tournamentCard = page.locator('[href*="/tournament/"]').filter({ hasText: 'Dated Tournament' });
    await expect(tournamentCard.locator('text=/Started/')).toBeVisible();
  });

  test('shows tournament completion date for completed tournaments', async ({ page }) => {
    // Create and complete a tournament
    await createAndStartTournament(page, 'Completed Tournament', 'Single Elimination', PLAYERS_4);

    // Complete all matches
    const matches = page.locator('[data-testid="match-card"]');
    const matchCount = await matches.count();
    for (let i = 0; i < matchCount; i++) {
      await matches.nth(i).click();
      await page.getByPlaceholder('Score').first().fill('21');
      await page.getByPlaceholder('Score').last().fill('19');
      await page.getByRole('button', { name: 'Save Score' }).click();
      await page.waitForTimeout(200);
    }

    // Navigate back to dashboard
    await navigateTo(page, '/');

    // Check that completion date is displayed
    const tournamentCard = page.locator('[href*="/tournament/"]').filter({ hasText: 'Completed Tournament' });
    await expect(tournamentCard.locator('text=/Completed/')).toBeVisible();
  });
});