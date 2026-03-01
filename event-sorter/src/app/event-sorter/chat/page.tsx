"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import ChatBot from "@/components/ChatBot";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/event-sorter"
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Event
          </h1>
        </div>
        <Link
          href="/event-sorter/chat/history"
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.1] transition-all duration-200 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </Link>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Chat with AI to create your event
      </p>
      <ChatBot />
    </div>
  );
}
