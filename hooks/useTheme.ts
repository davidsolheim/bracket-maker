'use client';

import { useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme>('theme', 'system');
  const [theme, setTheme] = useState<Theme>(storedTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setTheme(storedTheme);
  }, [storedTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      setResolvedTheme(systemTheme);
    } else {
      root.classList.add(theme);
      setResolvedTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(systemTheme);
        setResolvedTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setThemeMode = (newTheme: Theme) => {
    setStoredTheme(newTheme);
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setThemeMode('dark');
    } else if (theme === 'dark') {
      setThemeMode('light');
    } else {
      // If system, toggle to opposite of current resolved theme
      setThemeMode(resolvedTheme === 'dark' ? 'light' : 'dark');
    }
  };

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeMode,
    toggleTheme,
  };
}
