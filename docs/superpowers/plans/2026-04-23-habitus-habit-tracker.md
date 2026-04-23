# Habitus — Habit Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first habit tracker with SvelteKit, Convex, and Clerk authentication where users track daily habits in a table (columns = habits, rows = days).

**Architecture:** CSR-first SvelteKit app — SSR disabled globally, all data fetched client-side via Convex reactive subscriptions. Clerk handles auth; its JWT is wired into the Convex client on sign-in. All backend logic (queries, mutations, crons) lives in the `convex/` directory in the codebase.

**Tech Stack:** SvelteKit 2, TypeScript, Tailwind CSS v4, Convex, @clerk/sveltekit, Vitest, convex-test

---

## File Map

### SvelteKit App
- `src/app.html` — HTML shell
- `src/app.css` — Global styles + Tailwind base
- `src/hooks.server.ts` — Clerk server hook
- `src/routes/+layout.ts` — `export const ssr = false`
- `src/routes/+layout.svelte` — Clerk + Convex providers, auth token wiring
- `src/routes/+page.svelte` — Root: sign-in screen (unauthenticated) or app shell (authenticated)
- `src/lib/convex.ts` — ConvexClient singleton + `useQuery` reactive store factory
- `src/lib/convex-api.ts` — Re-export of generated Convex API for Svelte components
- `src/lib/stores/ui.ts` — `activeView` ('tracker'|'habits'|'stats') + `activeMonth` ('YYYY-MM')
- `src/lib/utils/dates.ts` — Local date helpers
- `src/lib/utils/dates.test.ts` — Date utility unit tests
- `src/lib/components/AppShell.svelte` — App shell: header + PillNav + view switcher
- `src/lib/components/PillNav.svelte` — Segmented pill switcher
- `src/lib/components/TrackerView.svelte` — Month table with habit columns and day rows
- `src/lib/components/HabitCell.svelte` — Single table cell: tap to toggle, long-press for note
- `src/lib/components/NoteSheet.svelte` — Bottom sheet for adding/editing notes
- `src/lib/components/HabitsView.svelte` — Habit list with FAB to add
- `src/lib/components/HabitForm.svelte` — Create/edit habit bottom sheet
- `src/lib/components/CategoryBadge.svelte` — Category chip
- `src/lib/components/StatsView.svelte` — Stats view: list of HabitStatCard
- `src/lib/components/HabitStatCard.svelte` — Per-habit stats card (streak, best, completion %)

### Convex Backend
- `convex/schema.ts` — Table definitions (habits, entries, categories, userPreferences)
- `convex/userPreferences.ts` — `getAuthUserId` helper + get/upsert functions
- `convex/habits.ts` — listActive, listArchived, create, update, archive
- `convex/habits.test.ts` — Convex habit function tests
- `convex/entries.ts` — byMonth, byYear, toggle, setNote
- `convex/entries.test.ts` — Convex entry function tests
- `convex/categories.ts` — list, create, update, remove
- `convex/stats.ts` — forHabit: currentStreak, longestStreak, completionRate
- `convex/stats.test.ts` — Streak calculation tests
- `convex/crons.ts` — Hourly timezone-aware sweep scaffold

### Config
- `svelte.config.js` — SvelteKit config with adapter-vercel
- `vite.config.ts` — Vite config with Tailwind + SvelteKit plugins
- `.env.local` — Convex URL, Clerk keys (gitignored)
- `vercel.json` — Vercel deployment config
- `.gitignore`

---

## Task 1: Initialize project + install dependencies

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `src/app.html`, `src/app.css`, `.gitignore`, `.env.local`

- [ ] **Step 1: Scaffold SvelteKit project**

```bash
cd /var/home/gus/Development/habitus
npm create svelte@latest . -- --template skeleton --types typescript --no-prettier --no-eslint --no-playwright --vitest
```

Expected output: "Your project is ready!" — SvelteKit skeleton with TypeScript and Vitest.

- [ ] **Step 2: Install dependencies**

```bash
npm install convex @clerk/sveltekit
npm install -D tailwindcss @tailwindcss/vite convex-test @sveltejs/adapter-vercel
```

- [ ] **Step 3: Replace vite.config.ts**

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
});
```

- [ ] **Step 4: Replace svelte.config.js**

```javascript
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: { adapter: adapter() }
};

export default config;
```

- [ ] **Step 5: Replace src/app.css**

```css
@import "tailwindcss";

:root { color-scheme: dark; }

html, body {
  @apply bg-[#111] text-white h-full;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
```

- [ ] **Step 6: Create .env.local**

```
PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

- [ ] **Step 7: Update .gitignore**

Append to the end of `.gitignore`:

```
.env.local
.superpowers/
```

- [ ] **Step 8: Initialize Convex**

```bash
npx convex dev --once
```

Expected: Creates `convex/` directory and `convex.json`. Updates `.env.local` with your deployment's `CONVEX_URL`.

- [ ] **Step 9: Initialize git and commit**

```bash
git init
git add -A
git commit -m "feat: initialize SvelteKit + Convex + Clerk + Tailwind project"
```

---

## Task 2: Convex schema

**Files:**
- Create: `convex/schema.ts`

- [ ] **Step 1: Write schema**

Create `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  habits: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.string(),
    color: v.string(),
    icon: v.string(),
    categories: v.array(v.id("categories")),
    createdAt: v.number(),
    archivedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  entries: defineTable({
    userId: v.string(),
    habitId: v.id("habits"),
    date: v.string(),     // "YYYY-MM-DD" — client sends local date
    done: v.boolean(),
    note: v.optional(v.string()),
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_habit_and_date", ["habitId", "date"]),

  categories: defineTable({
    userId: v.string(),
    name: v.string(),
    color: v.string(),
  }).index("by_user", ["userId"]),

  userPreferences: defineTable({
    userId: v.string(),
    timezone: v.string(),   // e.g. "America/New_York"
  }).index("by_user", ["userId"]),
});
```

- [ ] **Step 2: Push schema**

```bash
npx convex dev --once
```

Expected: "Schema successfully deployed" — no type errors.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: Convex schema — habits, entries, categories, userPreferences"
```

---

## Task 3: Auth helper + userPreferences functions

**Files:**
- Create: `convex/userPreferences.ts`

- [ ] **Step 1: Implement**

Create `convex/userPreferences.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export async function getAuthUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  return identity.subject;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const upsert = mutation({
  args: { timezone: v.string() },
  handler: async (ctx, { timezone }) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { timezone });
    } else {
      await ctx.db.insert("userPreferences", { userId, timezone });
    }
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add convex/userPreferences.ts
git commit -m "feat: getAuthUserId helper + userPreferences get/upsert"
```

---

## Task 4: Convex habits functions + tests

**Files:**
- Create: `convex/habits.ts`, `convex/habits.test.ts`

- [ ] **Step 1: Write failing tests**

Create `convex/habits.test.ts`:

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("create and list active habits", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user1" });

  const id = await asUser.mutation(api.habits.create, {
    name: "Morning Run",
    description: "Run 5km",
    color: "#22c55e",
    icon: "🏃",
    categories: [],
  });

  const habits = await asUser.query(api.habits.listActive);
  expect(habits).toHaveLength(1);
  expect(habits[0].name).toBe("Morning Run");
  expect(habits[0]._id).toBe(id);
});

test("archive moves habit out of active list and preserves it in archived", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user1" });

  const id = await asUser.mutation(api.habits.create, {
    name: "Read",
    description: "",
    color: "#3b82f6",
    icon: "📚",
    categories: [],
  });

  await asUser.mutation(api.habits.archive, { id });

  const active = await asUser.query(api.habits.listActive);
  expect(active).toHaveLength(0);

  const archived = await asUser.query(api.habits.listArchived);
  expect(archived).toHaveLength(1);
  expect(archived[0]._id).toBe(id);
});

test("users cannot see each other's habits", async () => {
  const t = convexTest(schema);
  const asUser1 = t.withIdentity({ subject: "user1" });
  const asUser2 = t.withIdentity({ subject: "user2" });

  await asUser1.mutation(api.habits.create, {
    name: "User1 Habit",
    description: "",
    color: "#fff",
    icon: "⭐",
    categories: [],
  });

  const user2Habits = await asUser2.query(api.habits.listActive);
  expect(user2Habits).toHaveLength(0);
});
```

- [ ] **Step 2: Run tests — verify failure**

```bash
npx vitest run convex/habits.test.ts
```

Expected: FAIL with "api.habits.create is not a function" or similar.

- [ ] **Step 3: Implement habits functions**

Create `convex/habits.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./userPreferences";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("archivedAt"), undefined))
      .order("asc")
      .collect();
  },
});

export const listArchived = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.neq(q.field("archivedAt"), undefined))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    color: v.string(),
    icon: v.string(),
    categories: v.array(v.id("categories")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return ctx.db.insert("habits", { ...args, userId, createdAt: Date.now() });
  },
});

export const update = mutation({
  args: {
    id: v.id("habits"),
    name: v.string(),
    description: v.string(),
    color: v.string(),
    icon: v.string(),
    categories: v.array(v.id("categories")),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await getAuthUserId(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, fields);
  },
});

export const archive = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { archivedAt: Date.now() });
  },
});
```

- [ ] **Step 4: Run tests — verify pass**

```bash
npx vitest run convex/habits.test.ts
```

Expected: PASS — 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add convex/habits.ts convex/habits.test.ts
git commit -m "feat: Convex habits CRUD (listActive, listArchived, create, update, archive)"
```

---

## Task 5: Convex entries functions + tests

**Files:**
- Create: `convex/entries.ts`, `convex/entries.test.ts`

- [ ] **Step 1: Write failing tests**

Create `convex/entries.test.ts`:

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const HABIT_ARGS = { name: "Run", description: "", color: "#fff", icon: "🏃", categories: [] as const };

test("toggle creates entry on first tap", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user1" });
  const habitId = await asUser.mutation(api.habits.create, HABIT_ARGS);

  await asUser.mutation(api.entries.toggle, { habitId, date: "2026-04-23" });

  const entries = await asUser.query(api.entries.byMonth, { month: "2026-04" });
  expect(entries).toHaveLength(1);
  expect(entries[0].done).toBe(true);
  expect(entries[0].date).toBe("2026-04-23");
});

test("toggle deletes entry on second tap", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user1" });
  const habitId = await asUser.mutation(api.habits.create, HABIT_ARGS);

  await asUser.mutation(api.entries.toggle, { habitId, date: "2026-04-23" });
  await asUser.mutation(api.entries.toggle, { habitId, date: "2026-04-23" });

  const entries = await asUser.query(api.entries.byMonth, { month: "2026-04" });
  expect(entries).toHaveLength(0);
});

test("setNote creates entry with done=true and note if entry does not exist", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user1" });
  const habitId = await asUser.mutation(api.habits.create, HABIT_ARGS);

  await asUser.mutation(api.entries.setNote, { habitId, date: "2026-04-23", note: "Great run!" });

  const entries = await asUser.query(api.entries.byMonth, { month: "2026-04" });
  expect(entries[0].done).toBe(true);
  expect(entries[0].note).toBe("Great run!");
});

test("setNote updates note on existing entry", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user1" });
  const habitId = await asUser.mutation(api.habits.create, HABIT_ARGS);

  await asUser.mutation(api.entries.toggle, { habitId, date: "2026-04-23" });
  await asUser.mutation(api.entries.setNote, { habitId, date: "2026-04-23", note: "5km done" });

  const entries = await asUser.query(api.entries.byMonth, { month: "2026-04" });
  expect(entries[0].note).toBe("5km done");
});

test("byMonth only returns entries for the requested month", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user1" });
  const habitId = await asUser.mutation(api.habits.create, HABIT_ARGS);

  await asUser.mutation(api.entries.toggle, { habitId, date: "2026-04-23" });
  await asUser.mutation(api.entries.toggle, { habitId, date: "2026-05-01" });

  const april = await asUser.query(api.entries.byMonth, { month: "2026-04" });
  expect(april).toHaveLength(1);
  expect(april[0].date).toBe("2026-04-23");
});
```

- [ ] **Step 2: Run tests — verify failure**

```bash
npx vitest run convex/entries.test.ts
```

Expected: FAIL — `api.entries.toggle` not defined.

- [ ] **Step 3: Implement entries functions**

Create `convex/entries.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./userPreferences";

export const byMonth = query({
  args: { month: v.string() }, // "YYYY-MM"
  handler: async (ctx, { month }) => {
    const userId = await getAuthUserId(ctx);
    return ctx.db
      .query("entries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).gte("date", `${month}-01`).lte("date", `${month}-32`)
      )
      .collect();
  },
});

export const byYear = query({
  args: { year: v.string() }, // "YYYY"
  handler: async (ctx, { year }) => {
    const userId = await getAuthUserId(ctx);
    return ctx.db
      .query("entries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).gte("date", `${year}-01-01`).lte("date", `${year}-12-31`)
      )
      .collect();
  },
});

export const toggle = mutation({
  args: { habitId: v.id("habits"), date: v.string() },
  handler: async (ctx, { habitId, date }) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("entries")
      .withIndex("by_habit_and_date", (q) => q.eq("habitId", habitId).eq("date", date))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("entries", { userId, habitId, date, done: true });
    }
  },
});

export const setNote = mutation({
  args: { habitId: v.id("habits"), date: v.string(), note: v.string() },
  handler: async (ctx, { habitId, date, note }) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("entries")
      .withIndex("by_habit_and_date", (q) => q.eq("habitId", habitId).eq("date", date))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { note });
    } else {
      await ctx.db.insert("entries", { userId, habitId, date, done: true, note });
    }
  },
});
```

- [ ] **Step 4: Run tests — verify pass**

```bash
npx vitest run convex/entries.test.ts
```

Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add convex/entries.ts convex/entries.test.ts
git commit -m "feat: Convex entries toggle/setNote mutations + byMonth/byYear queries"
```

---

## Task 6: Convex categories + stats + crons

**Files:**
- Create: `convex/categories.ts`, `convex/stats.ts`, `convex/stats.test.ts`, `convex/crons.ts`

- [ ] **Step 1: Write failing stats tests**

Create `convex/stats.test.ts`:

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const HABIT_ARGS = { name: "Run", description: "", color: "#fff", icon: "🏃", categories: [] as const };

test("streak is 0 with no entries", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user1" });
  const habitId = await asUser.mutation(api.habits.create, HABIT_ARGS);

  const stats = await asUser.query(api.stats.forHabit, { habitId, year: "2026" });
  expect(stats.currentStreak).toBe(0);
  expect(stats.longestStreak).toBe(0);
  expect(stats.completionRate).toBe(0);
});

test("longest streak counts max consecutive done entries", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user1" });
  const habitId = await asUser.mutation(api.habits.create, HABIT_ARGS);

  for (const date of ["2026-01-01", "2026-01-02", "2026-01-03"]) {
    await asUser.mutation(api.entries.toggle, { habitId, date });
  }
  // Gap on Jan 4
  for (const date of ["2026-01-05", "2026-01-06"]) {
    await asUser.mutation(api.entries.toggle, { habitId, date });
  }

  const stats = await asUser.query(api.stats.forHabit, { habitId, year: "2026" });
  expect(stats.longestStreak).toBe(3);
});
```

- [ ] **Step 2: Run tests — verify failure**

```bash
npx vitest run convex/stats.test.ts
```

Expected: FAIL — `api.stats.forHabit` not defined.

- [ ] **Step 3: Implement categories**

Create `convex/categories.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./userPreferences";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: { name: v.string(), color: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return ctx.db.insert("categories", { ...args, userId });
  },
});

export const update = mutation({
  args: { id: v.id("categories"), name: v.string(), color: v.string() },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await getAuthUserId(ctx);
    const cat = await ctx.db.get(id);
    if (!cat || cat.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    const cat = await ctx.db.get(id);
    if (!cat || cat.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(id);
  },
});
```

- [ ] **Step 4: Implement stats**

Create `convex/stats.ts`:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./userPreferences";

export const forHabit = query({
  args: { habitId: v.id("habits"), year: v.string() },
  handler: async (ctx, { habitId, year }) => {
    const userId = await getAuthUserId(ctx);
    const allEntries = await ctx.db
      .query("entries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).gte("date", `${year}-01-01`).lte("date", `${year}-12-31`)
      )
      .filter((q) => q.eq(q.field("habitId"), habitId))
      .collect();

    const doneDates = new Set(allEntries.filter((e) => e.done).map((e) => e.date));
    const today = new Date().toISOString().slice(0, 10);

    // Current streak: count consecutive done days backwards from today
    let currentStreak = 0;
    const cur = new Date(today);
    while (true) {
      const ds = cur.toISOString().slice(0, 10);
      if (!doneDates.has(ds)) break;
      currentStreak++;
      cur.setDate(cur.getDate() - 1);
    }

    // Longest streak: scan from Jan 1 to today
    let longestStreak = 0;
    let streak = 0;
    const start = new Date(`${year}-01-01`);
    const end = new Date(today);
    const scan = new Date(start);
    while (scan <= end) {
      const ds = scan.toISOString().slice(0, 10);
      if (doneDates.has(ds)) {
        streak++;
        if (streak > longestStreak) longestStreak = streak;
      } else {
        streak = 0;
      }
      scan.setDate(scan.getDate() + 1);
    }

    const daysSoFar = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    const completionRate = daysSoFar > 0 ? Math.round((doneDates.size / daysSoFar) * 100) : 0;

    return { currentStreak, longestStreak, completionRate };
  },
});
```

- [ ] **Step 5: Implement crons**

Create `convex/crons.ts`:

```typescript
import { cronJobs } from "convex/server";

const crons = cronJobs();

// Hourly sweep: future hook for timezone-aware per-user daily jobs.
// Pattern: query userPreferences, find users whose local hour === 0,
// dispatch internal functions for those users.
crons.hourly("timezone-aware-sweep", { minuteUTC: 0 }, async (_ctx) => {
  // No-op in v1 — infrastructure ready for daily digest or reminders.
});

export default crons;
```

- [ ] **Step 6: Run stats tests — verify pass**

```bash
npx vitest run convex/stats.test.ts
```

Expected: PASS — 2 tests green.

- [ ] **Step 7: Commit**

```bash
git add convex/categories.ts convex/stats.ts convex/stats.test.ts convex/crons.ts
git commit -m "feat: Convex categories CRUD, per-habit stats query, cron scaffold"
```

---

## Task 7: Date utilities

**Files:**
- Create: `src/lib/utils/dates.ts`, `src/lib/utils/dates.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/utils/dates.test.ts`:

```typescript
import { describe, expect, test } from "vitest";
import {
  toLocalDateString,
  getMonthDays,
  formatMonthLabel,
  prevMonth,
  nextMonth,
  currentMonth,
} from "./dates";

test("toLocalDateString returns YYYY-MM-DD in local time", () => {
  const date = new Date(2026, 3, 23); // April 23 2026 local time
  expect(toLocalDateString(date)).toBe("2026-04-23");
});

test("getMonthDays returns 30 days for April 2026", () => {
  const days = getMonthDays("2026-04");
  expect(days).toHaveLength(30);
  expect(days[0]).toBe("2026-04-01");
  expect(days[29]).toBe("2026-04-30");
});

test("getMonthDays returns 28 days for February 2026 (non-leap)", () => {
  expect(getMonthDays("2026-02")).toHaveLength(28);
});

test("getMonthDays returns 29 days for February 2024 (leap year)", () => {
  expect(getMonthDays("2024-02")).toHaveLength(29);
});

test("formatMonthLabel returns 'April 2026'", () => {
  expect(formatMonthLabel("2026-04")).toBe("April 2026");
});

test("prevMonth returns 2026-03 for 2026-04", () => {
  expect(prevMonth("2026-04")).toBe("2026-03");
});

test("nextMonth returns 2026-05 for 2026-04", () => {
  expect(nextMonth("2026-04")).toBe("2026-05");
});

test("prevMonth wraps January to December of previous year", () => {
  expect(prevMonth("2026-01")).toBe("2025-12");
});

test("nextMonth wraps December to January of next year", () => {
  expect(nextMonth("2025-12")).toBe("2026-01");
});
```

- [ ] **Step 2: Run tests — verify failure**

```bash
npx vitest run src/lib/utils/dates.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/utils/dates.ts`:

```typescript
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function currentMonth(): string {
  return toLocalDateString().slice(0, 7);
}

export function getMonthDays(month: string): string[] {
  // month = "YYYY-MM"
  const [year, m] = month.split("-").map(Number);
  const daysInMonth = new Date(year, m, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1).padStart(2, "0");
    return `${year}-${String(m).padStart(2, "0")}-${d}`;
  });
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });
}

export function prevMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function nextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
npx vitest run src/lib/utils/dates.test.ts
```

Expected: PASS — 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/dates.ts src/lib/utils/dates.test.ts
git commit -m "feat: date utilities (toLocalDateString, getMonthDays, prevMonth, nextMonth)"
```

---

## Task 8: SvelteKit layout + Clerk + Convex wiring

**Files:**
- Create: `src/routes/+layout.ts`, `src/hooks.server.ts`, `src/lib/convex.ts`, `src/lib/convex-api.ts`
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Disable SSR globally**

Create `src/routes/+layout.ts`:

```typescript
export const ssr = false;
```

- [ ] **Step 2: Add Clerk server hook**

Create `src/hooks.server.ts`:

```typescript
import { handleClerk } from "@clerk/sveltekit/server";
import { CLERK_SECRET_KEY } from "$env/static/private";

export const handle = handleClerk(CLERK_SECRET_KEY);
```

- [ ] **Step 3: Create Convex client + useQuery helper**

Create `src/lib/convex.ts`:

```typescript
import { ConvexClient } from "convex/browser";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { readable } from "svelte/store";
import type { FunctionReference, OptionalRestArgs } from "convex/server";

export const convex = new ConvexClient(PUBLIC_CONVEX_URL);

// Returns a Svelte readable store that re-emits whenever the Convex query result changes.
// Uses ConvexClient.onUpdate() — the subscription API for the browser client.
// If your Convex version uses watchQuery().onUpdate() instead, adjust accordingly:
//   const watch = convex.watchQuery(query, args[0] ?? {});
//   return watch.onUpdate((result) => set(result));
export function useQuery<Q extends FunctionReference<"query">>(
  query: Q,
  ...args: OptionalRestArgs<Q>
) {
  type Result = Awaited<ReturnType<Q["_returnType"]>> | undefined;
  return readable<Result>(undefined, (set) => {
    return convex.onUpdate(query, args[0] ?? ({} as any), (result) => set(result));
  });
}
```

- [ ] **Step 4: Create Convex API re-export**

Create `src/lib/convex-api.ts`:

```typescript
// Re-export generated Convex API so Svelte components import from one place.
export { api } from "../../convex/_generated/api";
```

- [ ] **Step 5: Write layout with Clerk + Convex auth wiring**

Replace `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
  import "../app.css";
  import { ClerkProvider } from "@clerk/sveltekit";
  import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "$env/static/public";
  import { convex } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import { onMount } from "svelte";

  // Note: @clerk/sveltekit exposes the Clerk instance via the clerk store.
  // Check your installed version's docs if this import path differs.
  import { clerk } from "@clerk/sveltekit/client";

  onMount(() => {
    // Wire Clerk JWT into Convex auth. Returns cleanup function.
    return clerk.addListener(async ({ session }) => {
      if (session) {
        convex.setAuth(async ({ forceRefreshToken }) => {
          return session.getToken({ template: "convex", skipCache: forceRefreshToken });
        });
        // Store user's local timezone for future cron-based features.
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        convex.mutation(api.userPreferences.upsert, { timezone }).catch(() => {});
      } else {
        convex.clearAuth();
      }
    });
  });
</script>

<ClerkProvider publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}>
  <slot />
</ClerkProvider>
```

> **Note:** If `clerk` import from `@clerk/sveltekit/client` does not exist in your installed version, check the package's README for the correct way to access the Clerk instance from a Svelte component. The key operation needed is `session.getToken({ template: "convex" })`.

- [ ] **Step 6: Configure Clerk JWT template**

In the Clerk dashboard → JWT Templates → New → select "Convex" preset → save as "convex". This is required for `getToken({ template: "convex" })` to work.

- [ ] **Step 7: Verify no compile errors**

```bash
npx convex dev &
npm run dev
```

Open http://localhost:5173. Expected: blank page or minimal output — no red console errors.

- [ ] **Step 8: Commit**

```bash
git add src/routes/+layout.ts src/routes/+layout.svelte src/hooks.server.ts src/lib/convex.ts src/lib/convex-api.ts
git commit -m "feat: SvelteKit layout — Clerk + Convex auth wiring, SSR disabled"
```

---

## Task 9: UI store + PillNav + AppShell + root page

**Files:**
- Create: `src/lib/stores/ui.ts`, `src/lib/components/PillNav.svelte`, `src/lib/components/AppShell.svelte`
- Create placeholders: `src/lib/components/TrackerView.svelte`, `HabitsView.svelte`, `StatsView.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create UI store**

Create `src/lib/stores/ui.ts`:

```typescript
import { writable } from "svelte/store";
import { currentMonth } from "$lib/utils/dates";

export type View = "tracker" | "habits" | "stats";

export const activeView = writable<View>("tracker");
export const activeMonth = writable<string>(currentMonth());
```

- [ ] **Step 2: Create PillNav**

Create `src/lib/components/PillNav.svelte`:

```svelte
<script lang="ts">
  import { activeView, type View } from "$lib/stores/ui";

  const tabs: { id: View; label: string }[] = [
    { id: "tracker", label: "Tracker" },
    { id: "habits", label: "Habits" },
    { id: "stats", label: "Stats" },
  ];
</script>

<div class="flex bg-[#1a1a1a] rounded-full p-1 mx-4 my-3">
  {#each tabs as tab}
    <button
      class="flex-1 py-1.5 text-sm font-medium rounded-full transition-colors duration-150
        {$activeView === tab.id ? 'bg-white text-black' : 'text-[#666] hover:text-white'}"
      on:click={() => activeView.set(tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</div>
```

- [ ] **Step 3: Create placeholder view components**

Create `src/lib/components/TrackerView.svelte`:

```svelte
<div class="p-4 text-[#555] text-sm">Tracker coming soon</div>
```

Create `src/lib/components/HabitsView.svelte`:

```svelte
<div class="p-4 text-[#555] text-sm">Habits coming soon</div>
```

Create `src/lib/components/StatsView.svelte`:

```svelte
<div class="p-4 text-[#555] text-sm">Stats coming soon</div>
```

- [ ] **Step 4: Create AppShell**

Create `src/lib/components/AppShell.svelte`:

```svelte
<script lang="ts">
  import { UserButton } from "@clerk/sveltekit";
  import PillNav from "./PillNav.svelte";
  import TrackerView from "./TrackerView.svelte";
  import HabitsView from "./HabitsView.svelte";
  import StatsView from "./StatsView.svelte";
  import { activeView } from "$lib/stores/ui";
</script>

<div class="flex flex-col h-dvh bg-[#111] text-white max-w-md mx-auto">
  <div class="flex items-center justify-between px-4 pt-5 pb-1">
    <span class="text-lg font-bold tracking-tight">habitus</span>
    <UserButton />
  </div>

  <PillNav />

  <div class="flex-1 overflow-hidden">
    {#if $activeView === "tracker"}
      <TrackerView />
    {:else if $activeView === "habits"}
      <HabitsView />
    {:else}
      <StatsView />
    {/if}
  </div>
</div>
```

- [ ] **Step 5: Create root page**

Replace `src/routes/+page.svelte`:

```svelte
<script lang="ts">
  import { SignIn, SignedIn, SignedOut } from "@clerk/sveltekit";
  import AppShell from "$lib/components/AppShell.svelte";
</script>

<SignedOut>
  <div class="flex items-center justify-center min-h-dvh bg-[#111]">
    <div class="flex flex-col items-center gap-6">
      <h1 class="text-3xl font-bold text-white tracking-tight">habitus</h1>
      <SignIn />
    </div>
  </div>
</SignedOut>

<SignedIn>
  <AppShell />
</SignedIn>
```

- [ ] **Step 6: Verify in browser**

```bash
npm run dev
```

Open http://localhost:5173. Expected:
- Unauthenticated: Clerk sign-in form with "habitus" title above it
- After signing in: app shell with pill nav, placeholder view text

- [ ] **Step 7: Commit**

```bash
git add src/lib/stores/ui.ts src/lib/components/PillNav.svelte src/lib/components/AppShell.svelte src/lib/components/TrackerView.svelte src/lib/components/HabitsView.svelte src/lib/components/StatsView.svelte src/routes/+page.svelte
git commit -m "feat: UI store, PillNav, AppShell, root page with Clerk sign-in"
```

---

## Task 10: HabitCell + NoteSheet

**Files:**
- Modify: `src/lib/components/HabitCell.svelte`, `src/lib/components/NoteSheet.svelte`

- [ ] **Step 1: Create NoteSheet**

Create `src/lib/components/NoteSheet.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { convex } from "$lib/convex";
  import { api } from "$lib/convex-api";

  export let habitId: string;
  export let date: string;
  export let existingNote: string = "";

  const dispatch = createEventDispatcher<{ close: void }>();
  let note = existingNote;

  async function save() {
    await convex.mutation(api.entries.setNote, { habitId: habitId as any, date, note });
    dispatch("close");
  }

  function onBackdropKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") dispatch("close");
  }
</script>

<!-- Backdrop -->
<div
  class="fixed inset-0 bg-black/60 z-40"
  on:click={() => dispatch("close")}
  on:keydown={onBackdropKeydown}
  role="button"
  tabindex="-1"
  aria-label="Close note sheet"
/>

<!-- Bottom sheet -->
<div class="fixed bottom-0 inset-x-0 z-50 bg-[#1e1e1e] rounded-t-2xl p-5 max-w-md mx-auto">
  <div class="w-8 h-1 bg-[#444] rounded-full mx-auto mb-4" />
  <p class="text-sm font-semibold text-white mb-3">Add a note</p>
  <textarea
    class="w-full bg-[#111] text-white text-sm rounded-xl p-3 resize-none border border-[#333] focus:outline-none focus:border-[#555] h-24"
    placeholder="How did it go?"
    bind:value={note}
    autofocus
  />
  <div class="flex gap-2 mt-3">
    <button
      class="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold"
      on:click={save}
    >Save</button>
    <button
      class="px-4 py-2.5 rounded-xl bg-[#333] text-[#aaa] text-sm"
      on:click={() => dispatch("close")}
    >Cancel</button>
  </div>
</div>
```

- [ ] **Step 2: Create HabitCell**

Create `src/lib/components/HabitCell.svelte`:

```svelte
<script lang="ts">
  import { convex } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import NoteSheet from "./NoteSheet.svelte";

  export let habitId: string;
  export let date: string;
  export let done: boolean = false;
  export let note: string | undefined = undefined;
  export let isToday: boolean = false;

  let showNoteSheet = false;
  let longPressTimer: ReturnType<typeof setTimeout> | undefined;

  function onPointerDown() {
    longPressTimer = setTimeout(() => {
      showNoteSheet = true;
      longPressTimer = undefined;
    }, 500);
  }

  function onPointerUp() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = undefined;
    }
  }

  async function onTap() {
    if (showNoteSheet) return; // long-press already fired
    await convex.mutation(api.entries.toggle, { habitId: habitId as any, date });
  }
</script>

<button
  class="w-full aspect-square rounded-sm flex items-center justify-center relative
    transition-transform duration-75 active:scale-90
    {done
      ? 'bg-[#22c55e]'
      : isToday
        ? 'border border-dashed border-[#555] bg-transparent'
        : 'bg-[#1a1a1a]'}"
  on:pointerdown={onPointerDown}
  on:pointerup={onPointerUp}
  on:pointerleave={onPointerUp}
  on:click={onTap}
  aria-label="{done ? 'Done' : 'Not done'} for {date}"
>
  {#if note && done}
    <!-- Small dot indicating a note exists -->
    <span class="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white/60 rounded-full" />
  {/if}
</button>

{#if showNoteSheet}
  <NoteSheet
    {habitId}
    {date}
    existingNote={note ?? ""}
    on:close={() => (showNoteSheet = false)}
  />
{/if}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/HabitCell.svelte src/lib/components/NoteSheet.svelte
git commit -m "feat: HabitCell (tap toggle, long-press note) + NoteSheet bottom sheet"
```

---

## Task 11: TrackerView

**Files:**
- Modify: `src/lib/components/TrackerView.svelte`

- [ ] **Step 1: Implement**

Replace `src/lib/components/TrackerView.svelte`:

```svelte
<script lang="ts">
  import { activeMonth } from "$lib/stores/ui";
  import { useQuery } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import {
    getMonthDays,
    formatMonthLabel,
    prevMonth,
    nextMonth,
    toLocalDateString,
  } from "$lib/utils/dates";
  import HabitCell from "./HabitCell.svelte";

  $: habits$ = useQuery(api.habits.listActive);

  // View mode: "month" (default) or "year" (lazy-loaded full grid)
  let viewMode: "month" | "year" = "month";

  $: entries$ = viewMode === "month"
    ? useQuery(api.entries.byMonth, { month: $activeMonth })
    : useQuery(api.entries.byYear, { year: $activeMonth.slice(0, 4) });

  $: days = viewMode === "month"
    ? getMonthDays($activeMonth)
    : getAllYearDays($activeMonth.slice(0, 4));

  $: today = toLocalDateString();

  // O(1) lookup: "habitId:date" → entry
  $: entryMap = new Map(
    ($entries$ ?? []).map((e) => [`${e.habitId}:${e.date}`, e])
  );

  function getAllYearDays(year: string): string[] {
    const result: string[] = [];
    for (let m = 1; m <= 12; m++) {
      const month = `${year}-${String(m).padStart(2, "0")}`;
      const daysInMonth = new Date(Number(year), m, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        result.push(`${month}-${String(d).padStart(2, "0")}`);
      }
    }
    return result;
  }
</script>

<div class="flex flex-col h-full">
  <!-- Navigation bar -->
  <div class="flex items-center justify-between px-4 pb-2 gap-2">
    {#if viewMode === "month"}
      <button
        class="text-[#555] p-1 text-xl hover:text-white transition-colors"
        on:click={() => activeMonth.update(prevMonth)}
        aria-label="Previous month"
      >‹</button>
      <span class="text-sm font-medium text-[#aaa] flex-1 text-center">
        {formatMonthLabel($activeMonth)}
      </span>
      <button
        class="text-[#555] p-1 text-xl hover:text-white transition-colors"
        on:click={() => activeMonth.update(nextMonth)}
        aria-label="Next month"
      >›</button>
    {:else}
      <span class="text-sm font-medium text-[#aaa] flex-1">
        {$activeMonth.slice(0, 4)} — full year
      </span>
    {/if}
    <button
      class="text-xs text-[#555] hover:text-white transition-colors px-2 py-1 rounded-lg bg-[#1a1a1a]"
      on:click={() => (viewMode = viewMode === "month" ? "year" : "month")}
    >
      {viewMode === "month" ? "Year" : "Month"}
    </button>
  </div>

  {#if !$habits$ || !$entries$}
    <div class="flex-1 flex items-center justify-center text-[#555] text-sm">Loading...</div>
  {:else if $habits$.length === 0}
    <div class="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
      <p class="text-[#666] text-sm">No habits yet.</p>
      <p class="text-[#444] text-xs">Switch to Habits to add your first one.</p>
    </div>
  {:else}
    <!-- Horizontally scrollable table -->
    <div class="flex-1 overflow-auto px-4 pb-4">
      <table class="border-collapse text-xs w-full">
        <thead class="sticky top-0 bg-[#111] z-10">
          <tr>
            <th class="text-left text-[#555] font-normal py-1 pr-3 w-16 min-w-[64px]" />
            {#each $habits$ as habit}
              <th
                class="text-center text-[#555] font-normal py-1 px-0.5 min-w-[36px]"
                title={habit.name}
              >
                <span class="block text-base leading-none">{habit.icon}</span>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each days as date}
            {@const isToday = date === today}
            <tr>
              <td
                class="py-0.5 pr-3 tabular-nums
                  {isToday ? 'text-white font-semibold' : 'text-[#555]'}"
              >
                {date.slice(5)}
              </td>
              {#each $habits$ as habit}
                {@const entry = entryMap.get(`${habit._id}:${date}`)}
                <td class="py-0.5 px-0.5">
                  <HabitCell
                    habitId={habit._id}
                    {date}
                    done={entry?.done ?? false}
                    note={entry?.note}
                    {isToday}
                  />
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Sign in. With no habits: "No habits yet." message. Create a habit via Habits tab (placeholder), then return — column should appear. Tap cells to toggle green. Long-press opens note sheet.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/TrackerView.svelte
git commit -m "feat: TrackerView — reactive month table with tap/long-press per cell"
```

---

## Task 12: HabitsView + HabitForm + CategoryBadge

**Files:**
- Create: `src/lib/components/CategoryBadge.svelte`, `src/lib/components/HabitForm.svelte`
- Modify: `src/lib/components/HabitsView.svelte`

- [ ] **Step 1: Create CategoryBadge**

Create `src/lib/components/CategoryBadge.svelte`:

```svelte
<script lang="ts">
  export let name: string;
  export let color: string;
</script>

<span
  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
  style="background-color: {color}22; color: {color};"
>
  {name}
</span>
```

- [ ] **Step 2: Create HabitForm**

Create `src/lib/components/HabitForm.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { convex } from "$lib/convex";
  import { useQuery } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import type { Id } from "../../convex/_generated/dataModel";

  export let habit: {
    _id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    categories: string[];
  } | null = null;

  const dispatch = createEventDispatcher<{ close: void }>();
  const categories$ = useQuery(api.categories.list);

  let name = habit?.name ?? "";
  let description = habit?.description ?? "";
  let color = habit?.color ?? "#22c55e";
  let icon = habit?.icon ?? "⭐";
  let selectedCategories: string[] = [...(habit?.categories ?? [])];

  const COLORS = ["#22c55e","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];
  const ICONS  = ["⭐","🏃","📚","💪","🧘","💧","🎯","✍️","🎵","🌱","😴","🥗"];

  function toggleCategory(id: string) {
    selectedCategories = selectedCategories.includes(id)
      ? selectedCategories.filter((c) => c !== id)
      : [...selectedCategories, id];
  }

  async function save() {
    if (!name.trim()) return;
    const args = {
      name: name.trim(),
      description,
      color,
      icon,
      categories: selectedCategories as Id<"categories">[],
    };
    if (habit) {
      await convex.mutation(api.habits.update, { id: habit._id as Id<"habits">, ...args });
    } else {
      await convex.mutation(api.habits.create, args);
    }
    dispatch("close");
  }

  function onBackdropKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") dispatch("close");
  }
</script>

<div
  class="fixed inset-0 bg-black/60 z-40"
  on:click={() => dispatch("close")}
  on:keydown={onBackdropKeydown}
  role="button"
  tabindex="-1"
  aria-label="Close form"
/>

<div class="fixed bottom-0 inset-x-0 z-50 bg-[#1e1e1e] rounded-t-2xl p-5 max-w-md mx-auto max-h-[90dvh] overflow-y-auto">
  <div class="w-8 h-1 bg-[#444] rounded-full mx-auto mb-4" />
  <h2 class="text-base font-semibold text-white mb-4">{habit ? "Edit habit" : "New habit"}</h2>

  <label class="block text-xs text-[#666] mb-1">Name</label>
  <input
    class="w-full bg-[#111] text-white text-sm rounded-xl px-3 py-2.5 border border-[#333] focus:outline-none focus:border-[#555] mb-4"
    placeholder="Morning run"
    bind:value={name}
    autofocus
  />

  <label class="block text-xs text-[#666] mb-1">Description</label>
  <input
    class="w-full bg-[#111] text-white text-sm rounded-xl px-3 py-2.5 border border-[#333] focus:outline-none focus:border-[#555] mb-4"
    placeholder="Optional notes"
    bind:value={description}
  />

  <label class="block text-xs text-[#666] mb-2">Icon</label>
  <div class="flex flex-wrap gap-2 mb-4">
    {#each ICONS as i}
      <button
        class="w-9 h-9 rounded-lg text-lg flex items-center justify-center
          {icon === i ? 'bg-[#333] ring-2 ring-white' : 'bg-[#1a1a1a]'}"
        on:click={() => (icon = i)}
        type="button"
      >{i}</button>
    {/each}
  </div>

  <label class="block text-xs text-[#666] mb-2">Color</label>
  <div class="flex gap-2 mb-4 flex-wrap">
    {#each COLORS as c}
      <button
        class="w-7 h-7 rounded-full transition-shadow
          {color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e]' : ''}"
        style="background-color: {c}"
        on:click={() => (color = c)}
        type="button"
        aria-label="Select color {c}"
      />
    {/each}
  </div>

  {#if $categories$ && $categories$.length > 0}
    <label class="block text-xs text-[#666] mb-2">Categories</label>
    <div class="flex flex-wrap gap-2 mb-4">
      {#each $categories$ as cat}
        <button
          class="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
          style="{selectedCategories.includes(cat._id)
            ? `background-color:${cat.color}33;color:${cat.color};border-color:${cat.color}55`
            : 'border-color:#333;color:#666'}"
          on:click={() => toggleCategory(cat._id)}
          type="button"
        >{cat.name}</button>
      {/each}
    </div>
  {/if}

  <button
    class="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40 mt-1"
    on:click={save}
    type="button"
    disabled={!name.trim()}
  >
    {habit ? "Save changes" : "Add habit"}
  </button>
</div>
```

- [ ] **Step 3: Implement HabitsView**

Replace `src/lib/components/HabitsView.svelte`:

```svelte
<script lang="ts">
  import { useQuery } from "$lib/convex";
  import { convex } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import HabitForm from "./HabitForm.svelte";
  import CategoryBadge from "./CategoryBadge.svelte";
  import type { Id } from "../../convex/_generated/dataModel";

  const habits$ = useQuery(api.habits.listActive);
  const categories$ = useQuery(api.categories.list);

  let showForm = false;
  let editingHabit: any = null;

  $: categoryMap = new Map(($categories$ ?? []).map((c) => [c._id, c]));

  async function archive(id: string) {
    if (confirm("Archive this habit? Its history will be preserved.")) {
      await convex.mutation(api.habits.archive, { id: id as Id<"habits"> });
    }
  }
</script>

<div class="flex flex-col h-full overflow-hidden">
  <div class="flex-1 overflow-y-auto px-4 pb-24">
    {#if !$habits$}
      <div class="flex items-center justify-center h-32 text-[#555] text-sm">Loading...</div>
    {:else if $habits$.length === 0}
      <div class="flex flex-col items-center justify-center h-48 gap-2 text-center">
        <p class="text-[#666] text-sm">No habits yet.</p>
        <p class="text-[#444] text-xs">Tap + to create your first one.</p>
      </div>
    {:else}
      <ul class="divide-y divide-[#1a1a1a]">
        {#each $habits$ as habit}
          <li class="py-3 flex items-center gap-3">
            <span
              class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style="background-color: {habit.color}22;"
            >{habit.icon}</span>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">{habit.name}</p>
              {#if habit.categories.length > 0}
                <div class="flex gap-1 mt-0.5 flex-wrap">
                  {#each habit.categories as catId}
                    {@const cat = categoryMap.get(catId)}
                    {#if cat}
                      <CategoryBadge name={cat.name} color={cat.color} />
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button
                class="text-xs text-[#555] hover:text-white px-2 py-1 transition-colors"
                on:click={() => { editingHabit = habit; showForm = true; }}
              >Edit</button>
              <button
                class="text-xs text-[#555] hover:text-[#ef4444] px-2 py-1 transition-colors"
                on:click={() => archive(habit._id)}
              >Archive</button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<!-- FAB -->
<button
  class="fixed bottom-6 right-1/2 translate-x-1/2 w-12 h-12 rounded-full bg-white text-black text-2xl flex items-center justify-center shadow-xl z-30"
  on:click={() => { editingHabit = null; showForm = true; }}
  aria-label="Add habit"
>+</button>

{#if showForm}
  <HabitForm
    habit={editingHabit}
    on:close={() => (showForm = false)}
  />
{/if}
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Switch to Habits. Tap + → form appears. Fill in name, pick icon and color → "Add habit". Verify habit appears in list and a column appears in the Tracker tab.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/HabitsView.svelte src/lib/components/HabitForm.svelte src/lib/components/CategoryBadge.svelte
git commit -m "feat: HabitsView with habit list, create/edit sheet, archive, category badges"
```

---

## Task 13: StatsView + HabitStatCard

**Files:**
- Create: `src/lib/components/HabitStatCard.svelte`
- Modify: `src/lib/components/StatsView.svelte`

- [ ] **Step 1: Create HabitStatCard**

Create `src/lib/components/HabitStatCard.svelte`:

```svelte
<script lang="ts">
  import { useQuery } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import type { Id } from "../../convex/_generated/dataModel";

  export let habit: { _id: string; name: string; icon: string; color: string };
  export let year: string;

  $: stats$ = useQuery(api.stats.forHabit, {
    habitId: habit._id as Id<"habits">,
    year,
  });
</script>

<li class="bg-[#1a1a1a] rounded-2xl p-4">
  <div class="flex items-center gap-3 mb-3">
    <span
      class="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
      style="background-color: {habit.color}22;"
    >{habit.icon}</span>
    <span class="text-sm font-medium text-white truncate">{habit.name}</span>
  </div>

  {#if !$stats$}
    <div class="text-xs text-[#555]">Loading...</div>
  {:else}
    <div class="grid grid-cols-3 gap-2 text-center">
      <div>
        <p class="text-xl font-bold text-white tabular-nums">{$stats$.currentStreak}</p>
        <p class="text-[10px] text-[#555] mt-0.5 uppercase tracking-wide">streak</p>
      </div>
      <div>
        <p class="text-xl font-bold text-white tabular-nums">{$stats$.longestStreak}</p>
        <p class="text-[10px] text-[#555] mt-0.5 uppercase tracking-wide">best</p>
      </div>
      <div>
        <p class="text-xl font-bold tabular-nums" style="color: {habit.color}">
          {$stats$.completionRate}%
        </p>
        <p class="text-[10px] text-[#555] mt-0.5 uppercase tracking-wide">this year</p>
      </div>
    </div>
  {/if}
</li>
```

- [ ] **Step 2: Implement StatsView**

Replace `src/lib/components/StatsView.svelte`:

```svelte
<script lang="ts">
  import { useQuery } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import HabitStatCard from "./HabitStatCard.svelte";

  const habits$ = useQuery(api.habits.listActive);
  const year = String(new Date().getFullYear());
</script>

<div class="flex flex-col h-full overflow-y-auto px-4 pb-6">
  <p class="text-xs text-[#555] mb-4 pt-1">{year} overview</p>

  {#if !$habits$}
    <div class="flex items-center justify-center h-32 text-[#555] text-sm">Loading...</div>
  {:else if $habits$.length === 0}
    <div class="flex items-center justify-center h-48 text-[#555] text-sm">
      No habits to show stats for.
    </div>
  {:else}
    <ul class="flex flex-col gap-3">
      {#each $habits$ as habit}
        <HabitStatCard {habit} {year} />
      {/each}
    </ul>
  {/if}
</div>
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Log some entries in Tracker. Switch to Stats — cards should show per-habit streaks and completion rate.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/StatsView.svelte src/lib/components/HabitStatCard.svelte
git commit -m "feat: StatsView with per-habit streak and completion rate cards"
```

---

## Task 14: Run all tests + deploy to Vercel

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json**

Create `vercel.json`:

```json
{
  "framework": "sveltekit"
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass. Fix any failures before proceeding.

- [ ] **Step 3: Build locally to catch type errors**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Deploy Convex to production**

```bash
npx convex deploy
```

Expected: "Deployment deployed successfully." Note the production CONVEX_URL printed.

- [ ] **Step 5: Deploy to Vercel**

```bash
npx vercel --prod
```

When prompted, set these environment variables in the Vercel dashboard (Settings → Environment Variables):
- `PUBLIC_CONVEX_URL` — the production Convex URL from step 4
- `PUBLIC_CLERK_PUBLISHABLE_KEY` — from Clerk dashboard
- `CLERK_SECRET_KEY` — from Clerk dashboard

- [ ] **Step 6: Smoke-test the production deploy**

Open the Vercel URL. Verify:
1. Sign-in page loads
2. Sign in with Clerk
3. Create a habit
4. Log entries in Tracker
5. Check Stats shows streaks

- [ ] **Step 7: Final commit**

```bash
git add vercel.json
git commit -m "feat: add vercel.json, all tasks complete"
```

---

## Verification Checklist

- [ ] `npx vitest run` — all tests green (habits, entries, stats, date utils)
- [ ] Sign-in page shows Clerk form; unauthenticated users cannot access data
- [ ] Create a habit → appears in Habit list and Tracker column
- [ ] Tap Tracker cell → turns green (done), tap again → reverts (deleted)
- [ ] Long-press cell → note sheet opens, save → white dot appears on cell
- [ ] Month nav arrows → rows update to correct month
- [ ] Stats tab shows current streak, best streak, completion % per habit
- [ ] Two different Clerk users see only their own habits and entries
- [ ] Production Vercel deploy fully functional
