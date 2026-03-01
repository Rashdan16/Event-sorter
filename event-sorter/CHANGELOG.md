# Changelog

All notable changes to this project are documented here.

---

## [2026-03-01] - Chat history (saved conversations)

- Added `ChatSession` and `ChatMessage` models to Prisma schema to persist AI chat conversations
- Chat sessions are automatically saved when the user sends messages to the AI chatbot
- Session title is generated from the user's first message
- Created API routes: `GET/POST /api/chat-sessions`, `GET/PUT/DELETE /api/chat-sessions/[id]`
- Created chat history page at `/event-sorter/chat/history` listing all past conversations with timestamps, "Event Created" badges, and delete buttons
- Created individual chat view page at `/event-sorter/chat/history/[id]` to view full past conversations in read-only mode
- Added "History" button on the AI Chat page to access saved chats
- Added back button and improved navigation on the chat page
- Updated `ChatBot` component to accept `sessionId`, `initialMessages`, and `readOnly` props for viewing past chats
- **Files:** `prisma/schema.prisma`, `src/app/api/chat-sessions/route.ts`, `src/app/api/chat-sessions/[id]/route.ts`, `src/components/ChatBot.tsx`, `src/app/event-sorter/chat/page.tsx`, `src/app/event-sorter/chat/history/page.tsx`, `src/app/event-sorter/chat/history/[id]/page.tsx`

---

## [2026-03-01] - Fix sign-out button visibility

- The sign-out button was hidden behind a hover-reveal animation that didn't work reliably with the custom cursor
- Made the sign-out button always visible next to the user's name/avatar
- **Files:** `src/components/Navbar.tsx`

---

## [2026-03-01] - Back button on Financial Helper page
- Added a "Back to Home" link at the top of the Sidebar component
- Added a mobile version of the back button in the layout (visible when sidebar is hidden below 860px)
- **Files:** `src/components/financial-helper/Sidebar.tsx`, `src/app/financial-helper/layout.tsx`

---

## [2026-03-01] - AI Chat single-message event creation
- Rewrote the system prompt to extract all event details from a single user message without asking follow-up questions
- Only name and date are required; time, location, and companions default to "none" if not provided
- AI now creates the event immediately without a confirmation step
- Updated the ChatBot greeting and input placeholder to guide users
- **Files:** `src/app/api/chat/route.ts`, `src/components/ChatBot.tsx`

---

## [2026-03-01] - Event completed feature
- Added `completed` boolean field to the Event model in Prisma schema (default: false)
- Pushed schema change to the database
- Added a full-width toggle button on the event detail page to mark events as completed/incomplete
- Added a green "Completed" badge on EventCard in the dashboard and bin
- **Files:** `prisma/schema.prisma`, `src/app/api/events/[id]/route.ts`, `src/types/index.ts`, `src/app/event-sorter/events/[id]/page.tsx`, `src/components/EventCard.tsx`, `src/app/event-sorter/page.tsx`

---

## [2026-03-01] - Orange hue on event cards
- Updated `.glass-card` background from a near-invisible white tint to a subtle orange tint matching the site's brand colour (`#f97316`)
- Updated card border to match the orange hue
- **Files:** `src/app/globals.css`

---

## [2026-03-01] - 12-hour time format
- Added a `formatTime()` helper to convert stored `HH:MM` (24hr) times to `H:MM AM/PM` display format
- Applied to event cards on the dashboard and the bin page
- **Files:** `src/components/EventCard.tsx`, `src/app/event-sorter/bin/page.tsx`

---

## [2026-03-01] - Google Calendar token refresh fix
- **Issue:** "Token has been expired or revoked" error when clicking Add to Calendar. The PrismaAdapter doesn't update stored OAuth tokens when a user signs in again, leaving stale/revoked refresh tokens in the database.
- **Fix:** Added a `signIn` callback in `auth.ts` that overwrites the stored `access_token`, `refresh_token`, and `expires_at` with fresh values from Google on every sign-in.
- **Files:** `src/lib/auth.ts`

---

## [2026-03-01] - Light mode UI theme

- Implemented a full light mode theme alongside the existing dark mode
- Added a ThemeProvider context with localStorage persistence and system preference detection
- Added a theme toggle button in the Navbar (sun/moon icon)
- Inline script in layout.tsx prevents flash of wrong theme before hydration
- Updated `globals.css`: split `.glass-card`, `.dot-grid`, `.section-glow-border`, and scrollbar styles into light/dark variants
- Updated all pages and components with `dark:` variant classes:
  - `page.tsx` (home): backgrounds, hero gradient text, feature cards, stats, footer
  - `event-sorter/page.tsx` (dashboard): backgrounds, headers, action buttons, time filters, search input, empty states
  - `EventCard.tsx`: text colors for name, date, location
  - `auth/signin/page.tsx`: backgrounds, logo text, heading, Google sign-in button
  - `event-sorter/bin/page.tsx`: backgrounds, text colors, action buttons
  - `Navbar.tsx`: background, border, text, profile ring, sign-out button
- Light mode uses white/gray palette; dark mode preserves the existing orange-tinted glassmorphism
- **Files:** `src/app/globals.css`, `src/components/Navbar.tsx`, `src/components/ThemeProvider.tsx`, `src/app/page.tsx`, `src/app/event-sorter/page.tsx`, `src/components/EventCard.tsx`, `src/app/auth/signin/page.tsx`, `src/app/event-sorter/bin/page.tsx`, `src/app/layout.tsx`

---

## [2026-03-01] - CLAUDE.md and CHANGELOG.md setup
- Created project-level `CLAUDE.md` with instructions for response style and error explanations
- Created global `~/.claude/CLAUDE.md` to apply changelog and response style rules to all future projects automatically
- Created this `CHANGELOG.md` file
- **Files:** `CLAUDE.md`, `CHANGELOG.md`, `~/.claude/CLAUDE.md`
