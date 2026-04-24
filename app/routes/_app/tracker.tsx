import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/tracker")({
  validateSearch: (search: Record<string, unknown>) => ({
    month: typeof search.month === "string" ? search.month : undefined,
  }),
  component: () => (
    <div className="p-4 text-[#555] text-sm">Tracker loading...</div>
  ),
});
