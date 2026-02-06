/**
 * Providers Component
 *
 * A wrapper component that provides global context to the entire application.
 * This component sets up the React Context providers needed throughout the app.
 *
 * Currently provides:
 * - SessionProvider: NextAuth authentication context (user session, login state)
 * - ThemeProvider: Dark/light mode theme context
 *
 * This is a client component because context providers require client-side React.
 * It's used in the root layout to wrap all pages.
 *
 * Provider Order:
 * The order of providers matters. Outer providers are available to inner ones.
 * SessionProvider is outermost so authentication is available everywhere,
 * including within the ThemeProvider if needed.
 */

"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";

/**
 * Props for the Providers component
 */
interface ProvidersProps {
  children: ReactNode; // The child components to wrap (typically the entire app)
}

/**
 * Providers Component
 *
 * Wraps children with all necessary context providers.
 * Add new providers here when needed throughout the app.
 *
 * @param children - The React components to wrap with providers
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    // SessionProvider: Provides authentication context from NextAuth
    // Enables useSession() hook throughout the app
    <SessionProvider>
      {/* ThemeProvider: Provides theme context for dark/light mode */}
      {/* Enables useTheme() hook throughout the app */}
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
