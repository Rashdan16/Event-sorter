"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { FinanceDataProvider } from "@/hooks/useFinanceData";
import Sidebar from "@/components/financial-helper/Sidebar";
import AISignalPanel from "@/components/financial-helper/AISignalPanel";

export default function FinancialHelperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0d1017", fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="space-y-4 w-64">
          <div className="fin-shimmer h-6 w-40" />
          <div className="fin-shimmer h-4 w-56" />
          <div className="fin-shimmer h-4 w-48" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap"
        rel="stylesheet"
      />
      <FinanceDataProvider>
        <div
          className="flex min-h-screen"
          style={{
            background: "#0d1017",
            color: "#e1e4ea",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Sidebar - hidden below 860px */}
          <div className="hidden min-[860px]:block flex-shrink-0">
            <Sidebar />
          </div>

          {/* Main content - scrollable */}
          <main className="flex-1 min-w-0 overflow-y-auto h-screen fin-scrollbar">
            {/* Mobile back button - visible only when sidebar is hidden */}
            <div className="block min-[860px]:hidden px-4 pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#7a7e8f] hover:bg-[#13161e] hover:text-[#b0b3c0] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
            </div>
            {children}
          </main>

          {/* AI Panel - stacks below on small screens */}
          <div className="hidden min-[1380px]:block flex-shrink-0">
            <AISignalPanel />
          </div>
        </div>

        {/* Stacked AI Panel for smaller screens */}
        <div className="block min-[1380px]:hidden" style={{ background: "#0d1017" }}>
          <AISignalPanel />
        </div>
      </FinanceDataProvider>
    </>
  );
}
