import { test, expect } from '@playwright/test';
import { clearAppData, navigateTo } from '../fixtures/test-utils';

test.describe('Theme', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/');
    await clearAppData(page);
  });

  test('starts with light theme by default', async ({ page }) => {
    // Check that html element doesn't have dark class
    const htmlClasses = await page.locator('html').getAttribute('class');
    expect(htmlClasses).not.toContain('dark');

    // Check that light theme icon is shown
    await expect(page.locator('svg').filter({ hasText: /sun|light/ })).toBeVisible();
  });

  test('theme toggle button exists and is accessible', async ({ page }) => {
    // Theme toggle should be in header
    const themeButton = page.locator('header button').filter({ hasAttribute: 'aria-label', value: 'Toggle theme' });
    await expect(themeButton).toBeVisible();
    await expect(themeButton).toBeEnabled();
  });

  test('clicking theme toggle switches to dark theme', async ({ page }) => {
    const themeButton = page.locator('header button').filter({ hasAttribute: 'aria-label', value: 'Toggle theme' });

    // Click to switch to dark
    await themeButton.click();

    // Should now have dark class
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Should show moon icon for dark theme
    await expect(page.locator('svg').filter({ hasText: /moon|dark/ })).toBeVisible();
  });

  test('clicking theme toggle switches back to light theme', async ({ page }) => {
    const themeButton = page.locator('header button').filter({ hasAttribute: 'aria-label', value: 'Toggle theme' });

    // Switch to dark first
    await themeButton.click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Switch back to light
    await themeButton.click();
    const htmlClasses = await page.locator('html').getAttribute('class');
    expect(htmlClasses).not.toContain('dark');

    // Should show sun icon again
    await expect(page.locator('svg').filter({ hasText: /sun|light/ })).toBeVisible();
  });

  test('theme preference persists across page reloads', async ({ page }) => {
    const themeButton = page.locator('header button').filter({ hasAttribute: 'aria-label', value: 'Toggle theme' });

    // Switch to dark theme
    await themeButton.click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Reload page
    await page.reload();

    // Should still be dark theme
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('theme preference is stored in localStorage', async ({ page }) => {
    const themeButton = page.locator('header button').filter({ hasAttribute: 'aria-label', value: 'Toggle theme' });

    // Initially should not have theme in localStorage or be 'light'
    let storedTheme = await page.evaluate(() => localStorage.getItem('bracket-maker-theme'));
    expect(storedTheme).toBeNull();

    // Switch to dark
    await themeButton.click();

    // Should now be stored
    storedTheme = await page.evaluate(() => localStorage.getItem('bracket-maker-theme'));
    expect(storedTheme).toBe('dark');

    // Switch back to light
    await themeButton.click();

    // Should be stored as light or removed
    storedTheme = await page.evaluate(() => localStorage.getItem('bracket-maker-theme'));
    expect(storedTheme === 'light' || storedTheme === null).toBe(true);
  });

  test('respects system theme preference when no manual preference set', async ({ page }) => {
    // Mock system preference for dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    // Clear any stored theme preference
    await page.evaluate(() => localStorage.removeItem('bracket-maker-theme'));

    // Reload to pick up system preference
    await page.reload();

    // Should follow system preference (dark in this case)
    const htmlClasses = await page.locator('html').getAttribute('class');
    expect(htmlClasses).toContain('dark');
  });

  test('manual theme preference overrides system preference', async ({ page }) => {
    // Mock system preference for dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    const themeButton = page.locator('header button').filter({ hasAttribute: 'aria-label', value: 'Toggle theme' });

    // Manually set to light theme
    await themeButton.click(); // This should switch from system dark to light

    // Should be light despite system preference
    const htmlClasses = await page.locator('html').getAttribute('class');
    expect(htmlClasses).not.toContain('dark');
  });

  test('theme applies to all page elements', async ({ page }) => {
    const themeButton = page.locator('header button').filter({ hasAttribute: 'aria-label', value: 'Toggle theme' });

    // Switch to dark theme
    await themeButton.click();

    // Check that main background is dark
    await expect(page.locator('body')).toHaveClass(/dark:bg-gray-900/);

    // Check that cards have dark backgrounds
    const cards = page.locator('[class*="bg-white"]').first();
    if (await cards.count() > 0) {
      await expect(cards).toHaveClass(/dark:bg-gray-800/);
    }
  });

  test('theme toggle works on all pages', async ({ page }) => {
    const themeButton = page.locator('header button').filter({ hasAttribute: 'aria-label', value: 'Toggle theme' });

    // Test on dashboard
    await themeButton.click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Test on tournament creation page
    await navigateTo(page, '/tournament/new');
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Test on players page
    await navigateTo(page, '/players');
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Test on stats page
    await navigateTo(page, '/stats');
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Test on history page
    await navigateTo(page, '/history');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('theme icons are correct size and accessible', async ({ page }) => {
    const themeButton = page.locator('header button').filter({ hasAttribute: 'aria-label', value: 'Toggle theme' });

    // Check initial light theme icon
    const lightIcon = themeButton.locator('svg').first();
    await expect(lightIcon).toHaveClass(/h-5 w-5/);

    // Switch to dark theme
    await themeButton.click();

    // Check dark theme icon
    const darkIcon = themeButton.locator('svg').first();
    await expect(darkIcon).toHaveClass(/h-5 w-5/);
  });

  test('theme toggle keyboard accessibility', async ({ page }) => {
    const themeButton = page.locator('header button').filter({ hasAttribute: 'aria-label', value: 'Toggle theme' });

    // Focus the button
    await themeButton.focus();
    await expect(themeButton).toBeFocused();

    // Press Enter to activate
    await page.keyboard.press('Enter');

    // Should switch theme
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Should still be focused
    await expect(themeButton).toBeFocused();
  });

  test('theme preference survives app restart simulation', async ({ page }) => {
    const themeButton = page.locator('header button').filter({ hasAttribute: 'aria-label', value: 'Toggle theme' });

    // Set dark theme
    await themeButton.click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Simulate app restart by clearing all data except theme
    await page.evaluate(() => {
      const theme = localStorage.getItem('bracket-maker-theme');
      localStorage.clear();
      if (theme) {
        localStorage.setItem('bracket-maker-theme', theme);
      }
    });

    // Reload page
    await page.reload();

    // Theme should still be dark
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('rapid theme toggling works correctly', async ({ page }) => {
    const themeButton = page.locator('header button').filter({ hasAttribute: 'aria-label', value: 'Toggle theme' });

    // Rapidly toggle theme multiple times
    for (let i = 0; i < 5; i++) {
      await themeButton.click();
      await page.waitForTimeout(50);
    }

    // Should end up in the correct state (odd number of clicks = opposite of start)
    const htmlClasses = await page.locator('html').getAttribute('class');
    expect(htmlClasses).toContain('dark'); // Started light, 5 clicks = dark

    // Check that stored preference is correct
    const storedTheme = await page.evaluate(() => localStorage.getItem('bracket-maker-theme'));
    expect(storedTheme).toBe('dark');
  });
});