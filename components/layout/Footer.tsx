'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border-dim)] bg-[var(--bg-card)]/50 backdrop-blur-md mt-auto relative overflow-hidden">
      {/* Gradient accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--neon-cyan)]/30 to-transparent" />
      
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Left: Birthday Message */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center md:items-start gap-1"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Special Shoutout
            </span>
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              🎉 Happy Birthday, <span className="text-[var(--neon-green)]">Michael Hofeling</span>!
            </p>
          </motion.div>

          {/* Center: Branding & Links */}
          <div className="flex flex-col items-center gap-3">
            <Link href="/" className="flex items-center gap-3 text-xl font-bold text-white transition-opacity hover:opacity-80 heading">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-magenta)] flex items-center justify-center text-sm">
                ⚔️
              </div>
              <span className="gradient-text">Bracket Magic</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="https://davidsolheim.com"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'text-sm text-[var(--text-muted)] hover:text-[var(--neon-cyan)]',
                  'transition-colors duration-200'
                )}
              >
                Website
              </Link>
              <span className="text-[var(--text-muted)]">•</span>
              <Link
                href="/tournament/new"
                className={cn(
                  'text-sm text-[var(--text-muted)] hover:text-[var(--neon-cyan)]',
                  'transition-colors duration-200'
                )}
              >
                Create
              </Link>
            </div>
          </div>

          {/* Right: Copyright & Attribution */}
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-sm text-[var(--text-secondary)]">
              Created with <span className="text-[var(--neon-magenta)] animate-pulse">❤️</span> by{' '}
              <Link 
                href="https://davidsolheim.com" 
                className="font-medium text-white hover:text-[var(--neon-cyan)] transition-colors"
              >
                David Solheim
              </Link>
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              © {currentYear} All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
