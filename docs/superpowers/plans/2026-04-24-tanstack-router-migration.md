# TanStack Router Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Habitus frontend from SvelteKit + Svelte to TanStack Router + React, keeping the Convex backend (`convex/`) completely unchanged.

**Architecture:** Delete `src/` and replace with `app/` containing TanStack Router file-based routes and React components. `__root.tsx` wraps the entire tree with `ClerkProvider` and `ConvexProviderWithClerk`. The `_app` pathless layout route in `_app/route.tsx` guards auth: unauthenticated users see the Clerk `<SignIn />` component; authenticated users see the `AppShell` + child route via `<Outlet />`. Navigation state (active tab) is encoded in the URL route; active month is a URL search param (`/tracker?month=2026-04`). All Convex data is fetched via `useQuery`/`useMutation` hooks from `convex/react`; JWT wiring is automatic via `@clerk/convex`'s `ConvexProviderWithClerk`.

**Tech Stack:** React 19, `@tanstack/react-router` v1 + `@tanstack/router-plugin` (file-based routing Vite plugin), `@vitejs/plugin-react`, `@clerk/react`, `@clerk/convex`, Tailwind CSS v4, Convex, Vitest

---

## File Map

### New files to create

- `index.html` — Vite entry HTML (replaces `src/app.html`)
- `favicon.svg` — copied from `src/lib/assets/favicon.svg`
- `vite.config.ts` — TanStack Router plugin + React plugin + Tailwind (replaces SvelteKit config)
- `tsconfig.json` — React JSX compiler options (replaces .svelte-kit generated tsconfig)
- `vitest.config.ts` — node environment, covers `convex/**` and `app/utils/**` tests
- `app/styles.css` — global CSS (same content as `src/app.css`)
- `app/main.tsx` — React entry point: `ReactDOM.createRoot` + `RouterProvider`
- `app/router.tsx` — creates TanStack Router from auto-generated route tree
- `app/routes/__root.tsx` — ClerkProvider + ConvexProviderWithClerk + html shell + `<Outlet />`
- `app/routes/index.tsx` — redirects `/` → `/tracker`
- `app/routes/_app/route.tsx` — auth guard + timezone upsert + renders AppShell or SignIn
- `app/routes/_app/tracker.tsx` — registers `/tracker` route with `month` search param, renders TrackerView
- `app/routes/_app/habits.tsx` — registers `/habits` route, renders HabitsView
- `app/routes/_app/stats.tsx` — registers `/stats` route, renders StatsView
- `app/components/AppShell.tsx` — header + PillNav + `<Outlet />`
- `app/components/PillNav.tsx` — tab links with active detection via `useRouterState`
- `app/components/TrackerView.tsx` — month/year table; reads month from search params
- `app/components/HabitCell.tsx` — tap toggle, 500ms long-press → NoteSheet
- `app/components/NoteSheet.tsx` — bottom sheet for note add/edit
- `app/components/HabitsView.tsx` — habit list with FAB, archive
- `app/components/HabitForm.tsx` — create/edit bottom sheet
- `app/components/CategoryBadge.tsx` — category pill
- `app/components/StatsView.tsx` — per-habit stat cards list
- `app/components/HabitStatCard.tsx` — streak + completion card
- `app/utils/dates.ts` — moved from `src/lib/utils/dates.ts` (identical)
- `app/utils/dates.test.ts` — moved from `src/lib/utils/dates.test.ts` (import path updated)

### Files to delete

- `src/` — entire directory
- `svelte.config.js`
- `src/app.d.ts`, `src/hooks.server.ts` (already under `src/`)

### Files to modify

- `package.json` — swap Svelte deps for React + TanStack deps
- `.env.local` — rename `PUBLIC_` prefix to `VITE_`, remove `CLERK_SECRET_KEY`
- `vercel.json` — remove `"framework": "sveltekit"`, use `"framework": "vite"`
- `.gitignore` — remove `.svelte-kit/`

---

## Task 1: Package swap + tooling config

**Files:**
- Modify: `package.json`
- Modify: `.env.local`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `favicon.svg`

- [ ] **Step 1: Remove Svelte packages**

```bash
cd /var/home/gus/Development/habitus
npm remove @sveltejs/adapter-auto @sveltejs/adapter-vercel @sveltejs/kit @sveltejs/vite-plugin-svelte svelte svelte-check svelte-clerk
```

Expected: packages removed, no errors about missing packages.

- [ ] **Step 2: Install React + TanStack Router + Clerk packages**

```bash
npm install react react-dom @tanstack/react-router @clerk/react @clerk/convex
npm install -D @types/react @types/react-dom @vitejs/plugin-react @tanstack/router-plugin
```

Expected: all packages installed successfully.

- [ ] **Step 3: Write vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
});
```

- [ ] **Step 4: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["app", "convex", "*.ts"]
}
```

- [ ] **Step 5: Write vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["convex/**/*.test.ts", "app/utils/**/*.test.ts"],
  },
});
```

- [ ] **Step 6: Write index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>habitus</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/app/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Copy favicon**

```bash
cp src/lib/assets/favicon.svg favicon.svg
```

- [ ] **Step 8: Update .env.local**

The env variable prefix changes from `PUBLIC_` (SvelteKit) to `VITE_` (Vite). Open `.env.local` and change:

```
VITE_CONVEX_URL=<same value as PUBLIC_CONVEX_URL was>
VITE_CLERK_PUBLISHABLE_KEY=<same value as PUBLIC_CLERK_PUBLISHABLE_KEY was>
```

Remove the old `PUBLIC_CONVEX_URL`, `PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY` lines. `CLERK_SECRET_KEY` is no longer needed — there's no server-side Clerk hook in the React version.

- [ ] **Step 9: Run existing Convex tests to verify they still pass**

```bash
npx vitest run convex/
```

Expected: all 10 Convex tests pass (habits, entries, stats). If any fail, the vitest.config.ts node environment setup has an issue.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json vitest.config.ts index.html favicon.svg .env.local
git commit -m "chore: swap Svelte for React + TanStack Router, update build config"
```

---

## Task 2: Date utilities + app entry point

**Files:**
- Create: `app/utils/dates.ts`
- Create: `app/utils/dates.test.ts`
- Create: `app/styles.css`
- Create: `app/router.tsx`
- Create: `app/main.tsx`

- [ ] **Step 1: Create app/utils/dates.ts**

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

- [ ] **Step 2: Create app/utils/dates.test.ts**

```typescript
import { expect, test } from "vitest";
import {
  toLocalDateString,
  getMonthDays,
  formatMonthLabel,
  prevMonth,
  nextMonth,
  currentMonth,
} from "./dates";

test("toLocalDateString returns YYYY-MM-DD in local time", () => {
  const date = new Date(2026, 3, 23);
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

- [ ] **Step 3: Run date tests — verify pass**

```bash
npx vitest run app/utils/dates.test.ts
```

Expected: PASS — 9 tests green.

- [ ] **Step 4: Create app/styles.css**

```css
@import "tailwindcss";

:root { color-scheme: dark; }

html, body {
  @apply bg-[#111] text-white h-full;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
```

- [ ] **Step 5: Create app/router.tsx**

```typescript
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

Note: `routeTree.gen.ts` is auto-generated by the TanStack Router Vite plugin when `vite dev` or `vite build` runs. It does not exist yet — that is expected.

- [ ] **Step 6: Create app/main.tsx**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
```

- [ ] **Step 7: Commit**

```bash
git add app/utils/dates.ts app/utils/dates.test.ts app/styles.css app/router.tsx app/main.tsx
git commit -m "feat: date utilities, global styles, router entry point"
```

---

## Task 3: Root route + providers + index redirect

**Files:**
- Create: `app/routes/__root.tsx`
- Create: `app/routes/index.tsx`

- [ ] **Step 1: Create app/routes/__root.tsx**

This is the root of the route tree. It wraps the entire app with Clerk and Convex providers, imports global styles, and renders the HTML document shell.

```tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ClerkProvider } from "@clerk/react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "@clerk/convex";
import { useAuth } from "@clerk/react";
import "../styles.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);

function RootComponent() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Outlet />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
```

- [ ] **Step 2: Create app/routes/index.tsx**

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/tracker" });
  },
  component: () => null,
});
```

- [ ] **Step 3: Commit**

```bash
git add app/routes/__root.tsx app/routes/index.tsx
git commit -m "feat: root route with ClerkProvider + ConvexProviderWithClerk, index redirect"
```

---

## Task 4: Authenticated layout + AppShell + PillNav + placeholder pages

**Files:**
- Create: `app/routes/_app/route.tsx`
- Create: `app/components/AppShell.tsx`
- Create: `app/components/PillNav.tsx`
- Create: `app/routes/_app/tracker.tsx`
- Create: `app/routes/_app/habits.tsx`
- Create: `app/routes/_app/stats.tsx`

- [ ] **Step 1: Create app/routes/_app/route.tsx**

This is a pathless layout route (the `_app` prefix doesn't appear in the URL). It checks Clerk auth: shows `<SignIn />` if not signed in, otherwise renders `AppShell` (which renders child routes via `<Outlet />`). It also upserts the user's timezone once on sign-in.

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SignIn, useAuth } from "@clerk/react";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import AppShell from "../../components/AppShell";

function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const upsert = useMutation(api.userPreferences.upsert);

  useEffect(() => {
    if (isSignedIn) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      upsert({ timezone: tz }).catch(() => {});
    }
  }, [isSignedIn]);

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-dvh bg-[#111]" />;
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-[#111]">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">habitus</h1>
          <SignIn />
        </div>
      </div>
    );
  }

  return <AppShell />;
}

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});
```

- [ ] **Step 2: Create app/components/AppShell.tsx**

AppShell renders the header, PillNav, and an `<Outlet />` for the current child route.

```tsx
import { Outlet } from "@tanstack/react-router";
import { UserButton } from "@clerk/react";
import PillNav from "./PillNav";

export default function AppShell() {
  return (
    <div className="flex flex-col h-dvh bg-[#111] text-white max-w-md mx-auto">
      <div className="flex items-center justify-between px-4 pt-5 pb-1">
        <span className="text-lg font-bold tracking-tight">habitus</span>
        <UserButton />
      </div>
      <PillNav />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create app/components/PillNav.tsx**

Uses TanStack Router `<Link>` with `activeProps`/`inactiveProps` for tab highlighting. The three tabs link to `/tracker`, `/habits`, `/stats`.

```tsx
import { Link } from "@tanstack/react-router";

const tabs = [
  { to: "/tracker" as const, label: "Tracker" },
  { to: "/habits" as const, label: "Habits" },
  { to: "/stats" as const, label: "Stats" },
];

const baseClass =
  "flex-1 py-1.5 text-sm font-medium rounded-full transition-colors duration-150 text-center";

export default function PillNav() {
  return (
    <div className="flex bg-[#1a1a1a] rounded-full p-1 mx-4 my-3">
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className={`${baseClass} text-[#666] hover:text-white`}
          activeProps={{ className: `${baseClass} bg-white text-black` }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create app/routes/_app/tracker.tsx**

Registers the `/tracker` route with an optional `month` search param. The component is `TrackerView` (defined in the next task). For now use a placeholder.

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/tracker")({
  validateSearch: (search: Record<string, unknown>) => ({
    month: typeof search.month === "string" ? search.month : undefined,
  }),
  component: () => (
    <div className="p-4 text-[#555] text-sm">Tracker loading...</div>
  ),
});
```

- [ ] **Step 5: Create app/routes/_app/habits.tsx**

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/habits")({
  component: () => (
    <div className="p-4 text-[#555] text-sm">Habits loading...</div>
  ),
});
```

- [ ] **Step 6: Create app/routes/_app/stats.tsx**

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/stats")({
  component: () => (
    <div className="p-4 text-[#555] text-sm">Stats loading...</div>
  ),
});
```

- [ ] **Step 7: Smoke-test in browser**

```bash
npx convex dev &
npm run dev
```

Open http://localhost:5173. Expected:
- Redirected to `/tracker`
- Clerk sign-in form with "habitus" title appears (you are not signed in)
- After signing in: AppShell shows with header + pill nav + "Tracker loading..." text
- Clicking Habits / Stats tabs navigates and shows their placeholder text
- `UserButton` appears in the header top-right

- [ ] **Step 8: Commit**

```bash
git add app/routes/_app/route.tsx app/components/AppShell.tsx app/components/PillNav.tsx app/routes/_app/tracker.tsx app/routes/_app/habits.tsx app/routes/_app/stats.tsx
git commit -m "feat: auth guard layout, AppShell, PillNav, placeholder pages"
```

---

## Task 5: NoteSheet + HabitCell

**Files:**
- Create: `app/components/NoteSheet.tsx`
- Create: `app/components/HabitCell.tsx`

- [ ] **Step 1: Create app/components/NoteSheet.tsx**

Bottom sheet with backdrop for adding/editing a cell note. Calls `api.entries.setNote` on save.

```tsx
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface Props {
  habitId: string;
  date: string;
  existingNote: string;
  onClose: () => void;
}

export default function NoteSheet({ habitId, date, existingNote, onClose }: Props) {
  const [note, setNote] = useState(existingNote);
  const setNote_ = useMutation(api.entries.setNote);

  async function save() {
    await setNote_({ habitId: habitId as Id<"habits">, date, note });
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close note sheet"
      />
      {/* Bottom sheet */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-[#1e1e1e] rounded-t-2xl p-5 max-w-md mx-auto">
        <div className="w-8 h-1 bg-[#444] rounded-full mx-auto mb-4" />
        <p className="text-sm font-semibold text-white mb-3">Add a note</p>
        <textarea
          className="w-full bg-[#111] text-white text-sm rounded-xl p-3 resize-none border border-[#333] focus:outline-none focus:border-[#555] h-24"
          placeholder="How did it go?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2 mt-3">
          <button
            className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold"
            onClick={save}
          >
            Save
          </button>
          <button
            className="px-4 py-2.5 rounded-xl bg-[#333] text-[#aaa] text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create app/components/HabitCell.tsx**

Tap toggles the entry (creates if absent, deletes if present). 500ms long-press opens the NoteSheet. A small white dot indicates a note exists on a done cell.

```tsx
import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import NoteSheet from "./NoteSheet";

interface Props {
  habitId: string;
  date: string;
  done: boolean;
  note: string | undefined;
  isToday: boolean;
}

export default function HabitCell({ habitId, date, done, note, isToday }: Props) {
  const toggle = useMutation(api.entries.toggle);
  const [showNote, setShowNote] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const longPressed = useRef(false);

  function onPointerDown() {
    longPressed.current = false;
    timerRef.current = setTimeout(() => {
      longPressed.current = true;
      setShowNote(true);
    }, 500);
  }

  function onPointerUp() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }

  function onClick() {
    if (longPressed.current) return;
    toggle({ habitId: habitId as Id<"habits">, date });
  }

  const bg = done
    ? "bg-[#22c55e]"
    : isToday
    ? "border border-dashed border-[#555] bg-transparent"
    : "bg-[#1a1a1a]";

  return (
    <>
      <button
        className={`w-full aspect-square rounded-sm flex items-center justify-center relative transition-transform duration-75 active:scale-90 ${bg}`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={onClick}
        aria-label={`${done ? "Done" : "Not done"} for ${date}`}
      >
        {note && done && (
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white/60 rounded-full" />
        )}
      </button>
      {showNote && (
        <NoteSheet
          habitId={habitId}
          date={date}
          existingNote={note ?? ""}
          onClose={() => setShowNote(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/components/NoteSheet.tsx app/components/HabitCell.tsx
git commit -m "feat: NoteSheet bottom sheet, HabitCell tap-toggle + long-press"
```

---

## Task 6: TrackerView

**Files:**
- Create: `app/components/TrackerView.tsx`
- Modify: `app/routes/_app/tracker.tsx`

- [ ] **Step 1: Create app/components/TrackerView.tsx**

Reads `month` from search params (defaults to current month). Renders a scrollable table: rows = days, columns = habits. Has prev/next month nav and a Year/Month toggle that loads all 365 days on demand.

```tsx
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useQuery, skipQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  getMonthDays,
  formatMonthLabel,
  prevMonth,
  nextMonth,
  toLocalDateString,
  currentMonth,
} from "../utils/dates";
import HabitCell from "./HabitCell";
import { useMemo, useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";

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

export default function TrackerView() {
  const search = useSearch({ from: "/_app/tracker" });
  const navigate = useNavigate({ from: "/_app/tracker" });
  const month = search.month ?? currentMonth();
  const [viewMode, setViewMode] = useState<"month" | "year">("month");

  const habits = useQuery(api.habits.listActive);
  const monthEntries = useQuery(
    api.entries.byMonth,
    viewMode === "month" ? { month } : skipQuery
  );
  const yearEntries = useQuery(
    api.entries.byYear,
    viewMode === "year" ? { year: month.slice(0, 4) } : skipQuery
  );
  const entries = viewMode === "month" ? monthEntries : yearEntries;

  const days = useMemo(
    () =>
      viewMode === "month"
        ? getMonthDays(month)
        : getAllYearDays(month.slice(0, 4)),
    [viewMode, month]
  );

  const today = toLocalDateString();

  const entryMap = useMemo(
    () =>
      new Map((entries ?? []).map((e) => [`${e.habitId}:${e.date}`, e])),
    [entries]
  );

  function setMonth(m: string) {
    navigate({ search: (prev) => ({ ...prev, month: m }) });
  }

  if (!habits || !entries) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#555] text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navigation bar */}
      <div className="flex items-center justify-between px-4 pb-2 gap-2">
        {viewMode === "month" ? (
          <>
            <button
              className="text-[#555] p-1 text-xl hover:text-white transition-colors"
              onClick={() => setMonth(prevMonth(month))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-[#aaa] flex-1 text-center">
              {formatMonthLabel(month)}
            </span>
            <button
              className="text-[#555] p-1 text-xl hover:text-white transition-colors"
              onClick={() => setMonth(nextMonth(month))}
              aria-label="Next month"
            >
              ›
            </button>
          </>
        ) : (
          <span className="text-sm font-medium text-[#aaa] flex-1">
            {month.slice(0, 4)} — full year
          </span>
        )}
        <button
          className="text-xs text-[#555] hover:text-white transition-colors px-2 py-1 rounded-lg bg-[#1a1a1a]"
          onClick={() => setViewMode(viewMode === "month" ? "year" : "month")}
        >
          {viewMode === "month" ? "Year" : "Month"}
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
          <p className="text-[#666] text-sm">No habits yet.</p>
          <p className="text-[#444] text-xs">Switch to Habits to add your first one.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 pb-4">
          <table className="border-collapse text-xs w-full">
            <thead className="sticky top-0 bg-[#111] z-10">
              <tr>
                <th className="text-left text-[#555] font-normal py-1 pr-3 w-16 min-w-[64px]" />
                {habits.map((habit) => (
                  <th
                    key={habit._id}
                    className="text-center text-[#555] font-normal py-1 px-0.5 min-w-[36px]"
                    title={habit.name}
                  >
                    <span className="block text-base leading-none">{habit.icon}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((date) => {
                const isToday = date === today;
                return (
                  <tr key={date}>
                    <td
                      className={`py-0.5 pr-3 tabular-nums ${
                        isToday ? "text-white font-semibold" : "text-[#555]"
                      }`}
                    >
                      {date.slice(5)}
                    </td>
                    {habits.map((habit) => {
                      const entry = entryMap.get(`${habit._id}:${date}`);
                      return (
                        <td key={habit._id} className="py-0.5 px-0.5">
                          <HabitCell
                            habitId={habit._id}
                            date={date}
                            done={entry?.done ?? false}
                            note={entry?.note}
                            isToday={isToday}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update app/routes/_app/tracker.tsx to use TrackerView**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import TrackerView from "../../components/TrackerView";

export const Route = createFileRoute("/_app/tracker")({
  validateSearch: (search: Record<string, unknown>) => ({
    month: typeof search.month === "string" ? search.month : undefined,
  }),
  component: TrackerView,
});
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Sign in. Tracker tab: table shows current month rows × habit columns. Tap a cell → turns green. Tap again → reverts. Long-press → note sheet opens. Previous/Next arrows change month. Year button loads all 365 rows.

- [ ] **Step 4: Commit**

```bash
git add app/components/TrackerView.tsx app/routes/_app/tracker.tsx
git commit -m "feat: TrackerView with month/year table, search param month nav"
```

---

## Task 7: CategoryBadge + HabitForm + HabitsView

**Files:**
- Create: `app/components/CategoryBadge.tsx`
- Create: `app/components/HabitForm.tsx`
- Create: `app/components/HabitsView.tsx`
- Modify: `app/routes/_app/habits.tsx`

- [ ] **Step 1: Create app/components/CategoryBadge.tsx**

```tsx
interface Props {
  name: string;
  color: string;
}

export default function CategoryBadge({ name, color }: Props) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {name}
    </span>
  );
}
```

- [ ] **Step 2: Create app/components/HabitForm.tsx**

Create/edit bottom sheet. Icon grid and color swatches for picking appearance. Category multi-select from existing categories. Calls `api.habits.create` or `api.habits.update`.

```tsx
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface HabitShape {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  categories: string[];
}

interface Props {
  habit: HabitShape | null;
  onClose: () => void;
}

const COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];
const ICONS = [
  "⭐", "🏃", "📚", "💪", "🧘", "💧",
  "🎯", "✍️", "🎵", "🌱", "😴", "🥗",
];

export default function HabitForm({ habit, onClose }: Props) {
  const categories = useQuery(api.categories.list);
  const create = useMutation(api.habits.create);
  const update = useMutation(api.habits.update);

  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [color, setColor] = useState(habit?.color ?? "#22c55e");
  const [icon, setIcon] = useState(habit?.icon ?? "⭐");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    habit?.categories ?? []
  );

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
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
      await update({ id: habit._id as Id<"habits">, ...args });
    } else {
      await create(args);
    }
    onClose();
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close form"
      />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-[#1e1e1e] rounded-t-2xl p-5 max-w-md mx-auto max-h-[90dvh] overflow-y-auto">
        <div className="w-8 h-1 bg-[#444] rounded-full mx-auto mb-4" />
        <h2 className="text-base font-semibold text-white mb-4">
          {habit ? "Edit habit" : "New habit"}
        </h2>

        <label className="block text-xs text-[#666] mb-1">Name</label>
        <input
          className="w-full bg-[#111] text-white text-sm rounded-xl px-3 py-2.5 border border-[#333] focus:outline-none focus:border-[#555] mb-4"
          placeholder="Morning run"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <label className="block text-xs text-[#666] mb-1">Description</label>
        <input
          className="w-full bg-[#111] text-white text-sm rounded-xl px-3 py-2.5 border border-[#333] focus:outline-none focus:border-[#555] mb-4"
          placeholder="Optional notes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="block text-xs text-[#666] mb-2">Icon</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center ${
                icon === i ? "bg-[#333] ring-2 ring-white" : "bg-[#1a1a1a]"
              }`}
              onClick={() => setIcon(i)}
            >
              {i}
            </button>
          ))}
        </div>

        <label className="block text-xs text-[#666] mb-2">Color</label>
        <div className="flex gap-2 mb-4 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`w-7 h-7 rounded-full transition-shadow ${
                color === c
                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e]"
                  : ""
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>

        {categories && categories.length > 0 && (
          <>
            <label className="block text-xs text-[#666] mb-2">Categories</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => {
                const active = selectedCategories.includes(cat._id);
                return (
                  <button
                    key={cat._id}
                    type="button"
                    className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                    style={
                      active
                        ? {
                            backgroundColor: `${cat.color}33`,
                            color: cat.color,
                            borderColor: `${cat.color}55`,
                          }
                        : { borderColor: "#333", color: "#666" }
                    }
                    onClick={() => toggleCategory(cat._id)}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <button
          type="button"
          className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40 mt-1"
          onClick={save}
          disabled={!name.trim()}
        >
          {habit ? "Save changes" : "Add habit"}
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Create app/components/HabitsView.tsx**

```tsx
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import HabitForm from "./HabitForm";
import CategoryBadge from "./CategoryBadge";

interface HabitShape {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  categories: string[];
}

export default function HabitsView() {
  const habits = useQuery(api.habits.listActive);
  const categories = useQuery(api.categories.list);
  const archive = useMutation(api.habits.archive);

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitShape | null>(null);

  const categoryMap = new Map((categories ?? []).map((c) => [c._id, c]));

  async function handleArchive(id: string) {
    if (window.confirm("Archive this habit? Its history will be preserved.")) {
      await archive({ id: id as Id<"habits"> });
    }
  }

  if (!habits) {
    return (
      <div className="flex items-center justify-center h-32 text-[#555] text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <p className="text-[#666] text-sm">No habits yet.</p>
            <p className="text-[#444] text-xs">Tap + to create your first one.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#1a1a1a]">
            {habits.map((habit) => (
              <li key={habit._id} className="py-3 flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${habit.color}22` }}
                >
                  {habit.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{habit.name}</p>
                  {habit.categories.length > 0 && (
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {habit.categories.map((catId) => {
                        const cat = categoryMap.get(catId);
                        return cat ? (
                          <CategoryBadge key={catId} name={cat.name} color={cat.color} />
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="text-xs text-[#555] hover:text-white px-2 py-1 transition-colors"
                    onClick={() => {
                      setEditingHabit(habit as unknown as HabitShape);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs text-[#555] hover:text-[#ef4444] px-2 py-1 transition-colors"
                    onClick={() => handleArchive(habit._id)}
                  >
                    Archive
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-6 right-1/2 translate-x-1/2 w-12 h-12 rounded-full bg-white text-black text-2xl flex items-center justify-center shadow-xl z-30"
        onClick={() => {
          setEditingHabit(null);
          setShowForm(true);
        }}
        aria-label="Add habit"
      >
        +
      </button>

      {showForm && (
        <HabitForm
          habit={editingHabit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update app/routes/_app/habits.tsx**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import HabitsView from "../../components/HabitsView";

export const Route = createFileRoute("/_app/habits")({
  component: HabitsView,
});
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Sign in. Habits tab: shows empty state and + FAB. Tap + → form slides up. Enter a name, pick icon + color → "Add habit". Habit appears in list. Tap Edit → form pre-filled. Tap Archive → confirms, habit disappears.

Back to Tracker tab: habit column now appears.

- [ ] **Step 6: Commit**

```bash
git add app/components/CategoryBadge.tsx app/components/HabitForm.tsx app/components/HabitsView.tsx app/routes/_app/habits.tsx
git commit -m "feat: HabitsView with list, create/edit form, archive, CategoryBadge"
```

---

## Task 8: StatsView + HabitStatCard

**Files:**
- Create: `app/components/HabitStatCard.tsx`
- Create: `app/components/StatsView.tsx`
- Modify: `app/routes/_app/stats.tsx`

- [ ] **Step 1: Create app/components/HabitStatCard.tsx**

Per-habit card showing current streak, best streak, and completion rate for the current year.

```tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface Props {
  habit: { _id: string; name: string; icon: string; color: string };
  year: string;
}

export default function HabitStatCard({ habit, year }: Props) {
  const stats = useQuery(api.stats.forHabit, {
    habitId: habit._id as Id<"habits">,
    year,
  });

  return (
    <li className="bg-[#1a1a1a] rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
          style={{ backgroundColor: `${habit.color}22` }}
        >
          {habit.icon}
        </span>
        <span className="text-sm font-medium text-white truncate">{habit.name}</span>
      </div>
      {!stats ? (
        <div className="text-xs text-[#555]">Loading...</div>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-bold text-white tabular-nums">{stats.currentStreak}</p>
            <p className="text-[10px] text-[#555] mt-0.5 uppercase tracking-wide">streak</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white tabular-nums">{stats.longestStreak}</p>
            <p className="text-[10px] text-[#555] mt-0.5 uppercase tracking-wide">best</p>
          </div>
          <div>
            <p
              className="text-xl font-bold tabular-nums"
              style={{ color: habit.color }}
            >
              {stats.completionRate}%
            </p>
            <p className="text-[10px] text-[#555] mt-0.5 uppercase tracking-wide">this year</p>
          </div>
        </div>
      )}
    </li>
  );
}
```

- [ ] **Step 2: Create app/components/StatsView.tsx**

```tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import HabitStatCard from "./HabitStatCard";

export default function StatsView() {
  const habits = useQuery(api.habits.listActive);
  const year = String(new Date().getFullYear());

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 pb-6">
      <p className="text-xs text-[#555] mb-4 pt-1">{year} overview</p>
      {!habits ? (
        <div className="flex items-center justify-center h-32 text-[#555] text-sm">
          Loading...
        </div>
      ) : habits.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-[#555] text-sm">
          No habits to show stats for.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {habits.map((habit) => (
            <HabitStatCard key={habit._id} habit={habit} year={year} />
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update app/routes/_app/stats.tsx**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import StatsView from "../../components/StatsView";

export const Route = createFileRoute("/_app/stats")({
  component: StatsView,
});
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Sign in. Log some entries in Tracker. Go to Stats tab — per-habit cards show current streak, best streak, completion %.

- [ ] **Step 5: Commit**

```bash
git add app/components/HabitStatCard.tsx app/components/StatsView.tsx app/routes/_app/stats.tsx
git commit -m "feat: StatsView + HabitStatCard (streak, best streak, completion %)"
```

---

## Task 9: Delete src/ + final cleanup + full test run

**Files:**
- Delete: `src/`
- Delete: `svelte.config.js`
- Modify: `vercel.json`
- Modify: `.gitignore`

- [ ] **Step 1: Run full test suite before deletion**

```bash
npx vitest run
```

Expected: all tests pass (10 Convex tests + 9 date utils tests = 19 tests green). Fix any failures before proceeding.

- [ ] **Step 2: Delete src/ directory**

```bash
rm -rf src/
```

- [ ] **Step 3: Delete svelte.config.js**

```bash
rm svelte.config.js
```

- [ ] **Step 4: Update vercel.json**

```json
{
  "framework": "vite"
}
```

- [ ] **Step 5: Update .gitignore**

Remove the `.svelte-kit/` line. Also ensure these are present:

```
node_modules/
dist/
.env.local
.superpowers/
```

- [ ] **Step 6: Run full test suite again**

```bash
npx vitest run
```

Expected: still 19 tests green. If date utils tests fail, the import path is wrong — check it resolves from `app/utils/dates.test.ts`.

- [ ] **Step 7: Build to catch TypeScript errors**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors. If the route tree (`routeTree.gen.ts`) is missing, run `npm run dev` first to let the Vite plugin generate it, then retry the build.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: remove src/ + svelte config, update vercel.json — migration complete"
```

---

## Verification Checklist

- [ ] `npx vitest run` — all tests green (10 Convex + 9 date utils)
- [ ] Sign-in page loads at `/` (redirected to `/tracker`, shows Clerk sign-in when not authenticated)
- [ ] After sign-in: AppShell renders with header + pill nav
- [ ] PillNav correctly highlights the active tab
- [ ] Create a habit → appears in Habits list and Tracker column
- [ ] Tap Tracker cell → turns green; tap again → reverts
- [ ] Long-press cell → NoteSheet opens; save → white dot on cell
- [ ] Month nav arrows → table updates to correct month
- [ ] `/tracker?month=2026-03` in URL bar → tracker shows March 2026
- [ ] Year button loads all 365 rows
- [ ] Stats tab shows current streak, best streak, completion % per habit
- [ ] Two different Clerk users see only their own habits and entries
- [ ] `npm run build` completes without errors
