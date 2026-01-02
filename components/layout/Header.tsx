'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTournament } from '@/contexts/TournamentContext';
import { cn } from '@/lib/utils';
import { downloadBackup, parseBackupFile, readFileAsText, type BackupData } from '@/lib/backup';
import { BackupRestoreModal } from '@/components/backup/BackupRestoreModal';

export function Header() {
  const { currentTournament } = useTournament();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: '🏠' },
    { href: '/tournament/new', label: 'New Tournament', icon: '🎮' },
    { href: '/history', label: 'History', icon: '📜' },
    { href: '/players', label: 'Players', icon: '👥' },
    { href: '/stats', label: 'Stats', icon: '📊' },
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
    <header className="border-b border-[var(--border-dim)] bg-[var(--bg-card)]/80 backdrop-blur-xl sticky top-0 z-50">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-magenta)] to-[var(--neon-cyan)]" />
      
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative"
          >
            <Image
              src="/bracket-magic-banner-white.png"
              alt="Bracket Magic"
              width={400}
              height={210}
              className="h-20 w-auto object-contain"
              priority
            />
          </motion.div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'cursor-pointer rounded-lg px-4 py-2 font-medium transition-all duration-200',
                'text-[var(--text-secondary)] hover:text-[var(--neon-cyan)]',
                'hover:bg-white/5',
                'flex items-center gap-2',
                'heading text-sm uppercase tracking-wide'
              )}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Export button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportBackup}
            className={cn(
              'cursor-pointer rounded-lg p-2.5 transition-all duration-200',
              'text-[var(--text-muted)] hover:text-[var(--neon-cyan)]',
              'hover:bg-white/5 border border-transparent hover:border-[var(--border-dim)]'
            )}
            aria-label="Export backup"
            title="Export backup"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </motion.button>
          
          {/* Import button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleImportClick}
            className={cn(
              'cursor-pointer rounded-lg p-2.5 transition-all duration-200',
              'text-[var(--text-muted)] hover:text-[var(--neon-cyan)]',
              'hover:bg-white/5 border border-transparent hover:border-[var(--border-dim)]'
            )}
            aria-label="Import backup"
            title="Import backup"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </motion.button>
          
          {/* Current tournament badge */}
          {currentTournament && (
            <div className="ml-2 pl-4 border-l border-[var(--border-dim)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Active</div>
              <div className="text-sm font-medium text-[var(--neon-green)] truncate max-w-[150px]">
                {currentTournament.name}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportBackup}
            className={cn(
              'rounded-lg p-2 transition-colors',
              'text-[var(--text-muted)] hover:text-[var(--neon-cyan)]',
              'hover:bg-white/5'
            )}
            aria-label="Export backup"
            title="Export backup"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleImportClick}
            className={cn(
              'rounded-lg p-2 transition-colors',
              'text-[var(--text-muted)] hover:text-[var(--neon-cyan)]',
              'hover:bg-white/5'
            )}
            aria-label="Import backup"
            title="Import backup"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              'cursor-pointer rounded-lg p-2 transition-colors',
              'text-[var(--text-muted)] hover:text-white',
              'hover:bg-white/5'
            )}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </motion.button>
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
            className="lg:hidden border-t border-[var(--border-dim)] bg-[var(--bg-card)]"
          >
            <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'cursor-pointer flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all',
                      'text-[var(--text-secondary)] hover:text-[var(--neon-cyan)]',
                      'hover:bg-white/5',
                      'heading uppercase tracking-wide'
                    )}
                  >
                    <span className="text-xl">{link.icon}</span>
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {currentTournament && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 pt-4 border-t border-[var(--border-dim)] px-4"
                >
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Active Tournament
                  </div>
                  <div className="text-sm font-medium text-[var(--neon-green)]">
                    {currentTournament.name}
                  </div>
                </motion.div>
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
