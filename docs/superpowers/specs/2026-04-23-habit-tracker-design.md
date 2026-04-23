# Habitus — Habit Tracker Design Spec

**Date:** 2026-04-23
**Status:** Approved

---

## Overview

Habitus is a mobile-first habit tracker built with SvelteKit and TypeScript. Users authenticate via Clerk and manage their own habits in isolation. The core experience is a scrollable table where rows are days and columns are habits — users tap cells to log completion and long-press to add notes.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | SvelteKit + TypeScript |
| Auth | Clerk (JS SDK + `ConvexProviderWithClerk`) |
| Backend / DB | Convex (functions, schema, crons — all in codebase) |
| Deployment | Vercel |

Architecture is **CSR-first**: SvelteKit handles routing and the app shell; all data fetching is done client-side via Convex reactive queries. No SSR. No SvelteKit server routes.

---

## Data Model

Defined in `convex/schema.ts`.

```typescript
habits: {
  userId: string,           // Clerk user ID — enforced on every query/mutation
  name: string,
  description: string,
  color: string,            // hex
  icon: string,             // emoji or icon key
  categories: Id<"categories">[],
  createdAt: number,
  archivedAt?: number       // soft delete — preserves entry history
}

entries: {
  userId: string,
  habitId: Id<"habits">,
  date: string,             // "YYYY-MM-DD" — client sends local date
  done: boolean,
  note?: string
}

categories: {
  userId: string,
  name: string,
  color: string
}

userPreferences: {
  userId: string,
  timezone: string          // e.g. "America/New_York" — set on first login
}
```

**Data isolation:** every Convex query and mutation calls `ctx.auth.getUserIdentity()` and rejects unauthenticated requests. All queries filter by `userId`.

---

## Pages & Routes

All routes are behind a Clerk auth guard. Unauthenticated users are redirected to `/` (sign-in).

### `/tracker` (default)

- Pill/segmented switcher at top: **Tracker · Habits · Stats**
- **Default view: current month** — shows ~30 rows × N habit columns
- Prev/next month navigation arrows
- "Year view" button lazy-loads the full 365-row grid on demand
- Today's row highlighted, auto-scrolled to on load
- Table scrolls horizontally when habits overflow viewport

**Cell interaction:**
- **Tap** → optimistic toggle `done` on the entry (instant UI, rollback on error)
- **Long-press** → open note bottom sheet (pre-filled if note exists, save/clear actions). Long-press works on both done and empty cells — it creates the entry as `done: true` if it doesn't exist yet, then opens the note sheet.
- Empty cell = no entry document. Tapping creates an entry with `done: true`. Tapping a done cell deletes the entry.

### `/habits`

- List of active (non-archived) habits with color, icon, and category chips
- FAB (+) to create a new habit
- Tap habit → slide-up edit sheet (name, description, color, icon, categories)
- Swipe-to-archive → sets `archivedAt`, hides from tracker columns going forward

### `/stats`

V1 — kept simple, computed on-demand:

- Per-habit card: current streak, longest streak, completion % for selected period
- No background job — derived from `entries` table in `convex/stats.ts`

---

## Auth Flow

```
/ (unauthenticated) → Clerk <SignIn /> component
  → on success → redirect to /tracker

SvelteKit layout.ts (client-side guard):
  → if !clerk.user → redirect to /

ConvexProviderWithClerk:
  → passes Clerk JWT to Convex client automatically
  → all Convex functions receive auth context
```

---

## Convex Backend Structure

```
convex/
  schema.ts         — data model (above)
  habits.ts         — query: listActive, listArchived; mutation: create, update, archive
  entries.ts        — query: byMonthAndUser, byYearAndUser; mutation: toggle, setNote
  categories.ts     — query: list; mutation: create, update, delete
  stats.ts          — query: streaksAndRates (computed from entries, no stored state)
  userPreferences.ts— query: get; mutation: upsert (called on first login to store timezone)
  crons.ts          — hourly sweep for future timezone-aware scheduled jobs
```

**Cron pattern for timezone-aware jobs:**
```typescript
// convex/crons.ts
crons.hourly("timezone-aware-sweep", async (ctx) => {
  const prefs = await ctx.db.query("userPreferences").collect();
  for (const pref of prefs) {
    const localHour = new Intl.DateTimeFormat("en", {
      hour: "numeric", hour12: false, timeZone: pref.timezone
    }).format(new Date());
    if (Number(localHour) === 0) {
      // midnight for this user — schedule their daily processing
      await ctx.scheduler.runAfter(0, internal.stats.dailyForUser, { userId: pref.userId });
    }
  }
});
```

No email notifications in v1. Cron infrastructure is in place for future use.

---

## Cost Considerations

Convex charges per document read. Loading a full year (~365 × N habits entries) per page load is expensive at scale.

**Mitigation: default to current month view.**
- Month load: ~30 × N entries — very cheap
- Year view: loaded lazily on user request only
- This keeps Convex reads well within the free tier for personal/small-team use

| Usage | Est. reads/month | Tier |
|---|---|---|
| 1 user, 10 habits, daily | ~110k | Free |
| 100 users, 10 habits, daily | ~11M | Paid (~$25/mo) |

---

## Error Handling

- **Cell toggles:** optimistic update with rollback on Convex mutation error
- **Offline:** Convex client queues mutations and retries automatically on reconnect
- **Auth expiry:** Convex returns auth error → SvelteKit client guard redirects to sign-in
- **Archived habit entries:** preserved in DB, excluded from tracker columns

---

## Out of Scope (v1)

- Email / push notifications (infrastructure ready via crons + `userPreferences.timezone`)
- Social features, shared habits
- Export / import
- Native mobile app
