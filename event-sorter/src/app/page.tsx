"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Parallax mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Scroll-triggered reveals
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-4 dot-grid">
          {/* Aurora ambient glow */}
          <div className="aurora-bg">
            <div className="aurora-orb" />
          </div>

          {/* Hero content with parallax */}
          <div
            className="relative z-10 text-center max-w-4xl mx-auto"
            style={{
              transform: `translate(${mouse.x * -8}px, ${mouse.y * -8}px)`,
              transition: "transform 0.15s ease-out",
            }}
          >
            <h1 className="hero-fade text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
                RK Solutions
              </span>
            </h1>
            <p className="hero-fade-d1 text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              A collection of tools to help you stay organized. Sign in to get started.
            </p>
            <div className="hero-fade-d2">
              <Link
                href="/auth/signin"
                className="glow-btn inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-10 py-4 rounded-full text-lg font-semibold"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Floating parallax orbs */}
          <div
            className="absolute top-1/4 left-[15%] w-2 h-2 bg-orange-400/30 rounded-full"
            style={{
              transform: `translate(${mouse.x * 20}px, ${mouse.y * 20}px)`,
              transition: "transform 0.2s ease-out",
              animation: "float 6s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-1/3 right-[18%] w-3 h-3 bg-amber-400/20 rounded-full"
            style={{
              transform: `translate(${mouse.x * -15}px, ${mouse.y * -15}px)`,
              transition: "transform 0.2s ease-out",
              animation: "float 8s ease-in-out infinite 1s",
            }}
          />
          <div
            className="absolute top-[60%] left-[70%] w-1.5 h-1.5 bg-orange-300/20 rounded-full"
            style={{
              transform: `translate(${mouse.x * 25}px, ${mouse.y * -18}px)`,
              transition: "transform 0.25s ease-out",
              animation: "float 7s ease-in-out infinite 2s",
            }}
          />
        </section>

        {/* ===== FEATURE HIGHLIGHTS ===== */}
        <div className="section-glow-border" />
        <section className="relative px-4 py-24 max-w-6xl mx-auto">
          <div className="reveal text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Everything you need
            </h2>
            <p className="text-gray-500 text-lg">Powerful tools, beautifully simple.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Event Sorter Card */}
            <div className="reveal reveal-delay-1 glass-card rounded-2xl p-8">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-5">
                <svg
                  className="w-6 h-6 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Event Sorter</h3>
              <p className="text-gray-400 leading-relaxed">
                Upload event posters and let AI extract the details. Sync to Google Calendar.
              </p>
            </div>

            {/* Financial Helper Card */}
            <div className="reveal reveal-delay-2 glass-card rounded-2xl p-8">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-5">
                <svg
                  className="w-6 h-6 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Financial Helper</h3>
              <p className="text-gray-400 leading-relaxed">
                Tools to help manage your finances.
              </p>
            </div>

            {/* Jobs Card */}
            <div className="reveal reveal-delay-3 glass-card rounded-2xl p-8">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-5">
                <svg
                  className="w-6 h-6 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Jobs</h3>
              <p className="text-gray-400 leading-relaxed">
                Browse and manage job opportunities.
              </p>
            </div>
          </div>
        </section>

        {/* ===== SOCIAL PROOF ===== */}
        <div className="section-glow-border" />
        <section className="relative px-4 py-24">
          <div className="max-w-4xl mx-auto">
            <div className="reveal grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">500+</div>
                <div className="text-gray-500 text-sm uppercase tracking-widest">Events Organized</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">99%</div>
                <div className="text-gray-500 text-sm uppercase tracking-widest">AI Accuracy</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">10x</div>
                <div className="text-gray-500 text-sm uppercase tracking-widest">Time Saved</div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <div className="section-glow-border" />
        <footer className="px-4 py-8">
          <div className="max-w-6xl mx-auto text-center text-gray-600 text-sm">
            Built with precision. &copy; {new Date().getFullYear()} RK Solutions.
          </div>
        </footer>
      </div>
    );
  }

  /* ===== AUTHENTICATED DASHBOARD ===== */
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">RK Solutions</h1>
          <p className="text-gray-500">Your tools and products</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Event Sorter Card */}
          <Link
            href="/event-sorter"
            className="group glass-card rounded-2xl p-8 block"
          >
            <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-orange-500/20 transition-colors duration-300">
              <svg
                className="w-7 h-7 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Event Sorter
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Upload event posters, extract details with AI, and sync to Google Calendar.
            </p>
            <div className="mt-5 flex items-center text-orange-400 text-sm font-medium">
              Open
              <svg
                className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Financial Helper Card */}
          <Link
            href="/financial-helper"
            className="group glass-card rounded-2xl p-8 block"
          >
            <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-orange-500/20 transition-colors duration-300">
              <svg
                className="w-7 h-7 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Financial Helper
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Tools to help manage your finances.
            </p>
            <div className="mt-5 flex items-center text-orange-400 text-sm font-medium">
              Open
              <svg
                className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Jobs Card */}
          <Link
            href="/jobs"
            className="group glass-card rounded-2xl p-8 block"
          >
            <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-orange-500/20 transition-colors duration-300">
              <svg
                className="w-7 h-7 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Jobs
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Browse and manage job opportunities.
            </p>
            <div className="mt-5 flex items-center text-orange-400 text-sm font-medium">
              Open
              <svg
                className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
