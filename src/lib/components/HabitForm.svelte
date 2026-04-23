<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { convex } from "$lib/convex";
  import { useQuery } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import type { Id } from "../../convex/_generated/dataModel";

  export let habit: {
    _id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    categories: string[];
  } | null = null;

  const dispatch = createEventDispatcher<{ close: void }>();
  const categories$ = useQuery(api.categories.list);

  let name = habit?.name ?? "";
  let description = habit?.description ?? "";
  let color = habit?.color ?? "#22c55e";
  let icon = habit?.icon ?? "⭐";
  let selectedCategories: string[] = [...(habit?.categories ?? [])];

  const COLORS = ["#22c55e","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];
  const ICONS  = ["⭐","🏃","📚","💪","🧘","💧","🎯","✍️","🎵","🌱","😴","🥗"];

  function toggleCategory(id: string) {
    selectedCategories = selectedCategories.includes(id)
      ? selectedCategories.filter((c) => c !== id)
      : [...selectedCategories, id];
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
      await convex.mutation(api.habits.update, { id: habit._id as Id<"habits">, ...args });
    } else {
      await convex.mutation(api.habits.create, args);
    }
    dispatch("close");
  }

  function onBackdropKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") dispatch("close");
  }
</script>

<div
  class="fixed inset-0 bg-black/60 z-40"
  on:click={() => dispatch("close")}
  on:keydown={onBackdropKeydown}
  role="button"
  tabindex="-1"
  aria-label="Close form"
/>

<div class="fixed bottom-0 inset-x-0 z-50 bg-[#1e1e1e] rounded-t-2xl p-5 max-w-md mx-auto max-h-[90dvh] overflow-y-auto">
  <div class="w-8 h-1 bg-[#444] rounded-full mx-auto mb-4" />
  <h2 class="text-base font-semibold text-white mb-4">{habit ? "Edit habit" : "New habit"}</h2>

  <label class="block text-xs text-[#666] mb-1">Name</label>
  <input
    class="w-full bg-[#111] text-white text-sm rounded-xl px-3 py-2.5 border border-[#333] focus:outline-none focus:border-[#555] mb-4"
    placeholder="Morning run"
    bind:value={name}
    autofocus
  />

  <label class="block text-xs text-[#666] mb-1">Description</label>
  <input
    class="w-full bg-[#111] text-white text-sm rounded-xl px-3 py-2.5 border border-[#333] focus:outline-none focus:border-[#555] mb-4"
    placeholder="Optional notes"
    bind:value={description}
  />

  <label class="block text-xs text-[#666] mb-2">Icon</label>
  <div class="flex flex-wrap gap-2 mb-4">
    {#each ICONS as i}
      <button
        class="w-9 h-9 rounded-lg text-lg flex items-center justify-center
          {icon === i ? 'bg-[#333] ring-2 ring-white' : 'bg-[#1a1a1a]'}"
        on:click={() => (icon = i)}
        type="button"
      >{i}</button>
    {/each}
  </div>

  <label class="block text-xs text-[#666] mb-2">Color</label>
  <div class="flex gap-2 mb-4 flex-wrap">
    {#each COLORS as c}
      <button
        class="w-7 h-7 rounded-full transition-shadow
          {color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e]' : ''}"
        style="background-color: {c}"
        on:click={() => (color = c)}
        type="button"
        aria-label="Select color {c}"
      />
    {/each}
  </div>

  {#if $categories$ && $categories$.length > 0}
    <label class="block text-xs text-[#666] mb-2">Categories</label>
    <div class="flex flex-wrap gap-2 mb-4">
      {#each $categories$ as cat}
        <button
          class="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
          style="{selectedCategories.includes(cat._id)
            ? `background-color:${cat.color}33;color:${cat.color};border-color:${cat.color}55`
            : 'border-color:#333;color:#666'}"
          on:click={() => toggleCategory(cat._id)}
          type="button"
        >{cat.name}</button>
      {/each}
    </div>
  {/if}

  <button
    class="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40 mt-1"
    on:click={save}
    type="button"
    disabled={!name.trim()}
  >
    {habit ? "Save changes" : "Add habit"}
  </button>
</div>
