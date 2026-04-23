<script lang="ts">
  import { useQuery } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import HabitStatCard from "./HabitStatCard.svelte";

  const habits$ = useQuery(api.habits.listActive);
  const year = String(new Date().getFullYear());
</script>

<div class="flex flex-col h-full overflow-y-auto px-4 pb-6">
  <p class="text-xs text-[#555] mb-4 pt-1">{year} overview</p>

  {#if !$habits$}
    <div class="flex items-center justify-center h-32 text-[#555] text-sm">Loading...</div>
  {:else if $habits$.length === 0}
    <div class="flex items-center justify-center h-48 text-[#555] text-sm">
      No habits to show stats for.
    </div>
  {:else}
    <ul class="flex flex-col gap-3">
      {#each $habits$ as habit}
        <HabitStatCard {habit} {year} />
      {/each}
    </ul>
  {/if}
</div>
