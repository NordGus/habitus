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
