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
