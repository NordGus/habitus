import { useSearch, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  getMonthDays,
  formatMonthLabel,
  prevMonth,
  nextMonth,
  toLocalDateString,
  currentMonth,
} from "../utils/dates";
import HabitCell from "./HabitCell";
import { useMemo, useState } from "react";

function getAllYearDays(year: string): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, "0")}`
  ).flatMap(getMonthDays);
}

export default function TrackerView() {
  const search = useSearch({ from: "/_app/tracker" });
  const navigate = useNavigate({ from: "/_app/tracker" });
  const month = search.month ?? currentMonth();
  const [viewMode, setViewMode] = useState<"month" | "year">("month");

  const habits = useQuery(api.habits.listActive);
  const monthEntries = useQuery(
    api.entries.byMonth,
    viewMode === "month" ? { month } : "skip"
  );
  const yearEntries = useQuery(
    api.entries.byYear,
    viewMode === "year" ? { year: month.slice(0, 4) } : "skip"
  );
  const entries = viewMode === "month" ? monthEntries : yearEntries;

  const days = useMemo(
    () =>
      viewMode === "month"
        ? getMonthDays(month)
        : getAllYearDays(month.slice(0, 4)),
    [viewMode, month]
  );

  const today = toLocalDateString();

  const entryMap = useMemo(
    () =>
      new Map((entries ?? []).map((e) => [`${e.habitId}:${e.date}`, e])),
    [entries]
  );

  function setMonth(m: string) {
    navigate({ search: (prev) => ({ ...prev, month: m }) });
  }

  if (!habits || !entries) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#555] text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navigation bar */}
      <div className="flex items-center justify-between px-4 pb-2 gap-2">
        {viewMode === "month" ? (
          <>
            <button
              className="text-[#555] p-1 text-xl hover:text-white transition-colors"
              onClick={() => setMonth(prevMonth(month))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-[#aaa] flex-1 text-center">
              {formatMonthLabel(month)}
            </span>
            <button
              className="text-[#555] p-1 text-xl hover:text-white transition-colors"
              onClick={() => setMonth(nextMonth(month))}
              aria-label="Next month"
            >
              ›
            </button>
          </>
        ) : (
          <span className="text-sm font-medium text-[#aaa] flex-1">
            {month.slice(0, 4)} — full year
          </span>
        )}
        <button
          className="text-xs text-[#555] hover:text-white transition-colors px-2 py-1 rounded-lg bg-[#1a1a1a]"
          onClick={() => setViewMode(viewMode === "month" ? "year" : "month")}
        >
          {viewMode === "month" ? "Year" : "Month"}
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
          <p className="text-[#666] text-sm">No habits yet.</p>
          <p className="text-[#444] text-xs">Switch to Habits to add your first one.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 pb-4">
          <table className="border-collapse text-xs w-full">
            <thead className="sticky top-0 bg-[#111] z-10">
              <tr>
                <th className="text-left text-[#555] font-normal py-1 pr-3 w-16 min-w-[64px]" />
                {habits.map((habit) => (
                  <th
                    key={habit._id}
                    className="text-center text-[#555] font-normal py-1 px-0.5 min-w-[36px]"
                    title={habit.name}
                  >
                    <span className="block text-base leading-none">{habit.icon}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((date) => {
                const isToday = date === today;
                return (
                  <tr key={date}>
                    <td
                      className={`py-0.5 pr-3 tabular-nums ${
                        isToday ? "text-white font-semibold" : "text-[#555]"
                      }`}
                    >
                      {date.slice(5)}
                    </td>
                    {habits.map((habit) => {
                      const entry = entryMap.get(`${habit._id}:${date}`);
                      return (
                        <td key={habit._id} className="py-0.5 px-0.5">
                          <HabitCell
                            habitId={habit._id}
                            date={date}
                            done={entry?.done ?? false}
                            note={entry?.note}
                            isToday={isToday}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
