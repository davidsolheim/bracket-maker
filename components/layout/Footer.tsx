'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80 mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Left: Birthday Message */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center md:items-start gap-1"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Special Shoutout
            </span>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              🎉 Happy Birthday, <span className="text-green-600 dark:text-green-400">Michael Hofeling</span>!
            </p>
          </motion.div>

          {/* Center: Branding & Links */}
          <div className="flex flex-col items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white transition-opacity hover:opacity-80">
              <img src="/bracket-magic-icon.png" alt="" className="h-6 w-6" />
              <span>Bracket Magic</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="https://davidsolheim.com"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'text-sm text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400',
                  'transition-colors duration-200'
                )}
              >
                Website
              </Link>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <Link
                href="/tournament/new"
                className={cn(
                  'text-sm text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400',
                  'transition-colors duration-200'
                )}
              >
                Create
              </Link>
            </div>
          </div>

          {/* Right: Copyright & Attribution */}
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Created with <span className="text-red-500 animate-pulse">❤️</span> by{' '}
              <Link 
                href="https://davidsolheim.com" 
                className="font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                David Solheim
              </Link>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              © {currentYear} All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}