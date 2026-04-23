<script lang="ts">
  import { activeMonth } from "$lib/stores/ui";
  import { useQuery } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import {
    getMonthDays,
    formatMonthLabel,
    prevMonth,
    nextMonth,
    toLocalDateString,
  } from "$lib/utils/dates";
  import HabitCell from "./HabitCell.svelte";

  $: habits$ = useQuery(api.habits.listActive);

  // View mode: "month" (default) or "year" (lazy-loaded full grid)
  let viewMode: "month" | "year" = "month";

  $: entries$ = viewMode === "month"
    ? useQuery(api.entries.byMonth, { month: $activeMonth })
    : useQuery(api.entries.byYear, { year: $activeMonth.slice(0, 4) });

  $: days = viewMode === "month"
    ? getMonthDays($activeMonth)
    : getAllYearDays($activeMonth.slice(0, 4));

  $: today = toLocalDateString();

  // O(1) lookup: "habitId:date" → entry
  $: entryMap = new Map(
    ($entries$ ?? []).map((e) => [`${e.habitId}:${e.date}`, e])
  );

  function getAllYearDays(year: string): string[] {
    const result: string[] = [];
    for (let m = 1; m <= 12; m++) {
      const month = `${year}-${String(m).padStart(2, "0")}`;
      const daysInMonth = new Date(Number(year), m, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        result.push(`${month}-${String(d).padStart(2, "0")}`);
      }
    }
    return result;
  }
</script>

<div class="flex flex-col h-full">
  <!-- Navigation bar -->
  <div class="flex items-center justify-between px-4 pb-2 gap-2">
    {#if viewMode === "month"}
      <button
        class="text-[#555] p-1 text-xl hover:text-white transition-colors"
        on:click={() => activeMonth.update(prevMonth)}
        aria-label="Previous month"
      >‹</button>
      <span class="text-sm font-medium text-[#aaa] flex-1 text-center">
        {formatMonthLabel($activeMonth)}
      </span>
      <button
        class="text-[#555] p-1 text-xl hover:text-white transition-colors"
        on:click={() => activeMonth.update(nextMonth)}
        aria-label="Next month"
      >›</button>
    {:else}
      <span class="text-sm font-medium text-[#aaa] flex-1">
        {$activeMonth.slice(0, 4)} — full year
      </span>
    {/if}
    <button
      class="text-xs text-[#555] hover:text-white transition-colors px-2 py-1 rounded-lg bg-[#1a1a1a]"
      on:click={() => (viewMode = viewMode === "month" ? "year" : "month")}
    >
      {viewMode === "month" ? "Year" : "Month"}
    </button>
  </div>

  {#if !$habits$ || !$entries$}
    <div class="flex-1 flex items-center justify-center text-[#555] text-sm">Loading...</div>
  {:else if $habits$.length === 0}
    <div class="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
      <p class="text-[#666] text-sm">No habits yet.</p>
      <p class="text-[#444] text-xs">Switch to Habits to add your first one.</p>
    </div>
  {:else}
    <!-- Horizontally scrollable table -->
    <div class="flex-1 overflow-auto px-4 pb-4">
      <table class="border-collapse text-xs w-full">
        <thead class="sticky top-0 bg-[#111] z-10">
          <tr>
            <th class="text-left text-[#555] font-normal py-1 pr-3 w-16 min-w-[64px]" />
            {#each $habits$ as habit}
              <th
                class="text-center text-[#555] font-normal py-1 px-0.5 min-w-[36px]"
                title={habit.name}
              >
                <span class="block text-base leading-none">{habit.icon}</span>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each days as date}
            {@const isToday = date === today}
            <tr>
              <td
                class="py-0.5 pr-3 tabular-nums
                  {isToday ? 'text-white font-semibold' : 'text-[#555]'}"
              >
                {date.slice(5)}
              </td>
              {#each $habits$ as habit}
                {@const entry = entryMap.get(`${habit._id}:${date}`)}
                <td class="py-0.5 px-0.5">
                  <HabitCell
                    habitId={habit._id}
                    {date}
                    done={entry?.done ?? false}
                    note={entry?.note}
                    {isToday}
                  />
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
