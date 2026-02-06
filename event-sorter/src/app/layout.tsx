/**
 * Root Layout Component
 *
 * The root layout wraps every page in the application.
 * This is a Next.js App Router convention - layout.tsx in the app directory
 * applies to all routes.
 *
 * Responsibilities:
 * - HTML document structure (<html>, <head>, <body>)
 * - Global styles and fonts
 * - Theme initialization (prevents flash of wrong theme)
 * - Context providers (auth, theme)
 * - Persistent UI elements (Navbar)
 *
 * This is a Server Component by default, but wraps client components
 * (Providers, Navbar) that need client-side functionality.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

/**
 * Font Configuration
 *
 * Load Google Fonts using Next.js font optimization.
 * Fonts are self-hosted and loaded with zero layout shift.
 * CSS variables are created for use in Tailwind/CSS.
 */
const geistSans = Geist({
  variable: "--font-geist-sans", // CSS variable name
  subsets: ["latin"],            // Only load Latin characters
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Page Metadata
 *
 * Default metadata for all pages. Individual pages can override this.
 * Used for SEO and browser tab display.
 */
export const metadata: Metadata = {
  title: "Event Sorter",
  description: "Extract event info from posters and organize your calendar",
};

/**
 * Theme Initialization Script
 *
 * This script runs BEFORE React hydrates to prevent flash of wrong theme.
 * It's injected directly into the HTML <head> so it executes immediately.
 *
 * Logic:
 * 1. Check localStorage for saved theme preference
 * 2. If no saved preference, check system preference (prefers-color-scheme)
 * 3. Add the theme class to <html> element
 *
 * Wrapped in try/catch in case localStorage is unavailable (private browsing)
 */
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.classList.add(theme);
    } catch (e) {
      document.documentElement.classList.add('light');
    }
  })();
`;

/**
 * RootLayout Component
 *
 * The outermost layout component that wraps all pages.
 *
 * @param children - The page content to render
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning prevents React warnings about
    // the theme class being added before hydration
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inject theme script to run before page renders */}
        {/* dangerouslySetInnerHTML is safe here - we control the content */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        // Apply font CSS variables and enable font smoothing
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Providers wrap the app with context (auth, theme) */}
        <Providers>
          {/* Navbar appears on every page */}
          <Navbar />
          {/* Main content area - children is the current page */}
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
