import { test, expect } from '@playwright/test';
import { clearAppData, navigateTo, waitForToast, addPlayers } from '../fixtures/test-utils';
import { PLAYERS_4, PLAYERS_8, PLAYERS_ODD } from '../fixtures/players';

test.describe('Player Lists', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/players');
    await clearAppData(page);
  });

  test('shows empty state when no lists exist', async ({ page }) => {
    await expect(page.getByText('No saved lists yet')).toBeVisible();
  });

  test('creates new player list', async ({ page }) => {
    // Click New List button
    await page.getByRole('button', { name: 'New List' }).click();

    // Fill list name
    await page.getByLabel('List Name').fill('Test Players');

    // Add players
    await addPlayers(page, PLAYERS_4);

    // Save list
    await page.getByRole('button', { name: 'Save List' }).click();

    // Should show success toast
    await waitForToast(page, 'Player list saved successfully!');

    // Should display the new list
    await expect(page.getByText('Test Players')).toBeVisible();
    await expect(page.getByText('4 player')).toBeVisible();
  });

  test('validates list name is required', async ({ page }) => {
    await page.getByRole('button', { name: 'New List' }).click();

    // Try to save without name
    await page.getByRole('button', { name: 'Save List' }).click();

    // Should show error
    await waitForToast(page, 'Please enter a list name');
  });

  test('validates list must have players', async ({ page }) => {
    await page.getByRole('button', { name: 'New List' }).click();

    // Fill list name but no players
    await page.getByLabel('List Name').fill('Empty List');

    // Try to save
    await page.getByRole('button', { name: 'Save List' }).click();

    // Should show error
    await waitForToast(page, 'Please add at least one player');
  });

  test('selects and views existing list', async ({ page }) => {
    // Create a list first
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List Name').fill('View Test List');
    await addPlayers(page, PLAYERS_4);
    await page.getByRole('button', { name: 'Save List' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Click on the list to view it
    await page.getByText('View Test List').click();

    // Should show view mode
    await expect(page.getByText('View List')).toBeVisible();

    // Should show all players
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText('Charlie')).toBeVisible();
    await expect(page.getByText('Diana')).toBeVisible();

    // Should show Edit and Delete buttons
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('edits existing player list', async ({ page }) => {
    // Create a list first
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List Name').fill('Edit Test List');
    await addPlayers(page, PLAYERS_4);
    await page.getByRole('button', { name: 'Save List' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Select and edit the list
    await page.getByText('Edit Test List').click();
    await page.getByRole('button', { name: 'Edit' }).click();

    // Should be in edit mode
    await expect(page.getByText('Edit List')).toBeVisible();

    // Change list name
    await page.getByLabel('List Name').fill('Edited List');

    // Add another player
    await page.getByPlaceholder('Player name').fill('Eve');
    await page.getByRole('button', { name: 'Add Player' }).click();

    // Update list
    await page.getByRole('button', { name: 'Update' }).click();

    // Should show success toast
    await waitForToast(page, 'Player list saved successfully!');

    // Should show updated list
    await expect(page.getByText('Edited List')).toBeVisible();
    await expect(page.getByText('5 player')).toBeVisible();
  });

  test('deletes player list with confirmation', async ({ page }) => {
    // Create a list first
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List Name').fill('Delete Test List');
    await addPlayers(page, PLAYERS_4);
    await page.getByRole('button', { name: 'Save List' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Select the list
    await page.getByText('Delete Test List').click();

    // Mock window.confirm to return true
    await page.evaluate(() => {
      window.confirm = () => true;
    });

    // Click delete
    await page.getByRole('button', { name: 'Delete' }).click();

    // Should no longer show the list
    await expect(page.getByText('Delete Test List')).not.toBeVisible();

    // Should show empty state
    await expect(page.getByText('No saved lists yet')).toBeVisible();
  });

  test('cancels delete when user declines', async ({ page }) => {
    // Create a list first
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List Name').fill('Cancel Delete Test');
    await addPlayers(page, PLAYERS_4);
    await page.getByRole('button', { name: 'Save List' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Select the list
    await page.getByText('Cancel Delete Test').click();

    // Mock window.confirm to return false
    await page.evaluate(() => {
      window.confirm = () => false;
    });

    // Click delete
    await page.getByRole('button', { name: 'Delete' }).click();

    // Should still show the list
    await expect(page.getByText('Cancel Delete Test')).toBeVisible();
  });

  test('imports CSV file', async ({ page }) => {
    // Create a CSV file content
    const csvContent = 'Alice\nBob\nCharlie\nDiana';

    // Create a data URL for the CSV file
    const csvDataUrl = `data:text/csv;base64,${btoa(csvContent)}`;

    // Mock file input
    await page.evaluate((dataUrl) => {
      // Create a file input and set its files
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        // Create a File object
        const file = new File([atob(dataUrl.split(',')[1])], 'players.csv', { type: 'text/csv' });

        // Create a DataTransfer and add the file
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;

        // Dispatch change event
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, csvDataUrl);

    // Should automatically fill the form
    await expect(page.getByLabel('List Name')).toHaveValue('players');

    // Should have imported players
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText('Charlie')).toBeVisible();
    await expect(page.getByText('Diana')).toBeVisible();
  });

  test('imports JSON file', async ({ page }) => {
    // Create a JSON file content
    const jsonContent = JSON.stringify({
      name: 'Imported Team',
      players: [
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' }
      ]
    });

    // Create a data URL for the JSON file
    const jsonDataUrl = `data:application/json;base64,${btoa(jsonContent)}`;

    // Mock file input
    await page.evaluate((dataUrl) => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        const file = new File([atob(dataUrl.split(',')[1])], 'players.json', { type: 'application/json' });

        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;

        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, jsonDataUrl);

    // Should automatically fill the form
    await expect(page.getByLabel('List Name')).toHaveValue('Imported Team');

    // Should have imported players
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText('Charlie')).toBeVisible();
  });

  test('handles invalid file format', async ({ page }) => {
    // Create an invalid file content
    const invalidContent = 'invalid file content';

    // Create a data URL for an invalid file
    const invalidDataUrl = `data:text/plain;base64,${btoa(invalidContent)}`;

    // Mock file input with invalid file
    await page.evaluate((dataUrl) => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        const file = new File([atob(dataUrl.split(',')[1])], 'players.txt', { type: 'text/plain' });

        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;

        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, invalidDataUrl);

    // Should show error toast
    await waitForToast(page, 'Unsupported file format');
  });

  test('handles invalid JSON file', async ({ page }) => {
    // Create invalid JSON content
    const invalidJsonContent = '{ invalid json }';

    // Create a data URL for the invalid JSON file
    const invalidJsonDataUrl = `data:application/json;base64,${btoa(invalidJsonContent)}`;

    // Mock file input
    await page.evaluate((dataUrl) => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        const file = new File([atob(dataUrl.split(',')[1])], 'invalid.json', { type: 'application/json' });

        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;

        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, invalidJsonDataUrl);

    // Should show error toast
    await waitForToast(page, 'Failed to import file');
  });

  test('exports player list as CSV', async ({ page }) => {
    // Create a list first
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List Name').fill('Export Test List');
    await addPlayers(page, PLAYERS_4);
    await page.getByRole('button', { name: 'Save List' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Select the list
    await page.getByText('Export Test List').click();

    // Mock download by spying on the download function
    let downloadTriggered = false;
    await page.evaluate(() => {
      // Override the downloadFile function to track calls
      (window as any).originalDownloadFile = (window as any).downloadFile;
      (window as any).downloadFile = (...args: any[]) => {
        (window as any).downloadTriggered = true;
        (window as any).downloadArgs = args;
      };
    });

    // Click export CSV
    await page.getByRole('button', { name: 'Export CSV' }).click();

    // Check if download was triggered
    const wasTriggered = await page.evaluate(() => (window as any).downloadTriggered);
    expect(wasTriggered).toBe(true);

    // Check download arguments
    const downloadArgs = await page.evaluate(() => (window as any).downloadArgs);
    expect(downloadArgs[0]).toContain('Alice'); // Should contain player data
    expect(downloadArgs[1]).toContain('Export_Test_List'); // Should contain sanitized filename
    expect(downloadArgs[2]).toBe('text/csv'); // Should be CSV mime type
  });

  test('exports player list as JSON', async ({ page }) => {
    // Create a list first
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List Name').fill('JSON Export Test');
    await addPlayers(page, PLAYERS_4);
    await page.getByRole('button', { name: 'Save List' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Select the list
    await page.getByText('JSON Export Test').click();

    // Mock download
    let downloadTriggered = false;
    await page.evaluate(() => {
      (window as any).downloadFile = (...args: any[]) => {
        (window as any).downloadTriggered = true;
        (window as any).downloadArgs = args;
      };
    });

    // Click export JSON
    await page.getByRole('button', { name: 'Export JSON' }).click();

    // Check if download was triggered
    const wasTriggered = await page.evaluate(() => (window as any).downloadTriggered);
    expect(wasTriggered).toBe(true);

    // Check download arguments
    const downloadArgs = await page.evaluate(() => (window as any).downloadArgs);
    const jsonContent = JSON.parse(downloadArgs[0]);
    expect(jsonContent.name).toBe('JSON Export Test');
    expect(jsonContent.players).toHaveLength(4);
    expect(jsonContent.players[0].name).toBe('Alice');
    expect(downloadArgs[1]).toContain('JSON_Export_Test');
    expect(downloadArgs[2]).toBe('application/json');
  });

  test('shows export buttons only when list is selected', async ({ page }) => {
    // Create a list first
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List Name').fill('Button Test List');
    await addPlayers(page, PLAYERS_4);
    await page.getByRole('button', { name: 'Save List' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Initially, export buttons should not be visible
    await expect(page.getByRole('button', { name: 'Export CSV' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Export JSON' })).not.toBeVisible();

    // Select the list
    await page.getByText('Button Test List').click();

    // Export buttons should now be visible
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export JSON' })).toBeVisible();
  });

  test('cancels edit mode', async ({ page }) => {
    // Create a list first
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List Name').fill('Cancel Edit Test');
    await addPlayers(page, PLAYERS_4);
    await page.getByRole('button', { name: 'Save List' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Select and edit the list
    await page.getByText('Cancel Edit Test').click();
    await page.getByRole('button', { name: 'Edit' }).click();

    // Change something
    await page.getByLabel('List Name').fill('Changed Name');

    // Cancel edit
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Should go back to view mode
    await expect(page.getByText('View List')).toBeVisible();

    // Should show original name
    await expect(page.getByText('Cancel Edit Test')).toBeVisible();
  });

  test('persists lists after page reload', async ({ page }) => {
    // Create a list
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List Name').fill('Persistence Test');
    await addPlayers(page, PLAYERS_4);
    await page.getByRole('button', { name: 'Save List' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Reload page
    await page.reload();

    // Should still show the list
    await expect(page.getByText('Persistence Test')).toBeVisible();
    await expect(page.getByText('4 player')).toBeVisible();
  });

  test('handles duplicate list names', async ({ page }) => {
    // Create first list
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List Name').fill('Duplicate Name');
    await addPlayers(page, PLAYERS_4);
    await page.getByRole('button', { name: 'Save List' }).click();
    await waitForToast(page, 'Player list saved successfully!');

    // Create second list with same name
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List Name').fill('Duplicate Name');
    await addPlayers(page, PLAYERS_ODD);
    await page.getByRole('button', { name: 'Save List' }).click();

    // Should allow duplicate names (they are just names, not unique identifiers)
    await expect(page.getByText('Duplicate Name')).toHaveCount(2);
  });
});