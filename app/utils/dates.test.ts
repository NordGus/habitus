import { expect, test } from "vitest";
import {
  toLocalDateString,
  getMonthDays,
  formatMonthLabel,
  prevMonth,
  nextMonth,
  currentMonth,
} from "./dates";

test("toLocalDateString returns YYYY-MM-DD in local time", () => {
  const date = new Date(2026, 3, 23);
  expect(toLocalDateString(date)).toBe("2026-04-23");
});

test("getMonthDays returns 30 days for April 2026", () => {
  const days = getMonthDays("2026-04");
  expect(days).toHaveLength(30);
  expect(days[0]).toBe("2026-04-01");
  expect(days[29]).toBe("2026-04-30");
});

test("getMonthDays returns 28 days for February 2026 (non-leap)", () => {
  expect(getMonthDays("2026-02")).toHaveLength(28);
});

test("getMonthDays returns 29 days for February 2024 (leap year)", () => {
  expect(getMonthDays("2024-02")).toHaveLength(29);
});

test("formatMonthLabel returns 'April 2026'", () => {
  expect(formatMonthLabel("2026-04")).toBe("April 2026");
});

test("prevMonth returns 2026-03 for 2026-04", () => {
  expect(prevMonth("2026-04")).toBe("2026-03");
});

test("nextMonth returns 2026-05 for 2026-04", () => {
  expect(nextMonth("2026-04")).toBe("2026-05");
});

test("prevMonth wraps January to December of previous year", () => {
  expect(prevMonth("2026-01")).toBe("2025-12");
});

test("nextMonth wraps December to January of next year", () => {
  expect(nextMonth("2025-12")).toBe("2026-01");
});
