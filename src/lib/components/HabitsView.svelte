<script lang="ts">
  import { useQuery } from "$lib/convex";
  import { convex } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import HabitForm from "./HabitForm.svelte";
  import CategoryBadge from "./CategoryBadge.svelte";
  import type { Id } from "../../convex/_generated/dataModel";

  const habits$ = useQuery(api.habits.listActive);
  const categories$ = useQuery(api.categories.list);

  let showForm = false;
  let editingHabit: any = null;

  $: categoryMap = new Map(($categories$ ?? []).map((c) => [c._id, c]));

  async function archive(id: string) {
    if (confirm("Archive this habit? Its history will be preserved.")) {
      await convex.mutation(api.habits.archive, { id: id as Id<"habits"> });
    }
  }
</script>

<div class="flex flex-col h-full overflow-hidden">
  <div class="flex-1 overflow-y-auto px-4 pb-24">
    {#if !$habits$}
      <div class="flex items-center justify-center h-32 text-[#555] text-sm">Loading...</div>
    {:else if $habits$.length === 0}
      <div class="flex flex-col items-center justify-center h-48 gap-2 text-center">
        <p class="text-[#666] text-sm">No habits yet.</p>
        <p class="text-[#444] text-xs">Tap + to create your first one.</p>
      </div>
    {:else}
      <ul class="divide-y divide-[#1a1a1a]">
        {#each $habits$ as habit}
          <li class="py-3 flex items-center gap-3">
            <span
              class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style="background-color: {habit.color}22;"
            >{habit.icon}</span>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">{habit.name}</p>
              {#if habit.categories.length > 0}
                <div class="flex gap-1 mt-0.5 flex-wrap">
                  {#each habit.categories as catId}
                    {@const cat = categoryMap.get(catId)}
                    {#if cat}
                      <CategoryBadge name={cat.name} color={cat.color} />
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button
                class="text-xs text-[#555] hover:text-white px-2 py-1 transition-colors"
                on:click={() => { editingHabit = habit; showForm = true; }}
              >Edit</button>
              <button
                class="text-xs text-[#555] hover:text-[#ef4444] px-2 py-1 transition-colors"
                on:click={() => archive(habit._id)}
              >Archive</button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<!-- FAB -->
<button
  class="fixed bottom-6 right-1/2 translate-x-1/2 w-12 h-12 rounded-full bg-white text-black text-2xl flex items-center justify-center shadow-xl z-30"
  on:click={() => { editingHabit = null; showForm = true; }}
  aria-label="Add habit"
>+</button>

{#if showForm}
  <HabitForm
    habit={editingHabit}
    on:close={() => (showForm = false)}
  />
{/if}
