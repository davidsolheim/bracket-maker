'use client';

import { useRef } from 'react';
import { toast } from 'sonner';
import type { PlayerList } from '@/types/tournament';
import {
  exportToCSV,
  exportToJSON,
  downloadFile,
  parseCSV,
  parseJSON,
  readFileAsText,
  type ImportedPlayerList,
} from '@/lib/playerListIO';
import { cn } from '@/lib/utils';

interface ImportExportButtonsProps {
  playerList: PlayerList;
  onImport?: (imported: ImportedPlayerList) => void;
}

export function ImportExportButtons({
  playerList,
  onImport,
}: ImportExportButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    const csv = exportToCSV(playerList);
    const filename = `${playerList.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    downloadFile(csv, filename, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = exportToJSON(playerList);
    const filename = `${playerList.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    downloadFile(json, filename, 'application/json');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      const filename = file.name.toLowerCase();

      let imported: ImportedPlayerList;

      if (filename.endsWith('.csv')) {
        const playerNames = parseCSV(content);
        imported = {
          name: playerList.name,
          players: playerNames,
        };
      } else if (filename.endsWith('.json')) {
        imported = parseJSON(content);
      } else {
        toast.error('Unsupported file format. Please use CSV or JSON.');
        return;
      }

      if (onImport) {
        onImport(imported);
      }
    } catch (error) {
      toast.error(`Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportCSV}
        className={cn(
          'cursor-pointer rounded px-4 py-2 text-sm font-medium',
          'border border-gray-300 bg-white hover:bg-gray-50',
          'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
        )}
      >
        Export CSV
      </button>
      <button
        onClick={handleExportJSON}
        className={cn(
          'cursor-pointer rounded px-4 py-2 text-sm font-medium',
          'border border-gray-300 bg-white hover:bg-gray-50',
          'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
        )}
      >
        Export JSON
      </button>
      {onImport && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            className={cn(
              'cursor-pointer rounded px-4 py-2 text-sm font-medium',
              'border border-gray-300 bg-white hover:bg-gray-50',
              'dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
            )}
          >
            Import
          </button>
        </>
      )}
    </div>
  );
}
