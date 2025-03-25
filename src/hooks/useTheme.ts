import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  // Initialize theme state from localStorage, defaulting to 'system' if not set
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  // Function to handle system theme changes
  const handleSystemThemeChange = (mediaQuery: MediaQueryListEvent | MediaQueryList) => {
    if (theme === 'system') {
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
    }
  };

  // Update the DOM when theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Apply theme based on the current selection
    if (theme === 'system') {
      // For system theme, check the media query
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
      localStorage.removeItem('theme');
    } else {
      // For explicit theme choices
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.theme = theme;
    }

    // Add listener for system theme changes
    const handleChange = (e: MediaQueryListEvent) => handleSystemThemeChange(e);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Function to update the theme
  const setCurrentTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    setTheme: setCurrentTheme,
  };
}; 