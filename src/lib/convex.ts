import { ConvexClient } from "convex/browser";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { readable } from "svelte/store";
import type { FunctionReference, OptionalRestArgs } from "convex/server";

export const convex = new ConvexClient(PUBLIC_CONVEX_URL);

// Returns a Svelte readable store that re-emits whenever the Convex query result changes.
// Uses ConvexClient.onUpdate() — the subscription API for the browser client.
// If your Convex version uses watchQuery().onUpdate() instead, adjust accordingly:
//   const watch = convex.watchQuery(query, args[0] ?? {});
//   return watch.onUpdate((result) => set(result));
export function useQuery<Q extends FunctionReference<"query">>(
  query: Q,
  ...args: OptionalRestArgs<Q>
) {
  type Result = Awaited<ReturnType<Q["_returnType"]>> | undefined;
  return readable<Result>(undefined, (set) => {
    return convex.onUpdate(query, args[0] ?? ({} as any), (result) => set(result));
  });
}
