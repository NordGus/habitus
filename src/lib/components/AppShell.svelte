<script lang="ts">
  import { UserButton } from "svelte-clerk";
  import PillNav from "./PillNav.svelte";
  import TrackerView from "./TrackerView.svelte";
  import HabitsView from "./HabitsView.svelte";
  import StatsView from "./StatsView.svelte";
  import { activeView } from "$lib/stores/ui";
</script>

<div class="flex flex-col h-dvh bg-[#111] text-white max-w-md mx-auto">
  <div class="flex items-center justify-between px-4 pt-5 pb-1">
    <span class="text-lg font-bold tracking-tight">habitus</span>
    <UserButton />
  </div>

  <PillNav />

  <div class="flex-1 overflow-hidden">
    {#if $activeView === "tracker"}
      <TrackerView />
    {:else if $activeView === "habits"}
      <HabitsView />
    {:else}
      <StatsView />
    {/if}
  </div>
</div>
