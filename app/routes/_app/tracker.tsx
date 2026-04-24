import { createFileRoute } from "@tanstack/react-router";
import TrackerView from "../../components/TrackerView";

export const Route = createFileRoute("/_app/tracker")({
  validateSearch: (search: Record<string, unknown>): { month?: string } => ({
    month: typeof search.month === "string" ? search.month : undefined,
  }),
  component: TrackerView,
});
