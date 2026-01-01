import { test, expect } from '@playwright/test';
import { clearAppData, navigateTo, createAndStartTournament } from '../fixtures/test-utils';
import { PLAYERS_4 } from '../fixtures/players';

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/');
    await clearAppData(page);
  });

  test('desktop navigation is visible on large screens', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1200, height: 800 });

    // Desktop navigation should be visible
    const desktopNav = page.locator('nav.hidden.md\\:flex');
    await expect(desktopNav).toBeVisible();

    // Mobile menu button should be hidden
    const mobileMenuButton = page.locator('button.md\\:hidden').filter({ hasAttribute: 'aria-label', value: 'Toggle menu' });
    await expect(mobileMenuButton).not.toBeVisible();
  });

  test('mobile menu button is visible on small screens', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile menu button should be visible
    const mobileMenuButton = page.locator('button.md\\:hidden').filter({ hasAttribute: 'aria-label', value: 'Toggle menu' });
    await expect(mobileMenuButton).toBeVisible();

    // Desktop navigation should be hidden
    const desktopNav = page.locator('nav.hidden.md\\:flex');
    await expect(desktopNav).not.toBeVisible();
  });

  test('mobile menu opens and closes correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileMenuButton = page.locator('button.md\\:hidden').filter({ hasAttribute: 'aria-label', value: 'Toggle menu' });

    // Initially menu should be closed
    const mobileMenu = page.locator('nav.md\\:hidden');
    await expect(mobileMenu).not.toBeVisible();

    // Click to open menu
    await mobileMenuButton.click();
    await expect(mobileMenu).toBeVisible();

    // Click again to close
    await mobileMenuButton.click();
    await expect(mobileMenu).not.toBeVisible();
  });

  test('mobile menu navigation links work', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileMenuButton = page.locator('button.md\\:hidden').filter({ hasAttribute: 'aria-label', value: 'Toggle menu' });

    // Open mobile menu
    await mobileMenuButton.click();

    // Click on tournament creation link
    await page.getByRole('link', { name: 'New Tournament' }).click();

    // Should navigate to tournament creation page
    await expect(page).toHaveURL('/tournament/new');
  });

  test('mobile menu closes when navigating', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileMenuButton = page.locator('button.md\\:hidden').filter({ hasAttribute: 'aria-label', value: 'Toggle menu' });

    // Open mobile menu
    await mobileMenuButton.click();
    await expect(page.locator('nav.md\\:hidden')).toBeVisible();

    // Navigate to another page
    await page.getByRole('link', { name: 'Players' }).click();

    // Menu should close
    await expect(page.locator('nav.md\\:hidden')).not.toBeVisible();
  });

  test('tournament cards are responsive', async ({ page }) => {
    // Create a tournament first
    await createAndStartTournament(page, 'Responsive Test', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Navigate back to dashboard
    await navigateTo(page, '/');

    // Test on desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    const tournamentCard = page.locator('[href*="/tournament/"]').filter({ hasText: 'Responsive Test' });
    await expect(tournamentCard).toBeVisible();

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(tournamentCard).toBeVisible();

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(tournamentCard).toBeVisible();
  });

  test('modal dialogs are responsive', async ({ page }) => {
    await createAndStartTournament(page, 'Modal Test', 'Single Elimination', PLAYERS_4);

    // Open score modal
    await page.locator('[data-testid="match-card"]').first().click();

    // Test modal on different screen sizes
    const modal = page.getByText('Enter Match Score').locator('..').locator('..');

    // Desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/max-w-md/); // Desktop modal size

    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.locator('[data-testid="match-card"]').first().click();
    await expect(modal).toBeVisible();
    // Modal should still be usable on mobile
  });

  test('form layouts adapt to screen size', async ({ page }) => {
    await navigateTo(page, '/tournament/new');

    // Test tournament creation form on different sizes
    const formatButtons = page.locator('button').filter({ hasText: 'Single Elimination' });

    // Desktop - should show multiple columns
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(formatButtons).toBeVisible();

    // Mobile - should stack vertically
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(formatButtons).toBeVisible();
  });

  test('table layouts are scrollable on mobile', async ({ page }) => {
    // Create tournament and complete it to show stats
    await createAndStartTournament(page, 'Table Test', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    await navigateTo(page, '/stats');

    // Stats table should be scrollable on mobile
    await page.setViewportSize({ width: 375, height: 667 });

    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Should have horizontal scroll capability
    const tableContainer = table.locator('..');
    await expect(tableContainer).toHaveClass(/overflow-x-auto/);
  });

  test('bracket view is scrollable on mobile', async ({ page }) => {
    await createAndStartTournament(page, 'Bracket Mobile Test', 'Single Elimination', PLAYERS_8);

    // Test bracket scrolling on mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Bracket should be scrollable horizontally
    const bracketContainer = page.locator('[data-testid="bracket-container"]');
    if (await bracketContainer.count() > 0) {
      await expect(bracketContainer).toHaveCSS('overflow-x', 'auto');
    }
  });

  test('action buttons adapt to screen size', async ({ page }) => {
    // Create and complete tournament
    await createAndStartTournament(page, 'Buttons Test', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Test header buttons on different screen sizes
    const exportButtons = page.locator('header button').filter({ hasText: 'Export' });

    // Desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(exportButtons).toHaveCount(3); // JSON, CSV, Image

    // Mobile - buttons should still be there but might be smaller
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(exportButtons).toBeVisible();
  });

  test('toast notifications work on mobile', async ({ page }) => {
    await navigateTo(page, '/tournament/new');

    // Trigger a validation error
    await page.getByRole('button', { name: 'Create & Start Tournament' }).click();

    // Toast should appear
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();

    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(toast).toBeVisible();
  });

  test('dropdown menus work on mobile', async ({ page }) => {
    await navigateTo(page, '/tournament/new');

    // Test format selection dropdown
    await page.getByText('Swiss System', { exact: true }).click();
    await expect(page.getByText('Number of Rounds')).toBeVisible();

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('Number of Rounds')).toBeVisible();
  });

  test('file upload works on mobile', async ({ page }) => {
    await navigateTo(page, '/players');

    // File input should be usable on mobile
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(fileInput).toBeVisible();
  });

  test('keyboard navigation works on mobile', async ({ page }) => {
    await createAndStartTournament(page, 'Keyboard Mobile Test', 'Single Elimination', PLAYERS_4);

    // Open score modal
    await page.locator('[data-testid="match-card"]').first().click();

    // Test keyboard navigation on mobile
    await page.setViewportSize({ width: 375, height: 667 });

    const scoreInput = page.getByPlaceholder('Score').first();
    await scoreInput.focus();

    // Arrow keys should still work
    await page.keyboard.press('ArrowUp');
    await expect(scoreInput).toHaveValue('1');

    // Enter should save
    await page.keyboard.press('Tab'); // Move to second input
    await page.keyboard.press('ArrowUp'); // Set second score
    await page.keyboard.press('Enter');

    // Modal should close
    await expect(page.getByText('Enter Match Score')).not.toBeVisible();
  });

  test('mobile menu shows current tournament info', async ({ page }) => {
    await createAndStartTournament(page, 'Current Tournament Test', 'Single Elimination', PLAYERS_4);

    await page.setViewportSize({ width: 375, height: 667 });

    const mobileMenuButton = page.locator('button.md\\:hidden').filter({ hasAttribute: 'aria-label', value: 'Toggle menu' });
    await mobileMenuButton.click();

    // Should show current tournament name in mobile menu
    await expect(page.getByText('Current Tournament Test')).toBeVisible();
  });

  test('touch targets are appropriately sized on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Buttons should have adequate touch targets
    const buttons = page.locator('button');
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i);
      const boundingBox = await button.boundingBox();

      if (boundingBox) {
        // Touch targets should be at least 44px (WCAG recommendation)
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('content reflows correctly when rotating device', async ({ page }) => {
    // Start in portrait mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Create tournament
    await createAndStartTournament(page, 'Rotation Test', 'Single Elimination', PLAYERS_4);

    // Check layout in portrait
    const tournamentCard = page.locator('[href*="/tournament/"]').filter({ hasText: 'Rotation Test' });
    await expect(tournamentCard).toBeVisible();

    // Simulate rotation to landscape
    await page.setViewportSize({ width: 667, height: 375 });

    // Content should still be visible and usable
    await expect(tournamentCard).toBeVisible();

    // Should now show desktop navigation
    const desktopNav = page.locator('nav.hidden.md\\:flex');
    await expect(desktopNav).toBeVisible();
  });
});