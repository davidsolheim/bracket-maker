import { test, expect } from '@playwright/test';
import { clearAppData, navigateTo, createAndStartTournament, createPlayerList } from '../fixtures/test-utils';
import { PLAYERS_4, PLAYERS_8 } from '../fixtures/players';

test.describe('Backup and Restore', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/');
    await clearAppData(page);
  });

  test('export backup downloads valid JSON file', async ({ page }) => {
    // Create some data first
    await createAndStartTournament(page, 'Backup Test Tournament', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Create a player list
    await navigateTo(page, '/players');
    await createPlayerList(page, 'Backup Test List', PLAYERS_4);

    // Go back to dashboard for backup
    await navigateTo(page, '/');

    // Mock the download function
    await page.evaluate(() => {
      (window as any).downloadFile = (content: string, filename: string, mimeType: string) => {
        (window as any).backupData = content;
        (window as any).backupFilename = filename;
        (window as any).backupMimeType = mimeType;
      };
    });

    // Click export backup
    await page.getByRole('button', { name: 'Export backup' }).first().click();

    // Verify backup data
    const backupData = await page.evaluate(() => (window as any).backupData);
    const filename = await page.evaluate(() => (window as any).backupFilename);
    const mimeType = await page.evaluate(() => (window as any).backupMimeType);

    expect(backupData).toBeTruthy();
    expect(filename).toContain('bracket-maker-backup');
    expect(filename).toContain('.json');
    expect(mimeType).toBe('application/json');

    // Parse and verify backup structure
    const backup = JSON.parse(backupData);
    expect(backup.version).toBeTruthy();
    expect(backup.exportedAt).toBeTruthy();
    expect(backup.data).toBeTruthy();
    expect(backup.data.tournaments).toHaveLength(1);
    expect(backup.data.playerLists).toHaveLength(1);

    // Verify tournament data
    const tournament = backup.data.tournaments[0];
    expect(tournament.name).toBe('Backup Test Tournament');
    expect(tournament.status).toBe('completed');
    expect(tournament.players).toHaveLength(4);
    expect(tournament.matches).toBeTruthy();

    // Verify player list data
    const playerList = backup.data.playerLists[0];
    expect(playerList.name).toBe('Backup Test List');
    expect(playerList.players).toHaveLength(4);
  });

  test('backup includes all tournaments and player lists', async ({ page }) => {
    // Create multiple tournaments
    await createAndStartTournament(page, 'Tournament 1', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
    await createAndStartTournament(page, 'Tournament 2', 'Round Robin', PLAYERS_4);

    // Complete round robin
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

    // Create multiple player lists
    await navigateTo(page, '/players');
    await createPlayerList(page, 'List 1', PLAYERS_4);
    await createPlayerList(page, 'List 2', PLAYERS_8);

    // Export backup
    await navigateTo(page, '/');
    await page.evaluate(() => {
      (window as any).downloadFile = (content: string) => {
        (window as any).backupData = content;
      };
    });

    await page.getByRole('button', { name: 'Export backup' }).first().click();

    // Verify backup contains all data
    const backupData = await page.evaluate(() => (window as any).backupData);
    const backup = JSON.parse(backupData);

    expect(backup.data.tournaments).toHaveLength(2);
    expect(backup.data.playerLists).toHaveLength(2);

    // Check tournament names
    const tournamentNames = backup.data.tournaments.map((t: any) => t.name);
    expect(tournamentNames).toContain('Tournament 1');
    expect(tournamentNames).toContain('Tournament 2');

    // Check player list names
    const listNames = backup.data.playerLists.map((l: any) => l.name);
    expect(listNames).toContain('List 1');
    expect(listNames).toContain('List 2');
  });

  test('import backup triggers file input', async ({ page }) => {
    // Mock file input click
    let fileInputClicked = false;
    await page.evaluate(() => {
      const originalClick = HTMLInputElement.prototype.click;
      HTMLInputElement.prototype.click = function() {
        (window as any).fileInputClicked = true;
        return originalClick.call(this);
      };
    });

    // Click import backup
    await page.getByRole('button', { name: 'Import backup' }).first().click();

    // Verify file input was triggered
    const wasClicked = await page.evaluate(() => (window as any).fileInputClicked);
    expect(wasClicked).toBe(true);
  });

  test('restore modal opens when valid backup file is selected', async ({ page }) => {
    // Create backup data
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        tournaments: [{
          id: 'test-tournament',
          name: 'Test Tournament',
          format: 'single-elimination',
          status: 'completed',
          players: PLAYERS_4.players,
          matches: [],
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        }],
        playerLists: [{
          id: 'test-list',
          name: 'Test List',
          players: PLAYERS_4.players.map(p => ({ name: p.name })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      }
    };

    // Mock file selection
    await page.evaluate((backup) => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, backupData);

    // Restore modal should open
    await expect(page.getByText('Restore Backup')).toBeVisible();
    await expect(page.getByText('Backup Information')).toBeVisible();
    await expect(page.getByText('Test Tournament')).toBeVisible();
    await expect(page.getByText('Test List')).toBeVisible();
  });

  test('restore modal shows backup metadata', async ({ page }) => {
    const exportDate = new Date('2024-01-15T10:30:00Z');
    const backupData = {
      version: '2.1.0',
      exportedAt: exportDate.toISOString(),
      data: {
        tournaments: [{}], // Just need count
        playerLists: [{}, {}] // Just need count
      }
    };

    // Mock file selection
    await page.evaluate((backup) => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, backupData);

    // Check metadata display
    await expect(page.getByText('Exported:')).toBeVisible();
    await expect(page.getByText('Tournaments: 1')).toBeVisible();
    await expect(page.getByText('Player Lists: 2')).toBeVisible();
    await expect(page.getByText('Version: 2.1.0')).toBeVisible();
  });

  test('merge mode preserves existing data and adds new data', async ({ page }) => {
    // Create existing data
    await createAndStartTournament(page, 'Existing Tournament', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Create backup data with different tournament
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        tournaments: [{
          id: 'new-tournament-id',
          name: 'New Tournament',
          format: 'single-elimination',
          status: 'completed',
          players: PLAYERS_8.players,
          matches: [],
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        }],
        playerLists: [{
          id: 'new-list-id',
          name: 'New List',
          players: PLAYERS_8.players.map(p => ({ name: p.name })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      }
    };

    // Mock file selection and restore
    await page.evaluate((backup) => {
      // First select file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Then simulate merge selection and restore
      setTimeout(() => {
        const mergeRadio = document.querySelector('input[value="merge"]') as HTMLInputElement;
        if (mergeRadio) {
          mergeRadio.checked = true;
          mergeRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const restoreButton = document.querySelector('button:has-text("Restore Backup")') as HTMLButtonElement;
        if (restoreButton) {
          restoreButton.click();
        }
      }, 100);
    }, backupData);

    // Wait for restore to complete
    await page.waitForTimeout(1000);

    // Check that both tournaments exist
    await navigateTo(page, '/');
    await expect(page.getByText('Existing Tournament')).toBeVisible();
    await expect(page.getByText('New Tournament')).toBeVisible();

    // Check that player list was added
    await navigateTo(page, '/players');
    await expect(page.getByText('New List')).toBeVisible();
  });

  test('replace mode removes existing data and restores only backup data', async ({ page }) => {
    // Create existing data
    await createAndStartTournament(page, 'Existing Tournament', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    await navigateTo(page, '/players');
    await createPlayerList(page, 'Existing List', PLAYERS_4);

    // Create backup data
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        tournaments: [{
          id: 'backup-tournament',
          name: 'Backup Tournament',
          format: 'single-elimination',
          status: 'completed',
          players: PLAYERS_8.players,
          matches: [],
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        }],
        playerLists: [{
          id: 'backup-list',
          name: 'Backup List',
          players: PLAYERS_8.players.map(p => ({ name: p.name })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      }
    };

    // Mock file selection and replace restore
    await page.evaluate((backup) => {
      // First select file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Then simulate replace selection and restore
      setTimeout(() => {
        const replaceRadio = document.querySelector('input[value="replace"]') as HTMLInputElement;
        if (replaceRadio) {
          replaceRadio.checked = true;
          replaceRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const restoreButton = document.querySelector('button:has-text("Restore Backup")') as HTMLButtonElement;
        if (restoreButton) {
          restoreButton.click();
        }
      }, 100);
    }, backupData);

    // Wait for restore to complete
    await page.waitForTimeout(1000);

    // Check that only backup data exists
    await navigateTo(page, '/');
    await expect(page.getByText('Backup Tournament')).toBeVisible();
    await expect(page.getByText('Existing Tournament')).not.toBeVisible();

    await navigateTo(page, '/players');
    await expect(page.getByText('Backup List')).toBeVisible();
    await expect(page.getByText('Existing List')).not.toBeVisible();
  });

  test('replace mode shows warning about data loss', async ({ page }) => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: { tournaments: [], playerLists: [] }
    };

    // Mock file selection
    await page.evaluate((backup) => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, backupData);

    // Check warning text for replace mode
    await expect(page.getByText(/Warning/)).toBeVisible();
    await expect(page.getByText(/delete all existing/)).toBeVisible();

    // Restore button should be styled as danger
    const restoreButton = page.getByRole('button', { name: 'Restore Backup' });
    await expect(restoreButton).toHaveClass(/danger/);
  });

  test('merge mode is selected by default', async ({ page }) => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: { tournaments: [], playerLists: [] }
    };

    // Mock file selection
    await page.evaluate((backup) => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, backupData);

    // Merge should be selected by default
    const mergeRadio = page.locator('input[value="merge"]');
    await expect(mergeRadio).toBeChecked();

    const replaceRadio = page.locator('input[value="replace"]');
    await expect(replaceRadio).not.toBeChecked();
  });

  test('handles invalid backup file gracefully', async ({ page }) => {
    // Mock invalid file selection
    await page.evaluate(() => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const file = new File(['invalid json content'], 'invalid.json', { type: 'application/json' });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Should show error toast
    await expect(page.locator('[data-sonner-toast]')).toContainText('Failed to import backup');
  });

  test('handles missing backup data gracefully', async ({ page }) => {
    const invalidBackup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString()
      // Missing data property
    };

    // Mock file selection
    await page.evaluate((backup) => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const file = new File([JSON.stringify(backup)], 'incomplete.json', { type: 'application/json' });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, invalidBackup);

    // Should show error
    await expect(page.locator('[data-sonner-toast]')).toContainText('Failed to import backup');
  });

  test('cancel button closes restore modal', async ({ page }) => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: { tournaments: [], playerLists: [] }
    };

    // Mock file selection
    await page.evaluate((backup) => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, backupData);

    // Modal should be open
    await expect(page.getByText('Restore Backup')).toBeVisible();

    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Modal should be closed
    await expect(page.getByText('Restore Backup')).not.toBeVisible();
  });

  test('modal closes after successful restore', async ({ page }) => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: { tournaments: [], playerLists: [] }
    };

    // Mock file selection and immediate restore
    await page.evaluate((backup) => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Auto-restore with merge
      setTimeout(() => {
        const restoreButton = document.querySelector('button:has-text("Restore Backup")') as HTMLButtonElement;
        if (restoreButton) {
          restoreButton.click();
        }
      }, 100);
    }, backupData);

    // Wait for restore
    await page.waitForTimeout(1000);

    // Modal should be closed
    await expect(page.getByText('Restore Backup')).not.toBeVisible();

    // Should show success toast
    await expect(page.locator('[data-sonner-toast]')).toContainText('Backup restored successfully');
  });

  test('backup export includes version and timestamp', async ({ page }) => {
    // Create some data
    await createAndStartTournament(page, 'Version Test', 'Single Elimination', PLAYERS_4);
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Export backup
    await page.evaluate(() => {
      (window as any).downloadFile = (content: string) => {
        (window as any).backupData = content;
      };
    });

    await page.getByRole('button', { name: 'Export backup' }).first().click();

    // Verify backup metadata
    const backupData = await page.evaluate(() => (window as any).backupData);
    const backup = JSON.parse(backupData);

    expect(backup.version).toBeTruthy();
    expect(backup.exportedAt).toBeTruthy();

    // exportedAt should be a valid ISO string
    const exportDate = new Date(backup.exportedAt);
    expect(exportDate).toBeInstanceOf(Date);
    expect(isNaN(exportDate.getTime())).toBe(false);
  });
});