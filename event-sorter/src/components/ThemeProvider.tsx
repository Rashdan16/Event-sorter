/**
 * Theme Provider Component
 *
 * Provides dark/light mode theming functionality throughout the application.
 * Uses React Context to make theme state and toggle function available to all components.
 *
 * Features:
 * - Persists theme preference in localStorage
 * - Respects system preference (prefers-color-scheme) on first visit
 * - Applies theme by adding 'dark' or 'light' class to document root
 * - Works with Tailwind CSS dark mode (class-based)
 *
 * This is a client component because it:
 * - Uses browser APIs (localStorage, matchMedia)
 * - Manages client-side state
 * - Modifies the DOM (document.documentElement)
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Theme type - only "light" or "dark" are valid values
 */
type Theme = "light" | "dark";

/**
 * Shape of the theme context value
 */
interface ThemeContextType {
  theme: Theme;           // Current theme ("light" or "dark")
  toggleTheme: () => void; // Function to switch between themes
}

/**
 * React Context for theme state
 * undefined default value - will be set by ThemeProvider
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider Component
 *
 * Wraps the application and provides theme context to all children.
 * Must be used near the root of the component tree.
 *
 * @param children - Child components that will have access to theme context
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Current theme state - defaults to "light" but will be updated on mount
  const [theme, setTheme] = useState<Theme>("light");

  // Track if component has mounted (needed to avoid hydration mismatch)
  const [mounted, setMounted] = useState(false);

  /**
   * Initialize theme on first mount
   * Runs once when component mounts (client-side only)
   */
  useEffect(() => {
    // Check for previously saved theme preference in localStorage
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    // Determine initial theme:
    // 1. Use saved preference if exists
    // 2. Otherwise, check system preference (prefers-color-scheme)
    // 3. Default to "light" if neither available
    const initialTheme = savedTheme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    // Set the theme state
    setTheme(initialTheme);

    // Apply theme class to document root element
    // Tailwind's dark mode uses this class to apply dark styles
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(initialTheme);

    // Mark as mounted to enable subsequent theme changes
    setMounted(true);
  }, []);

  /**
   * Apply theme changes after initial mount
   * Updates DOM and localStorage when theme state changes
   */
  useEffect(() => {
    // Only run after initial mount to prevent hydration issues
    if (mounted) {
      // Update the class on the document root
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);

      // Persist the theme preference for future visits
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  /**
   * Toggle between light and dark themes
   * Called when user clicks the theme toggle button
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Render the context provider with current theme value and toggle function
  // Children always render to prevent layout shift during SSR
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook
 *
 * Custom hook to access theme context from any component.
 * Must be used within a ThemeProvider.
 *
 * @returns Object with current theme and toggleTheme function
 * @throws Error if used outside of ThemeProvider
 *
 * @example
 * const { theme, toggleTheme } = useTheme();
 * // theme is "light" or "dark"
 * // toggleTheme() switches between them
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  // Throw helpful error if hook is used outside provider
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
