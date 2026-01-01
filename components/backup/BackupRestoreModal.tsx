'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { BackupData } from '@/lib/backup';
import { restoreBackup } from '@/lib/backup';
import { cn } from '@/lib/utils';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  backup: BackupData;
  onRestoreComplete: () => void;
}

export function BackupRestoreModal({
  isOpen,
  onClose,
  backup,
  onRestoreComplete,
}: BackupRestoreModalProps) {
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);

  const tournamentCount = backup.data.tournaments.length;
  const playerListCount = backup.data.playerLists.length;
  const exportedDate = new Date(backup.exportedAt);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      restoreBackup(backup, restoreMode);
      toast.success(
        restoreMode === 'replace'
          ? 'Backup restored successfully. All existing data has been replaced.'
          : 'Backup merged successfully. New items have been added.'
      );
      onRestoreComplete();
      onClose();
    } catch (error) {
      toast.error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Restore Backup" size="lg">
      <div className="space-y-6">
        {/* Backup Info */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Backup Information
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Exported:</span>{' '}
              {exportedDate.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Tournaments:</span> {tournamentCount}
            </div>
            <div>
              <span className="font-medium">Player Lists:</span> {playerListCount}
            </div>
            <div>
              <span className="font-medium">Version:</span> {backup.version}
            </div>
          </div>
        </div>

        {/* Restore Mode Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Restore Mode
          </h3>
          <div className="space-y-3">
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                restoreMode === 'merge'
                  ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
              )}
            >
              <input
                type="radio"
                name="restoreMode"
                value="merge"
                checked={restoreMode === 'merge'}
                onChange={(e) => setRestoreMode(e.target.value as 'replace' | 'merge')}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Merge with existing data
                </div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Keep all existing tournaments and player lists. Only add items from the backup that don't already exist (by ID).
                </div>
              </div>
            </label>

            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                restoreMode === 'replace'
                  ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
              )}
            >
              <input
                type="radio"
                name="restoreMode"
                value="replace"
                checked={restoreMode === 'replace'}
                onChange={(e) => setRestoreMode(e.target.value as 'replace' | 'merge')}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Replace all data
                </div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    Warning:
                  </span>{' '}
                  This will delete all existing tournaments and player lists, then restore only the data from this backup.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isRestoring}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRestore}
            variant={restoreMode === 'replace' ? 'danger' : 'primary'}
            disabled={isRestoring}
          >
            {isRestoring ? 'Restoring...' : 'Restore Backup'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
