'use client';

import { cn } from '@/lib/utils';

type ViewType = 'bracket' | 'list';

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-2 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
      <button
        onClick={() => onViewChange('bracket')}
        className={cn(
          'cursor-pointer rounded px-4 py-2 text-sm font-medium transition-colors',
          view === 'bracket'
            ? 'bg-green-600 text-white dark:bg-green-700'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        )}
      >
        Bracket View
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={cn(
          'cursor-pointer rounded px-4 py-2 text-sm font-medium transition-colors',
          view === 'list'
            ? 'bg-green-600 text-white dark:bg-green-700'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        )}
      >
        List View
      </button>
    </div>
  );
}
