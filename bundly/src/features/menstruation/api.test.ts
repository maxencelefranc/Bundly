import { computeCycleStats, predictNextCycle, type Period } from "./api";

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

describe("predictNextCycle", () => {
  it("returns null when there is no period history", () => {
    expect(predictNextCycle([])).toBeNull();
  });

  it("projects the next period, ovulation, and fertile window from the average cycle", () => {
    const prediction = predictNextCycle([period({ start_date: "2026-01-01" })]);

    expect(prediction).not.toBeNull();
    expect(prediction!.nextPeriodStart).toBe("2026-01-29");
    expect(prediction!.ovulationDate).toBe("2026-01-15");
    expect(prediction!.fertileWindowStart).toBe("2026-01-10");
    expect(prediction!.fertileWindowEnd).toBe("2026-01-16");
  });

  it("uses the computed average cycle length when several periods are known", () => {
    const periods = [
      period({ start_date: "2026-03-01" }),
      period({ start_date: "2026-02-01" }),
      period({ start_date: "2026-01-01" }),
    ];

    // avgCycle here is 30 days (Jan 1 -> Feb 1 = 31, Feb 1 -> Mar 1 = 28, avg 29.5 -> rounds to 30)
    const prediction = predictNextCycle(periods);

    expect(prediction!.nextPeriodStart).toBe("2026-03-31");
  });
});
