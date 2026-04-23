<script lang="ts">
  import "../app.css";
  import { ClerkProvider } from "svelte-clerk";
  import { PUBLIC_CLERK_PUBLISHABLE_KEY } from "$env/static/public";
  import AuthWiring from "$lib/components/AuthWiring.svelte";
</script>

<ClerkProvider publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}>
  <AuthWiring />
  <slot />
</ClerkProvider>
