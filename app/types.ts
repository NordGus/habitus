import type { Id } from "../convex/_generated/dataModel";

export interface HabitShape {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  categories: Id<"categories">[];
}
