<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { convex } from "$lib/convex";
  import { api } from "$lib/convex-api";

  export let habitId: string;
  export let date: string;
  export let existingNote: string = "";

  const dispatch = createEventDispatcher<{ close: void }>();
  let note = existingNote;

  async function save() {
    await convex.mutation(api.entries.setNote, { habitId: habitId as any, date, note });
    dispatch("close");
  }

  function onBackdropKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") dispatch("close");
  }
</script>

<!-- Backdrop -->
<div
  class="fixed inset-0 bg-black/60 z-40"
  on:click={() => dispatch("close")}
  on:keydown={onBackdropKeydown}
  role="button"
  tabindex="-1"
  aria-label="Close note sheet"
/>

<!-- Bottom sheet -->
<div class="fixed bottom-0 inset-x-0 z-50 bg-[#1e1e1e] rounded-t-2xl p-5 max-w-md mx-auto">
  <div class="w-8 h-1 bg-[#444] rounded-full mx-auto mb-4" />
  <p class="text-sm font-semibold text-white mb-3">Add a note</p>
  <textarea
    class="w-full bg-[#111] text-white text-sm rounded-xl p-3 resize-none border border-[#333] focus:outline-none focus:border-[#555] h-24"
    placeholder="How did it go?"
    bind:value={note}
    autofocus
  />
  <div class="flex gap-2 mt-3">
    <button
      class="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold"
      on:click={save}
    >Save</button>
    <button
      class="px-4 py-2.5 rounded-xl bg-[#333] text-[#aaa] text-sm"
      on:click={() => dispatch("close")}
    >Cancel</button>
  </div>
</div>
