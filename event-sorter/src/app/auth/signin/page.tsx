/**
 * Sign In Page Component
 *
 * Authentication page for the Event Sorter application.
 * Uses NextAuth.js with Google OAuth provider.
 *
 * Features:
 * - Single sign-on with Google
 * - Automatic redirect if already authenticated
 * - Clean, centered UI design
 * - Permission disclosure (Google Calendar access)
 *
 * Flow:
 * 1. User arrives at /auth/signin
 * 2. If already signed in, redirect to home page
 * 3. User clicks "Continue with Google"
 * 4. NextAuth handles OAuth flow with Google
 * 5. On success, redirect to home page (callbackUrl)
 *
 * This is a client component because it:
 * - Uses useSession hook to check auth state
 * - Uses useRouter for navigation
 * - Handles click events for sign-in
 */

"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Sign In Page Component
 *
 * Renders a centered card with Google sign-in button
 */
export default function SignInPage() {
  // ============================================
  // HOOKS
  // ============================================

  // Get current session state
  const { data: session, status } = useSession();

  // Router for programmatic navigation
  const router = useRouter();

  // ============================================
  // REDIRECT IF ALREADY AUTHENTICATED
  // ============================================

  /**
   * Redirect to home if user is already signed in
   * Runs when session state changes
   */
  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  // ============================================
  // LOADING STATE
  // ============================================

  // Show loading spinner while checking authentication status
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Aurora ambient glow */}
      <div className="aurora-bg">
        <div className="aurora-orb" />
      </div>

      {/* Dot grid texture */}
      <div className="absolute inset-0 dot-grid pointer-events-none" />

      <div className="relative z-10 max-w-md w-full">
        {/* Sign-in Card */}
        <div className="glass-card rounded-2xl p-10 text-center">
          {/* Logo */}
          <div className="mb-8">
            <span className="text-3xl font-bold text-white tracking-tight">
              RK<span className="text-orange-400">.</span>
            </span>
          </div>

          {/* Welcome Message */}
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Welcome to RK Solutions
          </h1>
          <p className="text-gray-400 mb-10 leading-relaxed">
            Sign in with your Google account to start organizing your events
          </p>

          {/* Google Sign-In Button */}
          {/* Uses NextAuth's signIn function with Google provider */}
          {/* callbackUrl specifies where to redirect after successful auth */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 bg-white/[0.04] border border-white/[0.08] text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-white/[0.08] hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-200"
          >
            {/* Google "G" Logo - Multi-colored SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              {/* Blue segment */}
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              {/* Green segment */}
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              {/* Yellow segment */}
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              {/* Red segment */}
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-8 section-glow-border" />

          {/* Permission Disclosure */}
          {/* Informs user about Google Calendar access being requested */}
          <p className="text-xs text-gray-500 leading-relaxed">
            By signing in, you grant permission to access your Google Calendar
            for event creation.
          </p>
        </div>
      </div>
    </div>
  );
}
