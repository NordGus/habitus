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
