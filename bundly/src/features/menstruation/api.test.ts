import { computeCycleStats, type Period } from "./api";

function period(overrides: Partial<Period>): Period {
  return {
    id: "id",
    profile_id: "profile",
    start_date: "2026-01-01",
    end_date: null,
    cycle_length: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeCycleStats", () => {
  it("returns defaults when there are fewer than two periods", () => {
    expect(computeCycleStats([])).toEqual({ avgCycle: 28, avgDuration: 5 });
    expect(computeCycleStats([period({})])).toEqual({ avgCycle: 28, avgDuration: 5 });
  });

  it("averages cycle length between consecutive period starts (most recent first)", () => {
    const periods = [
      period({ start_date: "2026-03-01", end_date: "2026-03-05" }),
      period({ start_date: "2026-02-01", end_date: "2026-02-06" }),
      period({ start_date: "2026-01-01", end_date: "2026-01-04" }),
    ];

    const stats = computeCycleStats(periods);

    expect(stats.avgCycle).toBe(30);
    expect(stats.avgDuration).toBe(4);
  });

  it("ignores ongoing periods (no end_date) when averaging duration", () => {
    const periods = [
      period({ start_date: "2026-03-01", end_date: null }),
      period({ start_date: "2026-02-01", end_date: "2026-02-06" }),
    ];

    const stats = computeCycleStats(periods);

    expect(stats.avgDuration).toBe(5);
    expect(stats.avgCycle).toBe(28);
  });
});
