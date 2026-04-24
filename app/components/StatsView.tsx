import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import HabitStatCard from "./HabitStatCard";

export default function StatsView() {
  const habits = useQuery(api.habits.listActive);
  const year = String(new Date().getFullYear());

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 pb-6">
      <p className="text-xs text-[#555] mb-4 pt-1">{year} overview</p>
      {!habits ? (
        <div className="flex items-center justify-center h-32 text-[#555] text-sm">
          Loading...
        </div>
      ) : habits.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-[#555] text-sm">
          No habits to show stats for.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {habits.map((habit) => (
            <HabitStatCard key={habit._id} habit={habit} year={year} />
          ))}
        </ul>
      )}
    </div>
  );
}
