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
      await ctx.db.patch(existing._id, { done: !existing.done });
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
