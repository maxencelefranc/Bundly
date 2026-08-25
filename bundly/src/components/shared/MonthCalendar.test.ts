import { dateKey, localDateKey, dateFromParts, addDaysStr, eachDayKey } from "./MonthCalendar";

describe("dateKey / localDateKey", () => {
  it("pads month and day to two digits", () => {
    expect(dateKey(2026, 3, 5)).toBe("2026-03-05");
    expect(dateKey(2026, 11, 20)).toBe("2026-11-20");
  });

  it("reads a Date's local components, not UTC ones", () => {
    // Constructed via local Date parts, so this must round-trip exactly
    // regardless of the machine's timezone.
    expect(localDateKey(new Date(2026, 0, 1))).toBe("2026-01-01");
  });
});

describe("dateFromParts", () => {
  it("parses without going through UTC (safe to call setDate on the result)", () => {
    const d = dateFromParts("2026-03-01");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(1);
  });
});

describe("addDaysStr", () => {
  it("adds days across a month boundary", () => {
    expect(addDaysStr("2026-03-01", 30)).toBe("2026-03-31");
  });

  it("adds days across a year boundary", () => {
    expect(addDaysStr("2025-12-30", 3)).toBe("2026-01-02");
  });

  it("supports negative offsets", () => {
    expect(addDaysStr("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("eachDayKey", () => {
  it("returns every date key from start to end, inclusive", () => {
    expect(eachDayKey("2026-01-28", "2026-02-02")).toEqual([
      "2026-01-28",
      "2026-01-29",
      "2026-01-30",
      "2026-01-31",
      "2026-02-01",
      "2026-02-02",
    ]);
  });

  it("returns a single-day array when start equals end", () => {
    expect(eachDayKey("2026-06-01", "2026-06-01")).toEqual(["2026-06-01"]);
  });
});
