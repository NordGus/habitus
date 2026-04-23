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
