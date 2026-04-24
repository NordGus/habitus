import { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { HabitShape } from "../types";

interface Props {
  habit: HabitShape | null;
  onClose: () => void;
}

const COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];
const ICONS = [
  "⭐", "🏃", "📚", "💪", "🧘", "💧",
  "🎯", "✍️", "🎵", "🌱", "😴", "🥗",
];

export default function HabitForm({ habit, onClose }: Props) {
  const categories = useQuery(api.categories.list);
  const create = useMutation(api.habits.create);
  const update = useMutation(api.habits.update);

  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [color, setColor] = useState(habit?.color ?? "#22c55e");
  const [icon, setIcon] = useState(habit?.icon ?? "⭐");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    habit?.categories ?? []
  );

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function save() {
    if (!name.trim()) return;
    const args = {
      name: name.trim(),
      description,
      color,
      icon,
      categories: selectedCategories as Id<"categories">[],
    };
    if (habit) {
      await update({ id: habit._id as Id<"habits">, ...args });
    } else {
      await create(args);
    }
    onClose();
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close form"
      />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-[#1e1e1e] rounded-t-2xl p-5 max-w-md mx-auto max-h-[90dvh] overflow-y-auto">
        <div className="w-8 h-1 bg-[#444] rounded-full mx-auto mb-4" />
        <h2 className="text-base font-semibold text-white mb-4">
          {habit ? "Edit habit" : "New habit"}
        </h2>

        <label className="block text-xs text-[#666] mb-1">Name</label>
        <input
          className="w-full bg-[#111] text-white text-sm rounded-xl px-3 py-2.5 border border-[#333] focus:outline-none focus:border-[#555] mb-4"
          placeholder="Morning run"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <label className="block text-xs text-[#666] mb-1">Description</label>
        <input
          className="w-full bg-[#111] text-white text-sm rounded-xl px-3 py-2.5 border border-[#333] focus:outline-none focus:border-[#555] mb-4"
          placeholder="Optional notes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="block text-xs text-[#666] mb-2">Icon</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center ${
                icon === i ? "bg-[#333] ring-2 ring-white" : "bg-[#1a1a1a]"
              }`}
              onClick={() => setIcon(i)}
            >
              {i}
            </button>
          ))}
        </div>

        <label className="block text-xs text-[#666] mb-2">Color</label>
        <div className="flex gap-2 mb-4 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`w-7 h-7 rounded-full transition-shadow ${
                color === c
                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e]"
                  : ""
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>

        {categories && categories.length > 0 && (
          <>
            <label className="block text-xs text-[#666] mb-2">Categories</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => {
                const active = selectedCategories.includes(cat._id);
                return (
                  <button
                    key={cat._id}
                    type="button"
                    className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                    style={
                      active
                        ? {
                            backgroundColor: `${cat.color}33`,
                            color: cat.color,
                            borderColor: `${cat.color}55`,
                          }
                        : { borderColor: "#333", color: "#666" }
                    }
                    onClick={() => toggleCategory(cat._id)}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <button
          type="button"
          className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40 mt-1"
          onClick={save}
          disabled={!name.trim()}
        >
          {habit ? "Save changes" : "Add habit"}
        </button>
      </div>
    </>,
    document.body
  );
}
