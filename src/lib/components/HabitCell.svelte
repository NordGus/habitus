<script lang="ts">
  import { convex } from "$lib/convex";
  import { api } from "$lib/convex-api";
  import NoteSheet from "./NoteSheet.svelte";

  export let habitId: string;
  export let date: string;
  export let done: boolean = false;
  export let note: string | undefined = undefined;
  export let isToday: boolean = false;

  let showNoteSheet = false;
  let longPressTimer: ReturnType<typeof setTimeout> | undefined;

  function onPointerDown() {
    longPressTimer = setTimeout(() => {
      showNoteSheet = true;
      longPressTimer = undefined;
    }, 500);
  }

  function onPointerUp() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = undefined;
    }
  }

  async function onTap() {
    if (showNoteSheet) return;
    await convex.mutation(api.entries.toggle, { habitId: habitId as any, date });
  }
</script>

<button
  class="w-full aspect-square rounded-sm flex items-center justify-center relative
    transition-transform duration-75 active:scale-90
    {done
      ? 'bg-[#22c55e]'
      : isToday
        ? 'border border-dashed border-[#555] bg-transparent'
        : 'bg-[#1a1a1a]'}"
  on:pointerdown={onPointerDown}
  on:pointerup={onPointerUp}
  on:pointerleave={onPointerUp}
  on:click={onTap}
  aria-label="{done ? 'Done' : 'Not done'} for {date}"
>
  {#if note && done}
    <span class="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white/60 rounded-full" />
  {/if}
</button>

{#if showNoteSheet}
  <NoteSheet
    {habitId}
    {date}
    existingNote={note ?? ""}
    on:close={() => (showNoteSheet = false)}
  />
{/if}
