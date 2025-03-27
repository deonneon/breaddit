import { useState, useEffect } from "react";

export type Theme = "light" | "dark" | "system";

export const useTheme = () => {
  // Initialize theme state from localStorage, defaulting to 'system' if not set
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "system";
  });

  // Function to update the theme-color meta tag
  const updateThemeColorMeta = (isDark: boolean) => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", isDark ? "#1f2937" : "#ffffff");
    }
  };

  // Function to handle system theme changes
  const handleSystemThemeChange = (
    mediaQuery: MediaQueryListEvent | MediaQueryList
  ) => {
    if (theme === "system") {
      const isDark = mediaQuery.matches;
      document.documentElement.classList.toggle("dark", isDark);
      updateThemeColorMeta(isDark);
    }
  };

  // Update the DOM when theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Apply theme based on the current selection
    if (theme === "system") {
      // For system theme, check the media query
      const isDark = mediaQuery.matches;
      document.documentElement.classList.toggle("dark", isDark);
      updateThemeColorMeta(isDark);
      localStorage.removeItem("theme");
    } else {
      // For explicit theme choices
      const isDark = theme === "dark";
      document.documentElement.classList.toggle("dark", isDark);
      updateThemeColorMeta(isDark);
      localStorage.theme = theme;
    }

    // Add listener for system theme changes
    const handleChange = (e: MediaQueryListEvent) => handleSystemThemeChange(e);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
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
