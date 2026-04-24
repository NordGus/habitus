import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/stats")({
  component: () => (
    <div className="p-4 text-[#555] text-sm">Stats loading...</div>
  ),
});
