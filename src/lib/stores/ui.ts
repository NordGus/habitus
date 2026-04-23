import { writable } from "svelte/store";
import { currentMonth } from "$lib/utils/dates";

export type View = "tracker" | "habits" | "stats";

export const activeView = writable<View>("tracker");
export const activeMonth = writable<string>(currentMonth());
