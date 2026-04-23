<script lang="ts">
  import { SignIn, useClerkContext, ClerkLoaded } from "svelte-clerk";
  import AppShell from "$lib/components/AppShell.svelte";

  const { clerk } = useClerkContext();
</script>

<ClerkLoaded>
  {#if $clerk?.user}
    <AppShell />
  {:else}
    <div class="flex items-center justify-center min-h-dvh bg-[#111]">
      <div class="flex flex-col items-center gap-6">
        <h1 class="text-3xl font-bold text-white tracking-tight">habitus</h1>
        <SignIn />
      </div>
    </div>
  {/if}
</ClerkLoaded>
