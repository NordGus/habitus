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
