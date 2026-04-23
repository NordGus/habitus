<script lang="ts">
  import { useClerkContext } from "svelte-clerk";
  import { convex } from "$lib/convex";
  import { api } from "$lib/convex-api";

  const { clerk } = useClerkContext();

  $: if ($clerk?.session) {
    convex.setAuth(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      return ($clerk.session as any).getToken({
        template: "convex",
        skipCache: forceRefreshToken,
      });
    });
    // Store user's local timezone for future cron-based features.
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    convex.mutation(api.userPreferences.upsert, { timezone }).catch(() => {});
  } else if ($clerk && !$clerk.session) {
    convex.clearAuth();
  }
</script>
