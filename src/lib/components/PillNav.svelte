<script lang="ts">
  import { activeView, type View } from "$lib/stores/ui";

  const tabs: { id: View; label: string }[] = [
    { id: "tracker", label: "Tracker" },
    { id: "habits", label: "Habits" },
    { id: "stats", label: "Stats" },
  ];
</script>

<div class="flex bg-[#1a1a1a] rounded-full p-1 mx-4 my-3">
  {#each tabs as tab}
    <button
      class="flex-1 py-1.5 text-sm font-medium rounded-full transition-colors duration-150
        {$activeView === tab.id ? 'bg-white text-black' : 'text-[#666] hover:text-white'}"
      on:click={() => activeView.set(tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</div>
