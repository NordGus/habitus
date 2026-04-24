import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { HabitShape } from "../types";
import HabitForm from "./HabitForm";
import CategoryBadge from "./CategoryBadge";

export default function HabitsView() {
  const habits = useQuery(api.habits.listActive);
  const categories = useQuery(api.categories.list);
  const archive = useMutation(api.habits.archive);

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitShape | null>(null);

  const categoryMap = new Map((categories ?? []).map((c) => [c._id, c]));

  async function handleArchive(id: string) {
    if (window.confirm("Archive this habit? Its history will be preserved.")) {
      await archive({ id: id as Id<"habits"> });
    }
  }

  if (!habits) {
    return (
      <div className="flex items-center justify-center h-32 text-[#555] text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <p className="text-[#666] text-sm">No habits yet.</p>
            <p className="text-[#444] text-xs">Tap + to create your first one.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#1a1a1a]">
            {habits.map((habit) => (
              <li key={habit._id} className="py-3 flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${habit.color}22` }}
                >
                  {habit.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{habit.name}</p>
                  {habit.categories.length > 0 && (
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {habit.categories.map((catId) => {
                        const cat = categoryMap.get(catId);
                        return cat ? (
                          <CategoryBadge key={catId} name={cat.name} color={cat.color} />
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="text-xs text-[#555] hover:text-white px-2 py-1 transition-colors"
                    onClick={() => {
                      setEditingHabit(habit as HabitShape);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs text-[#555] hover:text-[#ef4444] px-2 py-1 transition-colors"
                    onClick={() => handleArchive(habit._id)}
                  >
                    Archive
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-6 right-1/2 translate-x-1/2 w-12 h-12 rounded-full bg-white text-black text-2xl flex items-center justify-center shadow-xl z-30"
        onClick={() => {
          setEditingHabit(null);
          setShowForm(true);
        }}
        aria-label="Add habit"
      >
        +
      </button>

      {showForm && (
        <HabitForm
          habit={editingHabit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
