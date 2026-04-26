import { createFileRoute } from "@tanstack/react-router";
import HabitsView from "../../components/HabitsView";

export const Route = createFileRoute("/_app/habits")({
  component: HabitsView,
  ssr: false,
});
