import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/habits")({
  component: () => (
    <div className="p-4 text-[#555] text-sm">Habits loading...</div>
  ),
});
