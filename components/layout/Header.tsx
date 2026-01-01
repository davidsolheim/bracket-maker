'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTournament } from '@/contexts/TournamentContext';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { downloadBackup, parseBackupFile, readFileAsText, type BackupData } from '@/lib/backup';
import { BackupRestoreModal } from '@/components/backup/BackupRestoreModal';

export function Header() {
  const { currentTournament } = useTournament();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/tournament/new', label: 'New Tournament' },
    { href: '/history', label: 'History' },
    { href: '/players', label: 'Players' },
    { href: '/stats', label: 'Stats' },
  ];

  const handleExportBackup = () => {
    try {
      downloadBackup();
      toast.success('Backup downloaded successfully');
    } catch (error) {
      toast.error(`Failed to export backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      const backup = parseBackupFile(content);
      setBackupData(backup);
      setBackupModalOpen(true);
    } catch (error) {
      toast.error(`Failed to import backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRestoreComplete = () => {
    // Refresh the page to reload data
    window.location.reload();
  };

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-green-600 dark:text-green-400">
          <img src="/bracket-magic-icon.png" alt="" className="h-8 w-8" />
          Bracket Magic
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'cursor-pointer rounded px-4 py-2 font-medium transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={handleExportBackup}
            className={cn(
              'cursor-pointer rounded p-2 transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
            aria-label="Export backup"
            title="Export backup"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
          <button
            onClick={handleImportClick}
            className={cn(
              'cursor-pointer rounded p-2 transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
            aria-label="Import backup"
            title="Import backup"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </button>
          <button
            onClick={toggleTheme}
            className={cn(
              'cursor-pointer rounded p-2 transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
          {currentTournament && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentTournament.name}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={handleExportBackup}
            className={cn(
              'rounded p-2 transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
            aria-label="Export backup"
            title="Export backup"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
          <button
            onClick={handleImportClick}
            className={cn(
              'rounded p-2 transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
            aria-label="Import backup"
            title="Import backup"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </button>
          <button
            onClick={toggleTheme}
            className={cn(
              'cursor-pointer rounded p-2 transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              'cursor-pointer rounded p-2 transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Hidden file input for backup import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-700"
          >
            <div className="mx-auto max-w-7xl px-4 py-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'cursor-pointer block rounded px-4 py-2 font-medium transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {currentTournament && (
                <div className="mt-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  {currentTournament.name}
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Backup Restore Modal */}
      {backupData && (
        <BackupRestoreModal
          isOpen={backupModalOpen}
          onClose={() => {
            setBackupModalOpen(false);
            setBackupData(null);
          }}
          backup={backupData}
          onRestoreComplete={handleRestoreComplete}
        />
      )}
    </header>
  );
}
