# TanStack Start Migration Design Spec

**Date:** 2026-04-24
**Status:** Approved

---

## Overview

Migrate the Habitus frontend from SvelteKit + Svelte to TanStack Start + React, keeping the Convex backend (`convex/`) completely unchanged. The app features, data model, and UI design remain identical. This is a pure frontend framework swap.

---

## What Changes vs. What Stays

| Layer | Status |
|---|---|
| `convex/` (schema, functions, tests) | **Unchanged** |
| `docs/` | **Unchanged** |
| `vercel.json` | **Unchanged** |
| `src/` (all Svelte files) | **Deleted** |
| `svelte-clerk`, `@sveltejs/kit`, `svelte` | **Removed** |
| New: `app/` directory | **Created** |
| New: React components, TanStack Router routes | **Created** |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start |
| Router | TanStack Router (file-based) |
| UI | React 19 + TypeScript |
| Auth | `@clerk/tanstack-react-start` |
| Convex auth bridge | `@clerk/convex` (`ConvexProviderWithClerk`) |
| Convex React | `convex/react` (`useQuery`, `useMutation`, `useConvexAuth`) |
| Styling | Tailwind CSS v4 (unchanged) |
| Tests | Vitest (unchanged) |
| Deployment | Vercel (unchanged) |

---

## File Structure

```
app/
├── routes/
│   ├── __root.tsx            — HTML shell, ClerkProvider, ConvexProviderWithClerk
│   ├── index.tsx             — redirects to /tracker (auth guard handled in _app layout)
│   └── _app/
│       ├── route.tsx         — authenticated layout: redirects to sign-in if unauthed, renders AppShell
│       ├── tracker.tsx       — TrackerView page
│       ├── habits.tsx        — HabitsView page
│       └── stats.tsx         — StatsView page
├── components/
│   ├── AppShell.tsx          — header + PillNav + <Outlet />
│   ├── PillNav.tsx           — tab links using TanStack <Link> to /tracker, /habits, /stats
│   ├── TrackerView.tsx       — month/year table
│   ├── HabitCell.tsx         — tap toggle, long-press note
│   ├── NoteSheet.tsx         — bottom sheet for notes
│   ├── HabitsView.tsx        — habit list with FAB
│   ├── HabitForm.tsx         — create/edit bottom sheet
│   ├── CategoryBadge.tsx     — category pill
│   ├── StatsView.tsx         — stats list
│   └── HabitStatCard.tsx     — per-habit stats card
├── utils/
│   └── dates.ts              — identical logic to src/lib/utils/dates.ts (moved, not rewritten)
└── utils/
    └── dates.test.ts         — identical tests (moved)
```

---

## Routing & State

**Views as routes** (replaces Svelte `activeView` store):
- `/tracker` — TrackerView
- `/habits` — HabitsView
- `/stats` — StatsView
- PillNav uses TanStack `<Link>` for navigation. Active tab detected with `useRouterState` or `useMatch`.

**Active month as URL search param** (replaces Svelte `activeMonth` store):
- `/tracker?month=2026-04`
- TrackerView reads `month` from search params via TanStack Router's `validateSearch` / `useSearch`
- Prev/next month buttons update the search param
- Defaults to current month if param absent
- Bookmarkable and shareable

---

## Auth Flow

```
__root.tsx
  └── ClerkProvider (publishableKey from env)
        └── ConvexProviderWithClerk (convexUrl from env, uses Clerk JWT template "convex")
              └── _app/route.tsx
                    → if !isSignedIn → redirect to sign-in page
                    → if isSignedIn → render AppShell + <Outlet />
```

- `@clerk/tanstack-react-start` provides `<ClerkProvider>`, `<SignIn />`, `useAuth`, `useUser`
- `@clerk/convex` provides `ConvexProviderWithClerk` — handles JWT wiring automatically, no manual `setAuth` needed
- Timezone upsert (`userPreferences.upsert`) called once on sign-in inside `_app/route.tsx` using a `useEffect`

---

## Component Mapping (Svelte → React)

| Svelte | React equivalent |
|---|---|
| `{#if}` / `{:else}` | `{condition ? <A /> : <B />}` |
| `{#each}` | `.map()` |
| `on:click` | `onClick` |
| `on:pointerdown` | `onPointerDown` |
| `bind:value` | `value` + `onChange` |
| `export let prop` | function props |
| `createEventDispatcher` | callback props (`onClose`, etc.) |
| `$store` | hook return value |
| `svelte/store writable` | `useState` / `useRef` |
| `useQuery` (custom store) | `useQuery` from `convex/react` |
| `convex.mutation(...)` | `useMutation` from `convex/react` |
| Long-press: `setTimeout` on `onPointerDown` | Same pattern in React |

---

## Dependencies

**Remove:**
```
svelte, @sveltejs/kit, @sveltejs/adapter-vercel, @sveltejs/adapter-auto,
@sveltejs/vite-plugin-svelte, svelte-clerk, svelte-check
```

**Add:**
```
react, react-dom
@tanstack/react-start, @tanstack/react-router
@clerk/tanstack-react-start, @clerk/convex
@types/react, @types/react-dom
```

**Unchanged:**
```
convex, convex-test, tailwindcss, @tailwindcss/vite, typescript, vitest
```

---

## Vite / Build Config

TanStack Start uses its own Vite plugin (`@tanstack/react-start/plugin`). The `vite.config.ts` replaces the SvelteKit plugin with the TanStack Start plugin. Tailwind stays as-is via `@tailwindcss/vite`.

---

## Tests

- `convex/*.test.ts` — **unchanged**, run with `npx vitest run convex/`
- `app/utils/dates.test.ts` — moved from `src/lib/utils/dates.test.ts`, same content
- No React component tests in scope for this migration (adding them is future work)

---

## Out of Scope

- Changing any app features or UI design
- Adding React-specific features (Suspense boundaries, error boundaries beyond basics)
- Component tests for React components
- SSR (TanStack Start supports it but we remain CSR-first, same as before)
