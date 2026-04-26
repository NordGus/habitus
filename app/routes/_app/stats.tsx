import { createFileRoute } from "@tanstack/react-router";
import StatsView from "../../components/StatsView";

export const Route = createFileRoute("/_app/stats")({
  component: StatsView,
});
