# Event Sorter

An AI-powered personal organiser. Snap a photo of an event poster, paste a link, or just describe an event in a sentence, and Event Sorter pulls out the details, saves it, and adds it to your Google Calendar.

It also includes a job application tracker and a commodities "Financial Helper" dashboard.

## Features

### Event management
- **Poster scanning:** upload a photo of a poster and GPT-4o vision extracts the name, date, time, location, price and ticket link.
- **Link extraction:** paste an event webpage URL and the details are pulled from the page.
- **AI chat:** describe an event in one message (e.g. "Football with Sam on Saturday at 3pm") and it's created straight away. Conversations are saved in a chat history.
- **Google Calendar sync:** push any event to your Google Calendar, with automatic OAuth token refresh.
- **Email reminders:** send yourself a reminder email via Resend.
- **Completed status:** mark events as done.
- **Bin:** deleted events go to a bin first, so they can be restored.
- **Auto clean-up:** an hourly cron job removes events once they've passed.

### Job tracker
- Track applications through Saved, Applied, Interview, Offer and Rejected.
- Store the job link and notes, and filter by status.

### Financial Helper
- Live and historical price charts for Natural Gas, Crude Oil and Gold (Yahoo Finance data).
- Technical indicators: RSI, MACD, EMA 20, Bollinger Bands, volume trend and pivot points.
- A rule-based BUY / HOLD / SELL signal with a confidence score, built from those indicators.

> The Financial Helper is a learning project and is **not financial advice**.

### General
- Google sign-in
- Light and dark mode

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL with Prisma ORM |
| Auth | NextAuth.js with Google OAuth |
| AI | OpenAI GPT-4o |
| Integrations | Google Calendar API, Resend (email), Yahoo Finance |
| Hosting | Vercel (with Vercel Cron) |

## Getting started

### 1. Prerequisites
- Node.js 20+
- A PostgreSQL database (e.g. Supabase, Neon or a local install)
- A Google Cloud project with the **Google Calendar API** enabled and an OAuth client
- An OpenAI API key and a Resend API key

### 2. Install

```bash
git clone https://github.com/Rashdan16/Event-sorter.git
cd Event-sorter/event-sorter
npm install
```

### 3. Environment variables

Create a `.env` file inside `event-sorter/`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-long-random-string"

OPENAI_API_KEY="your-openai-key"
RESEND_API_KEY="your-resend-key"
```

In Google Cloud, add this as an authorised redirect URI:
`http://localhost:3000/api/auth/callback/google`

### 4. Set up the database

```bash
npx prisma db push
```

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

## Project structure

```
event-sorter/
├── prisma/schema.prisma        # Database models: User, Event, ChatSession, ChatMessage
├── src/
│   ├── app/
│   │   ├── api/                # API routes (events, extract, chat, calendar, bin, finance...)
│   │   ├── event-sorter/       # Dashboard, upload, chat, bin and event detail pages
│   │   ├── jobs/               # Job tracker
│   │   └── financial-helper/   # Commodities dashboard
│   ├── components/             # UI components (EventCard, ChatBot, Navbar...)
│   ├── lib/                    # Auth, Prisma client and finance indicators
│   └── services/               # OpenAI and Google Calendar logic
└── vercel.json                 # Hourly clean-up cron job
```

## Notes
- Job tracker data is stored in the browser (localStorage), so it stays on the device you used.
- See [`event-sorter/CHANGELOG.md`](event-sorter/CHANGELOG.md) for the full change history.

## Author

Built by **Rashdan Khan**, BSc Computer Science with AI student at the University of Leicester.
[LinkedIn](https://www.linkedin.com/in/rashdan-khan-98ba37230/)
