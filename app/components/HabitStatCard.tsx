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
