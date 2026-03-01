"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import ChatBot from "@/components/ChatBot";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatSessionData {
  id: string;
  title: string;
  eventId: string | null;
  createdAt: string;
  messages: ChatMessage[];
}

export default function ChatSessionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;

  const [chatSession, setChatSession] = useState<ChatSessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session && chatId) {
      fetchChatSession();
    }
  }, [session, chatId]);

  const fetchChatSession = async () => {
    try {
      const res = await fetch(`/api/chat-sessions/${chatId}`);
      if (res.ok) {
        const data = await res.json();
        setChatSession(data);
      } else if (res.status === 404) {
        router.push("/event-sorter/chat/history");
      }
    } catch (error) {
      console.error("Error fetching chat session:", error);
    } finally {
      setLoading(false);
    }
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

  if (!session || !chatSession) return null;

  const initialMessages = chatSession.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/event-sorter/chat/history"
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate max-w-md">
            {chatSession.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {chatSession.eventId && (
            <Link
              href={`/event-sorter/events/${chatSession.eventId}`}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition"
            >
              View Event
            </Link>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(chatSession.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Past conversation
      </p>
      <ChatBot
        sessionId={chatSession.id}
        initialMessages={initialMessages}
        readOnly
      />
    </div>
  );
}
