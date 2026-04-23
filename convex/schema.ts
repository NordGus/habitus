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
