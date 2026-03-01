"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ChatSession {
  id: string;
  title: string;
  eventId: string | null;
  createdAt: string;
  updatedAt: string;
  messages: { id: string; role: string; content: string }[];
}

export default function ChatHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchChatSessions();
    }
  }, [session]);

  const fetchChatSessions = async () => {
    try {
      const res = await fetch("/api/chat-sessions");
      if (res.ok) {
        const data = await res.json();
        setChatSessions(data);
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Delete this chat?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/chat-sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setChatSessions((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error("Error deleting chat session:", error);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (status === "loading" || loading) {
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/event-sorter/chat"
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Chat History</h1>
        </div>
        <Link
          href="/event-sorter/chat"
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200 text-sm font-medium"
        >
          + New Chat
        </Link>
      </div>

      {/* Chat Sessions List */}
      {chatSessions.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No chat history yet
          </h3>
          <p className="text-gray-500 mb-6">
            Start a conversation with AI to create events
          </p>
          <Link
            href="/event-sorter/chat"
            className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200 font-medium"
          >
            Start Chatting
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {chatSessions.map((chat) => (
            <div
              key={chat.id}
              className="glass-card rounded-xl p-5 flex items-center justify-between gap-4"
            >
              <Link
                href={`/event-sorter/chat/history/${chat.id}`}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {chat.title}
                  </h3>
                  {chat.eventId && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 px-2 py-0.5 rounded font-medium flex-shrink-0">
                      Event Created
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatDate(chat.updatedAt)}</span>
                  {chat.messages[0] && (
                    <span className="truncate">
                      {chat.messages[0].content.substring(0, 60)}
                      {chat.messages[0].content.length > 60 ? "..." : ""}
                    </span>
                  )}
                </div>
              </Link>

              <button
                onClick={() => deleteSession(chat.id)}
                disabled={deleting === chat.id}
                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50"
                title="Delete chat"
              >
                {deleting === chat.id ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
