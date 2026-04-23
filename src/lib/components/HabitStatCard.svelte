<script lang="ts">
  import { useQuery } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import type { Id } from "../../convex/_generated/dataModel";

  export let habit: { _id: string; name: string; icon: string; color: string };
  export let year: string;

  $: stats$ = useQuery(api.stats.forHabit, {
    habitId: habit._id as Id<"habits">,
    year,
  });
</script>

<li class="bg-[#1a1a1a] rounded-2xl p-4">
  <div class="flex items-center gap-3 mb-3">
    <span
      class="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
      style="background-color: {habit.color}22;"
    >{habit.icon}</span>
    <span class="text-sm font-medium text-white truncate">{habit.name}</span>
  </div>

  {#if !$stats$}
    <div class="text-xs text-[#555]">Loading...</div>
  {:else}
    <div class="grid grid-cols-3 gap-2 text-center">
      <div>
        <p class="text-xl font-bold text-white tabular-nums">{$stats$.currentStreak}</p>
        <p class="text-[10px] text-[#555] mt-0.5 uppercase tracking-wide">streak</p>
      </div>
      <div>
        <p class="text-xl font-bold text-white tabular-nums">{$stats$.longestStreak}</p>
        <p class="text-[10px] text-[#555] mt-0.5 uppercase tracking-wide">best</p>
      </div>
      <div>
        <p class="text-xl font-bold tabular-nums" style="color: {habit.color}">
          {$stats$.completionRate}%
        </p>
        <p class="text-[10px] text-[#555] mt-0.5 uppercase tracking-wide">this year</p>
      </div>
    </div>
  {/if}
</li>
