import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const HABIT_ARGS = { name: "Run", description: "", color: "#fff", icon: "🏃", categories: [] as never[] };

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

test("toggle sets done=false on second tap (preserves entry for note)", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user1" });
  const habitId = await asUser.mutation(api.habits.create, HABIT_ARGS);

  await asUser.mutation(api.entries.toggle, { habitId, date: "2026-04-23" });
  await asUser.mutation(api.entries.toggle, { habitId, date: "2026-04-23" });

  const entries = await asUser.query(api.entries.byMonth, { month: "2026-04" });
  expect(entries).toHaveLength(1);
  expect(entries[0].done).toBe(false);
});

test("toggle preserves note when toggling done off", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user1" });
  const habitId = await asUser.mutation(api.habits.create, HABIT_ARGS);

  await asUser.mutation(api.entries.toggle, { habitId, date: "2026-04-23" });
  await asUser.mutation(api.entries.setNote, { habitId, date: "2026-04-23", note: "Great run!" });
  await asUser.mutation(api.entries.toggle, { habitId, date: "2026-04-23" });

  const entries = await asUser.query(api.entries.byMonth, { month: "2026-04" });
  expect(entries[0].done).toBe(false);
  expect(entries[0].note).toBe("Great run!");
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
