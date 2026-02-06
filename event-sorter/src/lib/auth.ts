/**
 * NextAuth.js Authentication Configuration
 *
 * This file configures the authentication system using NextAuth.js with Google OAuth.
 * It handles user sign-in, session management, and stores user data in the database
 * using Prisma as the adapter.
 */

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";

/**
 * Main NextAuth configuration object
 * Contains all settings for authentication behavior
 */
export const authOptions: NextAuthOptions = {
  /**
   * Database Adapter Configuration
   * PrismaAdapter connects NextAuth to our PostgreSQL database via Prisma.
   * This enables storing users, accounts, and sessions in the database
   * instead of using JWT tokens only.
   */
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],

  /**
   * Authentication Providers
   * Currently using Google OAuth as the only sign-in method.
   * Users click "Sign in with Google" and are redirected to Google's login page.
   */
  providers: [
    GoogleProvider({
      // Google OAuth credentials from Google Cloud Console
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

      /**
       * Allow linking accounts with the same email address.
       * If a user signs in with a different method but same email,
       * the accounts will be linked automatically.
       */
      allowDangerousEmailAccountLinking: true,

      /**
       * OAuth Authorization Parameters
       * These configure what permissions we request from Google
       */
      authorization: {
        params: {
          /**
           * Scopes define what data/APIs we can access:
           * - openid: Basic OpenID Connect authentication
           * - email: Access to user's email address
           * - profile: Access to user's name and profile picture
           * - calendar.events: Permission to create/manage Google Calendar events
           */
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events",

          /**
           * access_type: "offline" requests a refresh token
           * This allows us to access Google Calendar even when user is not actively logged in
           */
          access_type: "offline",

          /**
           * prompt: "consent" forces the consent screen to show every time
           * This ensures we always get a refresh token (needed for calendar access)
           */
          prompt: "consent",
        },
      },
    }),
  ],

  /**
   * Callbacks - Custom functions that run during auth events
   * These let us modify the default NextAuth behavior
   */
  callbacks: {
    /**
     * Session Callback
     * Runs whenever a session is checked (on every authenticated request).
     * We use this to add the user's database ID to the session object,
     * making it available throughout the app via useSession().
     *
     * @param session - The session object being created
     * @param user - The user from the database
     * @returns Modified session with user ID included
     */
    async session({ session, user }) {
      if (session.user) {
        // Add the database user ID to the session
        // This allows us to query user-specific data in API routes
        session.user.id = user.id;
      }
      return session;
    },
  },

  /**
   * Custom Pages Configuration
   * Override the default NextAuth pages with our custom designs
   */
  pages: {
    // Use our custom sign-in page instead of the default NextAuth one
    signIn: "/auth/signin",
  },

  /**
   * Session Strategy Configuration
   * "database" means sessions are stored in PostgreSQL via Prisma.
   * Alternative is "jwt" which stores session data in encrypted cookies.
   * Database sessions are more secure and allow server-side session invalidation.
   */
  session: {
    strategy: "database",
  },
};
