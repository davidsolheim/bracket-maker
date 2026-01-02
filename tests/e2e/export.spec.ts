import { test, expect } from '@playwright/test';
import { clearAppData, createAndStartTournament, navigateTo } from '../fixtures/test-utils';
import { PLAYERS_4 } from '../fixtures/players';

test.describe('Tournament Export', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/tournament/new');
    await clearAppData(page);
  });

  test('export buttons are hidden for draft tournaments', async ({ page }) => {
    // Create a draft tournament
    await page.getByLabel('Tournament Name').fill('Draft Tournament');
    await page.getByText('Single Elimination', { exact: true }).click();

    for (const player of PLAYERS_4.players) {
      await page.getByPlaceholder('Player name').fill(player.name);
      await page.getByRole('button', { name: 'Add Player' }).click();
    }

    await page.getByRole('button', { name: 'Save Draft' }).click();

    // Export buttons should not be visible
    await expect(page.getByRole('button', { name: 'Export JSON' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Export CSV' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Export Image' })).not.toBeVisible();
  });

  test('export buttons are hidden for active tournaments', async ({ page }) => {
    // Create an active tournament
    await createAndStartTournament(page, 'Active Tournament', 'Single Elimination', PLAYERS_4);

    // Export buttons should not be visible
    await expect(page.getByRole('button', { name: 'Export JSON' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Export CSV' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Export Image' })).not.toBeVisible();
  });

  test('export buttons are visible for completed tournaments', async ({ page }) => {
    // Create and complete a tournament
    await createAndStartTournament(page, 'Completed Tournament', 'Single Elimination', PLAYERS_4);

    // Complete the tournament
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Export buttons should now be visible
    await expect(page.getByRole('button', { name: 'Export JSON' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export Image' })).toBeVisible();
  });

  test('exports valid JSON data', async ({ page }) => {
    // Create and complete tournament
    await createAndStartTournament(page, 'JSON Export Test', 'Single Elimination', PLAYERS_4);

    // Complete tournament
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Mock the download function to capture the data
    let capturedData: any = null;
    let capturedFilename: string = '';

    await page.evaluate(() => {
      (window as any).originalDownloadFile = (window as any).downloadFile;
      (window as any).downloadFile = (content: string, filename: string, mimeType: string) => {
        (window as any).capturedData = content;
        (window as any).capturedFilename = filename;
        (window as any).capturedMimeType = mimeType;
      };
    });

    // Click export JSON
    await page.getByRole('button', { name: 'Export JSON' }).click();

    // Verify the captured data
    const data = await page.evaluate(() => (window as any).capturedData);
    const filename = await page.evaluate(() => (window as any).capturedFilename);
    const mimeType = await page.evaluate(() => (window as any).capturedMimeType);

    expect(data).toBeTruthy();
    expect(filename).toContain('JSON_Export_Test');
    expect(filename).toContain('.json');
    expect(mimeType).toBe('application/json');

    // Parse and verify JSON structure
    const jsonData = JSON.parse(data);
    expect(jsonData.id).toBeTruthy();
    expect(jsonData.name).toBe('JSON Export Test');
    expect(jsonData.format).toBe('single-elimination');
    expect(jsonData.status).toBe('completed');
    expect(jsonData.players).toHaveLength(4);
    expect(jsonData.matches).toBeTruthy();
    expect(jsonData.completedAt).toBeTruthy();
  });

  test('exports valid CSV data', async ({ page }) => {
    // Create and complete tournament with specific results
    await createAndStartTournament(page, 'CSV Export Test', 'Single Elimination', PLAYERS_4);

    // Complete tournament with known results
    const matches = page.locator('[data-testid="match-card"]');

    // Alice beats Bob 21-19
    await matches.nth(0).click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Charlie beats Diana 21-19
    await matches.nth(1).click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Alice beats Charlie 21-19 (final)
    await matches.nth(2).click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Mock download function
    await page.evaluate(() => {
      (window as any).downloadFile = (content: string, filename: string, mimeType: string) => {
        (window as any).capturedData = content;
        (window as any).capturedFilename = filename;
        (window as any).capturedMimeType = mimeType;
      };
    });

    // Click export CSV
    await page.getByRole('button', { name: 'Export CSV' }).click();

    // Verify captured data
    const data = await page.evaluate(() => (window as any).capturedData);
    const filename = await page.evaluate(() => (window as any).capturedFilename);
    const mimeType = await page.evaluate(() => (window as any).capturedMimeType);

    expect(data).toBeTruthy();
    expect(filename).toContain('CSV_Export_Test');
    expect(filename).toContain('.csv');
    expect(mimeType).toBe('text/csv');

    // Verify CSV structure
    const lines = data.split('\n');
    expect(lines.length).toBeGreaterThan(1);

    // Check header
    const header = lines[0];
    expect(header).toContain('Match ID');
    expect(header).toContain('Bracket');
    expect(header).toContain('Round');
    expect(header).toContain('Position');
    expect(header).toContain('Player 1');
    expect(header).toContain('Player 1 Score');
    expect(header).toContain('Player 2');
    expect(header).toContain('Player 2 Score');
    expect(header).toContain('Winner');

    // Check data rows (should have match data)
    const dataLines = lines.slice(1).filter(line => line.trim());
    expect(dataLines.length).toBeGreaterThan(0);

    // Check that some expected data is present
    const csvContent = dataLines.join('\n');
    expect(csvContent).toContain('Alice');
    expect(csvContent).toContain('Bob');
    expect(csvContent).toContain('21');
    expect(csvContent).toContain('19');
  });

  test('exports image only in bracket view', async ({ page }) => {
    // Create and complete tournament
    await createAndStartTournament(page, 'Image Export Test', 'Single Elimination', PLAYERS_4);

    // Complete tournament
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Should be in bracket view by default
    await expect(page.getByRole('button', { name: 'Bracket' })).toHaveClass(/active/);

    // Export image button should be enabled
    await expect(page.getByRole('button', { name: 'Export Image' })).toBeEnabled();

    // Switch to list view
    await page.getByRole('button', { name: 'List' }).click();

    // Export image button should be disabled
    await expect(page.getByRole('button', { name: 'Export Image' })).toBeDisabled();

    // Switch back to bracket view
    await page.getByRole('button', { name: 'Bracket' }).click();

    // Should be enabled again
    await expect(page.getByRole('button', { name: 'Export Image' })).toBeEnabled();
  });

  test('image export triggers download with correct filename', async ({ page }) => {
    // Create and complete tournament
    await createAndStartTournament(page, 'Image Export Filename Test', 'Single Elimination', PLAYERS_4);

    // Complete tournament
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Mock the exportTournamentImage function
    await page.evaluate(() => {
      (window as any).originalExportImage = (window as any).exportTournamentImage;
      (window as any).exportTournamentImage = async (element: HTMLElement, tournamentName: string) => {
        (window as any).imageExportCalled = true;
        (window as any).exportTournamentName = tournamentName;
      };
    });

    // Click export image
    await page.getByRole('button', { name: 'Export Image' }).click();

    // Verify the function was called with correct parameters
    const wasCalled = await page.evaluate(() => (window as any).imageExportCalled);
    const tournamentName = await page.evaluate(() => (window as any).exportTournamentName);

    expect(wasCalled).toBe(true);
    expect(tournamentName).toBe('Image Export Filename Test');
  });

  test('export buttons work for different tournament formats', async ({ page }) => {
    // Test with round robin (different structure)
    await createAndStartTournament(page, 'Round Robin Export Test', 'Round Robin', PLAYERS_4);

    // Complete all matches
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

    // Mock download functions
    await page.evaluate(() => {
      (window as any).downloadFile = (content: string, filename: string, mimeType: string) => {
        (window as any).lastDownload = { content, filename, mimeType };
      };
    });

    // Test JSON export
    await page.getByRole('button', { name: 'Export JSON' }).click();
    let download = await page.evaluate(() => (window as any).lastDownload);
    expect(download.filename).toContain('Round_Robin_Export_Test');
    expect(download.mimeType).toBe('application/json');

    const jsonData = JSON.parse(download.content);
    expect(jsonData.format).toBe('round-robin');
    expect(jsonData.matches.length).toBeGreaterThan(0);

    // Test CSV export
    await page.getByRole('button', { name: 'Export CSV' }).click();
    download = await page.evaluate(() => (window as any).lastDownload);
    expect(download.filename).toContain('Round_Robin_Export_Test');
    expect(download.mimeType).toBe('text/csv');

    // Verify CSV contains round robin match data
    expect(download.content).toContain('round-robin');
  });

  test('JSON export includes all tournament metadata', async ({ page }) => {
    // Create tournament with specific configuration
    await page.goto('/tournament/new');
    await page.getByLabel('Tournament Name').fill('Metadata Export Test');
    await page.getByText('Swiss System', { exact: true }).click();
    await page.getByDisplayValue('3').fill('5'); // 5 rounds

    for (const player of PLAYERS_4.players) {
      await page.getByPlaceholder('Player name').fill(player.name);
      await page.getByRole('button', { name: 'Add Player' }).click();
    }

    await page.getByRole('button', { name: 'Create & Start Tournament' }).click();

    // Complete some matches to make it completed
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Mock download
    await page.evaluate(() => {
      (window as any).downloadFile = (content: string, filename: string, mimeType: string) => {
        (window as any).capturedData = content;
      };
    });

    // Export JSON
    await page.getByRole('button', { name: 'Export JSON' }).click();

    // Verify metadata
    const data = await page.evaluate(() => (window as any).capturedData);
    const jsonData = JSON.parse(data);

    expect(jsonData.name).toBe('Metadata Export Test');
    expect(jsonData.format).toBe('swiss');
    expect(jsonData.formatConfig.numberOfRounds).toBe(5);
    expect(jsonData.status).toBe('completed');
    expect(jsonData.players).toHaveLength(4);
    expect(jsonData.createdAt).toBeTruthy();
    expect(jsonData.completedAt).toBeTruthy();
  });

  test('CSV export handles special characters in names', async ({ page }) => {
    // Create tournament with special characters in names
    const specialPlayers = {
      name: 'Special Characters',
      players: [
        { name: 'José María', seed: 1 },
        { name: 'Björk Guðmundsdóttir', seed: 2 },
        { name: 'O\'Neill', seed: 3 },
        { name: 'Smith-Jones', seed: 4 },
      ],
    };

    await createAndStartTournament(page, 'Special Names Export', 'Single Elimination', specialPlayers);

    // Complete tournament
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Mock download
    await page.evaluate(() => {
      (window as any).downloadFile = (content: string, filename: string, mimeType: string) => {
        (window as any).capturedData = content;
      };
    });

    // Export CSV
    await page.getByRole('button', { name: 'Export CSV' }).click();

    // Verify special characters are handled
    const data = await page.evaluate(() => (window as any).capturedData);
    expect(data).toContain('José María');
    expect(data).toContain('Björk Guðmundsdóttir');
    expect(data).toContain('O\'Neill');
    expect(data).toContain('Smith-Jones');
  });

  test('export filenames are sanitized', async ({ page }) => {
    // Create tournament with special characters in name
    await createAndStartTournament(page, 'Test Tournament: With/Special?Chars*', 'Single Elimination', PLAYERS_4);

    // Complete tournament
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Mock download
    await page.evaluate(() => {
      (window as any).downloadFile = (content: string, filename: string, mimeType: string) => {
        (window as any).capturedFilename = filename;
      };
    });

    // Export JSON
    await page.getByRole('button', { name: 'Export JSON' }).click();

    // Verify filename is sanitized
    const filename = await page.evaluate(() => (window as any).capturedFilename);
    expect(filename).not.toContain(':');
    expect(filename).not.toContain('/');
    expect(filename).not.toContain('?');
    expect(filename).not.toContain('*');
    expect(filename).toContain('Test_Tournament__With_Special_Chars_');
    expect(filename).toContain('.json');
  });

  test('export buttons are properly positioned', async ({ page }) => {
    // Create and complete tournament
    await createAndStartTournament(page, 'Button Position Test', 'Single Elimination', PLAYERS_4);

    // Complete tournament
    await page.locator('[data-testid="match-card"]').first().click();
    await page.getByPlaceholder('Score').first().fill('21');
    await page.getByPlaceholder('Score').last().fill('19');
    await page.getByRole('button', { name: 'Save Score' }).click();

    // Check that export buttons are in the header/actions area
    const header = page.locator('header');
    await expect(header.getByRole('button', { name: 'Export JSON' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Export CSV' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Export Image' })).toBeVisible();
  });
});